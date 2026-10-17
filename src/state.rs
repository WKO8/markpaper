use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tokio::sync::broadcast;

/// Shared thread-safe application state
#[derive(Clone)]
pub struct AppState {
    pub file_path: Arc<Mutex<Option<PathBuf>>>,
    pub tx: broadcast::Sender<String>,
}

/// JSON response payload for the document metadata and content
#[derive(Serialize)]
pub struct DocumentResponse {
    pub content: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "dirPath")]
    pub dir_path: String,
    pub size: u64,
    #[serde(rename = "lastModified")]
    pub last_modified: String,
}

/// Query parameters for fetching local raw assets
#[derive(Deserialize)]
pub struct RawFileQuery {
    pub file: String,
    pub dir: Option<String>,
}

/// Timestamp display helper converting SystemTime without chrono dependency
pub struct ChronoFreeDisplay(pub std::time::SystemTime);

impl From<std::time::SystemTime> for ChronoFreeDisplay {
    fn from(t: std::time::SystemTime) -> Self {
        ChronoFreeDisplay(t)
    }
}

impl std::fmt::Display for ChronoFreeDisplay {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Ok(duration) = self.0.duration_since(std::time::UNIX_EPOCH) {
            let secs = duration.as_secs();
            write!(f, "{}", secs)
        } else {
            write!(f, "")
        }
    }
}
