# scriptOdd

**Version 1.0.0** — Local-only desktop screenwriting for feature films.

A keyboard-first screenplay editor with a modern UI. No account. No cloud. No subscription.

---

## Features

- **Automatic screenplay formatting** — Smart Enter, Tab, and Shift+Tab navigate through block types (scene heading, action, character, dialogue, parenthetical, transition)
- **Scene navigator** — Jump between scenes instantly from the sidebar
- **Index card board** — Drag-and-drop scene reordering via visual board view
- **Notes** — Per-scene and project-level notes
- **Semantic color highlighting** — Character names and locations highlighted by entity, toggleable
- **Entity autocomplete** — Remembered character names and scene headings for fast re-use
- **Fountain import/export** — Full round-trip compatibility with the Fountain plain-text format
- **PDF export** — WGA-standard margins, Courier New, title page, page numbers
- **Autosave + crash recovery** — Saves every 60 seconds; recovers unsaved sessions after a crash
- **Three themes** — Dark (default), Light, High-Contrast
- **Resizable layout** — Sidebar, editor, right panel — all adjustable
- **Focus mode** — Hides all chrome for distraction-free writing

---

## System Requirements

- **Windows 10 or 11** (64-bit) — primary platform
- macOS 12+ or Ubuntu 20.04+ (via AppImage) — experimental

---

## Getting Started

### Install (Windows)

1. Download `scriptOdd-Setup-1.0.0.exe` from the [Releases](../../releases) page
2. Run the installer (no admin required — per-user install)
3. Launch scriptOdd from the Start Menu or Desktop shortcut

### First Use

The app opens with a sample screenplay. Start typing or press `Ctrl+N` for a blank project.

### Keyboard Quick Reference

| Shortcut | Action |
|---|---|
| `Enter` | Context-aware next element |
| `Tab` | Cycle element type forward |
| `Shift+Tab` | Cycle element type backward |
| `Ctrl+Enter` | Insert new scene heading |
| `Alt+↓` / `Alt+↑` | Jump to next/previous scene |
| `Ctrl+1/2/3` | Draft / Page / Board view |
| `Ctrl+\` | Toggle left sidebar |
| `Ctrl+Shift+\` | Toggle right panel |
| `Ctrl+Shift+F` | Focus mode |
| `Ctrl+N` | New project |
| `Ctrl+O` | Open project |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+Shift+E` | Export PDF |
| `Ctrl+Shift+T` | Cycle theme |

---

## File Formats

| Format | Use |
|---|---|
| `.sodd` | Native project format — saves full editor state |
| `.fountain` | Import/export for interoperability with other tools |
| `.pdf` | Export for reading, printing, and sharing |

---

## CI & Release Workflow

### Automatic CI builds

Every push to any branch and every pull request automatically runs the CI
workflow (`ci.yml`), which:

- Type-checks and runs unit tests.
- Builds a Windows `.exe` installer and macOS `.dmg` / `.zip` installers.
- Uploads them as **GitHub Actions artifacts** (available for 7 days in the Actions tab).
- Does **not** create a public GitHub Release.

### Official releases (Release Please)

Official versioned releases are managed by [Release Please](https://github.com/googleapis/release-please):

1. Write commits using the [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `fix: …` → patch bump (e.g. `1.0.0 → 1.0.1`)
   - `feat: …` → minor bump (e.g. `1.0.0 → 1.1.0`)
   - `feat!: …` or `BREAKING CHANGE:` footer → major bump
   - `chore:`, `docs:`, `refactor:`, etc. → no version bump
2. Push to `main`. Release Please automatically opens or updates a **Release PR**
   with a version bump and updated changelog.
3. When you are ready to release, **merge the Release PR**.
4. Release Please creates a version tag (e.g. `v1.0.1`) and a GitHub Release.
5. The `release.yml` workflow builds the `.exe` and `.dmg` installers and uploads
   them to the GitHub Release for manual download — the same experience as before.

See [UPDATES.md](UPDATES.md) for the full workflow details.

---

## Building from Source

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Type check
npm run typecheck

# Run tests
npm run test

# Build + package (Windows installer)
npm run dist:win

# Build + package (macOS DMG)
npm run dist:mac

# Build + package (Linux AppImage)
npm run dist:linux
```

### Icon files (required for packaging)

Place the following in `build/`:
- `icon.ico` — Windows (256×256 multi-size ICO recommended)
- `icon.icns` — macOS bundle
- `icon.png` — Linux (512×512 PNG)

---

## Architecture

- **Electron 29** + **React 18** + **TypeScript 5**
- **Tiptap 3** (ProseMirror-based rich text editor with custom screenplay nodes)
- **Zustand 4** (state management)
- **TailwindCSS 3** (styling)
- **electron-builder** (packaging)

### Key source directories

```
src/
  main/          — Electron main process (IPC, file ops, menus)
  preload/       — Secure context bridge
  renderer/src/
    editor/      — Tiptap extensions, keyboard, autoformat, semantic highlight
    components/  — React UI (AppShell, views, panels, toolbars)
    store/       — Zustand stores (document, project, layout, settings, app)
    persistence/ — Serialization (format.ts, fountain.ts, pdf.ts)
    hooks/       — useProjectOperations, useKeyboard, useTheme
    types/       — TypeScript types
src/tests/       — Automated tests (Node built-in runner)
```

---

## Testing

```bash
npm run test
# 33 tests covering: Fountain import/export, project format, scene derivation
```

---

## Known Limitations (v1.0.0)

- No collaborative editing
- No cloud sync or backup
- No revision tracking or compare mode
- No Final Draft (FDX) import/export
- No spell check (relies on OS/browser spell check)
- PDF page numbers via CSS `@page` counter (Electron 29 — works on Windows/Linux; macOS may vary)

---

## License

MIT — see [LICENSE](LICENSE)
