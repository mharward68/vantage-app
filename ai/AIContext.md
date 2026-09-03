# AI Context

**Updated:** 2026-09-03 10:36 (America/New_York) — session closed here.

**Last run:** Phase 2B / **Session 2B.17 — Identity block redesign.** Compartment: the prospect detail view's identity block only. Plan: `ai/phases/phase-2b-review-response-plan.md` **line 399** — ⚠️ **NOT** in `phase-2b-prospect-detail-view.md`, whose 2B.17 at line 711 is the **SUPERSEDED** scope.
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v122 → v123, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v123']`, `controlled: true`, after two full reloads) · `app.js` 16,860 → **17,052** / `index.html` 3,555 → **3,698** / `style.css` 4,765 → **4,862** · **console: `onlyErrors` returns NOTHING, twice**, once after a full reload plus a six-hub sweep · parked: prospect detail on Jane, Interactions tab, light theme, no modal, 6 companies / 4 prospects / 31 tasks · `localStorage` **28,941 bytes at open and 28,941 at close — byte-identical, no net data change** · git **NOT COMMITTED — this session had no shell on his machine.** BUILD_NOTES **§ Git, from a session with no shell** has the path; last known commit is 2B.21's `a549087` · deployed n/a.
**Estimate vs actual:** sized **L / ~10 min / Medium**. **It ran L and Medium was right** — nothing in the code surprised me; the two surprises were both in the *measuring*, not the building. **Michael's time: ~3 minutes** — one boot question block of four, nothing since.

**One-glance version tell:** open any contact. **First Name / Last Name / Seniority across the top in three, and a bordered CONFERENCE group above Notes.** If Email is still the third field, you are on v122.

## ⛔ THE P5 OVERRIDE — 2B.10 OWES A SECOND AMENDMENT. THIS HEADING IS WHERE TO FIND IT.

**Frozen contract P5 ("The identity block, and the single field writer", parent plan line 167) reads:** *"All **17 editable fields**, in the field order of `#modal-prospect`"* — and pins them in a numbered table: Seniority 7, Company 8, City/State/Metro 9–11, the conference fields 13–16.

**Session 2B.17 replaced that order with Michael's own sheet and added `address` and `zip`.** The block now holds **18 controls + the tag chooser = 19 fields**. Michael granted a **this-session override at boot** (the review-response plan's standing procedure, lines 326–345: name the contract, quote the line, ask before task 1, never mid-run).

⚠️ **P5 IS NOW FALSE AS WRITTEN.** The amendment 2B.10 owes is roughly: *"P5's field table is superseded by Michael's sheet of 2026-09-02, applied by Session 2B.17: 18 controls plus tags, in the sheet's order, with `address` and `zip` added. The single-writer clause is unchanged and still holds."* ⛔ **The single-writer half of P5 was NOT touched** — `commitProspectField()` is still the only writer and everything new routes through it. **This is the SECOND owed amendment; 2B.21's is the first and 2B.22 will owe a third (P9).** All three belong in one batch.

## What was done — the six plan tasks

1. **`PROSPECT_DETAIL_FIELDS` reordered to the sheet, `address` and `zip` added.** Still the ONLY enumeration; the fill loop reads it and the commit path reads `data-pd-key`.
2. **Two THREE-UP rows in a two-column base.** `.pd-row-3up` spans both tracks and re-divides into three — one scoped rule, exactly as the plan's task 2 called for. ⛔ **The count is PINNED, never `auto-fit`** (2B.3's lesson, and it still bites).
3. **`location`'s label was ALREADY "Metro"** in the markup — nothing to do. The stored key stays `location`.
4. **Notes pop-out built** (`#modal-pd-notes`). ⚠️ **Notes was NOT made taller** — see Assumption 2.
5. **LinkedIn renders as a link** — `#pd-linkedin-open` in the label row, `ensureUrlProtocol()`, hidden when empty. The input stays an input.
6. **Company URL built** as a read-only derived display (`#pd-company-url`) from `company.website`.

## Verified — real output, not a claim

**THE ROW MAP, read out of the LIVE DOM by grouping every `[data-pd-key]` control by its y-position. This IS his sheet:**

```
first-name | last-name | seniority          <- .pd-row-3up
title | company
email | phone
linkedin | address
city | state | zip                          <- .pd-row-3up
location
conference-name | conference-venue          <- inside the bordered <fieldset>
conference-start | conference-end
notes                                       <- .pd-span-2
```
(Associated Tags shares row 6 with Metro; it carries no `data-pd-key`, so it is absent from this map by construction — that is the P5 opt-in working, not a missing field.)

**ALL 18 CONTROLS COMMIT AND PERSIST — every one written through a real `change` event on the real control, read back from `state` AND from `localStorage`:**

```
ALL_18_COMMITTED: true      failures: []      PERSISTED_TO_LOCALSTORAGE: true
firstName -> 2B17-firstName      address  -> 2B17-address        conferenceName  -> 2B17-conferenceName
lastName  -> 2B17-lastName       city     -> 2B17-city           conferenceVenue -> 2B17-conferenceVenue
seniority -> VP                  state    -> 2B17-state          conferenceStart -> 2B17-conferenceStart
title     -> 2B17-title          zip      -> 2B17-zip            conferenceEnd   -> 2B17-conferenceEnd
companyId -> Stripe              location -> 2B17-location       notes           -> 2B17-notes
email     -> jane.smith@stripe.com
companiesBefore 6 -> companiesAfter 6      emailWarningHidden: true   companyMatchHidden: true
```
⚠️ **`companyId` and `email` were re-committed with their OWN current values on purpose** — a marker in either would have minted a company or tripped P6, neither of which is a layout test. Both still exercised their full branch.

**CONTRACT S1, MEASURED AFTER A FULL RELOAD at his real 1710×1178 viewport:**

```
panelH 1011   identityH 705   stripH 32   bodyH 250   (705 + 32 + 250 = 987)
panel computed height "1010.67px"  <- DEFINITE, not auto
bodyOverflowY "auto"   bodyScrollsItsOwnContent true   canvasBodyScrolls FALSE
```
**The tab body went 170 → 250px**, because the window this session measured at is taller than 2B.11's. **The identity block went 488 → 705px**, which is the real cost of two columns and is why the margin trim below exists.

**THE CARET SURVIVES REAL TYPING — actual keyboard input through the extension, not a dispatched event:**

```
Notes:      typed "Met at AV Summit. Follow up in October."
            activeElement "pd-notes"  caretAt 39  caretAtEndOfTypedText true
            record still ""  <- correct, commit is on change not input
            then clicked Job Title -> notes committed on REAL blur, persisted, inline box repainted
Job Title:  End, then typed ", Developer Relations"
            activeElement "pd-title"  valueInBox "Developer Advocate, Developer Relations"
            caretAt 39  caretAtEndOfTypedText true
```

**THE NOTES POP-OUT, ROUND TRIP:**

```
seededFromRecord true    (from p.notes, NOT from the inline box — an uncommitted
                          keystroke must never reach the database through here)
CANCEL:  cancelWroteNothing true
SAVE:    "  line one\nline two from the pop-out  "  ->  "line one\nline two from the pop-out"
         trimmedByTheWriter true   inlineBoxRepainted true   persisted true
```

**THE TWO DERIVED DISPLAYS, both branches:**

```
companyUrlText "stripe.com"  -> href "https://stripe.com"    (ensureUrlProtocol)
no company        -> "—"                     h 15.40px  muted
company, no site  -> "— no website on file"  h 15.40px  muted    constantHeight: true
linkedinHref "https://2B17-linkedin"   linkHiddenWhenEmpty true
```

| Check | Result |
| --- | --- |
| All six hubs + prospect detail | Every panel `active-panel`, before AND after a full reload |
| Console | **`onlyErrors` returns nothing, twice.** No warnings surfaced either |
| `node --check` / `check_ids.py` | Clean parse; `Missing IDs: {'export-backup-btn', 'restore-backup-input'}` — the baseline pair exactly |
| Jane restored | Every field back to 2B.21's values, in `state` AND `localStorage` |
| `localStorage` bytes | **28,941 at open, 28,941 at close.** No net data change |

## Assumptions logged this session

1. **THE SHEET'S ONE-FIELD-PER-LINE IS A FIELD ORDER, NOT A ROW COUNT.** Read literally it is ~14 full-width rows ≈ 1,040px against a panel that is 1,011px at his tallest window and 716px at his shorter one — the tab body would be **zero**, which is S1 failing. Michael chose the two-column reading at boot with those numbers in front of him. **Reverse it and S1 goes.**
2. ⚠️ **NOTES WAS NOT MADE TALLER, and the plan's task 4 asked for "taller, plus a pop-out."** The pop-out is the better half of that pair and the taller box is the half that costs the tab body 30–40px it does not have. `#pd-notes` stays at 76px. **One line to change if he disagrees.**
3. **`.pd-grid .form-group` margin-bottom cut 8px → 4px.** Nine rows instead of six; ~36px straight back to the tab body. Purely a vertical-budget trim.
4. **The old 1150px breakpoint is GONE, replaced by one at 900px.** The base is already two columns, so "drop to two" had nothing left to do. Below 900 all three grids collapse to one track together.
5. **`#pd-company-url` is ALWAYS in the DOM, even empty.** Hiding it would make the Job Title / Company row change height record to record — layout shift on a record view, Ladder rung 2.
6. **The conference group is a `<fieldset>`/`<legend>`, not a div plus a heading**, because that is what a labelled group of controls is. Its UA defaults are zeroed explicitly.

## Backup coverage — DIRECTIVES §4

**NO NEW STORE, NO NEW FIELD, NO NEW KEY. This session is UI only.** Every field it renders was already persisted and already covered: `address` and `zip` by 2B.21 (six columns in four writers, read by `restoreProspectsFromCSV()`), the rest since Phase 1. **`ensureStateDefaults()`, `wipeAllData()`, every CSV writer and the restore path are BYTE-UNCHANGED.** No new `localStorage` key, no new IndexedDB store.

**One ZIP landed in the real backup folder before any markup moved** (`queryPermission({mode:"readwrite"})` `"granted"`, 18 files total): **`vantage_data_backup_9-3-26_1023.zip` — 22,585 bytes, `PK` signature, nine `prm_*.csv` entries — the rollback point for this session.** No closing ZIP was taken because no data changed (28,941 bytes in, 28,941 out).

## Open items

- **⚠️ NEEDS YOUR EYES — three, all decided, all one-line reversible:**
  1. **Notes is 76px, not taller** (Assumption 2). The pop-out is why.
  2. **The two-column reading of your sheet** (Assumption 1). Everything else on the sheet is literal.
  3. **The em-dash under Company on a company with no website.** All six of your companies have one today, so you will not see it until the back-fill lands.
- ⚠️ **2B.10 NOW OWES THREE AMENDMENTS, NOT ONE** — 2B.21's P9, **2B.17's P5 (see the heading above)**, and 2B.22's second P9. One batch.
- ⚠️ **THE NARROW-WINDOW COLLAPSE WAS NOT VERIFIED AT A REAL NARROW VIEWPORT. I DID NOT RUN IT.** `resize_window` does not work on this machine and **`documentElement.style.zoom = "2"` FROZE THE RENDERER TO CDP** (one `navigate` cleared it, nothing was lost). The rule is confirmed present and parsed in the CSSOM — `(max-width: 900px) { .pd-grid, .pd-row-3up, .pd-conference-grid { grid-template-columns: minmax(0px, 1fr); } }` — and nothing more than that.
- ⚠️ **THE OLD "BREAKS S1 BELOW 1150px" ITEM IS NOT FIXED AND CANNOT BE FIXED BY A TRACK COUNT.** It is a HEIGHT problem wearing a width problem's clothes: one column is TALLER than two. At a 884px-tall window the identity block (705px) is larger than the panel (716px) with 32px of strip on top, so the tab body goes to zero. **Your 1178px window is fine — measured, 250px of tab body.** The honest fixes are all out of this compartment: fewer fields on screen, or a scrolling identity block (which S1 forbids).
- **⚠️ THE PRODUCTION DATABASE IS STILL NOT LOADED.** 4 prospects / 6 companies. The duplicate-domain report has still never run against a real duplicate cluster, and it is still the cheapest thing you can do next.
- **Still owed by you:** the **P8 revision** (gates 2B.15) · and **Finding 10d's meaning** in one word. ✅ **The ID layout design ARRIVED and is SHIPPED.**
- **⛔ THE IMPORT NOT WRITING `notes` IS DELIBERATE — ASKED AND ANSWERED 2026-09-03.** Not a defect. The only thing still open is the SHAPE: `ensureStateDefaults()` has no `p.notes` default, so imported records hold `undefined` where others hold `""`. Cosmetic, unowned. **BUILD_NOTES carries the full entry.**
- **`domain` IS STILL DISPLAYED IN EXACTLY ONE PLACE: the company modal** — plus the duplicate-domain report. ⚠️ **`#pd-company-url` shows `website`, NOT `domain`.** Anything reported about "the company domain" outside those two is about `website`.
- **Phase backlog:** the cosmetic `p.notes` shape default; the uniqueness guard on the company edit path; the snapshot chip display defect (`renderSnapshotHealthChip()` / `computeSnapshotState()`, and 2B.10's "confirmed green snapshot" gate is unsatisfiable as written); the headquarters duplication question needs the production database; ZIP restore reports 1 orphaned task on a round trip; `.col-resize-handle` keeps the stock cursor; the §4 back-fill of existing `"domain.com"` and slug rows, deferred to Phase 2C's collision report.
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist. Both `forceShowAll*` true blanks the directory. ✅ **"The four always-on conference boxes read as grey ghosts" is RETIRED — they are a bordered group now.** CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
- **Unchanged from Phase 1:** `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

**Code:** `app.js` (16,860 → **17,052**, +192, of which roughly 130 are comment), `index.html` (3,555 → **3,698**, +143), `style.css` (4,765 → **4,862**, +97), `sw.js` (**v122 → v123**, one deploy — the second bump was budgeted and not needed).

**Documents:** `ai/AIContext.md`, `ai/archive/2026-09-03_1036_AIContext.md` (new), `ai/BUILD_NOTES.md`.

**No `DECLARATIONS.md` or `DECISIONS.md` change.**

## Next step

**2B.22 — Add Prospect modal: field order, and Save and Open Contact.** `ai/phases/phase-2b-review-response-plan.md` line 449. **Size S.** Its blockers are gone: 2B.21 shipped the fields and 2B.17 shipped the sibling layout, so the modal now has a shape to match.
⚠️ **IT NEEDS A P9 WAIVER AND THE PLAN SAYS ASK FOR IT AT BOOT, NEVER MID-RUN** — 2B.22 *is* the modal redesign. **This session and 2B.21 both established the precedent; quote P9's `#modal-prospect` "untouched" clause, name the departure, ask for a this-session override, and record it under a heading 2B.10 will find.**
⚠️ **ITS TASK 2 IS THE DANGEROUS ONE:** removing Seniority means **twelve unguarded `getElementById(...).value` reads** point at fields being touched, and a missed one throws `Cannot read properties of null` and **the modal stops opening**. ⚠️ **And `saveProspect()` must NOT write `location: ""` on the edit branch** — it assigns every field unconditionally today, and his working database keeps geography ONLY in `location`. **Remove the markup AND the write.**

**Then 2B.14**, **2B.15**, **2B.11**, **2B.12** · **2B.10**, **ALWAYS LAST**.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`; `activeView` is not a global — read `.active-panel`. `state.selectedProspectId` and `detailProspectId` are two cursors. No routing, ever. `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window.** Inject the transition kill-switch after every reload. `resize_window` does not work on this machine **and neither does `documentElement.style.zoom` — it freezes the renderer to CDP.** **Both query surfaces stay DEFERRED — `renderAqInspectorDrawer()`, the `aq-insp-*` ids, the Audience Query Engine and `exportAqRecordsCSV()` (deliberately one column set behind) are untouched.** `PROSPECT_DETAIL_TABS` is deliberately out of order versus P4. A native `<datalist>` popup freezes the renderer to CDP; one `navigate` clears it. **Screenshot↔CSS scale this session: 0.75, and it is `devicePixelRatio` — read `devicePixelRatio` rather than eyeballing it, which is how this session wasted two clicks on the wrong element.** `window.alert = m => {…}` **and `window.prompt = () => "YES"`** both get through the extension's content filter. **`wipeIndexedDB()` clears only the `files` store, NOT `handles`** — the backup-folder handle survives a full wipe.
