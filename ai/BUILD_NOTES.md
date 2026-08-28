# Build Notes — Vantage

Durable findings only — what a future session would waste time rediscovering. Not a session log. Curated at every phase close.

## MAP — where things live

*(empty — populated at the first phase close and refreshed against the real file tree thereafter)*

---

## Service worker and caching

- `sw.js` is **cache-first**: it serves `index.html` / `app.js` / `style.css` straight from cache and never diffs against the network. Any change to those three is invisible to the installed PWA until `CACHE_NAME` is bumped. The symptom is "I changed it and nothing happened" — it is not a code bug. Bumping the string forces install → activate → old cache deleted → fresh fetch. Last observed version: `vantageprm-cache-v42`.

## Working inside app.js

- One file, ~10,000 lines. **Always search for the exact function before editing it** — do not navigate by scrolling or by assumed location. This is a workaround for a structural issue, not a style preference.
- `index.html` is ~157 KB of markup in one document. Modal and section ids must stay globally unique.
- A single feature routinely spans the prospect modal, the inspector, CSV export, CSV restore, `ensureStateDefaults()` and two or more views — scattered, never adjacent. Budget for the spread when sizing a session.
- `check_ids.py` in the repo root cross-checks `getElementById()` calls inside `setupEventListeners()` against ids actually present in `index.html`. Crude, but it catches the listener-bound-to-a-nonexistent-element class of failure in one command.

## DOM and rendering

- **`innerHTML +=` destroys existing event listeners.** Use `createElement` + `appendChild` whenever the element being added carries a listener. This has bitten the audience inspector specifically.
- Inspector panels use two intentionally different patterns. Prospect Hub uses `.prospect-inspector-panel` — an absolutely-positioned overlay that animates in with `translateX`. The Campaign Hub Audience view puts `#audience-inspector` in as a direct grid child.
- Because of that, the Audience view's container carries an inline `grid-template-columns: 1.2fr 0.9fr; gap: 16px` override in `index.html`. `.prospects-layout-container` defaults to `1fr 0fr`, which collapses the inspector to zero width — the DOM updates correctly and nothing appears to happen. **Do not remove that inline style or "fix" it to match the Prospect Hub pattern.**
- Render functions that read DOM elements should early-return when one is missing — `renderAudienceInspector()` does. A missing element otherwise throws a `TypeError` that kills the entire render, not just that panel.

## Data, migrations and backup

- `wipeAllData()` must clear **both** `localStorage` and IndexedDB. Clearing one leaves orphans.
- New fields need a default in the existing state-defaults path (`ensureStateDefaults()` / `initializeDefaultState()`), or records predating the field read `undefined` and downstream code breaks on restore rather than on save — so the failure surfaces long after the change.
- `ensureStateDefaults()` always runs after a restore. That is the hook restore relies on for migrations.
- A feature that only mutates already-covered fields needs no new backup work. Check before assuming — the Advanced Query feature needed none.

## Dates

- Store `YYYY-MM-DD` strings, not ISO timestamps. Timestamps inherit the off-by-one-day timezone bug class that already bit the Onyva weather date filter. Date-only strings compare cleanly as text, including for before/after/on filters.

## Fossils and dead ends

- `schema_update.sql` describes `Prospect` and `Company` **SQL tables that have never existed.** A fossil from an abandoned SQL direction, and actively misleading — an agent reading it cold would conclude there is a relational database here. Status header added 2026-08-28; safe to delete.
- `AI-CONTEXT-PROTOCOL.md`, `ai-context-archives/` and `.agents/skills/new-ai-context/` are the pre-`ai/` context-rotation protocol, superseded by this workflow. Retained as history. A session that follows the old skill will write `AI-CONTEXT.md` at the root again and split the standing files in two.

## Traps carried into Phase 2

Full reasoning in `DECISIONS.md`; these are here because this file is read every session and that one is not.

- **The blob shortcut.** Storing whole state as one hosted document caps at the 1 MB document limit and lets two devices overwrite each other wholesale — a silent total overwrite, not a merge conflict. Rejected on Gate B. If a future session proposes it as a quick win, read `DECISIONS.md` before agreeing.
- **The origin trap.** Today's data lives on the `localhost:5000` origin. A hosted app is a different origin with a different `localStorage` and **opens empty**. Prospects do not follow. The ZIP/CSV backup is the bridge, and Phase 2 needs an explicit import-and-verify step. Doing real work in a hosted copy before that produces two divergent databases.
- **The `saveState()` risk.** Granular writes sound like touching every mutation site across 10,000 lines. They are not: keep a shadow copy of last-saved state, diff on save, write only what changed. One function, no call sites touched. This converts the riskiest session in the build into an ordinary one.
- **The Gmail scope cliff.** `gmail.send` is a sensitive scope and cheap. *Reading* mail is restricted and buys a recurring annual third-party security assessment. "Detect the reply and auto-advance the sequence" sounds small and is not.

## Local snapshot backup (Phase 1 deliverable)

- File System Access API: `showDirectoryPicker()` once, persist the handle, write without re-prompting. Chrome and Edge only — not Safari, not Firefox. Vantage runs in Chrome app mode, so this is fine today and is a real constraint if the app is ever opened elsewhere.
- **The permission occasionally needs re-granting.** A snapshotter that fails silently is worse than no snapshotter, because it manufactures false confidence. A denied or failed write must surface visibly, not log and continue.
- Gate C means the session that builds this restores *from* a snapshot as part of its Done-when. Writing one successfully is not evidence.

## Sequencing spec amendments

The sequencing spec document is superseded in three places and still says the old things:

- `currentStepIndex` → `currentStepId`
- `currentStepBody` → a per-step array snapshotted at enrollment
- dates as `YYYY-MM-DD` strings
