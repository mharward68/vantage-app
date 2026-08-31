# AI Context

**Updated:** 2026-08-31 17:16 (America/New_York)
**Last run:** Phase 2B / **Session 2B.1 — Navigation substrate.** `detailProspectId`, the origin record, the empty seventh view panel.
**State:** `node --check app.js` clean (run against the file as it sits in the repo, re-staged after writing) · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v95 → v96, one bump** · `app.js` 13,491 / `index.html` 3,293 / `style.css` 3,813 · console clean, 0 errors across a boot plus a seven-view sweep · deployed n/a
**Estimate vs actual:** sized **M / ~5 min / High**; ran **M**, **one `CACHE_NAME` bump** (v96 — but see the note below before recording that as a win), and roughly **2 min of Michael's time** — the boot report and this summary, no blocking questions.
**One-glance version tell:** open any prospect from the console — `openProspectDetail("pros-sarah", { view: "prospects" })` — and look at the **header band**. A **← arrow left of the 👥 icon**, the band reading **ProspectHub** with **Sarah Chen** underneath it = v96. Nothing in the app's own UI changed, so this is the only tell there is.

## What was done

P1, P2 and P3 exist in code, and nothing in the app calls any of it — the view is reachable from the console only, by plan Assumption 3. **The app is exactly as usable as it was before this session.** The old prospect inspector is untouched and is still the only prospect surface a user can reach.

- **P1** — `detailProspectId` / `detailOrigin` / `detailTab` at module scope. Not state fields, no `ensureStateDefaults()` entry, no `wipeAllData()` line, no CSV column. Proved not to survive a reload.
- **P2** — `openProspectDetail(id, origin)` and `closeProspectDetail()`. The close replays all three origin shapes; the unresolvable-id path closes and replays with no placeholder.
- **P3** — `#view-prospect-detail`, a **seventh `.view-panel`** inside `#main-canvas`. `renderApp()` branch, `switchView()` keeps `#nav-prospects` lit, `body.module-prospect-detail` carries ProspectHub's purple in both themes, back arrow in 2A's header band, prospect name in `#view-subtitle`.

## Verified — real output, not a claim

| Check | Result |
| --- | --- |
| Open from `{view:"prospects"}` | `activeView` `"prospect-detail"`, active panel `view-prospect-detail`, `--color-primary` `#6d28d9` (light), `nav-prospects` = `nav-tab active-tab`, title `ProspectHub`, subtitle `Sarah Chen` |
| Origin replay 1 — prospects | back → `view-prospects`, `detailProspectId` `null`, back arrow re-hidden |
| Origin replay 2 — tasks | back → `view-tasks` **with the editor open**: `#modal-task` = `modal-overlay` (not hidden), `#task-title` = `"Confirm AV requirements"`, `editingTaskId` = `task-demo-01` |
| Origin replay 3 — campaigns | `campaignViewSubState` and `selectedAudienceListId` were **deliberately poisoned to `"domains"`/`null` before the back click**; after it they read `"audiences"` / `aud-1788023350145`, audience sub-view shown, domains hidden. Without the poison the test would have passed on a bare `switchView("campaigns")` |
| Unresolvable id | `openProspectDetail("pros-does-not-exist", …)` → `activeView` `"prospects"`, no placeholder. With a `tasks` origin it replays **that** origin, editor open on `"Send follow-up email"` |
| Two cursors are independent | `selectProspect("pros-marcus")` then `openProspectDetail("pros-sarah", …)`: `detailProspectId` `pros-sarah`, `state.selectedProspectId` **`pros-marcus` before, during and after**, including after the back click |
| Reload with `activeView` persisted | `localStorage` held `"prospect-detail"`; boot landed on `view-dashboard`, `nav-dashboard` lit, `detailProspectId`/`detailOrigin` **`null`**, `detailTab` `"interactions"` |
| Whole-shell sweep, seven panels | Six hubs + the detail panel all report a **definite** height with `min-height: 0px` and `#canvas-body` not scrolling. Six read `997.333px`; **MediaHub reads `977.333px` — pre-existing, see below** |
| S1 shape, proved not assumed | 80 tagged filler rows into the tab body: body `scrollHeight/clientHeight` `1220/872`, scrolled to `348`; identity block `top` **96 before and 96 after**; `#canvas-body.scrollTop` `0` and not scrolling. Filler removed, `0` synthetic nodes left |
| Screenshots | Sidebar pinned and unpinned (panel `left` 304 → 100, sidebar 280 → 76, height still `997.333px`), the tab body mid-scroll, and dark theme (`--color-primary` `#8b5cf6`, back arrow and title both `rgb(139,92,246)`) |
| `check_ids.py` | Run against the re-staged repo file: `{'export-backup-btn', 'restore-backup-input'}` — the standing pair, nothing more |
| `grep -n "calc(100vh"` | **4 hits, unchanged.** A draft of the new markup comment briefly made it 5 by spelling the literal; reworded into words before commit, per the existing convention |

Record counts identical at start, after the sweep and at the end: **4 prospects / 5 companies / 30 media / 31 tasks / 0 campaigns / 1 audience list.**

## Files changed

`app.js`, `index.html`, `style.css`, `sw.js` (v96), `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/archive/2026-08-31_1716_AIContext.md` (new).

**No `ai/DECLARATIONS.md` or `ai/DECISIONS.md` change.** The seventh view panel is an amendment 2B.10 already owes (scope §9) — **propose at close, do not apply mid-phase**, and the "six hubs" line stays true and must not be edited to say seven.

## Assumptions logged this session

1. **The three containers carry scaffold text.** `renderProspectDetail()` writes one muted line into each, and `style.css` dresses them with a dashed outline. Without it the panel is a blank rectangle and the S1 shape cannot be screenshotted or reviewed. **Reversible and expected to be deleted:** 2B.3 replaces the identity block, 2B.4 the tab strip and the first two bodies, 2B.5 the rest. The dashed-outline rule is commented "Session 2B.1 ONLY".
2. **The new `app.js` block sits after `§ ✅ RENDER VIEW: TASKHUB` and before `§ 📁 RENDER VIEW: MEDIA MANAGER`**, not beside `renderInspector()`. Placing it there would falsify two MAP entries (the inspector block "immediately after `renderInspector()`", the four task blocks contiguous) to buy nothing.
3. **`body.module-prospect-detail` copies ProspectHub's four colour values verbatim rather than sharing a token.** The per-hub blocks are a flat greppable list; one indirection for one entry is how that stops being readable. The rule carries a KEEP IN SYNC comment.
4. **The MAP / DECLARATIONS line counts were left alone** (`app.js` "~13,270" against a real 13,491). Still approximate-and-true; 2B.10 re-measures at the close.

## Open items

- **⚠️ NEEDS YOUR EYES — (a) is unchanged and is now SEVEN sessions deep.**
  **(a) `git status`.** 2A.2–2A.6 and now 2B.1 are all uncommitted. **This session had no shell on the machine either** — every file went through the device bridge, which writes but cannot run git and cannot delete. `git checkout style.css` now discards six sessions. **Commit and push before anything else.**
  **(b) The back arrow's placement and weight, and the purple.** Both screenshots are above. The arrow sits between the hamburger slot and the 👥 icon, `-6px` left margin so it lines up with the row's optical left edge, `var(--color-primary)` so it tracks the theme. Say if it wants to be heavier, further left, or a different glyph.
  **(c) The scaffold text.** It exists to be looked at once and then deleted. If the shape reads wrong to you now, it is cheaper to say so before 2B.3 builds the identity block into it.
- **Carried, unchanged:** CampaignHub identifies itself twice (2A backlog → 2B backlog). Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. The prospect inspector's squeezed history table (2B.6 removes it). `state.taskSettings` missing from `wipeAllData()` → **2B.7**. `--color-danger` undefined, six call sites → **2B.3**.
- **Unchanged from Phase 1:** two Vantage windows overwrite each other; `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable. **Also still undeleted:** `ai/phases/phase-2-RUNSHEET.md`, `ai/phases/Vantage-Phase-2-Run-Sheet.docx` and now `ai/phases/phase-2a-RUNSHEET.md` — the bridge cannot remove a file; delete them by hand alongside the commit.

## Backup coverage — DIRECTIVES §4

**Not a data session.** This session created and modified **no** store of user-writable data: no new field, no CSV column, no migration, no `ensureStateDefaults()` or `wipeAllData()` edit, no export or restore function entered. `detailProspectId`, `detailOrigin` and `detailTab` are module scope by contract P1 and are *required* not to persist — proved by reload. The only persisted value this session touches is `state.activeView`, which already existed and which boot overwrites.

**The phase-level gate still fires**, through the carried-in `state.taskSettings` gap. **2B.7 must not reason "no data work → Gate C inert."**

## Next step

**Session 2B.2 has already been run** (2026-08-31, ahead of the plan — the column-layout machinery is generalised and `COLUMN_TABLES` exists with `taskhub` as its only consumer). So the next session is **2B.3 — Identity block: 17 fields, `commitProspectField()`, Delete, `--color-danger`.** Size **L**, ~12 min.

**⚠️ 2B.3 is a flagged backup point. Take a manual ZIP before it** — it is the first session in the phase to add a write path to every prospect field. Store it outside the project folder, in `..\backups-production\`.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css` — the detail panel's rules are its final entry. `#canvas-body` is never edited. `state` is not `window.state`. One Vantage window at a time. `state.selectedProspectId` and `detailProspectId` are two cursors and **do not converge in this phase**. No routing, ever — prospect ids are email addresses (P9, Gate A). Inject the transition kill-switch after every reload **and every theme toggle**, and read `document.getAnimations().length === 0` before trusting a measurement.
