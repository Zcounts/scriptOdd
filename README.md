# scriptOdd

Windows-first desktop screenwriting software built for fast writing, clean screenplay formatting, and a modern editor-style UI.

## Overview

[APP_NAME] is a local-only screenplay editor for feature films and short films.

It is designed to feel closer to a creative coding editor than a fake typewriter, while still producing properly formatted screenplay pages and keeping the writing flow fast.

The goal is not to clone Final Draft feature-for-feature. The goal is to build the core screenwriting experience that actually matters:

- automatic screenplay element formatting
- fast keyboard-first writing flow
- scene navigation
- outline / index card board
- notes
- autocomplete and remembered entities
- semantic color coding
- local save/load
- PDF export

## Core Principles

- Fast to write in
- Clean screenplay page output
- Local-only and private
- Customizable layout
- Beautiful dark mode by default
- White page mode available
- Minimal friction between idea and page

## V1 Scope

### Writing
- Feature film and short film workflows
- Automatic screenplay element handling
- Scene Heading
- Action
- Character
- Dialogue
- Parenthetical
- Transition
- Smart Enter / Tab / Shift+Tab behavior
- Automatic character cue memory
- Scene heading memory and autocomplete
- Page-aware screenplay view

### Navigation
- Scene navigator sidebar
- Index card / outline board
- Drag to reorder scenes
- Click scene to jump in editor
- Optional split layout with editor + navigator + board

### Notes
- Per-scene notes
- Inline notes / comments
- Outline notes
- Project notes

### Semantic Highlighting
- Toggleable color coding like a code editor
- Character names share a consistent color
- Locations share a consistent color
- Tagged props share a consistent color
- Ability to turn all highlighting off for a clean script view

### Persistence
- Save/open local project files
- Autosave and crash recovery
- Recent projects
- Export screenplay to PDF
- Import/export Fountain

## Non-Goals for V1
- Collaboration
- Cloud sync
- Revision mode
- Production reports
- Scheduling
- Call sheets
- Budgeting
- AI writing features

## File Strategy

[APP_NAME] uses a native local project file as the source of truth.

Recommended:
- `.appname` project file for full editor state
- `.fountain` import/export for portability
- `.pdf` export for sharing and printing

The project file should preserve:
- screenplay content
- screenplay element metadata
- notes
- scene order
- board cards
- semantic tags
- color settings
- panel layout
- theme preferences
- recent autocomplete entities

## UI Direction

Default UI:
- dark creative theme
- modern editor chrome
- resizable panels
- optional minimap / overview
- clean typography
- focus mode

Secondary mode:
- white screenplay page view for traditional reading / export preview

## Editor Behavior

The writing experience should be keyboard-first.

Core behaviors:
- Enter advances naturally to the next expected screenplay element
- Tab cycles element type intentionally
- Shift+Tab moves backward through likely element types
- Character cues are auto-suggested from previously used characters
- Scene headings are auto-suggested from previous headings
- The editor should feel fast with minimal mouse dependence

## Architecture

### App Shell
- Electron
- React
- TypeScript
- TailwindCSS
- Zustand

### Editor
- Screenplay-aware rich text editor with custom block types
- Semantic tagging + syntax-style highlighting
- Page view + draft view

### Storage
- Local filesystem only
- Autosave snapshots
- Recovery session handling

## Planned Views

- Draft View
- Page View
- Navigator
- Index Card / Outline Board
- Notes Panel
- Project Search

## Roadmap

### Phase 1
Project scaffold, desktop shell, layout system, base store

### Phase 2
Screenplay document model and editor shell

### Phase 3
Automatic formatting and keyboard flow

### Phase 4
Navigator and index card board

### Phase 5
Autocomplete, notes, remembered entities, semantic color coding

### Phase 6
Themes, preferences, layout customization, page settings

### Phase 7
Save/load, autosave, recovery, Fountain import/export, PDF export

### Phase 8
QA, bug fixing, performance tuning, packaging, release prep

## Development Goals

- Works smoothly on Windows 11
- Opens quickly
- Handles large scripts reliably
- No data loss during crashes
- Exported PDFs are clean and readable
- Keyboard flow feels professional

## Future Ideas
- FDX import/export
- Beat board enhancements
- Script statistics
- Character/location reports
- Side-by-side revision compare
- Production breakdown tagging

## Status

In development.
