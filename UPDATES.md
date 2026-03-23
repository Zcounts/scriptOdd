# Auto-Update Support

scriptOdd uses [electron-updater](https://www.electron.build/auto-update) to deliver
updates to already-installed users, while keeping the original manual
download-and-install flow intact for new users.

---

## How it works

### For new users (unchanged)
Download the installer from the **GitHub Releases** page:

| Platform | File | Install method |
|----------|------|----------------|
| Windows  | `scriptOdd-Setup-<version>.exe` | Run the NSIS installer |
| macOS    | `scriptOdd-<version>-arm64.dmg` / `scriptOdd-<version>-x64.dmg` | Mount DMG, drag to Applications |

This behaviour is identical to before.

### For installed users (new)

Once the app is installed, it manages updates automatically:

1. **On every launch** — a silent background check runs against the latest GitHub Release.
2. **Every 24 hours** — a subsequent background check runs (throttled; never more than once per day).
3. **Help → Check for Updates…** — triggers an immediate check on demand.
4. If a newer version is found the update **downloads in the background** with no UI interruption.
5. When the download finishes a non-blocking **"Update ready" dialog** appears at the bottom of the screen offering _Restart & Install_ or _Later_.
6. Dismissing the dialog is safe — the update will be offered again on the next launch.

---

## Cutting a release

The release workflow is now **tag-driven**.
To publish a new version:

```bash
# 1. Bump the version in package.json
npm version patch   # or minor / major

# 2. Push the commit and the generated tag
git push && git push --tags
```

The tag must match the pattern `v<major>.<minor>.<patch>` (e.g. `v1.2.3`).

The CI pipeline (`release.yml`) will:
- Build the Windows NSIS installer + `latest.yml` metadata.
- Build the macOS DMG files + ZIP archives + `latest-mac.yml` metadata.
- Create a GitHub Release and publish all artifacts automatically.

The `.exe` and `.dmg` files remain in the release for manual download exactly as before.
The `latest.yml` / `latest-mac.yml` files are the additional metadata that electron-updater uses.

---

## macOS auto-update — what remains to enable it

macOS auto-update requires **code signing and Apple notarization**.
Without them the Electron updater will throw a verification error when trying to apply the update on macOS. The DMG manual download still works fine without signing.

### Required secrets (add in GitHub repo → Settings → Secrets)

| Secret | Contents |
|--------|----------|
| `MAC_CERTS` | Base-64-encoded `.p12` Developer ID certificate |
| `MAC_CERTS_PASSWORD` | Password for the `.p12` file |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for the Apple ID |
| `APPLE_TEAM_ID` | 10-character Apple Developer Team ID |

### Enabling signing in the workflow

Uncomment the five `env` lines in the `build-mac` job in `.github/workflows/release.yml`:

```yaml
CSC_LINK: ${{ secrets.MAC_CERTS }}
CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}
APPLE_ID: ${{ secrets.APPLE_ID }}
APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

electron-builder handles the signing and notarization automatically once those
environment variables are set.

---

## Files changed by this feature

| File | Change |
|------|--------|
| `package.json` | Added `electron-updater` dependency; added `zip` target to `mac`; added `publish` block pointing to `Zcounts/scriptOdd` |
| `src/main/updater.ts` | **New** — initialises autoUpdater, wires events, throttles background checks |
| `src/main/ipc/updaterHandlers.ts` | **New** — IPC handlers for `update:check` and `update:install` |
| `src/main/ipc/index.ts` | Registers the new updater IPC handlers |
| `src/main/menu.ts` | Added **Help → Check for Updates…** menu item |
| `src/main/index.ts` | Calls `initUpdater(mainWindow)` after window creation |
| `src/preload/index.ts` | Exposes `checkForUpdates`, `installUpdate`, and four update-event listeners |
| `src/renderer/src/types/electron.d.ts` | Added `UpdateInfo` type and updater methods to `AppAPI` |
| `src/renderer/src/components/ui/UpdateDialog.tsx` | **New** — "Update ready" prompt shown when download completes |
| `src/renderer/src/App.tsx` | Silent check on launch; listens for `update:downloaded`; renders `UpdateDialog`; handles `app:check-for-updates` menu action |
| `.github/workflows/release.yml` | Changed trigger to tag push; replaced `--publish never` + manual softprops step with `--publish always` + `GH_TOKEN`; added macOS signing env stubs |
| `UPDATES.md` | **New** — this document |
