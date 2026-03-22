# scriptOdd — QA Checklist

Version: 1.0.0
Platform: Windows (primary), macOS, Linux

---

## App Launch

- [ ] App launches without errors or blank screen
- [ ] Title bar shows "scriptOdd" with window controls (minimize, maximize, close)
- [ ] Default dark theme is applied correctly
- [ ] Seed screenplay content loads on first launch
- [ ] Scene navigator (left sidebar) shows initial scenes

---

## Typing Flow

- [ ] Typing in a **scene heading** forces text to uppercase
- [ ] Typing in a **character** block forces text to uppercase
- [ ] `Enter` after scene heading creates an action block
- [ ] `Enter` after character creates a dialogue block
- [ ] `Enter` on empty dialogue converts it to action (escape)
- [ ] `Enter` after dialogue (at end) creates a new character block
- [ ] `Enter` after parenthetical resumes dialogue
- [ ] `Enter` after non-empty transition creates a new scene heading
- [ ] `Tab` cycles forward through element types (sceneHeading → action → character → …)
- [ ] `Shift+Tab` cycles backward through element types
- [ ] `Backspace` at start of character/dialogue/parenthetical does NOT merge into previous block

---

## Keyboard Shortcuts

- [ ] `Ctrl+Enter` — inserts new scene heading at cursor
- [ ] `Alt+ArrowDown` — jumps to next scene heading
- [ ] `Alt+ArrowUp` — jumps to previous scene heading
- [ ] `Ctrl+1` — switches to Draft view
- [ ] `Ctrl+2` — switches to Page view
- [ ] `Ctrl+3` — switches to Board view
- [ ] `Ctrl+\` — toggles left sidebar
- [ ] `Ctrl+Shift+\` — toggles right panel
- [ ] `Ctrl+Shift+F` — toggles focus mode
- [ ] `Ctrl+N` — new project
- [ ] `Ctrl+O` — open project dialog
- [ ] `Ctrl+S` — save project
- [ ] `Ctrl+Shift+S` — save project as
- [ ] `Ctrl+P` — opens command palette
- [ ] `Ctrl+,` — opens settings panel

---

## Scene Navigation & Board

- [ ] Clicking a scene in the navigator jumps to it in the editor
- [ ] Active scene highlighted in navigator as cursor moves
- [ ] Board view shows all scenes as cards
- [ ] Drag-and-drop reorders scenes in Board view
- [ ] Reorder reflects immediately in editor and navigator
- [ ] Scene synopsis can be edited (Board card or right panel)
- [ ] Scene color labels visible on cards

---

## Notes / Comments

- [ ] Can add a note to a scene from right panel
- [ ] Notes persist after save/reload
- [ ] Deleting a note works without error

---

## Semantic Highlighting

- [ ] Enabling semantic highlighting colors character names in dialogue
- [ ] Locations highlighted in scene headings when enabled
- [ ] Highlight style (minimal/vivid) changes appearance
- [ ] Disabling semantic highlighting removes all color
- [ ] Settings persist after restart

---

## Save / Load

- [ ] `Ctrl+S` saves to existing path (no dialog on second save)
- [ ] First save (`Ctrl+S` with no path) prompts for file location
- [ ] `Ctrl+Shift+S` (Save As) always prompts for new path
- [ ] Saved `.sodd` file can be reopened with full fidelity
- [ ] Scenes, notes, entities, layout all restored after open
- [ ] Error toast appears if save fails (e.g., read-only location)
- [ ] Error toast appears if open fails (corrupt file)
- [ ] Title bar updates to show filename after save

---

## Autosave & Crash Recovery

- [ ] Autosave runs every 60 seconds when project has unsaved changes
- [ ] Crash recovery banner appears on next launch after unclean exit
- [ ] Clicking "Restore" loads the recovered session
- [ ] Clicking "Discard" dismisses the banner and deletes recovery file
- [ ] Recovery file is deleted after successful manual save

---

## Fountain Import

- [ ] File > Open accepts `.fountain` files
- [ ] Scene headings (INT./EXT.) parsed correctly
- [ ] Character + dialogue blocks preserved
- [ ] Parentheticals preserved
- [ ] Transitions preserved
- [ ] Notes (`[[...]]`) preserved
- [ ] Title page metadata (Title:, Author:) extracted to project meta
- [ ] Multi-line action paragraphs each become separate action blocks

---

## Fountain Export

- [ ] File > Export Fountain produces a `.fountain` text file
- [ ] Scene headings are uppercase
- [ ] Character names are uppercase
- [ ] Dialogue indented correctly
- [ ] Title page header present if project has title/author
- [ ] Exported file can be round-tripped back via import
- [ ] Success toast appears after export

---

## PDF Export

- [ ] File > Export PDF prompts for save location
- [ ] "Exporting PDF…" toast appears while processing
- [ ] PDF opens correctly in system PDF viewer
- [ ] Title page present with title, author, date
- [ ] Scene headings are uppercase and properly spaced
- [ ] Character/dialogue formatted with correct indentation
- [ ] Transitions right-aligned
- [ ] Notes NOT included in printed output
- [ ] Page numbers appear in top-right corner (from page 2)
- [ ] Success toast appears after export
- [ ] Error toast appears if export fails

---

## Long Scripts (Performance)

- [ ] 100+ scene script loads in under 5 seconds
- [ ] Typing remains responsive (no lag) with 100+ scenes
- [ ] Scene navigator scrolls smoothly with many scenes
- [ ] Board view renders all cards without freezing

---

## Themes

- [ ] Dark theme: correct colors throughout
- [ ] Light theme: correct colors throughout
- [ ] High-contrast theme: correct colors throughout
- [ ] `Ctrl+Shift+T` cycles through themes
- [ ] Theme preference persists after restart

---

## Layout

- [ ] Left sidebar resizable by dragging divider
- [ ] Right panel resizable by dragging divider
- [ ] Focus mode hides all chrome, editor fills screen
- [ ] Layout state persists after restart

---

## Windows-Specific

- [ ] NSIS installer runs without UAC prompt (per-user install)
- [ ] Desktop shortcut created if option selected
- [ ] Start menu shortcut created
- [ ] App uninstalls cleanly via Control Panel
- [ ] `.sodd` file association opens app on double-click (if registered)
- [ ] App name shows correctly in taskbar, task manager, title bar

---

## Error Handling

- [ ] Corrupt `.sodd` file shows error toast (not silent failure)
- [ ] Failed save shows error toast
- [ ] Failed PDF export shows error toast
- [ ] No unhandled exceptions visible in dev console during normal use

---

## Edge Cases

- [ ] New project with no content saves and loads correctly
- [ ] Script with only one scene works (no crashes in board view)
- [ ] Scene with no content (empty heading) doesn't break scene list
- [ ] Undo/redo works for typing (Ctrl+Z / Ctrl+Y)
- [ ] Pasting rich text into scene heading strips formatting and uppercases
