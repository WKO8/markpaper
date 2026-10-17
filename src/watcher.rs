use notify::{EventKind, RecursiveMode, Watcher};
use std::path::PathBuf;
use tokio::sync::broadcast;

/// Starts a background thread monitoring the specified markdown file for disk changes.
/// Emits "file_changed" to the broadcast channel on modification events.
pub fn start_file_watcher(watch_path: PathBuf, tx: broadcast::Sender<String>) {
    std::thread::spawn(move || {
        let (event_tx, event_rx) = std::sync::mpsc::channel();
        let mut watcher = match notify::recommended_watcher(event_tx) {
            Ok(w) => w,
            Err(err) => {
                eprintln!("Warning: Failed to initialize file watcher: {}", err);
                return;
            }
        };

        if let Err(err) = watcher.watch(&watch_path, RecursiveMode::NonRecursive) {
            eprintln!("Warning: Failed to watch file {:?}: {}", watch_path, err);
            return;
        }

        for res in event_rx {
            match res {
                Ok(event) => {
                    if matches!(event.kind, EventKind::Modify(_)) {
                        let _ = tx.send("file_changed".to_string());
                    }
                }
                Err(e) => eprintln!("Watcher event notice: {:?}", e),
            }
        }
    });
}
