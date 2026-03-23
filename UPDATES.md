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

### Automatic CI builds (every push & pull request)

Every push to any branch and every pull request automatically triggers the
`ci.yml` workflow which:

- Runs `typecheck` + `test` on Ubuntu.
- Builds a Windows `.exe` installer (NSIS) on a Windows runner.
- Builds macOS `.dmg` + `.zip` installers on a macOS runner.
- Uploads all installers as **GitHub Actions artifacts** (retained 7 days).
- Does **not** create a public GitHub Release.

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
4. Release Please pushes a version tag (e.g. `v1.0.1`) and creates the GitHub
   Release with auto-generated release notes.
5. Creating the Release fires the `release: created` event, which triggers
   `release.yml`:
   - Builds the Windows NSIS installer + `latest.yml` update metadata
     (using `--publish never` so electron-builder does not touch GitHub).
   - Builds the macOS DMG + ZIP + `latest-mac.yml` update metadata
     (same — no GitHub interaction during the build step).
   - Runs `gh release upload` to attach **all** built files to the GitHub
     Release that Release Please already created.

**Why `on: release: types: [created]` instead of `on: push: tags`?**

Release Please uses `GITHUB_TOKEN` to create the release and push the tag.
GitHub's documented restriction: *events triggered by `GITHUB_TOKEN` do not
fire `push` workflow triggers.* So `on: push: tags` is **never** fired when
Release Please is the actor. The `release: created` event is an API-level event
(not a push), and **is** fired even with `GITHUB_TOKEN` — so that trigger works
reliably.

**Why `gh release upload` instead of `--publish always`?**

`electron-builder --publish always` tries to create a new GitHub Release and
will conflict with (or silently skip) the one Release Please already published.
Using `--publish never` + `gh release upload` decouples the build from the
publish step and reliably attaches files to the existing release.

**Result:** The GitHub Release contains `.exe` and `.dmg` installers for manual
download exactly as before, plus `latest.yml` / `latest-mac.yml` for the
auto-updater.

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

Uncomment the five `env` lines in the `build-mac` job in
`.github/workflows/release.yml`:

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
| `src/renderer/src/App.tsx` | Silent launch check; `update:downloaded` listener; renders `UpdateDialog` |
| `.github/workflows/release.yml` | Tag-triggered build & publish workflow |

### CI / Release Please (this update)

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | **New** — automatic build on every push/PR (no publish) |
| `.github/workflows/release-please.yml` | **New** — opens Release PRs on pushes to `main` |
| `release-please-config.json` | **New** — Release Please manifest configuration |
| `.release-please-manifest.json` | **New** — bootstraps current version at `1.0.0` |
| `UPDATES.md` | Updated — documents new CI + Release Please workflow |
| `README.md` | Updated — added CI & Release Workflow section |

### Release asset & startup-crash fixes (this update)

| File | Change |
|------|--------|
| `.github/workflows/release.yml` | Changed trigger from `on: push: tags` to `on: release: types: [created]` so the workflow actually fires when Release Please (using GITHUB_TOKEN) creates a release; changed tag reference to `github.event.release.tag_name`; added `shell: bash` to macOS upload step |
| `src/main/updater.ts` | Added `quitAndInstall()` export so IPC handlers do not need to import `electron-updater` directly |
| `src/main/ipc/updaterHandlers.ts` | **Root cause of startup crash fixed**: removed the named import `{ autoUpdater } from 'electron-updater'` (CJS module cannot satisfy ESM named imports); replaced with `quitAndInstall()` from `../updater` which already uses the correct default-import interop pattern |
| `UPDATES.md` | Updated — documents the `release: created` trigger rationale and the import fix |
