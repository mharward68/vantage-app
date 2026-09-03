# AI Context

**Updated:** 2026-09-03 12:50 (America/New_York) — session closed here.

**Last run:** Phase 2B / **Session 2B.22 — Add Prospect modal: field order, and Save and Open Contact.** Compartment: `#modal-prospect` only. Plan: `ai/phases/phase-2b-review-response-plan.md` **line 449**.
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v123 → v124, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v124']`, `controlled: true`, after four reloads) · `app.js` 17,052 → **17,180** / `index.html` 3,698 → **3,769** / `style.css` 4,862 → **4,939** · **console: 5 lines, one boot, ZERO errors** (`onlyErrors` empty; the one WARNING is the snapshot pruner, see Open items) · parked: ProspectHub, light theme, no modal, 6 companies / 4 prospects / 31 tasks · `localStorage` **28,941 bytes at open and 28,941 at close — byte-identical, no net data change** · git **NOT COMMITTED — four files outstanding, and the last commit is still `bd39305`.** ⛔ Git is always Michael-runs-it on this machine; hand him the commands. BUILD_NOTES **§ Git, from a session with no shell** has all of it · deployed n/a.
**Estimate vs actual:** sized **S / ~5 min / High**. **It ran M, not S** — the plan's four tasks were exactly as described, but the modal's own height turned out to be a fifth task nobody had scoped (see Assumption 1). Confidence was right. **Michael's time: ~2 minutes** — one boot question block of two, nothing since.

**One-glance version tell:** open Add Prospect. **The primary button reads "Save and Open Contact", Job Title is full-width under the names, and there is a bordered CONFERENCE group.** If there is still a Seniority dropdown beside Job Title, you are on v123.

## ⛔ THE P9 OVERRIDE — THIS IS THE THIRD OWED AMENDMENT. THIS HEADING IS WHERE TO FIND IT.

**Frozen contract P9 ("What does not change", parent plan line 262) reads:** *"`#modal-prospect` is untouched and remains the create path."*

**Session 2B.22 reordered that modal's markup, added `#pros-address` and `#pros-zip`, and removed `#pros-seniority` and `#pros-location`.** Michael granted a **this-session override at boot** (the review-response plan's standing procedure, lines 326–345: name the contract, quote the line, ask before task 1, never mid-run). He also confirmed, in the same block, that **Save and Open Contact REPLACES Save Contact** rather than sitting beside it.

⚠️ **P9's "untouched" CLAUSE IS NOW FALSE AS WRITTEN.** The amendment 2B.10 owes is roughly: *"P9's `#modal-prospect` clause is superseded as to LAYOUT by Michael's sheet of 2026-09-02, applied by Session 2B.22: the field order is the sheet's, `address` and `zip` gained controls, and Seniority and Metro lost theirs. The 'remains the create path' half is unchanged and still holds — it is still the only create surface and must not be deleted as cleanup."*

⛔ **2B.10 NOW OWES THREE AMENDMENTS, AND THIS IS THE LAST OF THEM: 2B.21's P9 (data), 2B.17's P5, and this one. ONE BATCH.**

## What was done — the four plan tasks, plus one the plan did not have

1. **The `.form-group`s reordered to the sheet**, `#pros-address` and `#pros-zip` added, `#pros-seniority` and `#pros-location` removed. **Every surviving id is byte-identical; only the order moved.**
2. **All four reads of the two removed controls are gone** — two in `openProspectModal()` (edit + create branch), two in `saveProspect()`. ⛔ **And the two WRITES with them** — see the two warnings below, which are the whole risk of this session.
3. **`deriveSeniority(titleVal)` fills `seniority` on CREATE only.**
4. **`saveProspect()` now RETURNS the saved id or a falsy value**, and `saveProspectAndOpen()` is the new listener on `#pros-modal-confirm`.
5. ⚠️ **NOT IN THE PLAN: the modal card had to be given its own scroll.** See Assumption 1.

## Verified — real output, not a claim

**THE ROW MAP, read out of the LIVE DOM by grouping every labelled control in the card by its y-position. This IS his sheet:**

```
pros-first-name | pros-last-name
pros-title
pros-company
pros-address
pros-city | pros-state | pros-zip          <- .form-row-3up, tracks 143.1 | 143.1 | 143.1
pros-email
pros-phone
pros-linkedin
pros-conference-name | pros-conference-venue   <- inside the bordered <fieldset>
pros-conference-start | pros-conference-end
pros-display-tags
pros-notes
```

**THE CHECK THAT MATTERS — `location` SURVIVES AN EDIT-AND-SAVE. And it is a test that CAN fail, because the record was really changed:**

```
SAVE_REALLY_RAN     phoneBefore "+1 (555) 321-4567" -> phoneAfter "2B22-PHONE-MARKER"
                    phoneInLocalStorage "2B22-PHONE-MARKER"
LOCATION_SURVIVED   before "San Francisco, CA"  after "San Francisco, CA"
                    inLocalStorage "San Francisco, CA"   identical: true
city "" state "" zip "37203" address "1200 Broadway, Suite 400"
```
⚠️ **A SAVE-UNCHANGED TEST WOULD HAVE PROVED NOTHING HERE, AND I RAN THAT ONE FIRST AND THREW IT AWAY.** Jane's record is byte-identical before and after an unchanged save, so "location is still there" passes whether or not `saveProspect()` ever ran. **The marker in a second field is what makes the location check evidence.**

**SENIORITY IS NOT RE-DERIVED ON EDIT — proved with a value the heuristic cannot produce:**

```
title "Developer Advocate"   whatDeriveWouldSay "Individual Contributor"
hand-corrected to "C-Level"  ->  after a full modal save: "C-Level"   in localStorage: "C-Level"
HAND_CORRECTION_SURVIVED: true      locationStillIntact "San Francisco, CA"
```

**BOTH REFUSALS REFUSE, AND NEITHER NAVIGATES:**

```
P6 DUPLICATE EMAIL (create, different case: "JANE.SMITH@STRIPE.COM")
  notice: "That email is already on file for Jane Smith — Stripe. Open Jane Smith Nothing was saved."
  modalStillOpen true   samePanelAsBefore true   prospects 4 -> 4   companies 6 -> 6
  typedDataStillInForm "Dup / JANE.SMITH@STRIPE.COM"

2B.18 COMPANY CONFLICT (email @stripe.com, box typed "Totally Different Co")
  notice: "stripe.com belongs to Stripe. Link to Stripe  Keep Totally Different Co  Nothing was linked."
  modalStillOpen true   samePanelAsBefore true   prospects 5 -> 5   companies 6 -> 6

THEN ANSWERING IT SAVES *AND* NAVIGATES  <- the wrapper in the picker callback
  clicked "Link to Stripe" -> created pros-1788453889000, company "Stripe", companies 6 -> 6
  activePanel "view-prospect-detail"   detailProspectId === the new id   subtitle "Conflict Test"
```

**THE CREATE BRANCH, END TO END (throwaway record, later removed):**

```
id pros-1788453859681           prospects 4 -> 5    companies 6 -> 6 (no company minted)
title "VP of Sales" -> seniority "VP"   matchesDerive: true
address "  99 Throwaway Rd  " -> "99 Throwaway Rd"  (trimmed by the writer)
city "Nashville"  state "TN"  zip "37203"
location ""  typeof "string"  hasOwnKey true      <- seeded, NOT undefined
2B.18 BLUR AUTOFILL STILL FIRES: company box "" -> "Stripe" on a real blur event
NAVIGATED: activePanel "view-prospect-detail", detailProspectId === the new id,
           detailOrigin {"view":"prospects",...}, modalHidden true
```

**CONTRACT S1 / THE SEVEN-PANEL SWEEP, after a full reload at 1710×1178:**

```
dashboard | prospects | media | campaigns | tasks | data-management | prospect-detail
all seven: active-panel true, height 1010.67px (DEFINITE, not auto), min-height 0px
document.getAnimations().length 0 before every measurement
```

| Check | Result |
| --- | --- |
| Order, both themes | Screenshotted. Edit (Jane) in light + dark; empty create modal in light |
| Real listener | `#add-prospect-btn` still opens it — heading "Add New Prospect", all 16 fields blank |
| Console | **5 lines, one boot, zero errors.** `onlyErrors` empty |
| `node --check` / `check_ids.py` | Clean parse; `Missing IDs: {'export-backup-btn', 'restore-backup-input'}` — the baseline pair exactly |
| Jane restored | Byte-identical to her opening JSON (`restored: true`), keys the original lacked deleted |
| `localStorage` bytes | **28,941 at open, 28,941 at close.** No net data change |

## Assumptions logged this session

1. ⚠️⚠️ **THE MODAL CARD NOW SCROLLS ITSELF, AND THIS WAS NOT IN THE PLAN. MEASURED BEFORE ANY MARKUP MOVED: at `innerHeight` 884 the card was ALREADY 869px tall, 8px from each edge, and NOTHING sets `overflow` on `.modal-overlay` or `.modal-card`.** The sheet turns four paired fields into full-width singles (+2 rows), so the card would have grown past the viewport with `align-items: center` clipping BOTH ends — First Name off screen, unreachable at any scroll position. `#modal-prospect .modal-card { max-height: calc(100vh - 24px); overflow-y: auto }`, scoped by id because `.modal-card` is shared by every modal in the app. **A/B'd at his shorter height, since `resize_window` does not work here: forcing `max-height: calc(884px - 24px)` clamped the card to 860px, `scrolls: true`, and both First Name and Notes reachable; removing the override restored 1042px and `scrolls: false`.**
2. **`#modal-prospect .form-group` margin-bottom cut 16px → 10px.** Twelve rows of 16px is 192px of pure gap; 6px back per row is ~72px and a shorter scroll. Purely a vertical-budget trim, scoped by id. **Reverting costs scroll distance and nothing else.**
3. ⛔ **`p.seniority` IS NOT ASSIGNED ON THE EDIT BRANCH.** The plan's task 3 says "`deriveSeniority(title)` fills `seniority` on save"; taken literally on BOTH branches that overwrites a hand-correction made in the detail view — which the plan itself calls "the surface for correcting a guess" — with a guess off the job title. **Create only.** `ensureStateDefaults()`'s `if (!p.seniority)` still fills a record that never had one.
4. **`location` IS SEEDED `""` ON CREATE though it is not assigned on edit.** A brand-new record has no geography to destroy, and there is no `p.location` default in `ensureStateDefaults()` — every reader is written `p.location || ""` — so omitting it entirely would mint the one record in the file holding `undefined` where the rest hold a string. The plan's "never write the field at all" is about the EDIT branch.
5. **`resolveCompanyByName(compVal, email, "")` — the third argument is now always empty.** It seeds a new company's `location` and used to carry the Metro box. `[city, state]` was refused for 2B.13's reason: a contact's city is not their employer's location, so "Unknown" is an honest empty and "San Francisco, CA" on a Chicago company is a confident wrong answer. Ladder rung 2. **Company location stays editable in the company modal.**
6. **The conference group is a `<fieldset class="modal-fieldset">`, its OWN rule set, not `.pd-conference-group`.** Same values, but that class carries `grid-column: 1 / -1` for the identity grid and its title takes `--color-primary`, which inside a modal is whichever hub is behind the overlay.
7. **`saveProspectAndOpen()` always passes `{ view: "prospects" }`.** Three of the detail view's four entry points come from there and `#add-prospect-btn` lives there.

## Backup coverage — DIRECTIVES §4

**NO NEW STORE, NO NEW FIELD, NO NEW KEY, NO MIGRATION. This session is UI plus one return value.** `address` and `zip` were persisted, migrated and given columns in both prospect CSV writers by **2B.21**; every field this modal writes was already covered. **`ensureStateDefaults()`, `wipeAllData()`, every CSV writer and the whole restore path are BYTE-UNCHANGED.** No new `localStorage` key, no new IndexedDB store.

⚠️ **AND THE COVERAGE MOVED THE OTHER WAY TOO, WHICH IS THE ONLY THING HERE WORTH A SECOND LOOK: two fields lost their only modal writer.** `seniority` and `location` are still exported, restored and displayed — they are simply no longer editable from this surface. `location` is editable in the detail view (Metro); `seniority` likewise. Neither is orphaned.

**One ZIP landed in the real backup folder before any markup moved** (`queryPermission({mode:"readwrite"})` `"granted"`): **`vantage_data_backup_9-3-26_1230.zip` — 22,585 bytes, written 12:30:41 PM — the rollback point for this session.** No closing ZIP was taken because no data changed (28,941 bytes in, 28,941 out).

## Open items

- **⚠️ NEEDS YOUR EYES — three, all decided, all reversible:**
  1. **The modal scrolls on a short window** (Assumption 1). At your 1178px window it does not scroll at all; at 884px it does. There is no version of your sheet that fits 884px unscrolled.
  2. **Seniority is not re-derived when you edit an existing contact** (Assumption 3). Change someone's job title in the modal and their Seniority stays as it was. Say the word and it becomes one line.
  3. **A new company created from this modal gets `location: "Unknown"`** (Assumption 5), where typing a Metro used to seed it.
- ⛔ **GIT IS NOT COMMITTED. Four files outstanding — `app.js`, `index.html`, `style.css`, `sw.js` — and the last commit is `bd39305`.** Run it before the next session.
- ⚠️ **REAL-MOUSE CLICKS FROZE CDP TWICE THIS SESSION AND THE APP WAS FINE BOTH TIMES.** Console read 5 lines, one boot, zero errors while `Runtime.evaluate` and screenshot injection were both timing out; one `navigate` recovered it each time. **The screenshot↔CSS scale is `css × (screenshotWidth ÷ innerWidth) × devicePixelRatio` = 0.585 here, NOT the 0.781 that BUILD_NOTES' formula gives** — a click computed the old way landed off screen. BUILD_NOTES carries the corrected arithmetic. **Nothing in the app is implicated; do not go looking for a bug.**
- ⚠️ **ONE SNAPSHOT FILE WAS WRITTEN ZERO-BYTE AND THE PRUNER CLEANED IT UP.** `[Snapshot] Ignoring 1 zero-byte snapshot file(s) — truncated writes, not snapshots.` then `Pruned 1 file(s) — 1 zero-byte, 0 aged out. 15 kept.` at 12:37:10. Self-healing and pre-existing, but **a truncated snapshot write is a Tier-1 recovery event** and it is the second thing on the snapshot pile with the chip defect. Not mine; not investigated.
- **⚠️ THE PRODUCTION DATABASE IS STILL NOT LOADED.** 4 prospects / 6 companies. The duplicate-domain report has still never run against a real duplicate cluster, and it is still the cheapest thing you can do next.
- **Still owed by you:** the **P8 revision** (gates 2B.15) · and **Finding 10d's meaning** in one word.
- **⛔ THE IMPORT NOT WRITING `notes` IS DELIBERATE — ASKED AND ANSWERED 2026-09-03.** Not a defect. Only the SHAPE is open: `ensureStateDefaults()` has no `p.notes` default, so imported records hold `undefined` where others hold `""`. Cosmetic, unowned. **BUILD_NOTES carries the full entry.**
- **`domain` IS STILL DISPLAYED IN EXACTLY ONE PLACE: the company modal** — plus the duplicate-domain report. ⚠️ **`#pd-company-url` shows `website`, NOT `domain`.**
- **Phase backlog:** the cosmetic `p.notes` shape default; **a `p.location` shape default, now that the create path seeds it by hand (Assumption 4)**; the uniqueness guard on the company edit path; the snapshot chip display defect (`renderSnapshotHealthChip()` / `computeSnapshotState()`, and 2B.10's "confirmed green snapshot" gate is unsatisfiable as written); the headquarters duplication question needs the production database; ZIP restore reports 1 orphaned task on a round trip; `.col-resize-handle` keeps the stock cursor; the §4 back-fill of existing `"domain.com"` and slug rows, deferred to Phase 2C's collision report.
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist (it is `btn-show-all-contacts`). Both `forceShowAll*` true blanks the directory. CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
- **Unchanged from Phase 1:** `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

**Code:** `app.js` (17,052 → **17,180**, +128, of which roughly 95 are comment), `index.html` (3,698 → **3,769**, +71, of which roughly 55 are comment), `style.css` (4,862 → **4,939**, +77, of which roughly 45 are comment), `sw.js` (**v123 → v124**, one deploy — the second bump was budgeted and not needed).

**Documents:** `ai/AIContext.md`, `ai/archive/2026-09-03_1250_AIContext.md` (new), `ai/BUILD_NOTES.md`.

**No `DECLARATIONS.md` or `DECISIONS.md` change.**

## Next step

**2B.14.** Then **2B.15**, **2B.11**, **2B.12** · **2B.10**, **ALWAYS LAST** — and 2B.10 opens by writing the **three owed amendments** (2B.21's P9, 2B.17's P5, 2B.22's P9) in one batch.
⛔ **COMMIT FIRST.** Four files are outstanding.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`; `activeView` is not a global — read `.active-panel`. `state.selectedProspectId` and `detailProspectId` are two cursors. No routing, ever. `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window.** Inject the transition kill-switch after every reload **and after every theme toggle**. The theme button is **`#theme-toggle-btn`**, not `#theme-toggle`. `resize_window` does not work on this machine **and neither does `documentElement.style.zoom`** — A/B a viewport constant with an injected `!important` rule instead, which worked cleanly this session. **Both query surfaces stay DEFERRED — `renderAqInspectorDrawer()`, the `aq-insp-*` ids, the Audience Query Engine and `exportAqRecordsCSV()` are untouched; the AQ drawer's `openProspectModal()` call at ~9884 now inherits Save-and-Open's navigation, which is known and accepted.** `PROSPECT_DETAIL_TABS` is deliberately out of order versus P4. A native `<datalist>` popup freezes the renderer to CDP; one `navigate` clears it. **`el.dispatchEvent(new MouseEvent("click", …))` exercises the real shipped listener and never freezes CDP — prefer it to a real mouse click for functional proof, and keep real clicks for layout screenshots only.** **`wipeIndexedDB()` clears only the `files` store, NOT `handles`** — the backup-folder handle survives a full wipe.
