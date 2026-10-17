use crate::state::{AppState, ChronoFreeDisplay, DocumentResponse, RawFileQuery};
use axum::{
    extract::{Query, State},
    http::{header, StatusCode, Uri},
    response::{
        sse::{Event, KeepAlive},
        IntoResponse, Sse,
    },
    Json,
};
use mime_guess::from_path;
use rust_embed::RustEmbed;
use std::{convert::Infallible, fs, path::Path};
use tokio_stream::{wrappers::BroadcastStream, StreamExt};

#[derive(RustEmbed)]
#[folder = "web/dist/"]
pub struct Asset;

/// Handler: Get current document content and metadata
pub async fn get_document_handler(State(state): State<AppState>) -> impl IntoResponse {
    let guard = state.file_path.lock().unwrap();
    if let Some(ref path) = *guard {
        if let Ok(content) = fs::read_to_string(path) {
            let file_name = path
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "document.md".to_string());

            let dir_path = path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            let metadata = fs::metadata(path).ok();
            let size = metadata.as_ref().map(|m| m.len()).unwrap_or(content.len() as u64);
            let last_modified = metadata
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let datetime: ChronoFreeDisplay = t.into();
                    datetime.to_string()
                })
                .unwrap_or_default();

            return (
                StatusCode::OK,
                Json(DocumentResponse {
                    content,
                    file_name,
                    file_path: path.to_string_lossy().to_string(),
                    dir_path,
                    size,
                    last_modified,
                }),
            )
                .into_response();
        }
    }

    // Default sample content if no file specified
    (
        StatusCode::OK,
        Json(DocumentResponse {
            content: "# Welcome to Markdown Viewer\n\nOpen any `.md` file with `markdown-viewer <file.md>`, drag & drop a file here, or click **Open** in the toolbar.".to_string(),
            file_name: "Welcome.md".to_string(),
            file_path: "".to_string(),
            dir_path: "".to_string(),
            size: 0,
            last_modified: "".to_string(),
        }),
    )
        .into_response()
}

/// Handler: Serve relative images and local media files
pub async fn get_raw_file_handler(Query(params): Query<RawFileQuery>) -> impl IntoResponse {
    let file_req = Path::new(&params.file);

    let full_path = if file_req.is_absolute() {
        file_req.to_path_buf()
    } else if let Some(ref dir) = params.dir {
        Path::new(dir).join(file_req)
    } else {
        file_req.to_path_buf()
    };

    if let Ok(bytes) = fs::read(&full_path) {
        let mime = from_path(&full_path).first_or_octet_stream();
        (
            StatusCode::OK,
            [(header::CONTENT_TYPE, mime.as_ref())],
            bytes,
        )
            .into_response()
    } else {
        (StatusCode::NOT_FOUND, "File not found").into_response()
    }
}

/// Handler: Server-Sent Events (SSE) streaming file modification events
pub async fn sse_events_handler(
    State(state): State<AppState>,
) -> Sse<impl tokio_stream::Stream<Item = Result<Event, Infallible>>> {
    let rx = state.tx.subscribe();
    let stream = BroadcastStream::new(rx).filter_map(|msg| match msg {
        Ok(event_str) => Some(Ok(Event::default().data(format!(
            "{{\"type\": \"{}\"}}",
            event_str
        )))),
        Err(_) => None,
    });

    Sse::new(stream).keep_alive(KeepAlive::default())
}

/// Handler: Serve embedded static frontend single-page application assets
pub async fn static_asset_handler(uri: Uri) -> impl IntoResponse {
    let mut path = uri.path().trim_start_matches('/').to_string();
    if path.is_empty() {
        path = "index.html".to_string();
    }

    match Asset::get(&path) {
        Some(content) => {
            let mime = from_path(&path).first_or_octet_stream();
            (
                StatusCode::OK,
                [(header::CONTENT_TYPE, mime.as_ref())],
                content.data,
            )
                .into_response()
        }
        None => {
            // SPA fallback to index.html
            match Asset::get("index.html") {
                Some(content) => (
                    StatusCode::OK,
                    [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
                    content.data,
                )
                    .into_response(),
                None => (
                    StatusCode::NOT_FOUND,
                    "Error: Frontend assets not built. Run 'pnpm build' in web/ directory.",
                )
                    .into_response(),
            }
        }
    }
}
