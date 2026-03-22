# scriptOdd — Release Checklist

---

## Overview of automated vs manual steps

| Step | Automated by CI? |
|------|-----------------|
| Typecheck + unit tests | ✅ Yes — `verify` job in release.yml |
| Windows NSIS installer | ✅ Yes — `build-windows` job |
| macOS DMG (unsigned) | ✅ Yes — `build-mac` job |
| GitHub Release + asset upload | ✅ Yes — `release` job (tag builds only) |
| macOS code-signing + notarization | ❌ No — requires Apple Developer ID (see below) |
| Installer smoke test on real hardware | ❌ No — manual |
| Release notes / Gumroad listing | ❌ No — manual |

---

## Pre-Release (manual)

### Code quality
- [ ] No TODO/FIXME comments in release-critical paths
- [ ] All `console.error` calls are backed by user-facing error messages
- [ ] QA Checklist completed on target platform(s) (see QA_CHECKLIST.md)
- [ ] Tested on: Windows 10/11 x64
- [ ] Tested on: macOS (if applicable)
- [ ] Smoke tests for packaged build completed (see SMOKE_TESTS.md)
- [ ] No regressions in: typing flow, save/load, PDF export, Fountain import/export

### Icons
Icons are pre-generated placeholders from `scripts/generate-icons.py`.
- [ ] Replace `build/icon.png`, `build/icon.ico`, `build/icon.icns` with final artwork before first public release
- To regenerate placeholders from the script: `python3 scripts/generate-icons.py`

---

## Triggering the release pipeline

The CI workflow lives at `.github/workflows/release.yml`.

### To create a full release:

```bash
# Bump version in package.json first, then:
git tag v1.0.0
git push origin v1.0.0
```

This triggers:
1. `verify` — typecheck + tests on ubuntu-latest
2. `build-windows` — `npm run dist:win` on windows-latest → uploads `scriptOdd-Setup-<ver>.exe`
3. `build-mac` — `npm run dist:mac` on macos-latest → uploads `scriptOdd-<ver>-x64.dmg` + `scriptOdd-<ver>-arm64.dmg`
4. `release` — downloads artifacts, creates a **draft** GitHub Release with all assets attached

### To do a trial build without publishing:
Use the "Run workflow" button in the GitHub Actions tab (workflow_dispatch).
No release is created; artifacts are stored for 7 days.

---

## After CI completes (manual)

- [ ] Open the draft release on GitHub and review the auto-generated notes
- [ ] Edit release notes if needed (known issues, upgrade notes)
- [ ] Publish the release (un-draft it)
- [ ] Download and smoke-test the Windows installer (see SMOKE_TESTS.md)

---

## macOS — signing and notarization ⚠️

**The CI build produces unsigned, unnotarized DMGs.**

macOS Gatekeeper will block launch for any user who downloaded the DMG from
the internet. Users can still open the app via right-click → Open, but this
is a significant friction point for distribution.

To fully solve this, you need:

1. An Apple Developer account ($99/year)
2. A "Developer ID Application" certificate exported as `.p12`
3. An App-Specific Password from appleid.apple.com for notarization
4. Add these as repository secrets:
   - `CSC_LINK` — base64-encoded `.p12` certificate
   - `CSC_KEY_PASSWORD` — certificate password
   - `APPLE_ID` — your Apple ID email
   - `APPLE_APP_SPECIFIC_PASSWORD` — app-specific password
   - `APPLE_TEAM_ID` — your 10-character Team ID
5. Update the `build-mac` job in `.github/workflows/release.yml` to pass those
   env vars to `npm run dist:mac` and enable `hardened-runtime` + notarization
   in the `mac` section of `package.json`

Until signing is set up, the macOS DMG is only suitable for personal use or
developer testing.

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
- [ ] Update version in `package.json` for next release cycle
- [ ] Archive QA results
