# AI Context

**Updated:** 2026-09-03 08:43 (America/New_York) — session closed here.

**Last run:** Phase 2B / **Session 2B.21 — Prospect field coverage: address, zip, and the conference repair.** Compartment: the prospect record's persisted field set + the prospect CSV export/restore/import. Plan: `ai/phases/phase-2b-review-response-plan.md` **line 363** — ⚠️ **NOT** in `phase-2b-prospect-detail-view.md`, which stops at 2B.10 and whose own "2B.21" at line 517 is the SUPERSEDED original scope (now 2B.22).
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v121 → v122, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v122']`, `controlled: true`, live header array read back out of the running `exportProspectsCSV`) · `app.js` 16,752 → **16,860** / `index.html` **3,555, UNCHANGED** / `style.css` **4,765, UNCHANGED — this session added no CSS and no markup** · **console: `onlyErrors` returns NOTHING, three times**, including once after a full reload and a six-hub sweep · parked: dashboard, light theme, no modal, 6 companies / 4 prospects / 31 tasks · git **unknown; there is still no shell on this machine, so ASK, do not assume** · deployed n/a.
**Estimate vs actual:** sized **M / ~5 min / High**. **It ran M and the confidence was right** — no surprises in the code, and the one thing the plan got wrong (see below) was found by grep in the first two minutes rather than mid-run. **Michael's time: ~2 minutes** — three questions answered at the top, nothing since.

**One-glance version tell:** there ISN'T one, and that is correct. **This session ships no UI at all.** The tell is in a file: export a ZIP and open `prm_prospects.csv` — the header is **21 columns**, not 15, and columns 9, 13, 15–18 are `Address`, `Zip`, `Conference Name`, `Conference Venue`, `Conference Start`, `Conference End`.

## ⛔ THE P9 OVERRIDE — 2B.10 OWES AN AMENDMENT. THIS HEADING IS WHERE TO FIND IT.

**Frozen contract P9 ("What does not change", parent plan line 256) opens:** *"No new persisted field. No `ensureStateDefaults()` entry. No CSV column. No `wipeAllData()` line for the detail view itself. No migration."*

**Session 2B.21 does the first, second, third and fifth of those by design.** Michael granted a **this-session override at boot** (the review-response plan's standing procedure, lines 326–345: name the contract, quote the line, ask before task 1, never mid-run).

⚠️ **AN OVERRIDE LEAVES THE CONTRACT TEXT WRONG, AND P9 IS NOW FALSE AS WRITTEN.** The amendment 2B.10 owes is roughly: *"P9's first bullet is scoped to the detail-view build (2B.1–2B.6). Sessions 2B.18 and 2B.21 added persisted fields, migrations and CSV columns under their own decisions."* **2B.22 will owe a second P9 amendment** (the `#modal-prospect` "untouched" clause). Both belong in the same batch.

## ⚠️ THE PLAN SAID TWO PROSPECT CSV WRITERS. THERE ARE FIVE.

The plan's task 3 says the six columns go in "**BOTH** prospect CSV writers … two separate literal header arrays." **Grep `"Company ID"` — there are five.** Michael chose **all four non-deferred** at boot:

| # | Function | Cols | 2B.21 |
| --- | --- | --- | --- |
| 1 | `exportProspectsCSV()` | 15 → **21** | changed — read back by restore |
| 2 | `exportFilteredContactsCSV()` | 15 → **21** | changed — convenience export |
| 3 | `exportAudienceContactsCSV()` | 16 → **22** (+ `Company`) | changed — convenience export |
| 4 | `exportZIPBackup()` prospect block | 15 → **21** | changed — read back by restore |
| 5 | `exportAqRecordsCSV()` | **16, UNTOUCHED** | ⛔ **DEFERRED — Audience Query Engine** |

⛔ **#5 IS DELIBERATELY ONE COLUMN SET BEHIND, exactly like the geography matcher's third copy.** Verified byte-identical at close. **Do not "reconcile" it** — it closes when the Engine is un-deferred, not by copying columns into a surface the phase may not enter. A block comment above `exportProspectsCSV()` says all of this in the file, so a future session finds it before it grep-and-replaces.

## What was done — the five plan tasks

1. **`address` and `zip` are real persisted prospect fields.** `address` previously existed on COMPANIES only (`comp-address`); neither existed on a prospect in any form.
2. **`ensureStateDefaults()` migrations for all six**, in the existing `state.prospects.forEach` block: `address`, `zip`, and the four `conference*` keys, **which had never had one either**. ⚠️ The seed and the migration write the **same shape** (`""`) — the 2B.13 / Finding 10a rule. `saveProspect()`'s create literal gained `address: ""` / `zip: ""` for the same reason; there is no modal control for either yet, so those are literals, not DOM reads.
3. **Six columns in four writers** — see the table above.
4. **`restoreProspectsFromCSV()` reads all six.** It maps **by header name**, so this is additive with no version check: an older backup has none of the headers and every one comes back `""`.
5. **The CSV import maps all six** via the house `lookup([...])` idiom. ⛔ **`"company address"` is deliberately NOT in the `address` key list** even though the `city` line one row up DOES fall back to `"company city"`. A company street address written onto a person is a confident wrong answer where a blank field is an honest one (Ladder rung 2); a city is coarse enough to borrow, a street address is not.

## Verified — real output, not a claim

**The two BACKUP header arrays, side by side, read out of the LIVE running functions (`identical: true`):**

```
exportProspectsCSV()     | exportZIPBackup()
-------------------------+-------------------------
ID                       | ID
First Name               | First Name
Last Name                | Last Name
Email                    | Email
Phone                    | Phone
Title                    | Title
LinkedIn                 | LinkedIn
Company ID               | Company ID
Address                  | Address
Location                 | Location
City                     | City
State                    | State
Zip                      | Zip
Seniority                | Seniority
Conference Name          | Conference Name
Conference Venue         | Conference Venue
Conference Start         | Conference Start
Conference End           | Conference End
Notes                    | Notes
Tags                     | Tags
History                  | History

lengths {p1:21, p2:21, p3:22, p4:21, p5_DEFERRED:16}   aqUnchanged: true
```

**Jane's row pulled straight back out of the ZIP that was written to the real backup folder** (`vantage_data_backup_9-3-26_840.zip`, header 21 cols) — note the comma inside `Address` and the slash inside `Conference Venue`, both round-tripped by `convertToCSV`/`parseCSV`:

```
pros-jane | Jane | Smith | jane.smith@stripe.com | +1 (555) 321-4567 | Developer Advocate
  | https://linkedin.com/in/janesmith | comp-stripe
  | "1200 Broadway, Suite 400" | "San Francisco, CA" | "" | "" | 37203 | Individual Contributor
  | AV Summit 2026 | "Nashville / Music City Center" | 2026-10-14 | 2026-10-16 | "" | Fintech;Developer;test | [history]
```

**THE WHOLE SESSION — export → `wipeAllData()` → restore, on real state:**

```
WIPED    {prospects 0, companies 0, tasks 0, statePros 0, stateComp 0, stateTasks 0}
RESTORED {prospects 4, companies 6, tasks 31}   emailsMatch: true   countsMatch: true

address          "1200 Broadway, Suite 400"      ->  "1200 Broadway, Suite 400"      identical
zip              "37203"                          ->  "37203"                         identical
conferenceName   "AV Summit 2026"                 ->  "AV Summit 2026"                identical
conferenceVenue  "Nashville / Music City Center"  ->  "Nashville / Music City Center" identical
conferenceStart  "2026-10-14"                     ->  "2026-10-14"                    identical
conferenceEnd    "2026-10-16"                     ->  "2026-10-16"                    identical

allSixIdentical: true
```

**The four conference values were typed through the REAL UI** — the detail view's `pd-conference-*` inputs with a `change` event, so they went through `handleProspectDetailFieldChange()` → `commitProspectField()`, not around it. **`address` and `zip` were set on the record**, because there is no control for either until 2B.17 / 2B.22. Screenshot of the identity block carrying all four conference values is in chat.

**AN OLDER, SIX-COLUMN-LESS BACKUP STILL RESTORES** — `vantage_data_backup_9-3-26_836.zip`, taken at v121 before any of this session's code existed, header **15 columns**, `hasAnyOfTheSix: []`:

```
ALL_SIX_EMPTY_STRING: true      ANY_UNDEFINED: false
pros-jane after that restore: address "" (string) · zip "" (string) · all four conference* "" (string)
```

**⚠️ THE ARITHMETIC THAT PROVES NOTHING ELSE MOVED, and it is the technique worth keeping.** After restoring the pre-session ZIP, user-data bytes read **28,735** against a pre-session **28,323**. Rather than argue about 412 bytes, the six keys were priced directly — for each prospect, `JSON.stringify(p).length` minus the same record with the six keys deleted:

```
costOfTheSixEmptyKeys 412      userDataBytesNow 28,735
28,735 − 412 = 28,323 == the pre-session reading, EXACTLY
```

**So the only change to his data is the six empty keys**, and as a by-product this proves **none of the four prospects held any `conference*` key before** — the plan's "0 records currently hold conference values" is confirmed, not assumed. (`snapshotHealth` excluded throughout, per the 2B.13 rule.)

| Check | Result |
| --- | --- |
| All six hubs + prospect detail | Every panel `active-panel`, before AND after a full reload |
| Console | **`onlyErrors` returns nothing, three times.** No warnings surfaced either |
| `node --check` / `check_ids.py` | Clean parse; `Missing IDs: {'export-backup-btn', 'restore-backup-input'}` — the baseline pair exactly |
| Guard key | `__2b21_guard` set before the wipe, **REMOVED**; `localStorage` keys are `vantage_sidebar_pinned`, `vantage_prm_database` and nothing else |
| Parked | Dashboard, no modal, 4 prospects / 6 companies / 31 tasks |

## Assumptions logged this session

1. **`address` / `zip` GET NO UI THIS SESSION** — that is 2B.17 (detail view) and 2B.22 (modal). The Done-when's "type a value into all six" was met by typing the four that have controls and setting the two that do not. Say so rather than implying six were typed.
2. ⚠️ **`pros-jane` IS LEFT HOLDING ALL SIX VALUES ON PURPOSE, AND THIS IS THE ONE TO REVERSE IF YOU DISLIKE IT** (one line). The plan's own §4 finding is that this defect survived every previous drill because **0 records held conference values — a drill against data that does not exist is a test that cannot fail.** 2B.10 runs that drill for real. Leaving one sandbox record populated is what makes 2B.10's export→wipe→restore able to fail. The other three prospects are `""` across all six.
3. **`saveProspect()`'s create literal seeds `address: ""` / `zip: ""`.** Contract P9's *markup* is untouched — this is the create function, not `#modal-prospect`. Without it a record created between two reloads carries `undefined`.
4. **The CSV headers are the SHORT forms** (`Conference Start`, not `Conference Start Date`). Both the restore and the import accept **both** spellings, so Michael's sheet using the long form still maps.
5. **All four non-deferred writers, not the plan's two** — Michael's call at boot.
6. **The pre-session ZIP is honest this time.** `state` and parsed `localStorage` were checked as agreeing (4/4, 6/6) BEFORE anything was touched, and `rawBytes` read **28,437** — byte-identical to 2B.20's close. No second window had written.

## Backup coverage — DIRECTIVES §4

⚠️ **THIS SESSION IS THE BACKUP COVERAGE, AND IT CLOSES A LIVE VIOLATION THAT PREDATES IT.** `address` and `zip` are **NEW** persisted prospect fields and are **COVERED** from birth — six columns in both backup writers, read back by `restoreProspectsFromCSV()`, proved by a real export → `wipeAllData()` → restore.

**The four `conference*` fields were WRITABLE FROM TWO SURFACES AND IN NEITHER CSV.** Every conference value was destroyed, silently, by any export → wipe → restore round trip. **They are now covered.**

**NO NEW STORE. `wipeAllData()` needs no edit** (the fields live on `state.prospects`, already wiped). **`ensureStateDefaults()` gained six lines.** **No new localStorage key, no new IndexedDB store.**

**Three ZIPs landed in the real backup folder** (`queryPermission({mode:"readwrite"})` `"granted"`, 16 total): **`vantage_data_backup_9-3-26_836.zip` — the pre-session rollback point, and the six-column-less backup the compatibility test used**; `..._840.zip` — the drill export; **`..._843.zip` — the closing state.**

## Open items

- **⚠️ NEEDS YOUR EYES — three, all decided, all one-line reversible:**
  1. **`pros-jane` keeps all six test values** (Assumption 2). Reverse it and 2B.10's drill goes back to being untestable.
  2. **The CSV column ORDER** — `Address` before `Location`, `Zip` after `State`, the four conference columns between `Seniority` and `Notes`. Header names are the contract; the order is only readability.
  3. **The import's `address` key list excludes `"company address"`** while `city` includes `"company city"`. Deliberate asymmetry, explained in the code.
- ⚠️ **2B.10 OWES A P9 AMENDMENT** — see the heading above. **2B.22 will owe a second one.**
- ⚠️ **DECLARATIONS AMENDMENTS PROPOSED, NOT APPLIED** — the batch 2B.10 owes: the P4 order, the seventh view panel, the line-count reconciliation, the field-semantics line, 2B.18's `resolveCompanyByName()` line, 2B.20's import-identity line. **"Six hubs" stays true and must not be edited to say seven.** ⚠️ **2B.21 adds one:** *"A prospect carries `address` and `zip`, and all six of those plus the four `conference*` fields are in the prospect CSV. `exportAqRecordsCSV()` is deliberately behind."*
- **⚠️ THE PRODUCTION DATABASE IS STILL NOT LOADED.** 4 prospects / 6 companies. The duplicate-domain report has still never run against a real duplicate cluster, and it is still the cheapest thing you can do next.
- **⚠️ THE IDENTITY BLOCK STILL BREAKS CONTRACT S1 BELOW 1150px CANVAS WIDTH.** 2B.17's.
- **Still owed by you:** the **P8 revision** (gates 2B.15), the **ID layout design** — ⚠️ **that one has ARRIVED** (his third sheet, in the plan at line 406), so **2B.17 is unblocked and needs only its P5 override at boot** · and **Finding 10d's meaning** in one word.
- **⛔ THE IMPORT NOT WRITING `notes` IS DELIBERATE — ASKED AND ANSWERED AT THIS CLOSE (Michael, 2026-09-03).** Raised as a possible defect; **it is not one.** The CSV import puts the sheet's notes column on the timeline as a dated `"Note"` entry and leaves `p.notes` alone, because **`notes` is what he writes inside Vantage and an outside sheet's text is provenance, not his note.** `restoreProspectsFromCSV()` DOES read the column and is also right — it reproduces what Vantage exported. ⚠️ **A blank Notes box on an imported contact is the intended behaviour, not a bug to report.** The only thing still open is the SHAPE: `ensureStateDefaults()` has no `p.notes` default, so imported records hold `undefined` where others hold `""`. Cosmetic, unowned, changes nothing. **BUILD_NOTES carries the full entry — read it before touching that function.**
- **`domain` IS STILL DISPLAYED IN EXACTLY ONE PLACE: the company modal** — plus the duplicate-domain report. Anything reported about "the company domain" outside those two is about **`website`**.
- **Phase backlog:** the cosmetic `p.notes` shape default only (the import behaviour itself is DECIDED — see above); the uniqueness guard on the company edit path; the snapshot chip display defect (`renderSnapshotHealthChip()` / `computeSnapshotState()`, and 2B.10's "confirmed green snapshot" gate is unsatisfiable as written); the headquarters duplication question needs the production database; ZIP restore reports 1 orphaned task on a round trip; `.col-resize-handle` keeps the stock cursor; **the §4 back-fill of existing `"domain.com"` and slug rows, deferred to Phase 2C's collision report.**
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist. Both `forceShowAll*` true blanks the directory. The four always-on conference boxes read as grey ghosts. CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
- **Unchanged from Phase 1:** `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

**Code:** `app.js` (16,752 → **16,860**, +108, of which roughly 75 are comment), `sw.js` (**v121 → v122**, one deploy). **`index.html` UNCHANGED at 3,555 and `style.css` UNCHANGED at 4,765 — this session added no markup and no CSS at all.**

**Documents:** `ai/AIContext.md`, `ai/archive/2026-09-03_0843_AIContext.md` (new), `ai/BUILD_NOTES.md`.

**No `DECLARATIONS.md` or `DECISIONS.md` change.**

## Next step

**2B.17 — Identity block redesign.** `ai/phases/phase-2b-review-response-plan.md` line 399. **Size L.** Its two blockers are gone: 2B.13 shipped, and `address`/`zip` now exist and are backup-covered.
⚠️ **IT NEEDS A P5 OVERRIDE AND THE PLAN SAYS ASK FOR IT AT BOOT, NEVER MID-RUN** — 2B.17 *is* the field-list change, so it is knowable in the first minute. Quote P5's enumeration, name the departure, ask for a this-session override, and record it under a heading 2B.10 will find (this file's P9 heading is the worked example).
⚠️ Two things on that list are still **unanswered and belong in the same boot block**: whether he still wants the **Notes pop-out expander** (task 4, not on his sheet) and whether the **read-only company URL display** (task 6, review Finding 11) is built or dropped.

**Then 2B.22** (needs the P9 waiver — and note this session already established the override precedent) · **2B.14**, **2B.15**, **2B.11**, **2B.12** · **2B.10**, **ALWAYS LAST**.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`; `activeView` is not a global — read `.active-panel`. `state.selectedProspectId` and `detailProspectId` are two cursors. No routing, ever. `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window.** Inject the transition kill-switch after every reload. `resize_window` does not work on this machine. **Both query surfaces stay DEFERRED — `renderAqInspectorDrawer()`, the `aq-insp-*` ids, the Audience Query Engine and now `exportAqRecordsCSV()` are untouched.** `PROSPECT_DETAIL_TABS` is deliberately out of order versus P4. A native `<datalist>` popup freezes the renderer to CDP; one `navigate` clears it. **Screenshot↔CSS scale this session: 0.433** (CSS x=306 → image x≈133), same as 2026-09-01; it was 0.912 at 2B.20 on this same machine, so **measure it every session.** `window.alert = m => {…}` **and `window.prompt = () => "YES"`** both get through the extension's content filter — the prompt stub is what makes `wipeAllData()` drivable at all. **`wipeIndexedDB()` clears only the `files` store, NOT `handles`** — the backup-folder handle survives a full wipe, which is what let this session restore itself.
