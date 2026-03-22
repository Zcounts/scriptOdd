# scriptOdd — Smoke Tests for Packaged Build

These are the minimum checks to confirm a packaged installer or app bundle works
correctly on a clean machine (one that has never run scriptOdd before).

---

## Prerequisites

- Fresh user account or clean VM (no prior scriptOdd install or config)
- Windows 10 or 11, 64-bit (for Windows build)

---

## 1. Install

**Windows:**
1. Run `scriptOdd-Setup-1.0.0.exe`
2. Accept license, choose install directory, click Install
3. Confirm app appears in Start Menu and/or Desktop
4. Launch from shortcut

**Expected:** App window appears within 5 seconds. No crash dialog.

---

## 2. First Launch

1. App opens with the default screenplay (seed content)
2. Title bar shows "scriptOdd"
3. Scene navigator shows scenes in the sidebar
4. Cursor is in the editor and typing works

**Expected:** App is usable immediately, no setup required.

---

## 3. Basic Typing

1. Click on a scene heading — verify it's uppercase as you type
2. Press `Enter` — verify an action block is created below
3. Press `Tab` — verify the block type cycles to another type
4. Type a character name in ALL CAPS, press `Enter` — verify dialogue block created

**Expected:** All transitions work as described.

---

## 4. Save a Project

1. Press `Ctrl+S`
2. File save dialog appears
3. Save to Desktop as `test.sodd`
4. Confirm title bar or status bar shows the project is saved (no ● indicator)

**Expected:** File is created on Desktop.

---

## 5. Open the Saved Project

1. Press `Ctrl+N` to start a new project
2. Press `Ctrl+O`
3. Navigate to Desktop, open `test.sodd`
4. Confirm the content matches what was saved

**Expected:** Content restores correctly.

---

## 6. Export PDF

1. Press `Ctrl+Shift+E` (or File > Export PDF)
2. A "Exporting PDF…" notification appears
3. File save dialog opens — save to Desktop as `test.pdf`
4. Open the PDF in the system viewer
5. Confirm: screenplay content visible, correct formatting (Courier New, indentation)

**Expected:** PDF opens and looks like a properly formatted screenplay.

---

## 7. Fountain Import

1. Create a `.fountain` file with basic content (or use a sample):
   ```
   Title: Test Script
   Author: Jane Doe

   INT. OFFICE - DAY

   JANE
   Hello.
   ```
2. Press `Ctrl+O` and open the `.fountain` file
3. Confirm scenes, character, and dialogue blocks loaded correctly

**Expected:** Fountain file imports without errors.

---

## 8. Fountain Export

1. Press `Ctrl+Shift+F` (or File > Export Fountain — if available via menu)
2. Save to Desktop as `test.fountain`
3. Open in a text editor — confirm proper Fountain formatting

**Expected:** Exported file is readable, correct structure.

---

## 9. Crash Recovery

1. Force-quit the app while a project with unsaved changes is open
   (e.g., Task Manager → End Task on Windows)
2. Relaunch the app
3. Confirm a banner appears: "Unsaved session found. Restore it?"
4. Click "Restore"
5. Confirm previous content is recovered

**Expected:** Recovery works correctly.

---

## 10. Uninstall (Windows only)

1. Open Settings > Apps (or Control Panel > Programs)
2. Find "scriptOdd" and uninstall
3. Confirm app removed from Start Menu and Desktop

**Expected:** Clean removal, no orphaned files in obvious locations.

---

## Pass Criteria

All 10 smoke tests must pass before marking a build as release-ready.
Any failure should be filed as a GitHub issue with priority "release blocker".
