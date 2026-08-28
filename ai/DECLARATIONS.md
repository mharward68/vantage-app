# Declarations — Vantage

Standard of truth. Decisions, not discoveries. One page. Amended deliberately.
Reasoning lives in `DECISIONS.md`. How to decide lives in `DIRECTIVES.md`. What was discovered lives in `BUILD_NOTES.md`.

## Stack

- Vanilla JavaScript, plain HTML, plain CSS. No framework, no build step, no bundler.
- `index.html` — single-page shell: every view, modal and sidebar in one document.
- `app.js` — all application logic, one file, ~10,000 lines.
- `style.css` — all styling.
- `sw.js` (cache-first service worker) + `manifest.json` — installable PWA.
- Persistence today: `localStorage` key `vantage_prm_database` holds the full JSON state; IndexedDB store `VantagePRMFiles` holds binary attachments.
- Persistence from Phase 2: Firebase — Hosting, Firestore, Auth. Per-entity collections, never one blob.
- Vantage does not send email. Sequencing renders merge-resolved copy to paste.

## Conventions

- State is a set of top-level in-memory arrays: `companies`, `prospects`, `media`, `campaigns`, `audienceLists`, `campaignPhases`, `developmentPhases`, `mediaTypes`, `platforms`, `media_tags`, `prospect_tags`, `campaign_tags`, `company_tags`, `reachoutTypes`, `customSortOrder`.
- **The in-memory array shape is the contract.** Persistence may change beneath it; render and filter code must not have to care.
- Boot: `loadDatabase()` → `initIndexedDB()` → `initTheme()` + `updateThemeColors()` → `setupEventListeners()` → `switchView("dashboard")`.
- Routing: `switchView(viewName)`. Views: `dashboard`, `prospects`, `media`, `campaigns`, `data`.
- Backup: ZIP bundle of per-entity CSVs. Restore router is `handleRestoreFile()` / `processSingleCSVContent()`; `ensureStateDefaults()` always runs post-restore.
- Every new field gets a default-value migration in the existing state-defaults path, so records predating it read `""` rather than `undefined`.
- Status fields are `"active" | "archived"`, per the `audienceLists` precedent. Archiving preserves; it never destroys.
- Dates are stored as `YYYY-MM-DD` strings. Never ISO timestamps.
- Enrollments identify their live step by stable id (`currentStepId`), never by array index.
- Hub colors: Dashboard blue, Prospect Hub purple, Media Hub orange, Campaign Hub green, Data Management red.

## Environment

- Run locally: `Start_Vantage.bat` → `npx serve` (Python `http.server` fallback) on `http://localhost:5000`, opening Chrome in app mode. `Stop_Vantage.bat` stops it.
- Installable as a PWA from that origin.
- Development stays local through Phase 1, and the local loop remains the working loop after hosting lands.
- Standing files live in `ai/`. Backups live **outside** the project folder, in a sibling directory — never inside it.
- Repo root: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.json`, `prm_data.json` (seed, first run only), `assets/`, `ai/`, `CLAUDE.md`.
- `AI-CONTEXT-PROTOCOL.md`, `ai-context-archives/` and `.agents/skills/new-ai-context/` are the superseded pre-`ai/` protocol. Retained as history; not live.

## Hard limits — never without asking

The canonical list is **DIRECTIVES §4**. Deliberately not duplicated here — one copy, one place to amend.

## Done means

Every session, all of these:

- The app loads at `localhost:5000` with a clean console.
- Existing views still render, and state survives a reload.
- `CACHE_NAME` in `sw.js` is bumped if `index.html`, `app.js` or `style.css` changed.
- Any new or modified store of user-writable data is stated in the summary as covered or not covered by backup/restore.
- Verification is pasted real command or console output. Never a claim.

From Phase 1 onward, additionally:

- The app is left **usable**, not merely building. Real outreach happens in it between sessions; a half-migrated view costs actual work.

## Amendments

- **2026-08-28** — Created during the Phase 0 retrofit from the Project Declarations block of `AI-CONTEXT.md`. Watch-outs moved to `BUILD_NOTES.md`; the development log moved to `AIContext.md`. Added four conventions that were decided in `DECISIONS.md` on 2026-08-27 but had never been written into a standing file: dates as `YYYY-MM-DD`, `currentStepId` over index, archive-preserves, and the state-shape-as-contract rule. Corrected the `app.js` line count from ~8,000 to ~10,000.
