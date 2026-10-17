use std::process::Command;

/// Launches the viewer in a standalone native-looking application window via Chrome/Chromium --app mode.
/// Falls back to the system default web browser if Chromium is unavailable.
pub fn launch_app_window(url: &str) {
    let chrome_binaries = [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
    ];

    for bin in chrome_binaries {
        let app_flag = format!("--app={}", url);
        let status = Command::new(bin)
            .args([
                &app_flag,
                "--class=markdown-viewer",
                "--name=markdown-viewer",
                "--window-size=1200,900",
            ])
            .spawn();

        if status.is_ok() {
            return;
        }
    }

    // Fallback: Open in default browser
    let _ = open::that(url);
}
