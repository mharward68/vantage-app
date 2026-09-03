# AI Context

**Updated:** 2026-09-03 15:17 (America/New_York) — session closed here.

**Last run:** Phase 2B / **Session 2B.15 — ProspectHub tag filter becomes the pop-out chooser.** Compartment: ProspectHub directory only. Plan: `ai/phases/phase-2b-review-response-plan.md` line 654. Finding 6. **Ran under the P8 revision Michael approved at the top of the session — the first frozen contract this phase has amended.**
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v125 → v126, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v126']`, `controlled: true`, and the tell that cannot lie — `typeof openProspectFilterChooseTagsModal` went `"undefined"` on reload 1 to `"function"` on reload 2) · `app.js` 17,188 → **17,346** · `index.html` 3,769 → **3,796** · `style.css` 4,939 → **4,926 (SMALLER — four dead rules deleted)** · **console: 5 lines, one boot, ZERO errors AND ZERO warnings** — the zero-byte-snapshot warning did **not** fire this time · **THE PRODUCTION DATABASE IS LOADED — 651 prospects / 1,090 companies** · `localStorage` **byte-identical across every filter operation (delta 0)** · git **UNCOMMITTED — `app.js`, `index.html`, `style.css`, `sw.js` and the `ai/` documents are outstanding, ON TOP OF 2B.14's uncommitted work. Last commit is still `50253cc`.** ⛔ Git is always Michael-runs-it on this machine; I did not run it. BUILD_NOTES **§ Git, from a session with no shell** · deployed n/a.
**Estimate vs actual:** sized **M / ~8 min / Medium confidence**. **It ran M**, and the Medium was right for the wrong reason — the risk priced in was the modal being too entangled with *assigning* to serve *filtering*, and it was not entangled at all; the real work was making sure the five assign targets got their chrome back. **Michael's time: ~3 minutes** — one boot block of four questions, answered in one pass, and nothing since.

**One-glance version tell:** ProspectHub Row 3. **It is a button reading "🏷️ Filter by Tag…", not a type-ahead box.** If you can type into it, you are on v125.

## What was done

Row 3 of the ProspectHub filter column stopped being the Advanced Query inline chip picker and became a **button onto the shared pop-out `#modal-choose-tags`** — the control MediaHub, CampaignHub, `#modal-prospect` and the prospect detail view already used. 2B.9's picker was the app's only outlier; that is the whole of Finding 6.

| Piece | What happened |
| --- | --- |
| `index.html` Row 3 | `<input>` + dropdown → one `<button id="btn-prospect-tag-filter">`. **Wrapper id `#prospect-tag-chooser` and `#prospect-tag-chips` unchanged.** |
| `#modal-choose-tags` | ids added to the title, the hint and the create-a-tag block so filter mode can rewrite them |
| `PROSPECT_TAG_PICKER` | `searchId` / `dropdownId` **removed**; `onChange` back to plain `renderProspectsView()` |
| `tagSelectionTarget` | **sixth value, `"prospect-filter"`** — the only one that assigns nothing |
| `applyChooseTagsModalMode()` | **new.** Sets title / hint / confirm label / create-block visibility from the target, **both branches exhaustive** |
| `openProspectFilterChooseTagsModal()` | **new.** Ticks come from `aqPickerState`, options from `buildProspectTagFilterOptions()` — unchanged since 2B.9 |
| `saveChosenTags()` | **new first branch.** Rebuilds the include Set, repaints chips, closes, re-filters. No `saveState()`, no record touched |
| `setupEventListeners()` | `initAqPickers([PROSPECT_TAG_PICKER])` → button listener **+ `renderAqPickerChips(PROSPECT_TAG_PICKER)` once at boot** |
| `style.css` | four now-dead rules **deleted**, not left; one new `.pt-filter-btn` rule |

**Untouched, and proved so:** `renderAqInspectorDrawer()`, every `aq-insp-*` id, `runCampaignQuery()`, `exportAqRecordsCSV()`, `resetAllAqPickers()`, `AQ_PICKERS`, and `renderProspectsView()` — which has now survived three different widgets in Row 3 without a line changing.

## Verified — real output, not a claim

**THE ADVANCED QUERY MODAL IS BYTE-FOR-BYTE UNCHANGED.** Old and new files hashed over the whole `#modal-advanced-query` markup and over the entire `AQ_PICKERS` → `initAqPickers()` span of `app.js`:

```
index.html  <div id="modal-advanced-query"> … <div id="modal-choose-tags">
   old sha256[:16] 112d6c020eeb9c47  85161 bytes
   new sha256[:16] 112d6c020eeb9c47  85161 bytes     IDENTICAL: True
app.js      const AQ_PICKERS = [ … end of initAqPickers()
   old sha256[:16] 5e0a463509f7ddae  17128 bytes
   new sha256[:16] 5e0a463509f7ddae  17128 bytes     IDENTICAL: True
renderAqInspectorDrawer / runCampaignQuery / exportAqRecordsCSV / resetAllAqPickers
                                                    IDENTICAL: True (all four)
every 'aq-insp-*' string, app.js 43 / index.html 25  SAME SEQUENCE: True
live: AQ_PICKERS.length 5 · all five search inputs, dropdowns and chip rows present
      AQ_PICKERS.includes(PROSPECT_TAG_PICKER) === false
```

**PARITY — the pop-out against the accessor's Sets set directly, on the production database:**

```
direct (aqPickerState.include = {Auto-eight, Tumbler}; renderProspectsView())
   terms ['7-7-26 auto-eight','tumbler audience']   contacts 11   companies 10
pop-out (btn-prospect-tag-filter.click() -> tick both -> tags-modal-confirm.click())
   terms ['7-7-26 auto-eight','tumbler audience']   contacts 11   companies 10
   chips ['7-7-26 Auto-eight','Tumbler Audience']   modal closed: true
```

Both driven through the **real buttons**, not the functions behind them. The numbers match 2B.14's recorded 11/10 exactly.

**ROUND TRIP, UNTICK, CHIP ✕, CANCEL, AND THE STORAGE PROOF:**

```
reopen -> checked ['7-7-26 Auto-eight','Tumbler Audience']   (reflects what is filtering now)
untick Tumbler -> Apply   terms ['7-7-26 auto-eight']  contacts 11  companies 10  chips 1
chip ✕                    terms []                     chips 0
open, tick, CANCEL        terms []                     chips 0     (cancel applies nothing)
localStorage delta across all of the above: 0 bytes
```

**ALL THREE CLEAR ROUTES:**

```
Clear Filters       -> terms [] chips 0
See All Contacts    -> terms [] chips 0
See All Companies   -> terms [] chips 0
```

**THE ASSIGN-MODE REGRESSION CHECK — the one this session could most easily have shipped:**

```
openChooseTagsModal(media[0])              title '✏️ Choose Associated Tags'
                                           confirm 'Save Tags'   create block hidden: false
openChooseTagsModalForProspectInspector()  title '✏️ Choose Associated Tags'
                                           confirm 'Save Tags'   create block hidden: false
filter mode                                title '🏷️ Filter by Tag'
                                           confirm 'Apply Filter' create block hidden: true
```

**THE `addChooseTagsNewTag()` GUARD — it must write nothing in filter mode:**

```
clicked #btn-dash-add-tag AND called addChooseTagsNewTag() with "ZZ-should-never-be-created"
   prospect_tags delta 0 · media_tags delta 0 · localStorage delta 0 · any tag named ZZ-: false
```

**EMPTY STATE:** filter mode renders *"No tags are in use yet. Tag a contact or a company and it becomes a filter option here."*; assign mode still renders a blank grid with the create box beneath it. Both read back from the live DOM.

**KEYBOARD** (authoring habit, not Gate F): the button is a real `<button>`, `focus()` lands on it (`activeElement.id === "btn-prospect-tag-filter"`), the rows are real `<input type=checkbox>` inside `<label>`, and there is **no positive `tabindex` anywhere in the modal**.

**BOOT AFTER RELOAD:** 5 console lines, zero errors, zero warnings; `terms []`, chips container empty; `#view-prospects` active; 651 / 1,090.

**SCREENSHOTS:** hub with two chips and Contacts (11) / Companies (10), and the pop-out open with both ticked — **both themes**, `document.getAnimations().length === 0` before each (transition kill-switch injected).

## Assumptions logged this session

1. **The empty-state wording is mine and is the one thing Michael has not seen in words.** He decided the button label ("Apply Filter") and the create-block (hidden); the plan's third "needs my eyes" item was the empty state, and stopping again for one muted sentence was not worth a round trip. **Filter mode only** — the five assign targets keep their existing blank grid, which keeps this inside ProspectHub. One line to change.
2. **`searchId` / `dropdownId` were REMOVED from the config rather than left as dangling ids.** Every shared function that reads them already guards, so their absence is a no-op; leaving two ids pointing at elements that no longer exist is the shape a later session mistakes for a bug.
3. **`initAqPickers([PROSPECT_TAG_PICKER])` was removed rather than left to return early.** It would have registered a document-level click listener that can never do anything. Its one still-useful effect — painting the chips at boot — is now an explicit `renderAqPickerChips()` call on the next line.
4. **The AQ modal was proved unchanged statically, and deliberately not clicked into.** Byte identity over the whole modal, the whole shared-function span and all four AQ functions is stronger evidence than opening it, and the standing instruction is that both query surfaces stay DEFERRED.

## Backup coverage — DIRECTIVES §4

**NO NEW STORE, NO NEW FIELD, NO NEW KEY, NO MIGRATION, NO RECORD WRITTEN.** The filter's selection lives in `aqPickerState`, module scope, deliberately not persisted (contract P9) — it clears on reload, exactly as the inline picker did. `ensureStateDefaults()`, `wipeAllData()`, every CSV writer and the whole restore path are **byte-unchanged**. **Proved rather than asserted: `localStorage` delta 0 across an apply, an un-tick, a chip removal and the new-tag guard test.** No manual ZIP was taken and none was required — the run sheet's backup points do not list this session.

## Open items

- **⚠️ NEEDS YOUR EYES — three things, all one-liners.** (1) The **empty-state sentence** above, the only wording you have not approved. (2) The **button label "🏷️ Filter by Tag…"** and its left-aligned 400px shape against the two placeholder-only rows above it. (3) Whether the pop-out should show a **count** on the button when tags are selected — the chips already say it, so I did not add one.
- **⚠️ TWO SESSIONS ARE NOW UNCOMMITTED.** 2B.14's `app.js`/`sw.js` plus this session's four files, all against `50253cc`. You declined the commit at boot; it is a bigger diff every session.
- ⚠️ **THE ZERO-BYTE SNAPSHOT WARNING DID NOT FIRE THIS TIME.** Three sessions running it appeared; this boot's console was clean of it. **Not fixed by anything here — nothing this session touched goes near the snapshotter.** Treat it as intermittent rather than resolved, which is a slightly worse fact than "it happens every boot".
- **The snapshot chip still reads "Not protected"** with a snapshot from 14:55:17 on disk — visible in both screenshots. Same display defect, still on the backlog.
- **Still owed by you:** the **2B.17 layout design** — no, that is unblocked; the remaining items are **Finding 10d's meaning** in one word, **`LA` = Louisiana or Los Angeles** (2B.11), and three carried cosmetics from 2B.4 raised twice. **The P8 revision is DONE and applied.**
- **⛔ 2B.10 OWES FIVE AMENDMENTS NOW, IN ONE BATCH:** 2B.21's P9 (data), 2B.17's P5, 2B.22's P9 (`#modal-prospect` layout override), Finding 5's note that 2B.14 REVERSES what 2B.9 verified, **and now the P8 revision itself — a frozen contract was amended mid-phase with your approval, and the close should record that it was authorised rather than drifted.**
- **⚠️ THE ACCEPTANCE TAG IS `7-7-26`, NOT `7-7-28`, IN ALL THREE PLANNING DOCUMENTS.** Carried; a one-character correction owed at 2B.10. Confirmed again this session — `buildProspectTagFilterOptions()` offers `7-7-26 Auto-eight` and nothing containing 7-7-28.
- **⚠️ RAISED AFTER THIS SESSION CLOSED, AND IT IS A SCOPING GAP RATHER THAN A DEFECT.** Michael reported Advanced Query still AND-ing tags; **it was a stale build in his own window** (confirmed by him). But chasing it surfaced something real: **ProspectHub OR-s prospect and company tags because they share one picker, while Advanced Query splits them across the chip picker and the `#aq-p-company-tags` TEXT FIELD and therefore AND-s them** — the same two tags, opposite results, both behaving as designed. The text field also has no exclude half. **On the backlog; needs a decision, not a fix.** See BUILD_NOTES § Tag filter semantics.
- **Phase backlog:** the cosmetic `p.notes` shape default; a `p.location` shape default; the uniqueness guard on the company edit path; the snapshot chip display defect; ZIP restore reports 1 orphaned task on a round trip; `.col-resize-handle` keeps the stock cursor; the §4 back-fill of existing `"domain.com"` and slug rows; the missing `<link rel="icon">`.
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist (it is `btn-show-all-contacts`). Both `forceShowAll*` true blanks the directory. CampaignHub identifies itself twice. MediaHub's tag rail off the right edge. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
- **Unchanged from Phase 1:** `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

**Code:** `app.js` (17,188 → **17,346**), `index.html` (3,769 → **3,796**), `style.css` (4,939 → **4,926**), `sw.js` (**v125 → v126**, one bump, and it held).

**Documents:** `ai/AIContext.md`, `ai/archive/2026-09-03_1517_AIContext.md` (new), `ai/BUILD_NOTES.md`, **`ai/phases/phase-2b-prospect-detail-view.md` (§P8 REVISED, session order)**, `ai/phases/phase-2b-review-response-plan.md` (2B.15 done, owed-item 1 closed, the three decisions recorded).

**No `DECLARATIONS.md` or `DECISIONS.md` change.** ⚠️ **2B.10 should consider one:** a phase plan's frozen contract was formally revised mid-phase for the first time, and `DECISIONS.md` has no entry describing how that is done.

## Next step

**2B.19 — Add Company: the front door and the domain normaliser.** Unblocked; the 2B.13 exception covers it; it builds what 2B.18 consumes. **2B.11, 2B.12, 2B.17 and 2B.22 are also unblocked** — 2B.22 wants the P9 waiver. **2B.10 is ALWAYS LAST**, and it opens by writing the five owed amendments in one batch.

⚠️ **COMMIT.** Two sessions' work is outstanding against `50253cc`.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`. `state.selectedProspectId` and `detailProspectId` are two cursors. No routing, ever. `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window.** Inject the transition kill-switch after every reload and after every theme toggle. The theme button is **`#theme-toggle-btn`** — **put the theme back the way you found it before you finish**; this session left it light, as it found it. `resize_window` does not work on this machine. **`setAdvancedQueryTarget()` takes `"prospect"` / `"company"` — SINGULAR.** **Both query surfaces stay DEFERRED.** `wipeIndexedDB()` clears only the `files` store, NOT `handles`. **A new top-level function name is the cheapest honest version probe there is** — `toString()` lies in both directions, a new global cannot.
