# AI Context

**Updated:** 2026-08-30 12:15 (America/New_York)
**Last run:** Phase 1 / Session 1.8 — Realistic restore drill, standing-file curation, **PHASE 1 CLOSE**  **Compartment(s):** QA (+ one authorized UI amendment)
**State:** `node --check app.js` clean · console clean (5 expected boot lines, no errors) · all six hubs render · state survives reload · `CACHE_NAME` **v83** · deployed n/a
**Estimate vs actual:** planned **S** / ~10 min of Michael's time. Actual **L**, and ~**45 min** of his — the drill itself was S, but it uncovered a live defect, absorbed a mid-session frozen-contract amendment, and produced two new documents. No three-strikes. One frozen contract amended, with authorization.

## Done

### The drill — both restore paths pass, on real data

Ran against the **real** production database (651 prospects / 1,090 companies), restored from `test-data\vantage_data_backup_8-30-26_946.zip`, then seeded with 55 `DRILL-` tasks bound to real prospect ids — several multi-paragraph with commas, embedded `"` quotes and blank lines; 20 completed; 31 orphans; columns hand-resized and hand-reordered.

- **ZIP path.** Export → `wipeAllData()` → restore. Every count MATCH: prospects 651, companies 1,090, tasks 86, audiences 4, media 33, campaigns 3, domains 5, email accounts 5, completed 20, open 66, orphans 31, history entries 659. `dateMode`, `reachoutTypes` (including `Task Completed`) and `columnLayouts` — order *and* widths — identical. A 373-character multi-paragraph note came back **character-identical**.
- **`wipeAllData()` verified live, not read:** everything to `0` and **`columnLayouts` → `{}`**. That is the clear-list entry the plan warned gets missed; it is present and it works. localStorage 1,482 KB → 3 KB.
- **Snapshot path**, separately, through `restoreFromSnapshotFile` → `applyJSONBackupText`: 651 / 1,090 / 86, completed 20, orphans 31, 55 drill tasks, `columnLayouts` identical, heavy note identical.
- Pre-flight before the destructive step: the exported ZIP was opened and its `prm_tasks.csv` inspected (17,403 bytes, C3 header exact, 55 DRILL rows, 170 raw lines for 86 tasks — embedded newlines correctly inside quoted fields), plus `Column Layouts` and `Task Date Mode` rows confirmed present. A rollback artifact nobody has opened is not a rollback.

### C16 row 1 amended — authorized mid-session

Michael reported the resize handle as very difficult to find. Root cause was **geometry, not the 5px**: the zone lay entirely inside the left-hand column, so half of every divider was dead — and it was the half a cursor aimed at the line lands in. Now a **12px band straddling the divider** (6px each side): near a `th`'s right edge resizes it, near its left edge resizes its left neighbour. `taskHubResizeTarget()` replaces `taskHubInResizeZone()`; `taskHubResizeHitCell()` widens the hit test **for resize only** so the last column is reachable across the trailing spacer. Sort and reorder still narrow to `taskHubHeaderCell()`.

Then **visible column dividers**, at two weights — header drawn to be found, body on `var(--color-border)`. The wider zone and the visible line only work together.

Verified: all five columns 12 live px (was 5, one-sided); a drag started 6px *past* the divider resized `dueDate` 165 → 225; the last column resized from the spacer side, 340 → 280; sorting survives (one dead click after a drag by design, then normal); reorder survives; sticky header still sticky; both themes checked by eye.

### Standing files

- **`DECLARATIONS.md` — drift audit applied. Nine items**, not the seven the plan listed. Stack line count, IndexedDB `handles` store, Firebase phase number, three new state stores plus the `wipeAllData()` rule, boot sequence, view list and `data` → `data-management`, TaskHub cyan, restore router, the three deleted protocol paths, backup folder location, and the one-window rule. Amendment entry written.
- **`BUILD_NOTES.md` — MAP populated properly**, plus three new sections and several corrections.
- **`ai/spec/phase-4-firebase-preflight.md` — NEW.** What must be tightened before hosting, ordered by when the cost lands.
- **`ai/phases/phase-2-RUNSHEET.md` — NEW.** All four paste blocks for Phase 2. Session list intentionally empty; Step 1's prompt tells the planner to fill it.
- **`phase-1-taskhub.md`** — C16 amendment recorded as a dated block preserving the original, matching how C5 was handled.

## Files changed

**Modified:** `app.js` (`taskHubResizeTarget` + `taskHubResizeHitCell` replacing `taskHubInResizeZone`; `initTaskHubHeaderDrag`'s mousemove and mousedown branches; zones 2–3 re-narrow to `taskHubHeaderCell`), `style.css` (column dividers appended to `✅ TASKHUB LAYOUT`), `sw.js` (`CACHE_NAME` v80 → **v83**, three bumps), `ai/DECLARATIONS.md`, `ai/BUILD_NOTES.md`, `ai/phases/phase-1-taskhub.md`, `ai/AIContext.md`.
**Created:** `ai/spec/phase-4-firebase-preflight.md`, `ai/phases/phase-2-RUNSHEET.md`.
**Untouched:** `index.html`, `renderTaskHubTable`, `TASKHUB_COLUMNS`, the C15 resolver, `setTaskHubColumnWidth` / `setTaskHubColumnOrder`, the reorder branch, `generateSettingsCSV` / `restoreSettingsFromCSV`, `wipeAllData`, `ensureStateDefaults`, every completion and history path, the other five hubs, `DIRECTIVES.md`, `DECISIONS.md`.

## Backup coverage (DIRECTIVES §4)

**No new store of user-writable data.** The session's only state write is `columnLayouts.taskhub.widths`, which C17 already covers via the single `["Column Layouts", <json>]` row in `prm_settings.csv` — **proved twice this session on real data**, through a full ZIP round trip and again through a snapshot restore, order and widths identical both times. Nothing here is uncovered.

## Assumptions made

- **6px per side** for the resize zone. Michael authorized the change without naming a number; 6 was the recommended option. One line (`TASKHUB_RESIZE_EDGE_PX`) if it wants to be 8.
- **The checkbox column keeps a divider; the trailing spacer does not.** Cosmetic, reversible.
- **The 55 `DRILL-` tasks were deleted at the end of the session.** The 31 pre-existing sandbox tasks were left alone — they are Michael's, they predate this session, and they are all orphans because their seed prospects no longer exist. They will vanish on his next wipe-and-restore.
- **The drill ran on the real database in Michael's own Chrome**, authorized explicitly, with a fresh ZIP written to the backup folder plus 11 snapshots as rollback.

## Open items

- **Needs Michael's eyes — the 6px zone and the divider weights.** Both are real-hand judgments. `TASKHUB_RESIZE_EDGE_PX` in `app.js`; `#1e5a63` / `#7ba7b0` in `style.css`.
- **Two Vantage windows silently overwrite each other.** Found this session, written up in `BUILD_NOTES.md` and `phase-4-firebase-preflight.md` §4. **Not fixed.** Practical rule until then: one window at a time. Cheapest guard is a `BroadcastChannel` heartbeat; the real fix is the shadow-copy diff in `saveState()`.
- **The stale `..\backups\` sibling.** Not in use; `backups-production` is live. Check its dates or delete it before it becomes a restore-from-the-wrong-folder incident.
- **Commit state, verified against `git log` 2026-08-30:** 1.10 and 1.11 were already committed at `e0c4254`, and `origin/main` was current at `f605433`. **The 1.11 handoff's claim that they were uncommitted with `25bd2ac` as the tip was stale** — a session that trusts it will go looking for work that is already in. Session 1.8's own changes were the only thing outstanding when this was written.
- **`ai/APP_SCOPE.md` does not exist** but `APP_BUILD_WORKFLOW.md` Prompt 3's READ FIRST names it. Either create it or amend the prompt — every Phase 2 block in the new run sheet works around it by hand.
- **Phase 3's scope is superseded** and needs re-scoping, not a Prompt 3. Recorded in the Phase 2 run sheet's Step 3 so the close says the right thing.
- **Still open: the repo is PUBLIC**, and DIRECTIVES §0 compliance is still undecided. Both now have concrete Phase 4 treatment in the pre-flight.
- **Still open: the stale `E:` clone.**
- **Carried, still open — the 20-row search cap (C14-frozen) and the results list's 220px max-height** (from 1.9); the `dueDate: 0` / code-default-124 assumption and the five default widths (from 1.10).
- **Backlog (found, not done — out of compartment):** `parseCSVRow()` (~8770) does not handle escaped `""` inside a quoted field. `var(--color-danger)` is used in `renderDomainsView()` and defined nowhere, so the expired-domain highlight is silently dead. **Michael decided 2026-08-30 to carry both to Phase 2 rather than fold them into a QA session.**
- **Closed, do not re-raise:** everything listed closed in the 1.11 context, plus — the resize hit zone (amended and verified this session) and the restore drill itself.

## Next step

**Phase 1 is complete.** All eleven sessions are done.

1. **Commit** Session 1.8. It is the only outstanding work — 1.10 and 1.11 are already in.
2. **Take a full ZIP**, stored outside the project folder.
3. **Run Prompt 5 to close the phase** — estimate calibration against the archived AIContext files, BUILD_NOTES curation, DECLARATIONS audit. The block is in `ai/phases/phase-1-RUNSHEET.md`. **Note:** much of steps 3 and 4 was done in this session; Prompt 5's value now is the estimate calibration, which has not been done.
4. **Then Phase 2 — but NOT Prompt 3 first.** `ai/spec/prospect-detail-view-scope.md` carries a stop banner: it is approved direction, not a scoped feature, and §5's contract questions are unsettled. Prompt 5's closing line is scripted and will tell you to run Prompt 3. **It is wrong for this phase.** Use `ai/phases/phase-2-RUNSHEET.md`, which leads with the intake step.

**Carry into Phase 2:** `#canvas-body` is still the shared scroll owner. In `style.css`, check source order before assuming a new rule wins. A drag sharing an element with a click must never re-render that element inside its own mouseup. And close every other Vantage window before starting a session.
