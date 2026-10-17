#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_TARGET_DIR="$HOME/.local/bin"
APP_TARGET_DIR="$HOME/.local/share/applications"
ICON_BASE_DIR="$HOME/.local/share/icons/hicolor"

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
mkdir -p "$ICON_BASE_DIR/scalable/apps"

# 4. Install Binary
echo "🚀 [3/4] Installing binary to $BIN_TARGET_DIR/markpaper..."
cp --remove-destination "$SCRIPT_DIR/target/release/markpaper" "$BIN_TARGET_DIR/markpaper"
chmod +x "$BIN_TARGET_DIR/markpaper"

# Symlink markdown-viewer for backwards compatibility
ln -sf "$BIN_TARGET_DIR/markpaper" "$BIN_TARGET_DIR/markdown-viewer"

# 5. Install Icons (Scalable SVG + Raster PNGs across standard sizes)
echo "🎨 [4/4] Installing desktop icons and window matching..."
cp "$SCRIPT_DIR/assets/icon.svg" "$ICON_BASE_DIR/scalable/apps/markpaper.svg"
cp "$SCRIPT_DIR/assets/icon.svg" "$ICON_BASE_DIR/scalable/apps/chrome-127.0.0.1__-Default.svg"

# Generate raster PNG icons if ImageMagick convert is installed
if command -v convert >/dev/null 2>&1; then
    for size in 512 256 128 64 48 32; do
        SIZE_DIR="$ICON_BASE_DIR/${size}x${size}/apps"
        mkdir -p "$SIZE_DIR"
        convert -background none "$SCRIPT_DIR/assets/icon.svg" -resize "${size}x${size}" "$SIZE_DIR/markpaper.png" 2>/dev/null || true
        convert -background none "$SCRIPT_DIR/assets/icon.svg" -resize "${size}x${size}" "$SIZE_DIR/chrome-127.0.0.1__-Default.png" 2>/dev/null || true
    done
fi

# 6. Install Desktop Entry
cp "$SCRIPT_DIR/markpaper.desktop" "$APP_TARGET_DIR/markpaper.desktop"

# Create Chrome WM_CLASS matching entry so GNOME Shell displays MarkPaper name & icon
cat <<EOF > "$APP_TARGET_DIR/chrome-127.0.0.1__-Default.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=MarkPaper
GenericName=Markdown Reader & PDF-Style Viewer
Comment=A publication-grade PDF-style Markdown reader for Linux
Exec=markpaper %f
Icon=markpaper
Terminal=false
StartupNotify=true
StartupWMClass=chrome-127.0.0.1__-Default
NoDisplay=true
EOF

# Refresh desktop database & GTK icon cache
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_TARGET_DIR" >/dev/null 2>&1 || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$ICON_BASE_DIR" >/dev/null 2>&1 || true
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
echo ""
echo "Or right-click any .md file in Ubuntu Files -> 'Open With MarkPaper'"
echo "Make sure '$BIN_TARGET_DIR' is in your PATH (standard on Ubuntu)."
echo "=========================================================="
