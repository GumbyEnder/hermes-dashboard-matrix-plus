

## Plan: 7 Features — ASCII Art, Live Status, Keyboard Shortcuts, Command Palette, Kanban Tasks, Notifications, Collapsible Panels

### 1. ASCII Art Section (NavRail bottom icon)

Add a new nav icon at the bottom of the rail (above Settings) using a custom ASCII-style icon (e.g., a `Terminal` or `Code2` icon styled with monospace). Clicking opens a full-screen ASCII art viewer in the main panel showing the Hermes ASCII logo (hardcoded from the uploaded reference — yellow/amber block letters). Includes an "Upload" button (mock file picker) and a simple text editor to create/edit ASCII art.

**Files:** `NavRail.tsx` (add icon + new section type), `AppShell.tsx` (wire new section), new `src/components/sections/AsciiSection.tsx`

### 2. Live Status Indicators (WorkspacePanel)

Replace static mock data in `SystemResources.tsx` with a `useEffect` interval (every 3s) that randomizes CPU/Mem/Net values within realistic ranges. Add animated pulse dots (CSS `@keyframes pulse`) next to each resource. Show a live "last updated" counter that ticks.

**Files:** `SystemResources.tsx`

### 3. Keyboard Shortcuts (Ctrl+1-9 for sections)

Add a global `useEffect` keydown listener in `AppShell.tsx`. `Ctrl+1` through `Ctrl+9` maps to the 9 nav sections in order. `Ctrl+K` opens command palette (see #4). Show shortcut hints in NavRail tooltips.

**Files:** `AppShell.tsx`, `NavRail.tsx` (tooltip hints)

### 4. Command Palette (Ctrl+K)

New `CommandPalette.tsx` using the existing `cmdk` + `Command` UI components already in the project. Lists all sections, profiles, and actions. Typing filters results. Selecting navigates. Opens via `Ctrl+K` or a search icon.

**Files:** new `src/components/CommandPalette.tsx`, `AppShell.tsx` (state + render)

### 5. Drag-and-Drop Kanban Task Board

Replace the `TasksMain` placeholder with a 3-column Kanban (Todo / In Progress / Done). Use native HTML drag-and-drop API (no extra deps). Tasks are cards that can be dragged between columns. Mock data seeded from existing tasks.

**Files:** `src/components/sections/TasksSection.tsx` (rewrite `TasksMain`)

### 6. Notification Toasts

Add a simulated event system using `sonner` toast (already installed). A `useEffect` in `AppShell.tsx` fires random agent events every 15-30s (e.g., "Task complete: Daily summary", "Build succeeded", "New commit pushed"). Toasts appear bottom-right with themed styling.

**Files:** `AppShell.tsx` (event simulation), `src/components/ui/sonner.tsx` (fix `useTheme` import to use local hook instead of `next-themes`)

### 7. Collapsible Left/Right Panels

Add collapse state for left and right panels. Double-clicking a resize divider toggles collapse. When collapsed, panel width goes to 0 with a CSS transition. Add a small expand button visible when collapsed. Hotkeys: `Ctrl+B` toggle left, `Ctrl+Shift+B` toggle right.

**Files:** `AppShell.tsx` (collapse state, transitions, hotkeys)

---

### Technical Notes

- **No new dependencies** — uses existing `cmdk`, `sonner`, native drag-and-drop, CSS animations
- **sonner fix** — current `sonner.tsx` imports from `next-themes` which doesn't exist; will switch to local `useTheme` hook
- The ASCII section adds a new `NavSection` union member `"ascii"` — wired like profiles with custom rendering
- All keyboard shortcuts use `Ctrl` (not `Cmd`) with `preventDefault` to avoid browser conflicts
- Kanban uses `onDragStart`/`onDragOver`/`onDrop` with state managed via `useState`

