mod cli;
mod handlers;
mod state;
mod watcher;
mod window;

use axum::{routing::get, Router};
use clap::Parser;
use cli::Cli;
use handlers::{get_document_handler, get_raw_file_handler, sse_events_handler, static_asset_handler};
use state::AppState;
use std::{
    fs,
    net::SocketAddr,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::sync::broadcast;
use watcher::start_file_watcher;
use window::launch_app_window;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    // Determine target markdown file (CLI argument or local README.md fallback)
    let target_file = cli.file.or_else(|| {
        let default_readme = PathBuf::from("README.md");
        if default_readme.exists() {
            Some(default_readme)
        } else {
            None
        }
    });

    let canonical_file = target_file.and_then(|p| fs::canonicalize(&p).ok());
    let (tx, _rx) = broadcast::channel(16);

    let state = AppState {
        file_path: Arc::new(Mutex::new(canonical_file.clone())),
        tx: tx.clone(),
    };

    // Start background file watcher service if viewing a physical file
    if let Some(ref path) = canonical_file {
        start_file_watcher(path.clone(), tx.clone());
    }

    // Build HTTP application router
    let app = Router::new()
        .route("/api/document", get(get_document_handler))
        .route("/api/raw-file", get(get_raw_file_handler))
        .route("/api/events", get(sse_events_handler))
        .fallback(static_asset_handler)
        .with_state(state.clone());

    // Bind TCP listener to an available port starting at requested or 5173
    let start_port = cli.port.unwrap_or(5173);
    let mut chosen_port = start_port;
    let listener = loop {
        let addr = SocketAddr::from(([127, 0, 0, 1], chosen_port));
        match tokio::net::TcpListener::bind(addr).await {
            Ok(l) => break l,
            Err(_) => {
                chosen_port += 1;
                if chosen_port > start_port + 100 {
                    panic!("Could not bind to any port in range {}-{}", start_port, chosen_port);
                }
            }
        }
    };

    let local_url = format!("http://127.0.0.1:{}", chosen_port);

    println!("\x1b[1;34m====================================================\x1b[0m");
    println!("\x1b[1;32m  📖 Markdown Viewer (PDF-Style Reader for Ubuntu)  \x1b[0m");
    println!("\x1b[1;34m====================================================\x1b[0m");
    if let Some(ref p) = canonical_file {
        println!("  Document : \x1b[1m{}\x1b[0m", p.display());
    } else {
        println!("  Document : \x1b[33mNo file specified (drag & drop or click Open)\x1b[0m");
    }
    println!("  Local App: \x1b[1;36m{}\x1b[0m", local_url);
    println!("  Shortcuts: \x1b[90mCtrl+O (Open) | Ctrl+P (Print/PDF) | Ctrl+F (Search) | Ctrl+\\ (Outline)\x1b[0m");
    println!("\x1b[1;34m----------------------------------------------------\x1b[0m");

    // Launch standalone desktop app window or default browser
    if !cli.no_window {
        let app_url = local_url.clone();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(150)).await;
            launch_app_window(&app_url);
        });
    }

    axum::serve(listener, app).await?;

    Ok(())
}
