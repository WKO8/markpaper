use clap::Parser;
use std::path::PathBuf;

/// Command-line arguments for Markdown Viewer
#[derive(Parser, Debug)]
#[command(
    name = "markpaper",
    version = "1.0.0",
    about = "MarkPaper - A publication-grade PDF-style Markdown reader for Linux"
)]
pub struct Cli {
    /// Path to the markdown file to view
    #[arg(value_name = "FILE")]
    pub file: Option<PathBuf>,

    /// Port to listen on (default: auto-detected starting at 5173)
    #[arg(short, long)]
    pub port: Option<u16>,

    /// Do not automatically launch application window / browser
    #[arg(long)]
    pub no_window: bool,
}
