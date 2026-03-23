# Auto-Update & Release Guide

scriptOdd uses [electron-updater](https://www.electron.build/auto-update) to deliver
updates to already-installed users, while keeping the original manual
download-and-install flow intact for new users.

---

## How auto-update works (for users)

### New users (unchanged)
Download the installer from the **GitHub Releases** page:

| Platform | File | Install method |
|----------|------|----------------|
| Windows  | `scriptOdd-Setup-<version>.exe` | Run the NSIS installer |
| macOS    | `scriptOdd-<version>-arm64.dmg` / `scriptOdd-<version>-x64.dmg` | Mount DMG, drag to Applications |

This behaviour is identical to before.

### Installed users (auto-update)

Once the app is installed, it manages updates automatically:

1. **On every launch** — a silent background check runs against the latest GitHub Release.
2. **Every 24 hours** — a background check runs; never more than once per day.
3. **Help → Check for Updates…** — triggers an immediate check on demand.
4. If a newer version is found the update **downloads in the background** with no UI interruption.
5. When the download finishes a **"Update ready" dialog** appears offering _Restart & Install_ or _Later_.
6. Dismissing the dialog is safe — the update will be offered again on the next launch.

---

## CI / Build workflow

### Automatic CI builds (pull requests + pushes to `main`)

Every pull request and every push to `main` automatically triggers the
`ci.yml` workflow which:

- Runs `typecheck` + `test` on Ubuntu.
- Builds a Windows `.exe` installer (NSIS) on a Windows runner.
- Builds macOS `.dmg` + `.zip` installers on a macOS runner.
- Verifies the built main-process bundle does not contain the broken named
  `electron-updater` import and points at the real preload output.
- Uploads installers **and updater metadata** as GitHub Actions artifacts
  (retained 7 days).
- Does **not** create a public GitHub Release.

`ci.yml` also uses workflow concurrency, so when you push multiple updates to
the same PR branch, older in-progress CI runs are automatically cancelled.

Download these CI artifacts from the **Actions** tab to test a build before
it becomes an official release.

### Official releases (Release Please)

Official releases are managed by [Release Please](https://github.com/googleapis/release-please).
This keeps version bumps and changelogs automatic while making releases deliberate.

**Normal development flow:**

1. Push conventional commits to `main` (see commit format below).
2. Release Please automatically opens (or updates) a **Release PR** that:
   - Bumps the version in `package.json`.
   - Updates `CHANGELOG.md` with the accumulated changes.
3. When you are ready to cut a release, **merge the Release PR**.
4. In that same `release-please.yml` run, Release Please creates the version tag
   (e.g. `v1.0.1`) and GitHub Release with auto-generated release notes.
5. When `release_created` is `true`, follow-up Windows and macOS jobs in
   `release-please.yml`:
   - Check out the new release tag.
   - Build the Windows NSIS installer + `latest*.yml` metadata.
   - Build the macOS DMG + ZIP + `latest-mac*.yml` metadata.
   - Upload installers, metadata, and blockmaps directly to the GitHub Release
     with `gh release upload`.

**Why keep the build/upload jobs in the same workflow?**

Release Please uses `GITHUB_TOKEN` by default. The Release Please maintainers
explicitly note that resources it creates — including release tags, release PRs,
and `release.created` events — do **not** trigger new workflow runs. Keeping the
build/upload jobs in the same workflow run avoids that GitHub Actions limitation.

**Why `gh release upload` instead of `--publish always`?**

`electron-builder --publish always` tries to create a new GitHub Release and
will conflict with (or silently skip) the one Release Please already published.
Using `--publish never` + `gh release upload` decouples the build from the
publish step and reliably attaches files to the existing release.

**Result:** The GitHub Release contains `.exe` and `.dmg` installers for manual
download exactly as before, plus `.zip`, `latest*.yml`, and blockmap updater
artifacts for the auto-updater.

---

## Windows installer: why the “cannot be closed” prompt happened

No tray, single-instance background process, or "keep running after close"
logic exists in the main process. The app closes by closing the BrowserWindow
and then calling `app.quit()` when all windows are closed.

The Windows NSIS installer, however, was still using the default
`runAfterFinish: true` behaviour for assisted installers. That means the
installer launches the app again as soon as installation completes. On the next
manual install/upgrade attempt, NSIS correctly sees `scriptOdd` still running
and prompts that it cannot be closed.

Setting `nsis.runAfterFinish` to `false` keeps the manual installer flow intact
while preventing the installer itself from immediately re-opening the app and
creating that false-seeming "cannot be closed" loop for the next install.

---

## Commit message format (Conventional Commits)

Release Please reads your commit messages to decide the next version number and
to populate `CHANGELOG.md`. Use this format:

```
<type>(<optional scope>): <short description>

[optional body]
[optional footer]
```

| Commit type | Version bump |
|-------------|--------------|
| `fix: …` | patch (1.0.0 → 1.0.1) |
| `feat: …` | minor (1.0.0 → 1.1.0) |
| `feat!: …` or `BREAKING CHANGE:` in footer | major (1.0.0 → 2.0.0) |
| `chore:`, `docs:`, `refactor:`, `test:`, `style:` | no release (ignored) |

**Examples:**

```
fix: prevent crash when opening fountain file with no scenes
feat: add word count display to status bar
feat!: change .sodd file format — existing files require re-save
chore: update dependencies
docs: update README keyboard shortcuts
```

Commits that do not match the conventional format are silently ignored by
Release Please (they will not block a release, they just won't appear in the
changelog or trigger a version bump on their own).

---

## macOS auto-update — what remains to enable it

macOS auto-update requires **code signing and Apple notarization**.
Without them the Electron updater will throw a verification error when trying
to apply the update on macOS. The DMG manual download still works without signing.

### Required secrets (add in GitHub repo → Settings → Secrets)

| Secret | Contents |
|--------|----------|
| `MAC_CERTS` | Base-64-encoded `.p12` Developer ID certificate |
| `MAC_CERTS_PASSWORD` | Password for the `.p12` file |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for the Apple ID |
| `APPLE_TEAM_ID` | 10-character Apple Developer Team ID |

### Enabling signing in the workflow

Uncomment the five `env` lines in the `build-mac-release` job in
`.github/workflows/release-please.yml`:

```yaml
CSC_LINK: ${{ secrets.MAC_CERTS }}
CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}
APPLE_ID: ${{ secrets.APPLE_ID }}
APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

electron-builder handles signing and notarization automatically once those
environment variables are set.

---

## Files changed by this feature

### Auto-update (original implementation)

| File | Change |
|------|--------|
| `package.json` | Added `electron-updater` dependency; `zip` target for mac; `publish` block |
| `src/main/updater.ts` | Initialises autoUpdater, wires events, throttles background checks |
| `src/main/ipc/updaterHandlers.ts` | IPC handlers for `update:check` and `update:install` |
| `src/main/ipc/index.ts` | Registers updater IPC handlers |
| `src/main/menu.ts` | Added **Help → Check for Updates…** |
| `src/main/index.ts` | Calls `initUpdater(mainWindow)` after window creation |
| `src/preload/index.ts` | Exposes `checkForUpdates`, `installUpdate`, four update-event listeners |
| `src/renderer/src/types/electron.d.ts` | Added `UpdateInfo` type and updater methods |
| `src/renderer/src/components/ui/UpdateDialog.tsx` | "Update ready" prompt |
| `src/renderer/src/App.tsx` | Update download listener and restart prompt UI |
| `.github/workflows/release-please.yml` | Release Please + release asset build/upload workflow |

### CI / Release Please (this update)

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | **New** — automatic build on pull requests and pushes to `main` (no publish), now also uploads updater metadata, verifies the built Electron bundles, and cancels superseded CI runs |
| `.github/workflows/release-please.yml` | **New** — opens Release PRs on pushes to `main`, and when a release is created in that same run it builds and uploads release assets directly to the GitHub Release |
| `release-please-config.json` | **New** — Release Please manifest configuration |
| `.release-please-manifest.json` | **New** — bootstraps current version at `1.0.0` |
| `UPDATES.md` | Updated — documents new CI + Release Please workflow |
| `README.md` | Updated — added CI & Release Workflow section |

### Release asset & startup-crash fixes (this update)

| File | Change |
|------|--------|
| `.github/workflows/release-please.yml` | Builds/uploads Windows and macOS release assets in the same Release Please workflow run, which avoids the `GITHUB_TOKEN` cross-workflow trigger limitation |
| `.github/workflows/ci.yml` | Uploads `.exe` / `.dmg` / `.zip` plus updater metadata as Actions artifacts for PR/main validation, while avoiding duplicate branch-push CI runs |
| `package.json` | Sets `nsis.runAfterFinish` to `false` so the Windows installer no longer immediately re-opens the app after installation |
| `scripts/verify-electron-bundle.mjs` | Asserts the built main bundle no longer contains the forbidden named `electron-updater` import and points at the real preload output |
| `src/main/window.ts` | Fixes the packaged preload path to `../preload/index.mjs`, matching the actual electron-vite output |
| `src/renderer/src/App.tsx` | Removes the duplicate launch-time manual update check so launch stays silent and post-launch checks remain throttled by the main process |
