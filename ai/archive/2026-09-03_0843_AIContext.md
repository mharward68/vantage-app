# AI Context

**Updated:** 2026-09-02 18:04 (America/New_York) — **session closed here** (amended after close: Michael reversed the `website` call, shipped as **v121**)

**Last run:** Phase 2B / **Session 2B.20 — Repair the company identity on import, and the duplicate-domain report.** Compartment: the CSV contact import (`importCSVContacts()`, both file routes) + one new read-only report surface. Plan: `ai/phases/phase-2b-review-response-plan.md` line 163 — **NOT** in `phase-2b-prospect-detail-view.md`.
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v118 → v121, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v121']`) · `app.js` 16,346 → **16,752** / `index.html` 3,515 → **3,555** / `style.css` **4,765, UNCHANGED — this session added no CSS** · **console: `onlyErrors` returns NOTHING, twice, across the whole session** · parked: dashboard, light theme, no modal, 6 companies / 4 prospects · user data **28,298 bytes, byte-identical to the pre-fixture reading** · git **unknown; there is still no shell on this machine, so ASK, do not assume** · deployed n/a
**Estimate vs actual:** sized **M / ~8 min / Medium**. **It ran M and the confidence was right** — the identity repair was not entangled with the id derivation (the plan's named fallback was never needed) and the only defect verification found was a plural. **Michael's time: ~2 minutes** — two questions answered at the top, one heads-up read mid-session.

**One-glance version tell:** DataHub, left card, under 📦 Run Backup / Export Options — a new **🔎 Duplicate Domain Report** button. On the sandbox it reports "Scanned 6 companies… None."

## ⚠️ WHAT HAPPENED TO "MICHAEL HARWARD", SETTLED BY ARITHMETIC — READ BEFORE DOUBTING THE BYTE COUNTS

**HIS WINDOW WAS STILL OPEN ~3 MINUTES INTO THIS SESSION AND IT WROTE ONCE**, at `lastMutationAt` 1788385367402 (21:42:47 UTC): **"Michael Harward" was deleted from ProspectHub.** That is exactly what 2B.18's Assumption 1 told him to do, so it is deliberate, not damage.

**The arithmetic is what settles it, and it is worth keeping because it is the general technique.** 2B.18 closed at **28,832** user-data bytes and recorded that record as **+394**. This session's first reading was **28,438 = 28,832 − 394**, while `state.prospects.length` in my already-loaded tab still said **5**. Both numbers were true: `raw` was fresh from his save, `state` was my tab's stale memory. **A disagreement between `state.X.length` and the parsed `localStorage` is the signature of a second window having saved since your page loaded** — and it is cheaper to check than to diagnose.

⛔ **THE STANDING PRE-FLIGHT STILL STANDS AND IT WAS ASKED THIS SESSION.** He answered "closed" and it was not yet closed. **Ask, and then also check the two numbers agree.**

**Consequence, already handled:** the pre-session ZIP taken at **17:43 was exported from `state`, so it contains 5 prospects.** It is a superset — a valid rollback point, not an honest snapshot of "now". **`vantage_data_backup_9-2-26_1747.zip` is the true 4/6 rollback point** and is the one to use.

## What was done — the six plan tasks

1. **`looksLikeDomain(v)`** — shape only: 2+ labels, alphabetic TLD of 2+, no whitespace. ⛔ **It deliberately does not know which TLDs exist and must not learn** — a hard-coded suffix list is wrong the day a new one ships, and `southland.church` is a real address.
2. **The repair, in `importCompanyIdentity(websiteVal, email, companyName)`** — one function, both import routes. Order: the sheet's website column if it survives junk-stripping → the row's email host unless free/junk → the placeholder.
3. ⛔⛔ **`companyId` DERIVATION IS UNTOUCHED AND WAS PROVED SO, NOT ASSERTED.** The old formula was transcribed verbatim and run beside the shipped import on the same ten rows: **10/10 MATCH, 0 mismatches.** Only the `domain` FIELD moved.
4. **No name reconciliation on import.** His explicit call.
5. **The duplicate-domain report** — `buildDuplicateDomainReport()` (pure) + `renderDuplicateDomainReport()` (DOM), in `app.js § 🔎 DUPLICATE-DOMAIN REPORT` immediately after `renderDataManagementView()`. Modal `#modal-domain-report`, button `#btn-open-domain-report`.
6. **Two sections, and that IS the design** — real identities in section 1; everything with no real identity in section 2, labelled as cleanup buckets, so the placeholder and slug clusters cannot bury the real findings.

**Silent junk-stripping** shipped as `IMPORT_JUNK_DOMAINS` (`domain.com`, `yourdomain.com`, `example.com/.org/.net`) plus everything `looksLikeDomain()` rejects — which is what catches `n/a`, `none`, `-` and every slug without listing them.

## ⚠️ THE TWO LANDMINES FOUND IN CODE I WAS ALREADY EDITING

**1. THE COMPANIES-FILE ROUTE DEFAULTED `domain` TO THE LITERAL STRING `"stripe.com"`.** `domain: domain || "stripe.com"` in route 1 of `importCSVContacts()`. Harmless while nothing read `domain` — **and 2B.18 made something read it.** Every website-less company from a companies sheet would have been handed Stripe's identity, making them the employer of every `@stripe.com` address in the file, retroactively, with no event to notice. **Fixed to the same identity function.** ⛔ `id: domain.toLowerCase() || …` on the line above still reads the RAW variable and must.

**2. A FOURTH COPY OF THE SLUG DERIVATION EXISTS AND WAS DELIBERATELY NOT TOUCHED.** `restoreProspectsFromCSV()` (~`app.js` 2289) carries the same `companyName → slug` lines. **It is the RESTORE path and it must reproduce what was exported, not improve on it** (BUILD_NOTES, same reasoning as `restoreCompaniesFromCSV()`). Grepping the slug regex now returns **two** hits, and only one of them is in scope for identity work.

## Verified — real output, not a claim

v121, `controlled: true`, transition kill-switch injected after every reload. **The first fixture block below is the v120 run, kept because it is what proves the `companyId` regression; the v121 block after it is the shipped `website` behaviour.**

**The pure branches, zero state mutation:**

```
looksLikeDomain:  spl-productions false | no-website:spl false | acme.com true
                  southland.church true | bbc.co.uk true | n/a false | none false
                  - false | "" false | "my company.com" false | domain.com TRUE (shape only)

placeholder:      SPL Productions -> no-website:spl      SPL Production   -> no-website:spl
                  SPL AV Production -> no-website:spl    Acme, Inc.       -> no-website:acme
                  The Anderson Group -> no-website:anderson
                  The Wilson Company -> no-website:wilson
                  A Better Sound     -> no-website:better      (the article skip, all three)
```

**The v120 import, a 10-row fixture through `importCSVContacts()` — every Done-when row.** ⚠️ Its `website` column is PRE-REVERSAL; see the v121 block below for what ships.

```
Spectra Productions  id=spectra-productions   domain=spectra-productions.com  website=(EMPTY)   slug -> EMAIL
Acme Widgets         id=acme-widgets.com      domain=acme-widgets.com   website=https://www.acme-widgets.com  REAL KEPT
Southland Church     id=southland-church      domain=no-website:southland     website=(EMPTY)   gmail -> PLACEHOLDER
SPL Production       id=spl-production        domain=no-website:spl           website=(EMPTY)
SPL Productions      id=spl-productions       domain=no-website:spl           website=(EMPTY)
SPL AV Production    id=spl-av-production     domain=no-website:spl           website=(EMPTY)   <- THE HEADLINE
Placeholder Co       id=yourdomain.com        domain=realhost.io              website=(EMPTY)   yourdomain.com STRIPPED
SPL Productions Ltd  id=spl-productions.com   domain=spl-productions.com      website=spl-productions.com
SPL Productions Ltd  id=spl-productions-ltd   domain=no-website:spl           website=(EMPTY)   christy@gmail NOT JOINED
Acme Widgets Inc     id=acme-widgets-inc      domain=acme-widgets.com         website=(EMPTY)
```

**`christy.weaver@gmail.com` listed against the existing "SPL Productions Ltd" (`spl-productions.com`) was NOT joined to it** — row 9 is its own record on `no-website:spl`. Domain is the only automatic key, exactly as he specified.

**THE v121 RE-RUN — the same 10-row fixture after the `website` reversal:**

```
Spectra Productions   domain=spectra-productions.com   website=spectra-productions.com   seeded
Acme Widgets          domain=acme-widgets.com   website=https://www.acme-widgets.com     SHEET WINS
Southland Church      domain=no-website:southland      website=(EMPTY)                   carve-out
SPL Production        domain=no-website:spl            website=(EMPTY)
SPL Productions       domain=no-website:spl            website=(EMPTY)
SPL AV Production     domain=no-website:spl            website=(EMPTY)
Placeholder Co        domain=realhost.io               website=realhost.io               junk fell through
SPL Productions Ltd   domain=spl-productions.com       website=spl-productions.com
SPL Productions Ltd   domain=no-website:spl            website=(EMPTY)
Acme Widgets Inc      domain=acme-widgets.com          website=acme-widgets.com          seeded
```

**"UNLESS THERE IS ALREADY A VALUE THERE", on rows that genuinely hit the existing-company branch (0 new companies created):**

```
(a) target already had a website : https://www.acme-widgets.com -> unchanged   PRESERVED true
(b) target's website was EMPTY   : (EMPTY) -> spl-production.com               FILLED true
    ...and its placeholder domain was NOT overwritten: no-website:spl -> no-website:spl
    companyIdentityDomain() for that record now resolves to spl-production.com
```

⚠️ **THAT LAST LINE IS AN EMERGENT REPAIR AND IT IS WORTH KNOWING.** A placeholder company whose `website` later gets filled by any contact with a real address becomes **matchable again for free**, because `companyIdentityDomain()` falls back to a normalised `website` when `domain` is not a real host. The placeholder keeps its cleanup-bucket grouping in the report *and* the company starts matching by email. Nothing was written to make this happen — it falls out of the 2B.18 fallback meeting the v121 seed.

**THE REGRESSION THAT MATTERS — old formula vs shipped, same ten rows:**

```
MATCH  spectra-productions      MATCH  acme-widgets.com     MATCH  southland-church
MATCH  spl-production           MATCH  spl-productions      MATCH  spl-av-production
MATCH  yourdomain.com           MATCH  spl-productions.com  MATCH  spl-productions-ltd
MATCH  acme-widgets-inc
allIdentical: true    mismatches: 0
```

**The report on the fixture:**

```
scanned 16
DUPLICATES:  acme-widgets.com -> 2 names, 2 records: Acme Widgets (1) / Acme Widgets Inc (1)
NO IDENTITY: no-website:spl [import placeholder (2B.20+)] 4 records:
             SPL AV Production / SPL Production / SPL Productions / SPL Productions Ltd
             + 1 singleton, counted not listed
```

⚠️ **NOTE WHAT PRODUCED THAT DUPLICATE: the repair itself.** "Acme Widgets Inc" arrived as a slug and only became visible as a duplicate of "Acme Widgets" once its `domain` was repaired from its email. **The report will find MORE on his real data after this ships than before, and that is the feature working, not new damage.**

**READ-ONLY, measured with no navigation inside the window:**

```
before {companies 16, prospects 14, rawBytes 35081, companiesJSON 5828, prospectsJSON 6172}
after  {companies 16, prospects 14, rawBytes 35081, companiesJSON 5828, prospectsJSON 6172}
IDENTICAL: true
```

⚠️ **The first attempt at this check read `unchanged: false` on a +6-byte drift and it was MY instrumentation** — `switchView("data-management")` calls `saveState()` and moves `activeView` from "prospects" (9) to "data-management" (15). BUILD_NOTES already records this. **Do not navigate inside a byte-comparison window.**

**Rollback, exact:**

```
rawBytes 28437  ==  pre-fixture 28437     matchesPreFixture: true
companies Stripe / Vercel / Figma / Notion / Airbnb / Your AV Department
prospects Jane Smith / Alex Rivera / Sarah Chen / Marcus Vance
__2b20_guard REMOVED   localStorage keys: vantage_sidebar_pinned, vantage_prm_database
```

| Check | Result |
| --- | --- |
| All six hubs | Every panel `active-panel` after the sweep |
| Console | **Zero errors, twice.** One WARNING is the shipped defence working: `[Snapshot] Ignoring 1 zero-byte snapshot file(s)`, then `Pruned 1 file(s) — 1 zero-byte, 14 kept` |
| `node --check` / `check_ids.py` | Clean parse; `Missing IDs: {'export-backup-btn', 'restore-backup-input'}` — the baseline pair exactly |
| Parked | Dashboard, light theme, no modal, 6 companies / 4 prospects |

**Screenshots in chat:** the report on the fixture showing both sections · the report on the clean sandbox showing the empty branch.

## Assumptions logged this session

1. **The plan's task 2 says "leave `domain` EMPTY" for a free host; the placeholder section says `no-website:<firstword>`. THE PLACEHOLDER WINS ON THE IMPORT.** Task 2's "empty" means "do not write gmail.com"; the placeholder section is the later, more specific rule and is explicitly import-only. ⛔ Hand-entered records still get an empty domain — 2B.18/2B.19 are unchanged.
2. ⚠️ **REVERSED BY MICHAEL AFTER THE CLOSE, AND THE SHIPPED BEHAVIOUR IS THE REVERSAL (v121).** The first pass left `website` empty on the email branch. He asked for: *"I want domain to write to website unless there is already a value there."* **A REAL derived host now goes into BOTH fields.** ⛔ **The `no-website:` placeholder still NEVER reaches `website`** — proved, not argued: `ensureUrlProtocol("no-website:spl")` returns **`https://no-website:spl`**, a live broken link on the company card, where `ensureUrlProtocol("acme-widgets.com")` returns a working `https://acme-widgets.com`. His own rule, same day: "Domain is the data. Website is the display." **"Already a value" lives in two places** — this function never overwrites the sheet's own website column, and the existing-company branch writes only into an EMPTY `existing.website`. Junk is not a value: a discarded `yourdomain.com` falls through and the real host lands in both.
3. **THE EXISTING-COMPANY BRANCH REPAIRS ONLY AN EMPTY `domain`/`website`**, following the `if (!existing.x && x)` idiom every other line in that branch uses. Overwriting a non-empty stored value during an import is a **DIRECTIVES §4 change to existing data** and needs its own decision and rollback plan. **Existing placeholders, `"domain.com"` rows and pre-2B.20 slugs are untouched and are what the report is FOR.**
4. **The article skip is `the` / `a` / `an`** (Michael answered at the top of this session).
5. **A BUTTON IN DATAHUB, THE REPORT IN A MODAL.** `#view-data-management` is a two-column `.dashboard-split-grid` with `grid-auto-rows: minmax(0, 1fr)`; **a third card creates a second row and halves both existing cards**, breaking the one-screen contract for a tool run occasionally. The backup-options button beside it is the same pattern. Rung 1.
6. **Unresolved SINGLETONS are counted, not listed** — otherwise section 2 becomes a reprint of the companies directory.
7. **Section 1's threshold is 2+ RECORDS, not 2+ names**, with `nameVariants` saying which kind it is. Two records of the same name on one domain is a duplicate record and he wants to see it too.

## Backup coverage — DIRECTIVES §4

**`state.companies[].domain` and `.website` ARE WRITTEN by this session, on the import path only. COVERED.** Both are existing fields already in the ZIP bundle — `Domain` is column 3 of `prm_companies.csv` and `website` is beside it. **NO NEW STORE, NO NEW FIELD, NO NEW KEY. `wipeAllData()` needs no edit. `ensureStateDefaults()` needs no entry. The report writes nothing at all.**

**Two ZIPs landed in the real backup folder this session**, both listed by reading the `backupFolder` handle directly, `queryPermission({mode:"readwrite"})` **`"granted"`**: `vantage_data_backup_9-2-26_1743.zip` (pre-session, but exported from a 5-prospect in-memory state — a superset) and **`vantage_data_backup_9-2-26_1747.zip`, the true 4/6 rollback point.**

## Open items

- ✅ **ANSWERED AFTER THE CLOSE: the `website` seed.** See Assumption 2 — shipped in v121, verified, docs corrected. The one thing carved out of his instruction is the placeholder, on the broken-link evidence above.
- **⚠️ NEEDS YOUR EYES — three, all decided, all one-line reversible:**
  1. **The report's two-section layout and its wording**, especially "NO REAL IDENTITY — CLEANUP BUCKETS, NOT DUPLICATES". The plan asked whether those groups should be listed at all or just counted; **shipped as: clusters listed, singletons counted.**
  2. **The button label 🔎 Duplicate Domain Report and its placement** under Run Backup / Export Options.
  3. **The existing-company branch repairs only EMPTY fields** (Assumption 3) — the back-fill of existing bad rows is still unowned and still a §4 decision.
- **⚠️ THE PRODUCTION DATABASE IS STILL NOT LOADED.** 4 prospects / 6 companies. **The report has never been run against a real duplicate cluster** — its whole value is unmeasured, and running it on the production import is the single cheapest thing he can do next.
- **⚠️ CLOSE YOUR VANTAGE WINDOW — AND THE SESSION SHOULD VERIFY THAT IT IS CLOSED, NOT JUST ASK.** See the top of this file.
- **⚠️ THE IDENTITY BLOCK STILL BREAKS CONTRACT S1 BELOW 1150px CANVAS WIDTH.** 2B.17's.
- **⚠️ DECLARATIONS AMENDMENTS PROPOSED, NOT APPLIED** — the batch 2B.10 owes: the P4 order, the seventh view panel, the line-count reconciliation, the field-semantics line, and 2B.18's `resolveCompanyByName()` line. **"Six hubs" stays true and must not be edited to say seven.** ⚠️ **2B.20 adds one:** *"The CSV import repairs a company's `domain` on the way in and writes `no-website:<firstword>` when no host can be derived. `companyId` is unchanged."*
- **Still owed by you:** the **P8 revision** (gates 2B.15), the **ID layout design** (gates 2B.17), and **Finding 10d's meaning** in one word.
- **`domain` IS STILL DISPLAYED IN EXACTLY ONE PLACE: the company modal** — plus, now, the report. Anything a user reports about "the company domain" outside those two is still about **`website`**.
- **Phase backlog:** the uniqueness guard on the company edit path; the snapshot chip display defect (`renderSnapshotHealthChip()` / `computeSnapshotState()`, and 2B.10's "confirmed green snapshot" gate is unsatisfiable as written); the headquarters duplication question needs the production database; ZIP restore reports 1 orphaned task on a round trip; `.col-resize-handle` keeps the stock cursor; **the §4 back-fill of existing `"domain.com"` and slug rows, deliberately deferred to Phase 2C's collision report — which this report now feeds.**
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist. Both `forceShowAll*` true blanks the directory. `pros-sarah` carries no `conference*` keys. The four always-on conference boxes read as grey ghosts. CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
- **Unchanged from Phase 1:** `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

**Code:** `app.js` (16,346 → **16,752**), `index.html` (3,515 → **3,555**), `sw.js` (**v118 → v121**; three deploys — a plural, then Michael's `website` reversal after the close). **`style.css` UNCHANGED at 4,765 — this session added no CSS at all**, the report reuses existing tokens and inline styles in the house idiom of that markup.

**Documents:** `ai/AIContext.md`, `ai/archive/2026-09-02_1751_AIContext.md` (new), `ai/BUILD_NOTES.md`.

**No `DECLARATIONS.md` or `DECISIONS.md` change.**

## Next step

**2B.14 — Include semantics: OR within a picker, AND across pickers.** `ai/phases/phase-2b-review-response-plan.md`. ⚠️ **TWO FUNCTIONS, NOT ONE** — `matchesIncludeExclude` and `matchesIncludeExcludeSmart`; change one and Title silently keeps AND. ⚠️ **It needs the MediaHub/CampaignHub cross-compartment decision, or those two hubs stay behind and disagree.** ⚠️ It reverses behaviour 2B.9 verified and shipped — a decision, not a regression.

**Then 2B.15** (needs the P8 revision) · **2B.17** (needs the layout design) · **2B.10**, **ALWAYS LAST**.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`; `activeView` is not a global — read `.active-panel`. `state.selectedProspectId` and `detailProspectId` are two cursors. No routing, ever. `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window.** Inject the transition kill-switch after every reload. `resize_window` does not work on this machine. **Both query surfaces stay DEFERRED — `renderAqInspectorDrawer()`, the `aq-insp-*` ids and the Audience Query Engine are untouched.** `PROSPECT_DETAIL_TABS` is deliberately out of order versus P4. A native `<datalist>` popup freezes the renderer to CDP; one `navigate` clears it. **Measure the screenshot↔CSS scale each session — 0.912 here, 0.433 last session, same machine.** **`window.alert = m => {…}` DID get through the extension's content filter this session** — that is what made the import testable at all.
