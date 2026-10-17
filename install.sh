#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_TARGET_DIR="$HOME/.local/bin"
APP_TARGET_DIR="$HOME/.local/share/applications"
ICON_TARGET_DIR="$HOME/.local/share/icons/hicolor/scalable/apps"

echo "=========================================================="
echo "    Installing MarkPaper (PDF-Style Markdown Reader)      "
echo "=========================================================="

# 1. Build Frontend Assets
echo "📦 [1/4] Building web frontend assets..."
cd "$SCRIPT_DIR/web"
pnpm build
cd "$SCRIPT_DIR"

# 2. Compile Release Binary
echo "🦀 [2/4] Compiling native Rust binary..."
cargo build --release

# 3. Create Directories
mkdir -p "$BIN_TARGET_DIR"
mkdir -p "$APP_TARGET_DIR"
mkdir -p "$ICON_TARGET_DIR"

# 4. Install Binary
echo "🚀 [3/4] Installing binary to $BIN_TARGET_DIR/markpaper..."
cp --remove-destination "$SCRIPT_DIR/target/release/markpaper" "$BIN_TARGET_DIR/markpaper"
chmod +x "$BIN_TARGET_DIR/markpaper"

# Also symlink markdown-viewer for convenience
ln -sf "$BIN_TARGET_DIR/markpaper" "$BIN_TARGET_DIR/markdown-viewer"

# 5. Install Icon & Desktop Entry
echo "🎨 [4/4] Installing desktop entry and icons..."
cp "$SCRIPT_DIR/assets/icon.svg" "$ICON_TARGET_DIR/markpaper.svg"
cp "$SCRIPT_DIR/markpaper.desktop" "$APP_TARGET_DIR/markpaper.desktop"

# Refresh desktop database if tool is available
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_TARGET_DIR" >/dev/null 2>&1 || true
fi

# Associate text/markdown with markpaper if xdg-mime is available
if command -v xdg-mime >/dev/null 2>&1; then
    xdg-mime default markpaper.desktop text/markdown >/dev/null 2>&1 || true
    xdg-mime default markpaper.desktop text/x-markdown >/dev/null 2>&1 || true
fi

echo ""
echo "✅ Installation completed successfully!"
echo "----------------------------------------------------------"
echo "You can now open any Markdown file from anywhere:"
echo "   markpaper /path/to/document.md"
echo "   (or: markdown-viewer /path/to/document.md)"
echo ""
echo "Or right-click any .md file in Ubuntu Files -> 'Open With MarkPaper'"
echo "Make sure '$BIN_TARGET_DIR' is in your PATH (standard on Ubuntu)."
echo "=========================================================="
