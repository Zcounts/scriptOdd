# scriptOdd — Release Checklist

Version: 1.0.0

---

## Pre-Release

### Code Quality
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run test` passes (33/33 tests)
- [ ] No TODO/FIXME comments in release-critical paths
- [ ] All console.error calls are backed by user-facing error messages

### Testing
- [ ] QA Checklist completed on target platform(s)
- [ ] Tested on: Windows 10/11 x64
- [ ] Tested on: macOS (if applicable)
- [ ] Tested on: Ubuntu/Debian (if applicable)
- [ ] Smoke tests for packaged build completed (see SMOKE_TESTS.md)
- [ ] No regressions in: typing flow, save/load, PDF export, Fountain import/export

### Assets
- [ ] `build/icon.ico` present (Windows installer icon)
- [ ] `build/icon.icns` present (macOS app icon, if building for macOS)
- [ ] `build/icon.png` present (Linux AppImage icon, 512×512 PNG)

---

## Packaging

### Windows
- [ ] Run `npm run dist:win`
- [ ] Installer appears in `dist/` as `scriptOdd-Setup-1.0.0.exe`
- [ ] Installer runs without requiring admin/UAC (per-user install)
- [ ] Installed app launches correctly

### macOS (if applicable)
- [ ] Run `npm run dist:mac`
- [ ] DMG appears in `dist/` as `scriptOdd-1.0.0-{arch}.dmg`
- [ ] App opens without "unidentified developer" block (requires notarization for distribution)

### Linux (if applicable)
- [ ] Run `npm run dist:linux`
- [ ] AppImage appears in `dist/`
- [ ] AppImage runs after `chmod +x`

---

## GitHub Release

- [ ] Merge all feature branches into `master`/`main`
- [ ] Tag the release: `git tag v1.0.0 && git push --tags`
- [ ] Create GitHub Release from tag v1.0.0
- [ ] Upload installers as release assets:
  - `scriptOdd-Setup-1.0.0.exe` (Windows)
  - `scriptOdd-1.0.0.dmg` (macOS, if built)
  - `scriptOdd-1.0.0.AppImage` (Linux, if built)
- [ ] Write release notes summarising features and known limitations
- [ ] Mark as latest release

---

## Gumroad (if distributing via Gumroad)

- [ ] Create product listing with screenshots
- [ ] Upload Windows installer as primary product file
- [ ] Set price or "pay what you want"
- [ ] Write product description covering:
  - What scriptOdd is (local-only desktop screenwriting)
  - Key features (Fountain import/export, PDF export, Board view, semantic highlighting)
  - System requirements (Windows 10+, 64-bit)
  - No account, no cloud, no subscription
- [ ] Add screenshots: Draft view, Board view, PDF output
- [ ] Publish listing

---

## Post-Release

- [ ] Monitor GitHub Issues for critical bugs
- [ ] Update RELEASE_CHECKLIST.md version number for next release
- [ ] Archive QA results
