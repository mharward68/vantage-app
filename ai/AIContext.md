# AI Context

**Updated:** 2026-09-02 12:27 (America/New_York)
**Last run:** Phase 2B / **Session 2B.13 — Company duplication: the website seed and the autocomplete.** Compartment: the company create path. Review Findings 10a + 10c. **Ran under Michael's authorised cross-compartment exception, granted at boot (full scope: both company inputs).**
**State:** `node --check app.js` clean and `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v110 → v111, CONFIRMED LIVE** (`caches.keys()` `['vantageprm-cache-v111']`, `controlled: true`) · `app.js` 15,226 → **15,312** / `index.html` 3,442 → **3,447** / `style.css` **4,739 unchanged** · **console is 5 lines per boot, all green, ZERO RED** · **user data byte-identical at 27,959** · git state UNKNOWN — still no shell on this machine, eighth session running · deployed n/a
**Estimate vs actual:** sized **M / ~6 min / High**; ran **M**, on plan for the code and **over on verification**. **Michael's time was ~2 minutes** — one two-question block at boot, answered in one pass, nothing after. The code is ~15 lines of substance; the cost was proving a **native datalist popup** on screen, which cannot be screenshotted and froze the renderer once.
**One-glance version tell:** open any prospect, click into **Company**. There is now a **▾ at the right edge of the field** and typing offers the companies that already exist. Same in ProspectHub's Add Prospect modal. Second tell: add a prospect with an email and a new company name — the company it creates now has a **website**, not an empty string.

## What was done

**Finding 10a — the website seed.** `resolveCompanyByName()` derived the email host **once** into `emailHost` and now seeds `website` from it. `domain` keeps its `"domain.com"` placeholder fallback **verbatim** — it is a CSV column, exported by the backup writer and searched by the company filter, so changing it is a restore-compatibility change and was explicitly out of bounds.

**THE PLACEHOLDER IS DELIBERATELY NOT COPIED INTO `website`.** A company created with no email still gets `domain: "domain.com"` and gets `website: ""`. Copying the placeholder across would be worse than empty: **domain.com is a real registered domain**, so 2B.17's read-only company-URL display would render a live link to a stranger's site on every company created without an email. DIRECTIVES Ladder rung 2 — the surface never lies about state.

**Finding 10c — the autocomplete.** `syncCompaniesDatalist()` is new, filed beside `getCompanyName()`. It rebuilds `#companies-datalist` from `state.companies`, sorted, and is called from **`openProspectModal()`** (above the id branch, so **edit gets it too** — an edit is exactly where somebody retypes a name and forks the record) and from **`renderProspectDetailIdentity()`**. `#pd-company` gained `list="companies-datalist"` in `index.html`.

**ONE DATALIST, TWO INPUTS, AND THE SHARING IS THE POINT.** `#companies-datalist` lives inside the create modal's markup; a `<datalist>` resolves by id from anywhere in the document and is never itself rendered, so the detail view's input reaches it across the DOM even while the modal is hidden. Do not clone a second list next to the detail view — two lists is how they drift.

## Verified — real output, not a claim

Run on Michael's Chrome via the extension against `http://localhost:5000` at v111, `controlled: true`, transition kill-switch injected after every reload, `document.getAnimations().length` **0** before every measurement.

**FINDING 10a, through the shipped create path** — the real `#modal-prospect`, the real `saveProspect()`:

```
websiteIsEmpty:          false
websiteEqualsEmailHost:  true
websiteEqualsDomain:     true
websiteSegments:         ["acmewidgets", "example"]
domainSegments:          ["acmewidgets", "example"]
oldSeedWouldHaveBeen:    empty string
```

**The no-email branch, through the same resolver:** `{ website: "\"\"", domain: "domain.com" }` — empty, not the placeholder, as designed.

**Company count across a create:** `before {prospects: 4, companies: 5}` → `after create {prospects: 5, companies: 6}` → `after rollback {prospects: 4, companies: 5}`. Exactly one company per create, no stray record.

**FINDING 10c, both inputs:**

| Check | `#pros-company` | `#pd-company` |
| --- | --- | --- |
| `list` attribute | `companies-datalist` | `companies-datalist` |
| `input.list === datalistElement` | **true** | **true** |
| Options on open | `["Airbnb","Figma","Notion","SPL Group","SPL Media Services","SPL Productions","Stripe","Vercel"]` | same eight |
| Offered for `SPL` | `["SPL Group","SPL Media Services","SPL Productions"]` | same three |

**⚠️ THE SPL RECORDS WERE SYNTHETIC AND I AM SAYING SO RATHER THAN IMPLYING OTHERWISE.** Michael's real SPL duplicates are in the **production import, which is not the database that boots here**. Three `syn-spl-*` companies were injected under the 2B.11 rollback pattern, used, and swept. Residue check after the sweep and a reload: `indexOf` for `syn-`, `SPL`, `ZZTEST`, `Seedtest`, `acmewidgets` all **-1**.

**THE SCREENSHOT EVIDENCE IS THE AFFORDANCE ARROW, NOT THE DROPDOWN — the dropdown cannot be captured at all (see BUILD_NOTES).** The decisive shot is a **control on one field**: `#pd-company`, same focus state, list populated vs list emptied.

| `#companies-datalist` | `#pd-company` renders |
| --- | --- |
| 5 options | **▾ arrow at the right edge** |
| 0 options | no arrow |

That is this session's before/after, because the datalist was empty in **every** prior version. Four screenshots in chat: the modal field with the arrow, the detail field with the arrow, the emptied-list control, and the 3× crop of the pair.

| Check | Result |
| --- | --- |
| All six hubs | Every panel `active-panel` after a reload |
| Console, two boots | **5 lines each, all green, zero red.** Database loaded · IndexedDB connected · SW registered · `[Snapshot] Boot: … vantage_snapshot_2026-09-02_121548.json` · Mirror daily |
| `node --check` / `check_ids.py` | Re-run against the **committed device copies**: clean parse; `Missing IDs: {'restore-backup-input', 'export-backup-btn'}` — the baseline pair exactly |
| Rollback | `pros-jane, pros-alex, pros-sarah, pros-marcus` and `comp-stripe, comp-vercel, comp-figma, comp-notion, comp-airbnb` — the originals, in order |
| Cleanup | Datalist restored **by calling the shipped `syncCompaniesDatalist()`**, not by hand-rebuilding it. Theme light as booted, parked on dashboard |

## Assumptions logged this session

1. **THE EXCEPTION WAS NARROWER THAN THE PLAN ASSUMED, AND I SAID SO BEFORE ASKING.** The plan calls the whole session "outside 2B." Only the `#pros-company` half is — the seed lives in `resolveCompanyByName()`, which is **P5's own extraction inside the detail-view block**. Michael was given that correction and granted the **full** scope anyway.
2. **THE PLACEHOLDER IS NOT SEEDED INTO `website`** (above). Reversible in one word if he ever wants `domain.com` there; he will not.
3. **REBUILT ON EVERY OPEN, NOT CACHED AND INVALIDATED.** Companies are created by import, by the modal, and by the detail view, so a cache needs three hooks to stay honest and is wrong the first time a fourth appears. At five companies the rebuild is free; at a few thousand it is one pass and a sort against a user about to spend seconds typing.
4. **THE `<datalist>` STAYS PHYSICALLY INSIDE THE MODAL.** Moving it to `<body>` would have been tidier and is a markup change with no behavioural gain — id resolution already works across the DOM, and it was verified (`input.list === dl` from the detail view, with the modal hidden).
5. **THE CREATE TEST DROVE `saveProspect()` DIRECTLY AFTER FILLING THE REAL MODAL'S INPUTS**, rather than clicking Save with the mouse. Same function the button calls; the modal was genuinely open and populated. Saying it plainly because it is one step short of a full mouse path.

## Backup coverage — DIRECTIVES §4

**`state.companies` IS MODIFIED by this session's code** — new companies now carry a populated `website`. **COVERED** by the ZIP bundle: `website` is an existing exported column and no new field, store or key was introduced. `wipeAllData()` needs no edit.

**The mandatory pre-session ZIP was taken and landed in the real backup folder** — `vantage_data_backup_9-2-26_1214.zip`, 22,160 bytes, `saveBackupFile()` returning `wroteToFolder: true` (not the download fallback).

**No existing company was altered.** Back-filling their empty `website` from `domain` was put to Michael and **DECLINED** — it stays a §4 decision needing its own rollback plan.

## Open items

- ✅ **RESOLVED SAME DAY — the arrow goes, the type-ahead stays.** Michael asked for exactly that. `::-webkit-calendar-picker-indicator { display: none }` scoped to the two ids does it, **tested live 2026-09-02**: no arrow, filtering and scrolling intact. **It ships in 2B.18, not here.**
- **⚠️ NEEDS YOUR EYES (2B.18) — the suggested company name's format**, once, on a hyphenated domain. `spl-productions.com` → "Spl Productions" is what the rule gives.
- **⚠️ REGRESSION SINCE 2B.16 — the snapshot chip reads "Not protected" again**, red, in every screenshot this session, while `[Snapshot] Boot:` names a file from **today at 12:15:48** and the ZIP wrote to the folder successfully. 2B.16 recorded this as resolved. It is not. **This re-blocks the "confirmed green snapshot" gate on 2B.10.** Nothing was changed to cause it; treat it as the File System Access permission lapsing again between sessions.
- **⚠️ Carried, still unanswered:** whether the ProspectHub tag filter should offer exclude at all (2B.9); the picker's purple and whether "+ Add" is the right verb; 2B.7's duplicate-email warning wording; 2B.8's twelve default column widths, its purple and its 6px resize zone; 2B.11's geography placeholder wording; 2B.12's cursor artwork in dark mode; 2B.16's disclosure-arrow placement; and the four cosmetics from 2B.4/2B.5.
- **⚠️ P4 AMENDMENT STILL PROPOSED, NOT APPLIED** (2B.16). Unchanged by this session.
- **⚠️ THE IDENTITY BLOCK STILL BREAKS CONTRACT S1 BELOW 1150px CANVAS WIDTH.** Belongs to 2B.17.
- **⚠️ THE PRODUCTION DATABASE IS STILL NOT LOADED.** 4 prospects / 5 companies. **This session could not see a single real duplicate** — the whole reason 10c exists is invisible in the sandbox. 2B.11's geography parity numbers also remain unreproduced.
- **Still owed by you:** the **P8 revision** (gates 2B.15), the **ID layout design** (gates 2B.17), and **Finding 10d's meaning** in one word. **The cross-compartment exception is GRANTED, full scope** — it cleared 2B.13, 2B.14 and 2B.18.
- **⚠️ THERE IS A THIRD COMPANY-CREATION PATH AND NEITHER 2B.13 NOR 2B.18 ENTERS IT.** The CSV contact import (`app.js` ~12566) builds the company id from the sheet's own website/domain column, or **slugifies the company name** when there isn't one, then writes `domain: p.companyId` and `website: website || p.companyId`. **It never reads the prospect's email.** Import a sheet with no website column and every company gets a slug where its URL should be. Found 2026-09-02 while diagnosing Michael's report. **Phase 2C, beside Finding 10b** — it is a different compartment and a different shape of fix.
- **`domain` IS DISPLAYED NOWHERE IN THE APP.** Not the Company tab grid, not `COMPANIES_COLUMNS`, and the Edit Company modal writes `website` and never touches `domain`. Anything a user reports about "the company domain" is about **`website`**. Worth knowing before chasing the wrong field.
- **Phase backlog:** the headquarters duplication question needs the production database; ZIP restore reports 1 orphaned task on a round trip of an untouched database; `.col-resize-handle` keeps the stock cursor. **New:** existing companies' empty `website` — a §4 back-fill decision, deliberately deferred.
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist. Both `forceShowAll*` true blanks the directory. `pros-sarah` carries no `conference*` keys. The four always-on conference boxes read as grey ghosts. CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. **`.gitignore` snapshot-glob gap — one line, `vantage_snapshot*`, still NOT fixed.** `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`.
  **`#companies-datalist` is no longer dead markup — it is filled. Remove that line from any list of fossils.**
- **GIT STATE IS UNKNOWN.** No shell on this machine; the bridge writes files and cannot run anything.
- **Unchanged from Phase 1:** two Vantage windows overwrite each other; `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Files changed

`app.js` (15,226 → **15,312**), `index.html` (3,442 → **3,447**), `sw.js` (**v110 → v111**), `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/archive/2026-09-02_1227_AIContext.md` (new). **`style.css` UNTOUCHED — 4,739 both ends.** `index.html`'s two-session untouched run **ends here**, by five lines.

**⚠️ A DECLARATIONS AMENDMENT IS NOW PROPOSED AND NOT APPLIED**, joining the batch 2B.10 already
owes. One Conventions line: *"A company's `domain` is its identity — a normalised bare host,
unique. `website` is free-form display. There is no `url` field."* Michael settled this 2026-09-02;
it is not in force in `DECLARATIONS.md` until he applies it there.

**No other `DECLARATIONS.md` or `DECISIONS.md` change.** 2B.10 still owes the seventh-view-panel amendment and the line-count reconciliation; **"six hubs" stays true and must not be edited to say seven.** The P4 order amendment is still in that batch.

## Next step

**2B.19 — Add Company: the front door, and the domain normaliser.** Then **2B.18**, then 2B.14.
Both are in `ai/phases/phase-2b-review-response-plan.md`. **Nothing is owed before 2B.19 starts.**

**⚠️ WHY 2B.19 EXISTS, AND IT IS NOT THE BUTTON MICHAEL ASKED FOR — IT IS WHAT ASKING FOR IT
UNCOVERED. VANTAGE CANNOT CREATE A COMPANY.** `openCompanyModal()` alerts *"Please save the prospect
first to create the company record"* on any id that does not resolve; `editingCompanyId` is assigned
in **exactly one place**, always to an existing id; `saveCompany()` opens `if (!editingCompanyId)
return;`. **Every company is a side effect** — of a prospect form, the CSV import, or a restore. **A
human's only route is typing a name into a prospect, the fork-prone path. That is the mechanism
behind the four `SPL` records.** The front door is duplicate prevention, not convenience.

**MICHAEL'S DECISIONS, 2026-09-02 — recorded, do not re-open:**

1. **`domain` IS THE COMPANY'S IDENTITY.** Normalised bare host, unique, and what an email domain
   matches against. **`website` is free-form display.** **There is no `url` field.**
2. ⚠️ **NORMALISATION IS CONSERVATIVE.** Lowercase, strip scheme, a leading `www.`, port, path,
   query, fragment, trailing dot — **then keep every remaining label.** He asked for "always
   `domain.suffix`" and **changed his mind when shown that two labels turns `bbc.co.uk` into
   `co.uk`**, collapsing every UK company onto one identity. Correct multi-part handling needs the
   Public Suffix List — a **§4 new dependency**. **The accepted cost is a MISS
   (`mail.acme.com` ≠ `acme.com`), never a silent MERGE. Collapsing labels later is reintroducing a
   rejected failure, not an improvement.**
3. **One match + blank box → link silently. One match + a different typed name → WARN AND ASK.
   Two or more → show them and let him pick.** (2B.18)
4. ⚠️ **The company fill fires on EMAIL BLUR, not at Save** — *"I want the company name to get
   entered immediately after I enter the email address."* Save-time-only is not what he asked for.

**2B.19 also builds `normaliseDomain()`, which 2B.18 consumes — do not write a second copy** — adds
the missing **`#comp-domain`** input (the modal has fourteen fields and no domain field), and puts a
**`+ Add Company`** button on ProspectHub's companies directory. Its two traps are in the plan:
`saveCompany()` unconditionally writes into the **prospect** modal's Company box, and the modal is
shared with edit so a create branch must blank all fourteen fields from an explicit list.

**His stated goal:** *"Eventually, there should be no different companies sharing the same domain."*
**2B.19 and 2B.18 stop NEW ones. Neither merges existing ones** — that is Finding 10b, **now keyed on
`domain`, not `website`**, in Phase 2C with a collision report before enforcement. **That report will
show huge false clusters** around the `"domain.com"` placeholder and around CSV-import slugs; expect
them.

⛔ **NO ONLINE LOOKUP.** CORS blocks reading another site's page, so it needs a third-party API — a
**§4 new dependency** whose key would sit in client-side JS in a **PUBLIC repo**. **Phase 4**, on a
Cloud Function. He accepted this. Do not revive it.

**⚠️ THE PLACEHOLDER IDENTITY — IMPORT ONLY (Michael, 2026-09-02).** On a CSV import, when no usable
domain can be derived, `domain` gets **`no-website:<first word of the company name>`** (leading
articles skipped) and **`website` is left EMPTY** — *"Domain is the data. Website is the display."*
**COMPANIES SHARING A FIRST WORD DELIBERATELY SHARE ONE PLACEHOLDER** — *"10 SPL people using 3
different versions… I want those grouped so I can manually clean them up."* **It is a cleanup
bucket, not an identity assertion; a later session that makes it "more precise" from the full name
destroys the feature.**

⛔ **A HAND-ENTERED PROSPECT NEVER PRODUCES A PLACEHOLDER**, and this reverses an earlier draft.
*"A real example could be a Conference Direct person I am working for on behalf of a national
association. I want the person attached to the association not Conference Direct."* **An email
domain is not necessarily an employer.** When he picks a company, it links — any domain, blocked or
not, matching or not, no warning. A company with no usable domain gets an **empty** `domain`, which
he can see and fix.

⛔ **NOTHING A PROSPECT'S EMAIL TOUCHES MAY EDIT AN EXISTING COMPANY** — *"I don't want any blocked
or unresolved domains affiliated with any existing companies."* An email seeds a company only when
**all three** hold: the company's `domain` is empty, **this prospect is its only contact**, and the
host is not blocked. That reaches the company just created on the same form — the whole of the
reported bug — and nothing else. **Reversible, logged, on the Needs-his-eyes list.**

**Automatic linking keys on the DOMAIN ONLY** — `christy@gmail.com` against an existing "SPL
Productions" is NOT auto-joined, because name matching is what made the four SPLs. **A human
explicitly picking from the autocomplete still resolves by name, and always wins.**

**Then 2B.20 — repair the company identity on import, plus the duplicate-domain report.** Michael,
2026-09-02: the import writes `domain: p.companyId`, a **slug** whenever the sheet has no website
column, and never reads the email. 2B.20 replaces a non-domain `domain` with the row's email host
(empty if that host is on the blocklist), does **no** name reconciliation on import, and adds a
**manually triggered, read-only report** listing domains carrying two or more company names.
⚠️ **`companyId` derivation MUST NOT CHANGE** — it is the record id prospects point at, while
`domain` is the business identity; they hold the same string today and are not the same concept.
Changing it orphans every link. **That report is Finding 10b's collision report**, pulled into Phase
2B as a manual tool; 10b's enforcement half stays in 2C.

**Then 2B.14** (include semantics — TWO functions, or Title silently keeps AND) · **2B.15** (needs
the P8 revision, after 2B.14) · **2B.17** (needs his layout design) · **2B.10**, **ALWAYS LAST**.

**⚠️ Backup points: a ZIP before 2B.19** (first session that can create companies directly) **and
before 2B.18** (it writes `companyId` on prospects). **A ZIP and a confirmed green snapshot before
2B.10.** The chip is red again, so that gate is NOT currently checkable.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`, and `activeView` is not a global — read the active panel from `.active-panel`. `state.selectedProspectId` and `detailProspectId` are two cursors and do not converge in this phase. No routing, ever. `switchView()` calls `saveState()`. Inject the transition kill-switch after every reload. `resize_window` does not work on this machine and `computer.zoom` times out — clone into an overlay, or crop the capture afterwards. **Both query surfaces stay DEFERRED — `renderAqInspectorDrawer()`, the `aq-insp-*` ids and the Audience Query Engine are not touched, and the Engine's geography matcher is DELIBERATELY out of step with ProspectHub's; do not port.** `PROSPECT_DETAIL_TABS` is deliberately out of order versus P4, and the disclosure pattern must NOT be applied to the four conference fields. **New: a native `<datalist>` popup freezes the renderer to CDP exactly like a native dialog, and one `navigate` clears it — see BUILD_NOTES before driving either company input from a script.**
