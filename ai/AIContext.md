# AI Context

**Updated:** 2026-08-31 17:44 (America/New_York)
**Last run:** Phase 2B / **Session 2B.3 — Identity block.** 17 fields, `commitProspectField()`, `resolveCompanyByName()`, `deleteProspectById()`, `--color-danger`.
**State:** `node --check app.js` clean (run against the file as it sits in the repo, re-staged after writing) · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v96 → v98, two bumps** · `app.js` 13,722 / `index.html` 3,428 / `style.css` 3,992 · console clean, 0 errors across two boots plus a seven-view sweep · deployed n/a
**Estimate vs actual:** sized **L / ~12 min / High**; ran **L**, **two `CACHE_NAME` bumps** (the second for the column-count fix below), and roughly **4 min of Michael's time** — the boot report, one blocking question, one mid-run stop/restart, and this summary.
**One-glance version tell:** open any prospect from the console — `openProspectDetail("pros-sarah", { view: "prospects" })`. **A real three-column form with purple labels and a red "🗑️ Delete Prospect" at its bottom right = v98.** v96 showed one line of grey scaffold text in a dashed box. Second tell: the **Wipe Data / Reset Sandbox buttons in the sidebar are now red** — `--color-danger` finally exists.

## What was done

The identity block is real and edits in place. **The old prospect inspector is untouched and is still the only prospect surface a user can reach** — nothing calls `openProspectDetail()` until 2B.6 (plan Assumption 3), so the app is exactly as usable as it was before this session.

- **Markup (`index.html`)** — all 17 fields as STATIC markup inside `#prospect-detail-identity`, ids `pd-*`, three columns × six rows in `#modal-prospect`'s own field order. `data-pd-key` on each control is the contract between the markup and `app.js`; a control without it is inert by construction, which is how Delete and the tag chooser sit in the same container without being mistaken for fields.
- **`commitProspectField(prospect, key, value)`** — the only writer for this surface. Trims, assigns, `saveState()`, and repaints **only** what depends on the field (name → the header subtitle, `companyId` → the company control, `tags` → the chip strip). Commit is on `change`; no Save button, no dirty state.
- **`resolveCompanyByName(name, email, location = "")`** — extracted from `saveProspect()` and called from both. One company-creation path.
- **`deleteProspectById(id)`** — extracted; the zero-argument `deleteProspect()` survives as a one-line caller, so the inspector and the deferred AQ drawer were not entered. It **returns true only if a record was actually removed**, which is what lets the detail view replay the origin on success and stay put on cancel.
- **`openChooseTagsModalForProspectInspector(prospectId = state.selectedProspectId)`** — the P8 interim. The default is what kept both existing callers untouched; `tagProspectTargetId` carries the target through to `saveChosenTags()`, which now writes through `commitProspectField()`.
- **`--color-danger`** — defined once in `:root` (`#ef4444`) plus `.light-theme` (`#dc2626`). **All six pre-existing call sites now render red.** The three `style.css` comments that said the token "is defined nowhere" were corrected in place rather than left to be disproved by one grep.

## Verified — real output, not a claim

| Check | Result |
| --- | --- |
| All 17 fields commit | Set each control, dispatched `change`: `firstName` `"Sarah2"`, `lastName` `"Chen2"`, `email` `"sarah.chen2@figma.com"`, `phone` `"+1 (555) 000-1111"`, `linkedin` `".../sarahchen2"`, `title` `"VP of Product Design"`, **`seniority` `"VP"`**, `companyId` `"comp-figma"`, `city` `"Oakland"`, `state` `"CA"`, **`location` `"East Bay"` (Metro)**, **`conferenceName` `"AV Summit 2026"`**, **`conferenceVenue` `"Nashville"`**, **`conferenceStart` `"March 3, 2026"`**, **`conferenceEnd` `"March 5, 2026"`**, `notes` set. Subtitle tracked live to `"Sarah2 Chen2"` |
| Reload survival | All 17 read back identical after a reload; `detailProspectId` / `detailOrigin` **`null`**, boot landed on `dashboard` |
| Company — new name | `"Northwind Audio"` → companies 5 → 6, `companyId` `comp-1788212305357`, seed `{domain:"figma.com", location:"East Bay", industry:"General"}` — **`location` proves the extraction kept `saveProspect()`'s `loc` seed** |
| Company — existing, different case | `"nOrThWiNd AuDiO"` → **same id**, companies **still 6**, and the control snapped back to the stored `"Northwind Audio"` |
| Company — cleared | `companyId` `""`, companies still 6, nothing minted |
| Tags cleared | Drove the real ✏️ button → chooser opened with `["UIUX","Design Systems","test"]` checked, `tagProspectTargetId` `"pros-sarah"`; unchecked all → `prospect.tags` **`["No Prospect Tag"]`**, chip strip `"# No Prospect Tag"`, `state.selectedProspectId` **still `null`** |
| Delete, from a `tasks` origin | prospects 5 → 4, dialog `"Are you sure you want to permanently delete contact Delete Me?"`, `activeView` `"tasks"`, `#modal-task` = `modal-overlay` (**open**), `#task-title` `"test2"`, `editingTaskId` `task-1788018621038` |
| Delete, cancelled | `confirm` → false: prospects **5 → 5**, `activeView` still `"prospect-detail"`, `detailProspectId` intact |
| Two cursors, through a delete | `selectProspect("pros-marcus")` then deleted `pros-canceltest` from the detail view: `state.selectedProspectId` read **`"pros-marcus"` after the delete** — the guarded assignment holds |
| `saveProspect()` regression | Created through `#modal-prospect`: companies 5 → 6, `location` seeded **`"Research Triangle"`** from the typed Metro, `seniority` `"Director"`, modal closed. Then legacy `deleteProspect()` removed it: 5 → 4 |
| `--color-danger`, both themes | root `#ef4444` / body-in-light `#dc2626`. `#btn-aq-clear-selection`, `#btn-ea-delete`, `#btn-dom-delete`, `#btn-pd-delete-prospect` all `rgb(239,68,68)` dark / `rgb(220,38,38)` light. The three `app.js`-generated sites have **no records to render** (0 email accounts, 0 domains, 0 audience triggers) — proved by injecting the exact markup `app.js` emits: all four read the same pair. 0 synthetic nodes left |
| Shape (S1) | `#view-prospect-detail` `997.333px` **definite**, `min-height 0px`; identity block **479px**, does not scroll; `#canvas-body` not scrolling; page not scrolling; `#pd-notes` `76px` with `resize: none` |
| Column count | `300.438px × 3` pinned, sidebar unpinned `368.4px × 3`, panel left 304 → 100 |
| Whole-shell sweep, seven panels | All seven `active-panel`, six read `997.333px`; **MediaHub `977.333px` — pre-existing, carried** |
| Console | **0 errors** across two boots + a seven-view sweep + the detail view. Only the five expected `[Database]` / `[IndexedDB]` / `[PWA]` / `[Snapshot]` boot logs |
| `check_ids.py` | Run against the re-staged repo file: `{'restore-backup-input', 'export-backup-btn'}` — the standing pair, nothing more |
| `grep -c "calc(100vh"` | `style.css` 3, `index.html` 1 = **4, unchanged** |

Record counts identical at start and end: **4 prospects / 5 companies / 30 media / 31 tasks / 0 campaigns / 1 audience list.** `pros-sarah` was restored field-by-field to its exact pre-session record, including **deleting** the four conference keys it never carried.

## Files changed

`app.js`, `index.html`, `style.css`, `sw.js` (v98), `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/archive/2026-08-31_1744_AIContext.md` (new).

**No `ai/DECLARATIONS.md` or `ai/DECISIONS.md` change.** 2B.10 still owes the seventh-view-panel amendment; "six hubs" stays true and must not be edited to say seven.

## Assumptions logged this session

1. **`resolveCompanyByName()` takes an OPTIONAL third parameter, `location = ""`.** P5 writes the signature as `(name, email)`, and both frozen call shapes are unchanged — but `saveProspect()` also seeded the new company's `location` from the typed Metro, and extracting at exactly two arguments would have silently dropped it. An extraction that changes behaviour is not an extraction. DIRECTIVES §5: no gate eliminates either option; Ladder rung 1 (Stability) decides. **Not a contract change** — same shape the plan already blesses for the tag chooser.
2. **The tag chooser's new id parameter DEFAULTS to `state.selectedProspectId`,** so neither existing caller needed editing and `editAqInspectorTags()` in the deferred AQ drawer was never entered.
3. **`commitProspectField()` does not call `refreshAqAfterEdit()`.** The AQ results modal cannot be open while the detail view is (nothing calls `openProspectDetail()` yet), and staying out of the deferred surface is worth more than a call that would early-return. Revisit at 2B.6, when four real entry points exist.
4. **Three columns, not four.** Decided with the screen up. At four the fields land near 370px, narrower than the LinkedIn URLs and conference names this database actually holds; a truncating field on a record view is worse than one more row.
5. **The identity block's ids are `pd-*`, the modal's stay `pros-*`.** Never merged — `#modal-prospect` is the create path and is untouched (scope Assumption 5).

## Open items

- **⚠️ NEEDS YOUR EYES**
  **(a) `git status` — unchanged and now EIGHT sessions deep.** 2A.2–2A.6, 2B.1, 2B.2 and now 2B.3 are all uncommitted. **This session had no shell on the machine either** — every file went through the device bridge, which writes but cannot run git and cannot delete. `git checkout style.css` now discards seven sessions. **Commit and push before anything else.**
  **(b) The four always-on conference boxes** — scope Assumption 4, and the dark-theme screenshot is the one to look at. Against Jane Smith, who has none of them, they read as a full row of grey placeholder ghosts. Collapsing them when all four are blank is a five-minute change; it was deliberately not taken in the abstract.
  **(c) The red.** `#ef4444` dark / `#dc2626` light. It now colours five destructive controls you have never seen in red, including **Wipe Data and Reset Sandbox in the sidebar**, which is a bigger visual change to DataHub than to the detail view.
  **(d) Three columns, and the block's 479px height.** That is roughly half the panel; 2B.4 has ~490px for the tab strip and the tab body. If the identity block should be tighter, say so before 2B.4 builds against that budget.
- **Found this session, not fixed — to the phase backlog:**
  **`#companies-datalist` is dead.** `index.html` declares the `<datalist>` and `app.js` never populates it, so `#modal-prospect`'s Company field has had no autocomplete since it was written. The new `#pd-company` deliberately does not reference it. One `renderCompaniesDatalist()` would fix both.
  **`pros-sarah` carried NO `conference*` keys at all** — not `""`, absent. DECLARATIONS' "every new field gets a default-value migration so records predating it read `""` rather than `undefined`" was not honoured when the conference fields were added. Every reader guards with `|| ""` so nothing is broken today, but the convention is not actually being kept.
- **Carried, unchanged:** CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge, and its panel's `977.333px`. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. The prospect inspector's squeezed history table (2B.6 removes it). `state.taskSettings` missing from `wipeAllData()` → **2B.7**.
- **Cleared this session:** `--color-danger` undefined, six call sites. Gone.
- **Unchanged from Phase 1:** two Vantage windows overwrite each other; `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.
- **CLOSED — the three stale run-sheet files are already gone.** `ai/phases/phase-2-RUNSHEET.md`, `Vantage-Phase-2-Run-Sheet.docx` and `phase-2a-RUNSHEET.md` were carried as "still undeleted" from 2B.1 and **this session repeated that claim before checking it.** A real directory listing on 2026-08-31 17:5x shows `ai/phases/` holding exactly six entries — `.gitkeep`, `phase-1-RUNSHEET.md`, `phase-1-taskhub.md`, `phase-2a-app-shell.md`, `phase-2b-prospect-detail-view.md`, `phase-2b-RUNSHEET.md`. Michael deleted them. **They will appear as deletions in the pending commit; that is correct, not a mistake to undo.** Do not re-add this item.
- **⚠️ `.gitignore` gap, found 2026-08-31 while pre-flighting the commit — NOT yet fixed.** The file's snapshot guard is `snapshots/` plus a bare `YYYY-MM-DD_HHMMSS.json` glob, but real snapshots are named **`vantage_snapshot_2026-08-31_172934.json`** (confirmed from the boot log). That prefix matches neither glob, and `vantage_backup*` does not cover it either. So a snapshot written to the **project root** rather than its subfolder would be committed to a PUBLIC repo, which is the exact scenario the file says it exists to prevent. The root is clean today. **One line fixes it: `vantage_snapshot*`.**

## Backup coverage — DIRECTIVES §4

**No store of user-writable data was created or modified.** Contract P9 holds exactly: no new field, no `ensureStateDefaults()` entry, no CSV column, no `wipeAllData()` line, no migration. This session adds a **write path** to seventeen fields that already existed, already export, already restore, and are already covered by the ZIP bundle and by Tier-1 snapshots. `tagProspectTargetId` is module scope by the same rule as `detailProspectId` and is required not to persist. **Covered.**

**The phase-level gate still fires**, through the carried-in `state.taskSettings` gap. **2B.7 must not reason "no data work → Gate C inert."**

The flagged manual ZIP was taken by Michael before this session.

## Next step

**Session 2B.4 — Tab strip, Interactions tab, Tasks tab.** Size **M**, ~8 min. `PROSPECT_DETAIL_TABS`, `renderProspectDetailTabs()`, `renderProspectDetailTabBody()` per P4. Buttons, not `<div>`s. Interactions is the whole of `p.history` **unfiltered** — `isRealReachout()` excludes `"Task Completed"` from the *math* only, and that distinction stays in each row's type chip. Sequences is a row with `enabled: false`.

**Not a flagged backup point.** The next ZIP the plan asks for is before **2B.7**.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css` — the detail panel's rules are its final entry, and the identity block's rules are inside that entry. `#canvas-body` is never edited. `state` is not `window.state`. One Vantage window at a time. `state.selectedProspectId` and `detailProspectId` are two cursors and **do not converge in this phase**. No routing, ever — prospect ids are email addresses (P9, Gate A). Inject the transition kill-switch after every reload **and every theme toggle**, and read `document.getAnimations().length === 0` before trusting a measurement. The theme toggle's id is **`theme-toggle-btn`**, not `theme-toggle`.
