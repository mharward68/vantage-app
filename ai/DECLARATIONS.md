# Declarations — Vantage

Standard of truth. Decisions, not discoveries. One page. Amended deliberately.
Reasoning lives in `DECISIONS.md`. How to decide lives in `DIRECTIVES.md`. What was discovered lives in `BUILD_NOTES.md`.

## Stack

- Vanilla JavaScript, plain HTML, plain CSS. No framework, no build step, no bundler.
- `index.html` — single-page shell: every view, modal and sidebar in one document.
- `app.js` — all application logic, one file, **~13,270 lines** (`index.html` **~3,250**, `style.css` **~3,680**). The number is here so a session can size a change; keep it approximate but true. Re-measured by `wc -l` at the Phase 2A close, 2026-08-31: 13,272 / 3,254 / 3,681. **`style.css` grew ~530 lines across Phase 2A and is now larger than `index.html`** — most of the growth is the commented blocks that explain the shell, not new rules.
- `style.css` — all styling.
- `sw.js` (cache-first service worker) + `manifest.json` — installable PWA.
- Persistence today: `localStorage` key `vantage_prm_database` holds the full JSON state; IndexedDB store `VantagePRMFiles` holds binary attachments, and its `handles` store holds the backup-folder directory handle under key `backupFolder`.
- Persistence from **Phase 4**: Firebase — Hosting, Firestore, Auth. Per-entity collections, never one blob. (Hosting moved from Phase 2 to Phase 4 on 2026-08-28; see `DECISIONS.md`. Pre-flight: `ai/spec/phase-4-firebase-preflight.md`.)
- Vantage does not send email. Sequencing renders merge-resolved copy to paste.

## Conventions

- State is a set of top-level in-memory arrays: `companies`, `prospects`, `media`, `campaigns`, `audienceLists`, `campaignPhases`, `developmentPhases`, `mediaTypes`, `platforms`, `media_tags`, `prospect_tags`, `campaign_tags`, `company_tags`, `reachoutTypes`, `customSortOrder`, **`tasks`**, plus the two non-array stores **`taskSettings`** (`{ dateMode }`) and **`columnLayouts`** (persisted UI layout, keyed by table id). `snapshotHealth` is also top-level but is deliberately excluded from backup and restore — it describes this machine's filesystem, not user data.
- **The in-memory array shape is the contract.** Persistence may change beneath it; render and filter code must not have to care.
- **Every new top-level store must be added by hand to `wipeAllData()`**, which clears an explicit list rather than everything. A store left out survives the wipe, which silently turns any export→wipe→restore drill into a test that cannot fail.
- Boot: `loadDatabase()` → `initIndexedDB()` → `initTheme()` + `updateThemeColors()` → `setupEventListeners()` → `switchView("dashboard")` → `initSnapshotSystem()`.
- Routing: `switchView(viewName)`. Views: `dashboard`, `prospects`, `media`, `campaigns`, **`tasks`**, `data-management`. The panel ids are `#view-<name>`, so the last one is `#view-data-management` — a session that trusts a declared name of `data` looks for an element that does not exist.
- Backup: ZIP bundle of per-entity CSVs. The restore router is **`handleRestoreFile()` → `processRestoreFile()`**; `ensureStateDefaults()` always runs post-restore.
  **`processSingleCSVContent()` is NOT part of the restore path.** It exists — it is a private inner function of `importCSVContacts()` serving the Prospect Hub's contact import — so grepping for it finds three hits and an agent may wrongly conclude it is the router. It is a different feature. Restore work goes in `processRestoreFile()`.
- Every new field gets a default-value migration in the existing state-defaults path, so records predating it read `""` rather than `undefined`.
- Status fields are `"active" | "archived"`, per the `audienceLists` precedent. Archiving preserves; it never destroys.
- Dates are stored as `YYYY-MM-DD` strings. Never ISO timestamps.
- Enrollments identify their live step by stable id (`currentStepId`), never by array index.
- Hub colors: Dashboard blue, Prospect Hub purple, Media Hub orange, Campaign Hub green, **TaskHub cyan**, Data Management red. Six hubs.

## Environment

- Run locally: `Start_Vantage.bat` → `npx serve` (Python `http.server` fallback) on `http://localhost:5000`, opening Chrome in app mode. `Stop_Vantage.bat` stops it.
- Installable as a PWA from that origin.
- Development stays local through Phase 1, and the local loop remains the working loop after hosting lands.
- Standing files live in `ai/`. Backups live **outside** the project folder, in a sibling directory — never inside it. The live backup folder is `..\backups-production\`; manual ZIPs sit at its top level and automatic snapshots in its `snapshots\` subfolder. A second sibling `..\backups\` exists and is **not** in use — do not restore from it without checking dates.
- Repo root: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.json`, `prm_data.json` (seed, first run only), `assets/`, `ai/`, `CLAUDE.md`.
- `AI-CONTEXT-PROTOCOL.md`, `ai-context-archives/` and `.agents/skills/new-ai-context/` were the pre-`ai/` context-rotation protocol. **They were removed from the repo, not retained** — verified absent 2026-08-30. Nothing points at them any more.
- **One Vantage window at a time.** Two windows on the same origin share one `localStorage` but keep independent in-memory state, and whichever saves last overwrites the other wholesale, with no error. They also write into the same `snapshots/` folder. See `BUILD_NOTES.md`.

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

- **2026-08-31** — Phase 2A close (Session 2A.6). **One correction applied: the Stack line counts**, re-measured by `wc -l` rather than estimated — `app.js` 13,272, `index.html` 3,254, `style.css` 3,681. The declared 3,200 / 3,100 predated the phase; `style.css` gained ~530 lines and is now the larger of the two, which changes how a session sizes a CSS change. **Two further amendments were PROPOSED at this close and deliberately not applied** — the one-word hub display names (with the DataHub-is-displayed-but-identified-as-`data-management` warning extended from the existing Routing note rather than replacing it), and the in-app-navigation principle Michael set on 2026-08-30. Both are recorded in `ai/AIContext.md` and `ai/DECISIONS.md` awaiting his approval; neither is in force until he applies it here.
- **2026-08-30** — Drift audit at the Phase 1 close (Session 1.8). Nine corrections, every one a line that had become factually wrong rather than a preference. **Stack:** `app.js` line count ~10,000 → ~13,100, with `index.html` and `style.css` added; the IndexedDB `handles` store recorded; Firebase moved from "Phase 2" to **Phase 4** (reordered in `DECISIONS.md` on 2026-08-28 — `DIRECTIVES.md` and `BUILD_NOTES.md` carried the same stale number). **Conventions:** `tasks`, `taskSettings` and `columnLayouts` added to the state list, with the `wipeAllData()` hand-edit rule that governs them; `initSnapshotSystem()` added to the boot sequence; `tasks` added to the view list and `data` corrected to `data-management`; TaskHub cyan added, making six hubs. **Backup line:** the restore router corrected to `handleRestoreFile()` → `processRestoreFile()`. The prior text named `processSingleCSVContent()`, and the phase plan's C7 and `BUILD_NOTES.md` both said that function "does not exist" — **both were wrong.** It exists as a private inner function of `importCSVContacts()` (contact import, not restore), so it greps as three hits and reads like a live router. Corrected to say what it actually is, because "does not exist" is disprovable in one grep and gets the whole note discarded. **Environment:** the three pre-`ai/` protocol paths were declared "retained as history" and are in fact deleted — verified absent; the live backup folder and the unused sibling recorded; the one-window-at-a-time rule added after Session 1.8 observed two instances silently overwriting each other.
- **2026-08-28** — Created during the Phase 0 retrofit from the Project Declarations block of `AI-CONTEXT.md`. Watch-outs moved to `BUILD_NOTES.md`; the development log moved to `AIContext.md`. Added four conventions that were decided in `DECISIONS.md` on 2026-08-27 but had never been written into a standing file: dates as `YYYY-MM-DD`, `currentStepId` over index, archive-preserves, and the state-shape-as-contract rule. Corrected the `app.js` line count from ~8,000 to ~10,000.
