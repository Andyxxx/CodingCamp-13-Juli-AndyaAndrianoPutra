# Implementation Plan: New Tab Dashboard

## Overview

Implement a zero-dependency, single-page browser dashboard delivered as `index.html` + `css/style.css` + `js/app.js`. Modules are added to `app.js` in order: `StorageService → ThemeController → GreetingWidget → TimerModule → TaskManager → LinkManager → DashboardApp`. All `localStorage` keys are prefixed `ndt_`. Theme is applied via an inline `<script>` in `<head>` before the CSS `<link>` to prevent FOUT.

---

## Tasks

- [ ] 1. Scaffold project files
  - [ ] 1.1 Create `index.html` with full page structure
    - Add `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, `<body>`
    - Place inline FOUT-prevention `<script>` in `<head>` before the CSS `<link>`: reads `ndt_theme` from `localStorage` and sets `document.documentElement.dataset.theme = 'dark'` if stored value is `'dark'`
    - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
    - Add `<script src="js/app.js" defer></script>` before `</body>`
    - Add semantic landmark elements: `<header>` (theme toggle), `<main>` (greeting, timer, tasks, links), and placeholder `id` attributes for every widget root (`#greeting-widget`, `#timer-widget`, `#task-widget`, `#link-widget`)
    - _Requirements: 13.3, 15.1, 15.3_
  - [ ] 1.2 Create `css/style.css` stub with CSS custom properties
    - Declare `:root` with light-theme color tokens: `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-border`, `--color-error`
    - Add `[data-theme="dark"]` block overriding all tokens with dark values
    - Add minimal reset (`*, *::before, *::after { box-sizing: border-box; }`) and `body` base styles
    - _Requirements: 13.1, 13.2, 13.4, 15.1_
  - [ ] 1.3 Create `js/app.js` stub with module placeholders
    - Declare `localStorage` key constants at top: `KEY_THEME`, `KEY_USER_NAME`, `KEY_POMODORO_DURATION`, `KEY_TASKS`, `KEY_SORT_MODE`, `KEY_LINKS` — all prefixed `ndt_`
    - Add empty named object literals in order: `StorageService`, `ThemeController`, `GreetingWidget`, `TimerModule`, `TaskManager`, `LinkManager`, `DashboardApp`
    - Add `document.addEventListener('DOMContentLoaded', () => DashboardApp.init())` at the bottom
    - _Requirements: 14.1, 15.1, 15.3_

- [ ] 2. Implement `StorageService`
  - [ ] 2.1 Implement safe `localStorage` wrapper methods
    - Implement `StorageService.get(key)` — JSON-parses the stored value, returns `null` on error or missing key
    - Implement `StorageService.set(key, value)` — JSON-stringifies and writes; on catch sets `available = false` and renders a non-blocking warning banner (`<div role="alert">`) once
    - Implement `StorageService.remove(key)` — calls `localStorage.removeItem`; no-ops if `available === false`
    - Implement `StorageService.isAvailable()` — returns the `available` boolean
    - Initialize `available = true`; wrap a test write/read/delete in a try/catch during module init to detect locked storage
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 3. Implement `ThemeController` and complete CSS theme variables
  - [ ] 3.1 Implement `ThemeController` methods
    - Implement `ThemeController.getCurrent()` — reads `StorageService.get(KEY_THEME)`, returns `'light'` if null/invalid
    - Implement `ThemeController.init()` — applies the stored theme to `document.documentElement.dataset.theme`, wires the `#theme-toggle` button's `click` event to `toggle()`, and sets `aria-pressed` to reflect current state
    - Implement `ThemeController.toggle()` — flips the current theme, calls `StorageService.set(KEY_THEME, newTheme)`, updates `document.documentElement.dataset.theme`, updates `aria-pressed` on the toggle button
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [ ]* 3.2 Write property test for theme toggle round-trip
    - **Property 25: Theme toggle is a round-trip (involution)**
    - **Validates: Requirements 13.2**
    - Test that calling `toggle()` twice from any starting theme restores the original value in both DOM and storage
  - [ ] 3.3 Flesh out `css/style.css` theme token values
    - Expand `:root` and `[data-theme="dark"]` with complete, contrast-compliant color values for all tokens (background, surface, text, primary, border, error, success)
    - Verify WCAG 2.1 AA contrast ratio (≥4.5:1 for normal text) for both themes
    - _Requirements: 13.1, 13.2, 15.1_

- [ ] 4. Implement `GreetingWidget`
  - [ ] 4.1 Implement pure helper functions
    - Implement `GreetingWidget._formatTime(h, m, s)` — returns zero-padded `"HH:MM:SS"` string
    - Implement `GreetingWidget._formatDate(date)` — returns `"Weekday, DD Month YYYY"` using `Intl.DateTimeFormat` or equivalent
    - Implement `GreetingWidget._getGreeting(hour)` — returns correct greeting for hour 0–23 per spec ranges
    - Implement `GreetingWidget._buildMessage(greeting, name)` — appends `", " + name` when name is non-empty after trimming, returns greeting only otherwise
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 4.2 Write property test for time formatting
    - **Property 1: Time formatting is always zero-padded HH:MM:SS**
    - **Validates: Requirements 1.1**
    - Use `fast-check` with `fc.integer({min:0,max:23})`, `fc.integer({min:0,max:59})`, `fc.integer({min:0,max:59})`; assert result matches `/^\d{2}:\d{2}:\d{2}$/`
  - [ ]* 4.3 Write property test for date formatting
    - **Property 2: Date formatting contains all required components**
    - **Validates: Requirements 1.2**
    - Generate random valid `Date` objects; assert returned string contains weekday, day, month name, and 4-digit year
  - [ ]* 4.4 Write property test for greeting selection
    - **Property 3: Greeting selection covers all 24 hours**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Use `fc.integer({min:0,max:23})`; assert correct greeting string for each hour range
  - [ ]* 4.5 Write property test for greeting message building
    - **Property 4: Greeting message includes name when present, omits it when absent**
    - **Validates: Requirements 2.5, 2.6**
    - Test both non-empty trimmed names (expect `g + ", " + n`) and null/whitespace names (expect exactly `g`)
  - [ ] 4.6 Implement `GreetingWidget.init()` and `setName()`
    - Implement `init()`: reads `KEY_USER_NAME` from storage, starts `setInterval(_tick, 1000)`, immediately calls `_tick()`, renders name input and save button wired to `setName()`
    - Implement `setName(name)`: trims input; if non-empty calls `StorageService.set(KEY_USER_NAME, trimmed)`, else calls `StorageService.remove(KEY_USER_NAME)`; updates greeting display
    - Implement `_tick()`: updates `#clock`, `#date`, and `#greeting` DOM elements using helper functions
    - _Requirements: 1.1, 1.2, 1.3, 2.1–2.6, 3.1–3.4_
  - [ ]* 4.7 Write property test for name persistence round-trip
    - **Property 5: Name persistence round-trip**
    - **Validates: Requirements 3.2**
    - For any non-empty trimmed string, assert `localStorage` returns the same trimmed value after `saveName`
  - [ ]* 4.8 Write property test for whitespace-only name clearing storage
    - **Property 6: Whitespace-only name clears storage**
    - **Validates: Requirements 3.3**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`; assert `localStorage.getItem(KEY_USER_NAME)` is `null` after save

- [ ] 5. Implement `TimerModule`
  - [ ] 5.1 Implement pure helper and state machine
    - Implement `TimerModule._formatTimer(seconds)` — returns zero-padded `"MM:SS"` (MM may exceed 59)
    - Define state constants `STOPPED`, `RUNNING`, `FINISHED`
    - Implement `TimerModule._render()` — updates `#timer-display`, syncs `startBtn.disabled` and `stopBtn.disabled` per state rule
    - _Requirements: 4.1, 4.7, 4.8_
  - [ ]* 5.2 Write property test for timer formatting
    - **Property 7: Timer formatting is always zero-padded MM:SS**
    - **Validates: Requirements 4.1**
    - Use `fc.integer({min:0,max:5999})`; assert result matches `/^\d{2}:\d{2}$/` and `MM*60 + SS === input`
  - [ ]* 5.3 Write property test for timer button states
    - **Property 10: Timer button states match running status**
    - **Validates: Requirements 4.7, 4.8**
    - For RUNNING state assert `startBtn.disabled === true`, `stopBtn.disabled === false`; for STOPPED/FINISHED assert the inverse
  - [ ] 5.4 Implement `TimerModule.init()`, `start()`, `stop()`, `reset()`, `setDuration()`
    - Implement `init()`: reads `KEY_POMODORO_DURATION` from storage (default 25), validates schema, sets state to STOPPED, calls `_render()`, wires start/stop/reset buttons and duration input
    - Implement `start()`: records `startTime = Date.now()` and `startRemaining`, sets state to RUNNING, calls `setInterval(_tick, 1000)`, calls `_render()`
    - Implement `stop()`: clears interval, sets state to STOPPED, retains `remaining`, calls `_render()`
    - Implement `reset()`: clears interval, sets `remaining = duration * 60`, sets state to STOPPED, calls `_render()`
    - Implement `_tick()`: computes elapsed via `Date.now() - startTime`, updates `remaining`; if `remaining ≤ 0` transitions to FINISHED, emits visual alert (`role="alert"`) or `alert()`, calls `_render()`
    - Implement `setDuration(minutes)`: validates integer in [1,120] — on invalid shows error, does nothing; on valid saves to storage, calls `reset()`
    - _Requirements: 4.2–4.8, 5.1–5.4_
  - [ ]* 5.5 Write property test for timer countdown monotonicity
    - **Property 8: Timer countdown is monotonically decreasing by one per tick**
    - **Validates: Requirements 4.3**
    - Simulate N ticks on a TimerModule instance; assert `remaining === T - N` for all N ≤ T
  - [ ]* 5.6 Write property test for timer reset restoring full duration
    - **Property 9: Timer resets to configured duration**
    - **Validates: Requirements 4.5**
    - For any duration D in [1,120], after `reset()` assert display equals `D` minutes in MM:SS
  - [ ]* 5.7 Write property test for valid duration persistence
    - **Property 11: Valid Pomodoro duration is persisted and reflected in timer display**
    - **Validates: Requirements 5.2**
    - For any integer d in [1,120], after `setDuration(d)` assert `localStorage` holds `d` and display equals d minutes
  - [ ]* 5.8 Write property test for out-of-range duration rejection
    - **Property 12: Out-of-range Pomodoro duration is rejected**
    - **Validates: Requirements 5.3**
    - For any integer d where `d < 1` or `d > 120`, after `setDuration(d)` assert `localStorage` unchanged and display unchanged

- [ ] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass. Ask the user if questions arise.

- [ ] 7. Implement `TaskManager`
  - [ ] 7.1 Implement pure helper functions
    - Implement `TaskManager._normalize(text)` — returns `text.trim().toLowerCase()`
    - Implement `TaskManager._isDuplicate(text, excludeId)` — iterates `tasks` where `done === false` and `id !== excludeId`; returns `true` if any normalized text matches
    - Implement `TaskManager._sortTasks(tasks, mode)` — shallow-copies and sorts per mode: `default` (createdAt asc), `az` (localeCompare), `za` (localeCompare reversed), `completed_last` (done asc, createdAt tiebreak)
    - _Requirements: 6.4, 7.5, 10.1, 10.2_
  - [ ]* 7.2 Write property test for duplicate detection
    - **Property 15: Duplicate task detection (case-insensitive, trimmed)**
    - **Validates: Requirements 6.4, 7.5**
    - For any incomplete task text T and any string s where `s.trim().toLowerCase() === T.text.trim().toLowerCase()`, assert `_isDuplicate(s)` returns `true`; also assert `_isDuplicate(T.text, T.id)` returns `false` (self-exclusion)
  - [ ]* 7.3 Write property test for sort correctness
    - **Property 21: Sort order is correct for all modes**
    - **Validates: Requirements 10.2**
    - For each of the four modes, assert every adjacent pair `(a, b)` in sorted output satisfies the mode comparator
  - [ ]* 7.4 Write property test for sort not mutating storage data
    - **Property 20: Sort does not mutate stored task data**
    - **Validates: Requirements 10.2**
    - After `setSortMode(mode)`, assert `text`, `done`, `id`, `createdAt` of every task in storage are unchanged
  - [ ] 7.5 Implement `TaskManager.init()`, `addTask()`, `editTask()`, `deleteTask()`, `toggleComplete()`, `setSortMode()`, `_renderList()`
    - Implement `init()`: reads `KEY_TASKS` and `KEY_SORT_MODE` from storage with schema validation; falls back to `[]` and `"default"`; calls `_renderList()`
    - Implement `addTask(text)`: validates non-empty, checks `_isDuplicate`, generates id (`Date.now() + '-' + Math.random().toString(36).slice(2,9)`), pushes Task, saves, re-renders; shows inline errors for empty/duplicate
    - Implement `editTask(id, text)`: validates non-empty, checks `_isDuplicate(text, id)`, updates task text in array, saves, re-renders; shows inline errors; no-ops on cancel path
    - Implement `deleteTask(id)`: filters task from array, saves, re-renders
    - Implement `toggleComplete(id)`: flips `done` flag, saves, re-renders
    - Implement `setSortMode(mode)`: validates mode string, saves to `KEY_SORT_MODE`, calls `_renderList()` — does not mutate task array
    - Implement `_renderList()`: sorts via `_sortTasks`, builds task item DOM (checkbox, text span, edit input hidden, edit/confirm/cancel buttons, delete button), replaces `#task-list` contents
    - Wire task input submit and sort `<select>` change in `init()`
    - _Requirements: 6.1–6.5, 7.1–7.6, 8.1–8.3, 9.1–9.2, 10.1–10.3_
  - [ ]* 7.6 Write property test for addTask creating correct fields
    - **Property 13: Adding a valid task creates it with correct fields**
    - **Validates: Requirements 6.2**
    - For any non-empty non-duplicate text, assert resulting Task has `text === input.trim()`, non-empty `id`, positive `createdAt`
  - [ ]* 7.7 Write property test for whitespace-only task rejection
    - **Property 14: Whitespace-only task text is rejected**
    - **Validates: Requirements 6.3**
    - For any whitespace-only string, assert task list length unchanged and storage not written
  - [ ]* 7.8 Write property test for editTask round-trip
    - **Property 16: Task edit round-trip**
    - **Validates: Requirements 7.3**
    - For any valid (non-empty, non-duplicate) new text, assert task `text` equals `newText.trim()` in both memory and storage
  - [ ]* 7.9 Write property test for whitespace-only edit rejection
    - **Property 17: Whitespace-only edit is rejected and leaves original text unchanged**
    - **Validates: Requirements 7.4**
    - For any whitespace-only string, assert task text unchanged in both memory and storage
  - [ ]* 7.10 Write property test for completion toggle round-trip
    - **Property 18: Completion toggle is a round-trip (involution)**
    - **Validates: Requirements 8.2, 8.3**
    - Toggle any task twice; assert `done` returns to original value and storage matches after each toggle
  - [ ] 7.11 Write property test for task deletion
    - **Property 19: Deleting a task removes only that task**
    - **Validates: Requirements 9.2**
    - Assert deleted task absent, all other tasks present and unmodified in both memory and storage

- [ ] 8. Implement `LinkManager`
  - [ ] 8.1 Implement pure helper and core methods
    - Implement `LinkManager._validateURL(url)` — uses `new URL(url.trim())` in try/catch; returns `true` only if `protocol === 'http:' || protocol === 'https:'`
    - Implement `LinkManager._renderLinks()` — builds link cards from `links` array; each card has label text, `<a href target="_blank">` (or button that calls `window.open`), and a delete button
    - Implement `LinkManager.init()`: reads `KEY_LINKS` from storage with schema validation; calls `_renderLinks()`; wires add-link form submit
    - Implement `LinkManager.addLink(label, url)`: validates non-empty label and valid URL; generates id; pushes QuickLink; saves; re-renders; shows inline error on invalid input
    - Implement `LinkManager.deleteLink(id)`: filters link from array; saves; re-renders
    - _Requirements: 11.1–11.5, 12.1–12.2_
  - [ ]* 8.2 Write property test for valid link addition
    - **Property 22: Valid quick-link is persisted and rendered**
    - **Validates: Requirements 11.2**
    - For any label (1–50 chars) and valid http/https URL, assert QuickLink saved to storage and rendered
  - [ ]* 8.3 Write property test for invalid link rejection
    - **Property 23: Invalid quick-link input is rejected**
    - **Validates: Requirements 11.3**
    - For empty/whitespace labels OR invalid/non-http URLs, assert link list unchanged and storage not written
  - [ ]* 8.4 Write property test for link deletion
    - **Property 24: Deleting a link removes only that link**
    - **Validates: Requirements 12.2**
    - Assert deleted link absent, all other links present and unmodified in both memory and storage

- [ ] 9. Implement `DashboardApp` orchestrator and wire everything together
  - [ ] 9.1 Implement `DashboardApp.init()` and complete `index.html` widget markup
    - Implement `DashboardApp.init()`: calls `StorageService` availability check, then `ThemeController.init()`, `GreetingWidget.init()`, `TimerModule.init()`, `TaskManager.init()`, `LinkManager.init()` in that order
    - Complete `index.html` with all widget HTML structures: theme toggle button (`#theme-toggle`, `aria-pressed`), greeting section (`#clock`, `#date`, `#greeting`, name input `#name-input`, save button), timer section (`#timer-display`, `#start-btn`, `#stop-btn`, `#reset-btn`, duration input `#duration-input`), task section (`#task-input`, `#task-submit`, `#task-list`, sort `<select id="sort-select">`), link section (`#link-label-input`, `#link-url-input`, `#link-submit`, `#link-list`)
    - Ensure every `<input>` has an associated `<label>` element
    - Add `role="alert"` to all error/warning message containers
    - _Requirements: 4.2, 6.1, 6.5, 10.3, 11.5, 13.1, 14.2, 14.3, 15.1_

- [ ] 10. Implement responsive CSS layout
  - [ ] 10.1 Implement CSS Grid layout and responsive breakpoints
    - Implement `<main>` as CSS Grid; greeting and link widgets span full width; timer and task widgets share a two-column row on `≥768px`
    - Add `@media (max-width: 767px)` breakpoint collapsing grid to single column
    - Add `max-width` container (e.g., `1200px`) centered with `margin: 0 auto` for `≥1200px`
    - Ensure all interactive controls (buttons, inputs) have `min-height: 44px; min-width: 44px` for mobile touch targets
    - Ensure no horizontal scrolling at any viewport from 320px to 2560px
    - _Requirements: 15.4_
  - [ ] 10.2 Style all widget components
    - Style greeting widget: large clock font, readable date, greeting + name text
    - Style timer widget: prominent MM:SS display, clearly labelled control buttons, duration input with inline error span
    - Style task widget: task list items with checkbox, text, edit/delete controls; completed tasks with strikethrough; sort dropdown
    - Style link widget: link cards in a flex-wrap row, delete button on hover/focus; add-link form with inline error span
    - Style storage warning banner (dismissible, non-blocking, full-width)
    - _Requirements: 8.2, 15.1_

- [ ] 11. Accessibility pass
  - [ ] 11.1 Audit and complete accessibility attributes
    - Verify every `<input>` has a programmatically associated `<label>` (via `for`/`id` or `aria-label`)
    - Add `aria-label` to icon-only buttons (edit, delete, theme toggle) describing their action
    - Ensure `#theme-toggle` has `aria-pressed` updated on every toggle
    - Ensure timer start/stop/reset buttons have `aria-label` describing current action (e.g., "Start timer", "Stop timer")
    - Confirm all inline error/warning `<span>` elements have `role="alert"` so screen readers announce them
    - _Requirements: 14.3, 15.1_
  - [ ] 11.2 Verify color contrast in both themes
    - Check that `--color-text` on `--color-bg` and `--color-text` on `--color-surface` achieve ≥4.5:1 contrast ratio in both light and dark themes
    - Adjust token values in `css/style.css` if any ratio falls below WCAG 2.1 AA
    - _Requirements: 15.1_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- All `localStorage` keys use the `ndt_` prefix to avoid collisions.
- No build tools, bundlers, or frameworks — the project must run by opening `index.html` directly in a browser.
- The inline FOUT-prevention script in `<head>` is the only code outside `app.js`; keep it minimal (reads one key, sets one attribute).
- `fast-check` is used for property-based tests; `jest` + `jest-environment-jsdom` (or Vitest) for the test runner.
- Property tests reference design properties by number for traceability.
- Each task references specific requirements for full traceability back to the spec.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.3"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 5, "tasks": ["4.7", "4.8", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["5.5", "5.6", "5.7", "5.8", "7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4", "7.5", "8.1"] },
    { "id": 9, "tasks": ["7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "8.2", "8.3", "8.4"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["11.1", "11.2"] }
  ]
}
```
