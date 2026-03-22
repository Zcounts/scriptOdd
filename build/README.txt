App icons for electron-builder packaging.

Required files:
  icon.ico   — Windows icon (256x256 minimum, multi-size ICO preferred)
  icon.icns  — macOS icon bundle (1024x1024 source recommended)
  icon.png   — Linux icon (512x512 PNG)

All three icons should use the same source artwork.
electron-builder also accepts a single icon.png (512x512+) and will
auto-convert for each platform if the platform-native formats are absent.
