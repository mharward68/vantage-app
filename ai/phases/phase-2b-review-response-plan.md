# Phase 2B — Review-Response Session Plan (2B.11 – 2B.17)

**Planned:** 2026-09-01, from `ai/phases/phase-2b-REVIEW-FINDINGS.md` (pass closed the same day)
**Parent plan:** `ai/phases/phase-2b-prospect-detail-view.md` — frozen contracts P1–P9 live there
**Run sheet:** `ai/phases/phase-2b-RUNSHEET.md`, Step 2B

> Phase-plan Assumption 8: review-driven sessions take **2B.11 and up** and run **before 2B.10**,
> which keeps its number and always runs last. This file is that list.

---

## What the review pass produced

Fifteen findings, one withdrawn (13), one unverified (deleting a prospect). **Only nine belong to
Phase 2B.** The rest are a data-quality theme that surfaced here because that is when Michael was
looking, not because they belong to this phase — they go to **Phase 2C**, listed at the end.

**Do not widen 2B to absorb them.** The compartment discipline is what has kept this project's
sessions sized honestly; spending it on a convenient catch-all is how phases stop meaning anything.

---

## Session order

```
2B.11  Filter column       (UI,   M)  — geography + widths        ✅ DONE 2026-09-02
2B.12  Resize cursor       (UI,   S)  — cursor + drag guard       ✅ DONE 2026-09-02
2B.13  Company dup guard   (DATA, M)  — website seed + datalist   ✅ DONE 2026-09-02
2B.14  Include semantics   (UI,   M)  — OR within a picker        ✅ DONE 2026-09-03
2B.15  Tag filter pop-out  (UI,   M)  — after 2B.14               ✅ DONE 2026-09-03
2B.16  Company tab         (UI,   S)  — collapse + tab reorder    ✅ DONE 2026-09-02
2B.19  Add Company          (DATA, M)  — the front door + normaliser ✅ DONE 2026-09-02 (+ 2B.19b repair)
2B.18  Email → company      (DATA, M)  — domain match + arrow        ✅ DONE 2026-09-02
2B.20  Import identity      (DATA, M)  — repair on import + report   ✅ DONE 2026-09-02
2B.21  Prospect fields      (DATA, M)  — address, zip, conference CSV ✅ DONE 2026-09-03
2B.17  ID block redesign   (UI,   L)  — after 2B.13 and 2B.21     ✅ DONE 2026-09-03
2B.22  Add Prospect layout (UI,   S)  — after 2B.21               ✅ DONE 2026-09-03 (ran M, not S)
2B.10  Close               (QA,   M)  — LAST. Always last.        ✅ DONE 2026-09-03
```

⛔ **PHASE 2B IS CLOSED, 2026-09-03. EVERY SESSION ABOVE HAS RUN.** The narrative below is
how the order was decided at the time and is kept for that reason; **the ✅ marks are the
authority on what happened.** ⚠️ **Three documents — this one, the run sheet and
`ai/AIContext.md` — carried "2B.19 is NEXT" for a full day after 2B.19 shipped**, because
2B.19's own close updated the handoff and not the two plans. **A session booted against
that pointer and had to disprove it from the code before it could start.** The durable
lesson is filed in `BUILD_NOTES.md`: *a session that ships out of numeric order must update
the plan that names the order, not only the handoff.*

**RUN ORDER CHANGED 2026-09-02, AFTER 2B.13 SHIPPED.** 2B.13 and 2B.16 are done. **2B.19 and 2B.18 were both added
the same afternoon from Michael's own use of what 2B.13 shipped** and run NEXT, ahead of 2B.14 —
**2B.19 first, because it builds the front door and the normaliser 2B.18 consumes** —
he asked for it directly and it finishes the job 10a started rather than beginning a new one. The
**cross-compartment exception granted for 2B.13 covers it** (same company create path); nothing new
is owed before it can start.

**2B.11 and 2B.12 can run today.** They need nothing from Michael and depend on nothing. Everything
else has a gate.

**2B.13 is placed third on a compounding-damage argument, not a value one.** Every prospect added
without the autocomplete is another chance at a fourth `SPL`. It is the only item on this list where
waiting actively costs data. Same reasoning would pull Finding 9 forward, but that one is not 2B's.

**2B.14 runs before 2B.15** so the tag filter's *semantics* change once and its *widget* changes once,
in that order. Reversing them means touching the same surface twice and testing a new widget against
behaviour that is about to change.

---

## Session 2B.11 — ProspectHub filter column: geography matcher and field widths

- **Compartment:** ProspectHub directory · **Depends on:** nothing. **Can run immediately.**
- **Findings:** 1, 4
- **Goal:** `VA` and `Virginia` return the same records. `Virginia` stops including West Virginia. The
  placeholder stops advertising syntax the filter cannot honour. All three filter fields cap at Row
  1's width, from one rule.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. A `US_STATES` abbreviation↔name map (50 + DC) at module scope, near the filter code.
  2. Expand every geo term to **both** forms before matching. **Keep a guard against loose 2-char
     substring matching** — `"va"` is inside Ne**va**da, Syl**va**nia, **Va**ncouver. The existing
     `term.length === 2` branch exists for that reason; replace its lookup, not its caution.
  3. **Compare state as a whole value**, not a substring, so `Virginia` ≠ `West Virginia`. City and
     metro stay substring matches — those are genuinely partial-text fields.
  4. Both branches: contacts (`app.js` 3611–3618) **and** companies (3443–3455). They are separate
     copies; fixing one is the obvious half-fix.
  5. `index.html` 248 placeholder — say what the field actually supports.
  6. One `.search-box-wrapper` rule scoped to the ProspectHub filter column at `max-width: 400px`,
     **and delete Row 1's inline `style="… max-width: 400px …"`** so all three come from one place.
- **Inputs needed from me:** one — see Needs my eyes.
- **Done when:**
  - `VA` → contact and company counts pasted. `Virginia` → the same two numbers pasted. They match.
  - A `West Virginia` record is excluded from a `Virginia` search — **or**, if the database holds
    none, say so plainly. Do not claim a pass that was not demonstrated.
  - All three filter wrappers measured by `getBoundingClientRect().width`, pasted, equal.
  - Screenshot the filter column in **both** themes.
  - Console clean · `check_ids.py` at baseline · `CACHE_NAME` bumped.
- **Needs my eyes:** **should `LA` mean Louisiana or Los Angeles?** With the map it resolves to
  Louisiana and can never match the city. That is a real trade and it is mine to make.
- **Risk and fallback:** the **third copy of this matcher at `app.js` 10919** (Audience Query Engine,
  `#query-geography`) is **DEFERRED and not touched**. The two surfaces will understand geography
  differently until the Engine is un-deferred — **write that divergence into `BUILD_NOTES.md` in this
  session**, worded so nobody "fixes" it by porting.

---

## Session 2B.12 — Column resize cursor, and the mid-drag guard

- **Compartment:** shared column-layout machinery (2B.2) · **Depends on:** nothing.
- **Findings:** 2, 3
- **Goal:** the resize cursor is legible on every header in both themes, and stays a resize cursor for
  the whole drag.
- **Size: S** · My time: ~5 min · **Confidence: High**
- **Files:** `app.js`, `style.css`, `sw.js`
- **Tasks:**
  1. A custom cursor: `cursor: url("data:image/svg+xml,…") <hx> <hy>, col-resize`. Black glyph, white
     halo, **32×32 ceiling**, keyword fallback **mandatory**. Data URI — no new file, no build step.
  2. A guard so the thead `mousemove` (`app.js` 5805) **skips the cursor while a resize is live**.
- **Done when:**
  - The **same four-step trace** from the review pass, re-run and pasted, showing step 3 now reports
    the resize cursor on **TaskHub** rather than `pointer`.
  - Screenshot a light-mode header mid-hover. The cursor will not appear in the capture — say so, and
    verify legibility by eye instead of implying the screenshot proves it.
  - Resize persists across a reload on all three tables. TaskHub reorder still works.
  - Console clean · `CACHE_NAME` bumped.
- **Needs my eyes:** the cursor artwork, once, on the light header.
- **Risk and fallback:** ⚠️ **BOTH FIXES OR NEITHER.** A bitmap alone does **not** fix the blink — at
  step 3 the inline cursor is wiped and `.taskhub-sortable`'s `cursor: pointer` (`style.css` 262)
  wins regardless of what `body` carries. **A session that builds only the bitmap will look correct
  on ProspectHub — the surface anyone would naturally test — and still blink on TaskHub.**
  If the hotspot cannot be made to feel right, fall back to the keyword cursor and fix only the
  guard; do not ship a cursor that drags offset from where it was grabbed.

---

## Session 2B.13 — Company duplication: the website seed and the autocomplete

- **Compartment:** company create path — ⚠️ **OUTSIDE 2B. Requires Michael's authorised exception.**
- **Depends on:** that authorisation. **Blocks 2B.17.**
- **Findings:** 10a, 10c
- **Goal:** a company created from a prospect's email carries a usable website, and typing a company
  name offers the ones that already exist.
- **Size: M** · My time: ~6 min · **Confidence: High**
- **Why it is third:** compounding damage. Every prospect added without the autocomplete is another
  chance at a fourth `SPL`. The only item on this list where waiting costs data.
- **Files:** `app.js`, `index.html`, `sw.js`
- **Tasks:**
  1. **`resolveCompanyByName()` (6568) seeds `website: ""`, and that empty string defeats the existing
     back-fill** at 1443 (`if (c.website === undefined)`). Seed `website` from the same email-derived
     value the `domain` line uses.
  2. **Populate `#companies-datalist`.** The markup exists at `index.html` 1497–1498 and **nothing has
     ever filled it.** Unfinished, not dead.
  3. ⚠️ **Both inputs.** `#pros-company` (create modal) has the datalist; **`#pd-company` (detail view)
     has none.** One without the other leaves half the leak open.
  4. **Do NOT delete or "reconcile away" the `domain` field.** It is exported (8903) and searched
     (8475); dropping a CSV column is a restore-compatibility change.
- **Inputs needed from me:** the exception, plus the back-fill decision below.
- **Done when:**
  - A new prospect with an email creates a company whose `website` is populated — pasted.
  - Typing `SPL` in **both** `#pros-company` and `#pd-company` offers the existing SPL records —
    screenshot each.
  - Company count before and after a create, pasted, proving no accidental extra record.
  - Console clean · `CACHE_NAME` bumped.
- **Needs my eyes:** ⚠️ **existing companies are not helped by this.** The 1443 back-fill only fires on
  `undefined`, and every company already created holds `""`. Back-filling them from `domain` is a
  **DIRECTIVES §4 change to existing data** and needs its own decision and rollback plan. **Ask; do
  not do it as a side effect.**
- **Backup coverage:** `state.companies` is modified. Covered by the ZIP bundle — state so in the
  summary per §4.

---

## Session 2B.20 — Repair the company identity on import, and the duplicate-domain report

- **Compartment:** the CSV contact import + one new read-only report surface · **company create path
  is covered by the 2026-09-02 exception.**
- **Depends on:** `normaliseDomain()` (2B.19) and `FREE_EMAIL_DOMAINS` (2B.18). Runs after both.
- **Source:** Michael, 2026-09-02.
- **Size: M** · His time: ~8 min · **Confidence: Medium** — the import is the bulk path, so a
  mistake here damages hundreds of records in one action rather than one.

### What he decided

> *"If website record is not a real domain (e.g. no dot-com), use email domain to replace it. I
> don't think we want to worry about company name deviations in these imports. Instead, let's create
> a manually triggered [report] that searches for domains with multiple company names for cleanup."*

**Two halves, deliberately split: repair the IDENTITY on the way in, and report on the NAMES
afterwards.** No name reconciliation during import — the sheet is written as given.

### The problem this fixes

The import sets **`domain: p.companyId`**, and `companyId` comes from the sheet's website column
**or, when there is none, a slug of the company name** — `"SPL Productions"` → `spl-productions`.
**It never reads the prospect's email.** Now that `domain` is the identity, the bulk path is the
largest source of bad identities in the database.

### Tasks

1. **`looksLikeDomain(v)`** — at least two labels, a dot, an alphabetic TLD of 2+ characters, no
   spaces. `spl-productions` → **false**. `acme.com` → true. `southland.church` → true.
2. **In the import, after the existing derivation:** if `domain` fails `looksLikeDomain()`, replace
   it with `normaliseDomain(<host of that row's email>)`. **If that host is on
   `FREE_EMAIL_DOMAINS`, leave `domain` EMPTY** — an absent identity is honest, `gmail.com` as an
   employer is not.
3. ⚠️⚠️ **DO NOT CHANGE HOW `companyId` IS DERIVED. THIS IS THE ONE THING THAT MUST NOT MOVE.**
   `companyId` is the **record** id and prospects point at it; `domain` is the **business** identity.
   Today they happen to hold the same string, which makes them look like one concept. **They are
   not.** Repair `domain` and leave `companyId` exactly as it is computed now — changing it orphans
   every existing prospect→company link on the next import, silently.
4. **No company-name reconciliation on import.** His explicit call. Names come in as the sheet has
   them; the report below is how deviations get found.
5. **The duplicate-domain report — manually triggered, READ-ONLY.** Groups companies by normalised
   `domain` and lists every domain held by **two or more different company names**, with the names,
   their record ids, and how many prospects hang off each. **It merges nothing and changes nothing.**
   Place it in **DataHub** beside the other data tools.
6. ⚠️ **The report will show large clusters that are NOT duplicates** — everything holding the
   `"domain.com"` placeholder, and every pre-2B.20 import slug. **Label those groups distinctly in
   the output** ("no real identity") rather than listing them as duplicate companies, or the first
   run buries the real findings under noise and looks like catastrophic data loss.

### The placeholder identity — Michael, 2026-09-02. Read this before touching the matcher.

**THE RECONCILIATION KEY IS THE DOMAIN, AND ONLY THE DOMAIN.** In his words: *"It's not checking the
Company name to reconcile. It's checking the domain. If the contact does not have that email domain,
she is automatically not connected to an existing company."*

So `christy.weaver@gmail.com` listed against "SPL Productions" is **NOT** joined to the existing SPL
Productions record. She gets a placeholder identity, he sees it while working contacts, and he moves
her onto the real SPL by hand — **keeping her Gmail address.** He chose this over name-matching
deliberately: **name matching is what produced the four `SPL` records in the first place.**

⚠️ **THIS GOVERNS AUTOMATIC LINKING ONLY.** A human explicitly choosing a company from the
autocomplete is a different act and still works by name — otherwise typing "Stripe" when Stripe
exists would create a second Stripe. **Automatic = domain. Explicit human choice = whatever they
picked.** Do not collapse these two into one rule.

### The placeholder's shape — IMPORT ONLY, and the collision is THE FEATURE

⛔ **THIS SCHEME APPLIES TO THE CSV IMPORT AND NOWHERE ELSE.** A hand-entered prospect never produces
a `no-website:` value — see 2B.18's entry. Placeholders make a **bulk** load triageable; on a form
Michael is looking at, an empty domain he can see and fix is better than a generated string.

When no usable domain can be derived, `domain` gets **`no-website:<first word of the company
name>`** — lowercased, punctuation stripped. `SPL Productions` → **`no-website:spl`**.

⚠️⚠️ **COMPANIES SHARING A FIRST WORD DELIBERATELY SHARE ONE PLACEHOLDER, AND A FUTURE SESSION MUST
NOT "FIX" THIS.** Michael's reason, verbatim: *"Maybe I have a list of 10 SPL people using 3
different versions: SPL Production, SPL Productions, SPL AV Production. I want those grouped so I can
manually clean them up."*

**The placeholder is a CLEANUP BUCKET, not an identity assertion.** It is coarse on purpose. The
accepted cost is that two genuinely unrelated companies sharing a first word land in one bucket —
he would rather over-group and sort it out by hand than under-group and never find them.
**A "more precise" placeholder derived from the full name destroys the entire point of the feature.**

**THE IMPORTED COMPANY IS A REAL, FIRST-CLASS COMPANY RECORD — it is created and stored in Vantage
carrying the placeholder as its `domain`.** Michael, 2026-09-02, confirming: *"The companies as
imported goes into vantage with placeholder as domain."* It is **not** quarantined, staged, hidden
or skipped. It appears in the companies directory like any other company, prospects link to it
normally, and the Company tab renders it normally. **The placeholder is a real value in a real
record, not a marker that something was withheld.**

**Cleanup is then an ordinary edit:** he opens the company and replaces `no-website:spl` with the
real domain, and every contact already attached follows automatically — because they point at the
record, not at the string. That is the payoff of `domain` being the identity, and it is why the
placeholder must be stored rather than the import refusing the row.

- **`website` is left EMPTY.** The placeholder is data, not display. Putting it in `website` would
  render `https://no-website:spl` as a broken link on the company card and in the companies table,
  because `ensureUrlProtocol()` prepends a scheme to anything without one. **His rule: "Domain is
  the data. Website is the display."**
- **The `no-website:` prefix can never be a real domain**, so `looksLikeDomain()` rejects it, and
  **sorting companies by `domain` groups every unresolved company into one contiguous block** — the
  cleanup queue, for free.
- ⚠️ **Skip a leading article when taking the first word** — `The Anderson Group` and
  `The Wilson Company` must not both bucket to `no-website:the`. Skip `the` / `a` / `an` and take
  the next word. **Needs his eyes**, but the article case is clearly not what he meant by grouping.

### Silent junk-stripping on import

Before deriving anything, discard values that are **not real addresses**: slugs (anything failing
`looksLikeDomain()`), and the placeholder strings **`yourdomain.com`**, **`domain.com`**,
**`example.com`**, plus empties like `n/a`, `none`, `-`. **Silent — no report, no prompt.** These are
noise, and treating them as identities is what produced the current mess. A stripped value falls
through to the email domain, then to the placeholder.

### Done when — pasted, not summarised

- An import row whose website column is a **slug** ends up with the **email's** domain. Pasted.
- An import row with a **real** website column keeps it. Pasted.
- A row whose only address is **gmail.com** ends with **`no-website:<firstword>`** in `domain` and
  an **empty `website`**. Pasted.
- **Three rows named `SPL Production`, `SPL Productions` and `SPL AV Production`, all with blocked
  emails, land on the SAME `no-website:spl`.** Pasted. **This is the grouping he asked for and is
  the headline acceptance test for the placeholder.**
- A row carrying `yourdomain.com` or a slug in its website column has it **silently discarded** and
  falls through to the email domain. Pasted.
- ⚠️ **`christy@gmail.com` listed against an EXISTING "SPL Productions" is NOT joined to it** — she
  gets the placeholder. Pasted. Domain is the only automatic key.
- ⚠️ **`companyId` values are IDENTICAL to what the same sheet produced before this change.** Import
  a fixture both ways and paste the two id lists. **This is the regression that matters** — it is
  the one that silently orphans links.
- The report lists a domain carrying two different company names. Screenshot.
- **The report is read-only:** company and prospect counts identical before and after running it.
  Pasted.
- Console clean · `check_ids.py` at baseline · `CACHE_NAME` bumped.

- **Backup coverage:** `state.companies` written on import (as today). The report writes nothing.
  **State it per §4.** ⚠️ **A ZIP before this session is not optional** — it is the only one of these
  that touches records in bulk.
- **Needs his eyes:** the report's layout, and whether "no real identity" groups should be listed at
  all or just counted.
- **Risk and fallback:** ⚠️ **This is the bulk path — verify against a FIXTURE FILE, not his real
  data**, and never against the production import. If the identity repair proves entangled with the
  id derivation, **ship the report alone** — it is independently useful, tells him the true scale of
  the problem, and is read-only.

### Relationship to Finding 10b

**This report IS the collision report 10b called for**, arriving in Phase 2B as a **manual cleanup
tool** at Michael's request rather than as Phase 2C enforcement. **10b's enforcement half — refusing
or merging duplicates — stays in Phase 2C** and is still its own §4 decision. Running this report is
what will tell him whether enforcement is even needed.

## THE FIELD WORK — Michael's three sheets, 2026-09-02 evening

He supplied the layouts for **both** surfaces on the same evening. They share a field set, so the
work splits by KIND, not by screen: the data first, then each layout.

**Run order: 2B.21 → then 2B.17 and 2B.22 in either order.** Both layouts render `address` and `zip`,
so neither can run until those fields exist and are backup-covered.

### HOW THE P5 / P9 OVERRIDES ARE TAKEN — Michael's instruction, 2026-09-02

He does not pre-approve these. **The session ASKS, and he answers with the change in front of him.**

⚠️ **ASK IT AS PART OF THE BOOT QUESTION BLOCK, NEVER MID-RUN.** In both sessions the contract
departure IS the work — 2B.17 *is* the field-list change, 2B.22 *is* the modal redesign — so it is
knowable in the first minute and belongs with everything else the session asks up front. A session
that reaches task 1, stops, and waits has converted an unattended run into a stalled one.

**The exact question, both sessions:** name the contract, quote the line it departs from, say what
the departure is in one sentence, and ask for a **this-session override**. Do not ask him to amend
the contract; that is a separate act and it is not his to do mid-session.

⛔ **AND THE HALF THAT IS EASY TO DROP: AN OVERRIDE LEAVES THE CONTRACT TEXT WRONG.** Once 2B.17
ships, P5's enumeration no longer matches the code; once 2B.22 ships, P9's "untouched" is false.
**A frozen contract that contradicts the code is worse than no contract** — BUILD_NOTES' curation
rule: one grep disproves it, the whole note is discarded, and the true half goes with it. So every
override taken here is **owed as an amendment at 2B.10**, which already runs a DECLARATIONS audit.
**A session that takes an override MUST record it in its own AIContext handoff under a heading
2B.10 will find.**

### ⛔⛔ THE §4 FINDING THAT CAME OUT OF SCOPING THIS — READ FIRST

**THE FOUR CONFERENCE FIELDS ARE WRITABLE FROM BOTH SURFACES AND ARE IN NEITHER CSV.** Proved with
the shipped exporter against a record holding all four values: 15 header columns, **zero** conference
columns, and the CSV did not contain `"AV Summit 2026"` or `"Nashville"`. Not in
`exportProspectsCSV()`, not in `exportZIPBackup()`'s prospect block, therefore not readable by
`restoreProspectsFromCSV()`.

**So every conference value is destroyed by an export → wipe → restore round trip, silently.** This
is a live DIRECTIVES §4 Backup coverage violation and it PREDATES this work. ⚠️ **2B.10's phase close
runs exactly that drill on real data.** It has never lost anything only because **0 records currently
hold conference values** — which is also why no previous drill caught it. **A drill against data that
does not exist is a test that cannot fail.**

---

## Session 2B.21 — Prospect field coverage: address, zip, and the conference repair

- **Compartment:** the prospect record's persisted field set + the prospect CSV export/restore.
- **Depends on:** nothing. **Runs before 2B.17 and 2B.22.**
- **Size: M** · His time: ~5 min · **Confidence: High** — the work is enumerable and the drill is
  the proof.
- ⚠️ **ZIP FIRST. NON-NEGOTIABLE** — the Done-when calls `wipeAllData()`.

### Tasks

1. **Two new persisted fields on the prospect: `address` and `zip`.** ⚠️ `address` exists today on
   COMPANIES only (`comp-address`); there has never been a prospect address. Neither field exists in
   any form.
2. **`ensureStateDefaults()` migrations for all six** — `address`, `zip`, and the four `conference*`
   keys, which have never had one either. ⛔ **The seed and the migration must write the SAME SHAPE**
   — BUILD_NOTES' 2B.13 lesson: `if (x === undefined)` is permanently defeated by a `""` seed, and
   both lines read as correct in isolation.
3. **Six new columns in BOTH prospect CSV writers** — `exportProspectsCSV()` **and**
   `exportZIPBackup()`'s prospect block. They are two separate literal header arrays holding the same
   15 values. **Editing one and not the other is the defect this session exists to fix, repeated.**
4. **`restoreProspectsFromCSV()` reads all six.** Restore functions trim; that is right for these.
5. **The CSV import maps them where the sheet has them** — Apollo carries address/city/state/zip
   columns. Follow the existing `lookup([...])` idiom.

### Done when

- Type a value into **all six** fields on one contact → **export → `wipeAllData()` → restore** →
  paste all six back, character-identical. **This is the whole session.**
- The two header arrays are compared and pasted side by side, proving they match.
- An older backup (without the six columns) still restores, leaving the six as `""` not `undefined`.
- `check_ids.py` baseline · console clean · `node --check` clean.

- **Backup coverage:** ⚠️ **This session IS the backup coverage.** State it per §4 in the summary.

---

## Session 2B.17 — Identity block redesign  ✅ UNBLOCKED 2026-09-02

- **Compartment:** prospect detail view · **Depends on:** 2B.13 (done) and **2B.21**.
- ⛔ **WAS blocked on Michael's layout. THE LAYOUT NOW EXISTS** — his third sheet. Confidence rises
  from Low to Medium: the unknown that made it Low is gone.
- **Size: L** · His time: ~10 min

### The layout, verbatim from the sheet

```
First Name     Last Name     Seniority        (THREE-UP)
Job Title
Company
Email Address
Phone Number
LinkedIn URL
Address
City           State         Zip              (THREE-UP)
Metro
Associated Tags
─────
Conference Name         Conference City / Venue    (paired)
Conference Start Date   Conference End Date        (paired)
Notes
```

- **"Metro" IS `location`, RELABELLED — NOT A NEW FIELD.** `PROSPECTS_COLUMNS` already ships
  `{ key: "metro", label: "Metro" }` reading `p.location`, with a comment saying the field name and
  the label have never matched on that table. **This sheet makes the detail view AGREE with the
  directory**, which is a consistency gain, not a rename. ⛔ The stored key stays `location`.
- **Seniority is HERE but NOT in the Add Prospect modal** (2B.22 drops it). Deliberate: this is the
  surface for correcting a guess, and `deriveSeniority(title)` supplies the value at create time.
- **The conference block sits BELOW, full width, in two paired rows** — not "off to the side" as the
  original 2B.17 text said. **The sheet wins.** Still visible, still never hidden.

### Tasks

1. Reorder `PROSPECT_DETAIL_FIELDS` — **the only enumeration** — plus the matching `.form-group`
   order, and add `address` / `zip` rows. ⚠️ **This departs from frozen contract P5**, which freezes
   that enumeration. **ASK AT BOOT, NOT MID-RUN** — see the standing note below.
2. Two THREE-UP rows. The grid is two-column today; a three-up needs one rule, scoped.
3. `location`'s label becomes **Metro**. Key unchanged.
4. **Notes taller, plus a pop-out expander** (carried from the original scope; not visible on the
   sheet — confirm he still wants it).
5. **LinkedIn renders as a link**, `target="_blank"` via `ensureUrlProtocol()`.
6. ⚠️ **Company URL as a read-only derived display is NOT on his sheet.** Original task 4. **Ask
   before building or dropping it** — it was review Finding 11.

---

## Session 2B.22 — Add Prospect modal: field order, and Save and Open Contact

- **Compartment:** `#modal-prospect` only · ⛔ **CONFLICTS WITH FROZEN CONTRACT P9.**
- **Depends on:** **2B.21**, and Michael waiving P9.
- **Size: S** · His time: ~5 min · **Confidence: High** once the fields exist.

### ⛔ THE P9 CONFLICT

P9 says *"`#modal-prospect` is untouched and remains the create path."* Written to stop the
detail-view work absorbing or deleting the modal, not to freeze its layout — but the text says
untouched, and **a session does not reinterpret a frozen contract on its own.**
**ASK AT BOOT, NOT MID-RUN** — see the standing note below.

### The layout, verbatim from the sheet

```
First Name     Last Name         (paired)
Job Title
Company                          (+ 🔍 Look Up, ✏️ Edit Profile, #pros-company-match)
Address
City   State   Zip               (THREE-UP)
Email Address                    (+ #pros-dup-warning)
Phone Number
LinkedIn URL
─────  Conference Name / Conference City / Venue / Start | End
─────  Associated Tags / Notes
─────  [ Save and Open Contact ]
```

- **Seniority is DROPPED here.** `deriveSeniority(title)` fills it on save so the value still exists
  with no input. It remains editable in the detail view.
- **No Metro/`location` input in this modal.** ⚠️ Then `saveProspect()` must NOT write `location: ""`
  on the edit branch — it assigns every field unconditionally today, so a blind removal **wipes the
  geography of every record it touches.** His working database keeps geography ONLY in `location`.
  **Remove the markup AND the write; never write the field at all.**
- ⚠️ **Company sits ABOVE Email**, so the natural tab order has him typing the name first. 2B.18's
  matcher fills a **blank** box, so the silent auto-fill fires less and the conflict notice more —
  consistent with his stated habit (*"Most of the time I will type a company name"*). **It does NOT
  reintroduce 2B.18's ordering defect**, which was the detail view, where every control commits on
  change. Nothing here is written until Save.

### Tasks

1. Reorder the `.form-group`s. Markup only — **every id stays exactly as it is.**
2. Remove Seniority's markup and its three reads (11972 / 12000 / 12122). ⚠️ **Twelve unguarded
   `getElementById(...).value` reads point at the fields being touched**; a missed one throws
   `Cannot read properties of null` and the modal stops opening — the `theme-toggle` failure shape.
3. `deriveSeniority(title)` fills `seniority` on save.
4. **Save and Open Contact** replaces Save Contact: `saveProspect()`, then `openProspectDetail()`.
   ⚠️ `saveProspect()` returns nothing today and has **two refusal branches** (P6's duplicate-email
   guard, 2B.18's company-conflict guard). It must report whether it saved, and the modal must **not
   navigate on a refusal.** That is the only non-cosmetic code in this session.

### Done when

- The order matches. Screenshot, both themes.
- **Open an existing contact carrying `location`, save unchanged, paste `location` before and after.
  Identical.** The check that matters.
- Email at a known company still auto-links; the notice still renders.
- A duplicate email → **Save still refused AND the detail view does NOT open.** Paste both.
- `check_ids.py` at baseline · console clean.

- **Needs his eyes:** whether Save and Open Contact fully replaces Save Contact or sits beside it
  (**unanswered — the sheet shows ONE button, so replace is the assumed default**).
- **Risk and fallback:** if the refusal-aware save entangles, **ship the reorder alone.**

---

## SUPERSEDED — original 2B.21 scope

> Replaced 2026-09-02 by the three sessions above, after Michael's second and third sheets added Address, Zip and the identity-block layout. Kept only so the earlier reference resolves.

### Session 2B.21 (original) — Add Prospect modal: field order, and Save and Open Contact

- **Compartment:** `#modal-prospect` only · ⛔ **CONFLICTS WITH FROZEN CONTRACT P9 — see below.**
- **Depends on:** Michael waiving P9. Nothing else.
- **Source:** Michael, 2026-09-02, two spreadsheet screenshots (the second places Company).
- **Size: M** · His time: ~5 min · **Confidence: Medium** — the layout is trivial; the field
  REMOVALS are not, and that is where the whole risk sits.

### ⛔ THE P9 CONFLICT — RESOLVE BEFORE STARTING

P9 says: *"`#modal-prospect` is untouched and remains the create path."* That was written to stop the
detail-view work from absorbing or deleting the modal, not to freeze its layout forever — but the
text says "untouched" and **a session does not reinterpret a frozen contract on its own.** Michael
waives it in a sentence, or this session does not run.

### The layout he asked for, verbatim from the sheet

```
First Name        Last Name        (paired)
Job Title
Company                            (+ 🔍 Look Up, ✏️ Edit Profile, #pros-company-match)
Email Address                      (+ #pros-dup-warning)
Phone Number
LinkedIn URL
─────
Conference Name
Conference City / Venue
Start Date        End Date         (paired)
─────
Associated Tags
Notes
─────
[ Save and Open Contact ]
```

Same labels, same `.form-group` idiom, three visual groups from the blank rows he left. Phone and
LinkedIn become **full-width singles** (they are paired today); Job Title moves up and goes
full-width.

⚠️ **COMPANY SITS ABOVE EMAIL AND THAT CHANGES WHICH 2B.18 BRANCH FIRES MOST.** The matcher fills a
**blank** Company box on Email blur; with Company above Email the natural tab order has him typing
the name first, so the silent auto-fill fires less and the conflict notice fires more. That is
consistent with his own stated habit — *"Most of the time I will type a company name"* — so it is
the right order for him. **It does NOT reintroduce 2B.18's ordering defect:** that bug was the
DETAIL VIEW, where every control commits on change. In this modal nothing is minted until Save.

### ⚠️⚠️ THE REAL RISK: FOUR FIELDS COME OUT, AND TWELVE UNGUARDED READS POINT AT THEM

His sheet drops **Seniority, City, State and Location.** Each is read three times with a bare
`document.getElementById(...).value` — `openProspectModal()`'s edit branch (11972–11976),
its create branch (12000–12004), and `saveProspect()` (12122–12126). **Deleting the markup without
editing all twelve throws `Cannot read properties of null` and the modal stops opening at all** —
the same failure shape BUILD_NOTES records for `theme-toggle`.

⛔ **AND THE DATA-LOSS PATH, WHICH IS WORSE THAN THE CRASH.** `#modal-prospect` is the EDIT path too,
and `saveProspect()` assigns every field unconditionally on the edit branch. So:

- remove the markup, leave the write → **crash**;
- remove the markup, write `""` → **every edit silently wipes that contact's geography**, including
  the geography imported from Apollo that 2B.11's filter reads;
- remove the markup **and** remove the write → existing values survive untouched. ✅ **This is the
  only correct option.**

**The accepted cost of the correct option:** an imported contact's City / State / Location become
invisible and uneditable by hand. He keeps them in the data and in the filters, but can no longer
fix a bad one from this form. **Say this to him plainly before building; it is a real trade, not a
detail.** Seniority is cheaper — `deriveSeniority(title)` already exists and can fill it from Job
Title on save, so nothing is lost.

### Tasks

1. Reorder the `.form-group`s in `#modal-prospect` to the block above. **Markup only** — every id
   stays exactly as it is.
2. Remove Seniority / City / State / Location from the markup **and** from all twelve reads. Do not
   write those fields on the edit branch at all.
3. `deriveSeniority(title)` fills `seniority` on save, so the field keeps a real value with no input.
4. **Save and Open Contact** replaces Save Contact: `saveProspect()`, then
   `openProspectDetail(newId, { view: "prospects" })`. ⚠️ `saveProspect()` currently returns nothing
   and has **refusal branches** (the P6 duplicate-email guard and 2B.18's company-conflict guard) —
   it must report whether it actually saved, and the modal must NOT navigate on a refusal. **That is
   the one non-cosmetic code change in this session.**
5. Bump `CACHE_NAME`.

### Done when

- Every field in the block above appears in that order. Screenshot, both themes.
- **Open an EXISTING imported contact that has city/state/location, save it unchanged, and paste
  those three values before and after. They must be identical.** This is the check that matters.
- Add a contact with an email at a known company → still auto-links; the notice still renders.
- A duplicate email → **Save is still refused AND the detail view does NOT open.** Paste both.
- `check_ids.py` at its baseline of two — removing four ids must not move it.
- Console clean · `node --check` clean.

- **Backup coverage:** no new field, no new store. `seniority` / `city` / `state` / `location` remain
  exported and restored exactly as today; this session changes which of them a FORM can write.
  **State it per §4.**
- **Needs his eyes:** that losing hand-editing of City / State / Location is acceptable, and whether
  Save and Open Contact fully replaces Save Contact or sits beside it (**unanswered as of
  2026-09-02 — the sheet shows ONE button, so replace is the literal reading and the assumed
  default**).
- **Risk and fallback:** if the refusal-aware save proves entangled, **ship the reorder alone** — it
  is independently the thing he asked for, and the button becomes its own S session.

---

## Session 2B.14 — Include semantics: OR within a picker, AND across pickers

- **Compartment:** ProspectHub + Advanced Query modal · ⚠️ **MediaHub and CampaignHub are outside 2B
  and need the same authorised exception**, or they stay behind and disagree.
- **Depends on:** that decision.
- **Findings:** 5
- **Goal:** adding a term never reduces the result count.
- **Size: M** · My time: ~10 min · **Confidence: Medium** — the surface count, not the difficulty.
- **Files:** `app.js`, `sw.js`
- **Tasks:** change include from `.every()` to `.some()` at every site in the Finding 5 table.
  **Exclude stays `.some()` — it is already correct and must not be touched.**
- **Done when:**
  - **Michael's own acceptance test, pasted:** `7-7-26 Auto-eight` + `Tumbler Audience`, both
    included → **11 results, Michael Harward appearing once.**
  - A **Title** picker with two terms broadens — proving the *second* function was changed.
  - Cross-picker still narrows: two tags **plus** a title term returns fewer than the tags alone.
  - An exclude term still removes rows.
  - Console clean · `CACHE_NAME` bumped.
- **Needs my eyes:** the first real query afterwards. Results get **bigger**; that is the change, not
  a broken filter.
- **Risk and fallback:** ⚠️ **TWO FUNCTIONS, NOT ONE.** `matchesIncludeExclude` (8097) **and**
  `matchesIncludeExcludeSmart` (8134). Change one and **Title silently keeps AND**, passing any
  spot-check that does not use Title. This is why the Done-when tests Title explicitly.
  ⚠️ **This reverses behaviour 2B.9 verified and shipped.** It is a decision, not a regression fix —
  do not go hunting for a break that was never there.

---

## Session 2B.15 — ProspectHub tag filter becomes the pop-out chooser

- **Compartment:** ProspectHub directory · ⚠️ **Requires the P8 revision first.**
- **Depends on:** the revision, **and 2B.14** — so semantics change once, then the widget changes once.
- **Findings:** 6
- **Goal:** filtering by tag uses the same pop-out checklist as every other tag surface in the app.
- **Size: M** · My time: ~8 min · **Confidence: Medium**
- **Files:** `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. A **fourth `tagSelectionTarget`** on the existing `#modal-choose-tags`. **Reuse, not invention** —
     `renderTagsChecklistGrid()` already takes any tag list and `saveChosenTags()` already branches on
     `"prospect"`, `"campaign"`, `"media"`.
  2. **Feed `prospectTagFilterTerms()`** — the single accessor 2B.9 built. Nothing downstream of
     `tagTerms` in `renderProspectsView()` changes. That accessor is the seam; use it.
  3. Chips render after close, as MediaHub does on **Save Tags**.
- **Done when:**
  - Pick two tags through the pop-out → same counts as setting the accessor's value directly. Paste
    both.
  - **The Advanced Query modal is byte-for-byte unchanged** — verify and paste. Michael has said twice
    it is not to be touched.
  - Clear Filters and both See-All routes still clear the selection.
  - Screenshot the pop-out and the resulting chips, both themes.
- **Needs my eyes:** the **Save Tags** button's label in a filtering context — it means "apply
  filter" here, not "save." And the empty state. **Decide it with me; do not improvise it.**
  → **DECIDED 2026-09-03 at the top of 2B.15.** Label: **"Apply Filter"** (over "Show Results" and
  over leaving it). Create-a-tag block: **hidden in filter mode.** Empty state: written by the
  session as *"No tags are in use yet. Tag a contact or a company and it becomes a filter option
  here."* — **filter mode only**, the five assign targets keep their existing blank grid, and this
  one string is the only part of the three Michael has not seen in words. One line to change.
- **Risk and fallback:** if the modal proves too entangled with *assigning* to serve *filtering*, the
  fallback is checkbox rows in the existing inline dropdown — **not** a second modal.

---

## Session 2B.16 — Company tab: collapse by default, and the tab reorder

- **Compartment:** prospect detail view · **Depends on:** nothing.
- **Findings:** banked review Finding 1, plus Finding 8
- **Goal:** the Company tab opens collapsed with a disclosure arrow; the tab strip reads
  Interactions · Tasks · Company · Sequences · Audiences · Campaigns.
- **Size: S** · My time: ~5 min · **Confidence: High**
- **Files:** `app.js`, `style.css`, `sw.js`
- **Tasks:** reorder the rows in `PROSPECT_DETAIL_TABS` (the single source for strip and bodies);
  add the disclosure to `renderDetailCompany()` and its `.pd-company-card` / `.pd-company-grid`
  styling.
- **Done when:** the strip renders in the new order and every body still resolves; the Company tab
  opens collapsed and expands; all three of its empty states still render — including the
  dangling-reference one, which **cannot be reached by deleting a company** (see BUILD_NOTES).
- **Needs my eyes:** the disclosure arrow's placement, once.
- **Risk and fallback:** ⛔ **Do NOT invent a store for the expanded/collapsed state.** P9. Default to
  not persisting it; if it must be remembered it joins `state.columnLayouts` under its own key.
  ⛔ **Do not apply this collapse pattern to the conference fields** — Michael was offered it and
  **rejected it**; they stay visible.
  **Brushes P4** (which writes the six rows in a specific order) — a one-clause amendment, proposed
  in the summary, not applied.

---

## SUPERSEDED — original 2B.17 scope

> ⛔ Replaced 2026-09-02 by the 2B.17 entry above, when Michael supplied the layout. Its BLOCKED status and Low confidence no longer hold. Kept only so earlier references resolve; **build from the entry above.**

### Session 2B.17 (original) — Identity block redesign

- **Compartment:** prospect detail view · ⛔ **BLOCKED — needs Michael's layout design first.**
- **Depends on:** Michael, **and 2B.13.**
- **Findings:** 7, 11, 14's LinkedIn link
- **Goal:** the identity block is laid out the way Michael actually fills it in.
- **Size: L** · My time: ~15 min · **Confidence: Low** — the design does not exist yet.
- **Tasks (once the design exists):**
  1. Reorder `PROSPECT_DETAIL_FIELDS` — **the only enumeration of the 17** — plus the matching
     `.form-group` order.
  2. The four **conference fields grouped into a bordered block, off to the side. STILL VISIBLE.**
  3. **Notes taller, plus a pop-out expander.**
  4. **Company URL as a READ-ONLY derived display**, populated from the selected company's `website`.
     Not an input, no `data-pd-key`, no `commitProspectField()` path — so **not** an 18th editable
     field and **not** a P5 amendment.
  5. **LinkedIn renders as a link**, `target="_blank"` via `ensureUrlProtocol()`. It is currently a
     plain input and appears as a link nowhere in the app.
  6. The header-band subtitle duplicates the first-name field — decide whether it stays.
- **Done when:** every one of the 17 still reads, writes and repaints; the caret survives typing in
  Notes and Job Title; the company URL shows a real value on a prospect whose company has one.
- **Needs my eyes:** the whole design, up front.
- **Risk and fallback:** ⚠️ **2B.13 MUST SHIP FIRST.** The URL displays `company.website`, which is
  empty on nearly every existing company until 10a lands. Build this first and it renders blank
  almost everywhere and reads as a broken new field. **Brushes P5's field-order clause** — a
  one-clause amendment, proposed not applied. **Unblocks the tab-strip weight question**, which
  Michael deferred until this exists.

---

## Session 2B.19 — Add Company: the front door, and the domain normaliser

- **Compartment:** company create path + ProspectHub's companies directory · **covered by the
  cross-compartment exception granted 2026-09-02.**
- **Depends on:** nothing. **Blocks 2B.18**, which consumes `normaliseDomain()`.
- **Source:** Michael, 2026-09-02 — *"I need a '+ add company' button/module on prospect
  directory."* Investigating it found the reason it matters.
- **Size: M** · His time: ~8 min · **Confidence: High**

### ⚠️ THE FINDING THAT MAKES THIS A FEATURE AND NOT A BUTTON

**Vantage cannot create a company. There is no front door, and the app says so out loud:**

```js
function openCompanyModal(compId) {
  const c = state.companies.find(x => x.id === compId);
  if (!c) { alert("Please save the prospect first to create the company record."); return; }
  editingCompanyId = compId;          // the ONLY assignment in the file
```
```js
function saveCompany() { if (!editingCompanyId) return;   // edit-only, always
```

Companies exist **only as side effects** — of `resolveCompanyByName()` from a prospect form, of the
CSV import, or of a restore. **So the only way to make a company is to type a name into a prospect,
which is precisely the fork-prone path**, and that is the mechanism behind the four `SPL` records.
Giving companies a real front door is duplicate prevention, not convenience.

### Tasks

1. **`normaliseDomain(v)` — the shared helper this session exists to establish.** ⚠️ **CONSERVATIVE,
   BY MICHAEL'S DECISION 2026-09-02.** Lowercase · trim · strip `https://` / `http://` · strip a
   leading `www.` · strip a port · drop everything from the first `/`, `?` or `#` · strip a trailing
   dot. **Then keep every remaining label as-is.**

   ⛔ **DO NOT REDUCE TO TWO LABELS.** He asked for "always `domain.suffix`" and then chose the
   conservative rule when shown the failure: `bbc.co.uk` reduced to two labels is **`co.uk`**, and
   every UK company in the database collapses onto one identity. Doing it properly needs the Public
   Suffix List — ~15,000 entries and a **§4 new dependency**. **The accepted cost of the
   conservative rule is that `mail.acme.com` does not match `acme.com`** — an occasional MISS, which
   surfaces as a question rather than as a silent merge of two real companies. **A later session
   that "improves" this by collapsing labels is reintroducing the failure he rejected.**

   Proof obligation: `www.youravdept.com`, `youravdept.com`, `https://youravdept.com` and
   `https://www.youravdept.com` all return `youravdept.com`.

2. **A `#comp-domain` input in `#modal-company`.** ⚠️ **The modal has fourteen fields and no domain
   field** — the identity is currently unsettable and uneditable by hand. Add it, normalise on blur,
   show the normalised value back. Seed it from `#comp-website` when domain is blank.
3. **`openCompanyModal(compId = null)` gets a create branch.** Blank every field, clear
   `currentCompanyTags`, title "Add Company".
   ⚠️ **KEEP THE EXISTING ALERT FOR A BAD ID.** It is a dangling-reference guard and five call sites
   pass a real id. Only a **deliberate `null`** means create; an id that fails to resolve must still
   warn. Two different cases that today share one branch.
4. **`saveCompany()` gets a create branch**, pushing a record with a normalised `domain`.
5. ⚠️ **`saveCompany()` ENDS BY WRITING INTO THE PROSPECT MODAL** —
   `document.getElementById("pros-company").value = c.name;` — which is harmless today because the
   only way in is from a prospect. **From the directory it stomps the prospect form's Company box**,
   or throws if the element is not there. **Guard it.** This is the single most likely way this
   session ships something that looks fine and corrupts the other form.
6. **The domain uniqueness guard, at the point of creation.** Another company with the same
   normalised `domain` → **warn and offer to open that one instead**, on the
   `renderDuplicateEmailWarning()` pattern (P6). ⛔ Not a second modal. **Without this the new front
   door becomes a fourth way to make duplicates**, which would make the feature a net loss.
7. **The `+ Add Company` button** on ProspectHub's companies directory, beside `#companies-table`,
   matching the existing add-prospect affordance.

### Done when — pasted, not summarised

- **All four forms** of `youravdept.com` through `normaliseDomain()` → the same string. Pasted.
- `bbc.co.uk` → **`bbc.co.uk`**, unchanged. Pasted. (The regression test for the rule he rejected.)
- **"Your AV Department" created end to end through the new button**, with domain `youravdept.com`.
  Paste the record. **This is the live test case 2B.18 needs.**
- A second company on the same domain → **warned, not created**. Company count before and after.
- **Editing an existing company still behaves exactly as before** — the modal is shared, so this is
  the regression that matters. Open one from a prospect, change a field, save, re-read.
- **`openCompanyModal("no-such-id")` still alerts.** Pasted.
- **The prospect form's Company box is untouched** after creating a company from the directory.
- Console clean · `check_ids.py` at baseline · `CACHE_NAME` bumped.

- **Backup coverage:** creates records in `state.companies`, and adds a **hand-editable `domain`**.
  Covered by the ZIP bundle — `domain` is already an exported CSV column. **State it per §4.**
- **Needs his eyes:** the button's placement and label; the duplicate warning's wording.
- **Risk and fallback:** ⚠️ **THE MODAL IS SHARED WITH EDIT, so a create branch that forgets to
  reset one field leaks the last-edited company's value into the new record** — and it will be a
  field nobody looks at, like `postal` or `specialities`. **Blank from an explicit list of the
  fourteen ids, not by hoping.** ⚠️ `openCompanyModal` uses `alert()`, which **freezes an automated
  browser** (BUILD_NOTES) — stub it during verification.

## Session 2B.18 — Connect a contact to its company by email domain

- **Compartment:** company create path + the prospect **email** commit · **Covered by the
  cross-compartment exception granted 2026-09-02.** Nothing further is owed.
- **Depends on:** 2B.13 (done). **Should run before 2B.17**, which displays the company URL.
- **Source:** Michael, 2026-09-02, from using 2B.13 the same afternoon. Not the review pass.
- **Size: M–L** · His time: ~10 min · **Confidence: Medium** — the matcher is easy, the two
  interaction branches are where this can go wrong.

### What it is, in his words: *"make the connection of contact to company."*

**The deliverable is `prospect.companyId` pointing at the right record.** The name appearing in the
Company box is how you SEE the link happened; the URL is the company's and is already correct once
the link is. There is no new prospect field and no URL to write anywhere.

**THE CHANGE IS THE MATCH KEY, AND THAT IS THE WHOLE IDEA.** Vantage matches companies on **name**
(`resolveCompanyByName()`), and names are unstable — "Your AV Dept" and "Your AV Department" are two
records. **Domains are stable.** The email's domain becomes the identifier.

**Demonstrated in his own database 2026-09-02, then rolled back:**

```
Company "Your AV Department", website youravdept.com, already in Vantage.

michaelh@youravdept.com, Company box BLANK
   → prospect created, companyId EMPTY. No link at all.

michaelh2@youravdept.com, Company box "Your AV Dept"
   → 2 companies, same domain: ["Your AV Department", "Your AV Dept"]
```

**That second case is the four `SPL` records, reproduced in one keystroke.**

### Field semantics — SETTLED BY MICHAEL 2026-09-02, and this governs everything below

Three words were being used for two fields, one of which is invisible. That ambiguity is why the
first bug report took a diagnosis pass to place. It is now decided:

| | **`domain`** | **`website`** |
| --- | --- | --- |
| **Role** | **THE IDENTITY** | **The display** |
| Holds | A normalised bare host — `acme.com`. Lowercase, no scheme, no `www.`, no path | Anything clickable — `https://www.acme.com/contact`. Free-form |
| Unique? | **YES. This is the field "no two companies share a domain" is about** | No |
| Matched against | **Yes — the email domain matches THIS** | Fallback only, see below |
| Visible in the UI | **No** — no row, no column, no input | Company tab row, companies-table column, `#comp-website` |

**There is no field called `url`.** It is a word we use in conversation. 2B.17's "Company URL" is a
read-only *display* derived from `company.website`; it stores nothing.

⚠️ **THE FALLBACK TO `website` IS TRANSITIONAL AND MUST BE COMMENTED AS SUCH.** Match `domain`
first; fall back to a normalised `website` only when `domain` is empty or is obviously not a host.
This exists because **today's data has bad identities** (below), not because two identity fields are
the design. Phase 2C removes the need for it.

⚠️ **TODAY'S `domain` FIELD HOLDS THREE DIFFERENT KINDS OF THING, AND TWO OF THEM ARE NOT HOSTS:**

1. A real host, from `resolveCompanyByName()` when an email was present. **Correct.**
2. The literal string **`"domain.com"`** — the placeholder that function writes when there is no
   email. **Now actively harmful**: it is a fake identity, and every company created without an
   email collides with every other one on the identity key.
3. A **slug** like `spl-productions`, written by the **CSV import** (`domain: p.companyId`). At
   import scale this corrupts the identity field wholesale. ⛔ **Out of this compartment —
   Phase 2C** — but it is the reason the `website` fallback has to exist.

**2B.18 fixes (1) and (2) going forward and touches no existing record.** A company created with no
email gets an **empty `domain`**, not the placeholder — an absent identity is honest, a shared fake
one is not. Existing `"domain.com"` and slug records are left alone and are **input to Phase 2C's
collision report**, not something this session repairs.

### The behaviour table — decided by Michael 2026-09-02, do not re-open

Run the domain match **first**, then fall through:

| Domain matches | Company box | What happens |
| :---: | --- | --- |
| 0 | anything | Today's name-based path, unchanged, plus the website seed and name suggestion below |
| 1 | blank | **Link it and fill the name.** Silent — nothing was typed to contradict |
| 1 | resolves to the SAME company | Nothing to do |
| 1 | resolves to a DIFFERENT or new company | ⚠️ **WARN AND ASK.** "michaelh@youravdept.com belongs to **Your AV Department**. Link to it instead of creating *Your AV Dept*?" **He chooses. Nothing is created behind his back** |
| 2+ | anything | ⚠️ **SHOW THE MATCHES AND LET HIM PICK.** This is the only branch that surfaces the duplicates he already has |

**Domain wins, but it always asks before overriding something he typed.** He rejected the silent
version explicitly — an app that overwrites your typing feels like it is fighting you.

### ⛔ THE PLACEHOLDER IS IMPORT-ONLY. IT MUST NOT APPEAR ON A HAND-ENTERED PROSPECT.

Michael reversed my earlier draft on 2026-09-02 and the reason is a real workflow, not a preference:

> *"A real example could be a Conference Direct person I am working for on behalf of a national
> association. I want the person attached to the association not Conference Direct."*

**A person's email domain is not necessarily their employer.** Agencies, contractors, personal
addresses, people seconded to an association — he needs to attach a contact to whichever company he
says, and **the email domain must not argue with him.** So on the manual paths:

- **He picks a company (typed name or autocomplete) → link to it. Full stop.** Any email domain,
  blocked or not, matching or not. **No warning, no placeholder, no second-guessing.**
- **A company with no usable domain gets an EMPTY `domain`, not a placeholder.** He will see it and
  fix it — hand entry is low volume and he is looking right at it. Placeholders exist to make a
  *bulk* import triageable; they are noise on a form he is already filling in.

### ⛔ NEVER WRITE ANYTHING ONTO AN EXISTING COMPANY FROM A PROSPECT'S EMAIL

> *"I don't want any blocked or unresolved domains affiliated with any existing companies."*

Attaching `jane@conferencedirect.com` to the association must leave the **association's** record
untouched — its `domain` stays `naofx.org`, its `website` stays whatever it is. **The prospect's
email never edits the company it is attached to.**

⚠️ **THIS CONSTRAINS 2B.18's ORIGINAL "ORDERING FIX", AND THE TWO RULES GENUINELY PULL APART.** The
reported bug was Company-then-email leaving a brand-new company's website empty forever. The fix was
"seed it when the email commits." Under the rule above that is dangerous — the linked company may be
long-established and unrelated to the sender's domain.

**Resolved with three conditions, ALL of which must hold before an email seeds a company:**

1. The company's `domain` is **empty** — never a placeholder, never an existing value; **and**
2. **This prospect is that company's ONLY contact** — a company with other people attached is
   established, and nothing a single new contact types may edit it; **and**
3. The email's host is **not** on `FREE_EMAIL_DOMAINS`.

That reaches the company the user just created moments ago on this very form — which is the whole of
the reported bug — and reaches nothing else. **Logged as a reversible decision (DIRECTIVES §5.3),
and on the Needs-his-eyes list.**

⚠️ **AUTOMATIC linking keys on the DOMAIN ONLY. A human explicitly picking a company from the
autocomplete still works by name** — otherwise typing "Stripe" when Stripe exists creates a second
Stripe. The behaviour table above is the automatic path; explicit selection is not it, and explicit
selection always wins.

### Tasks

1. **`normaliseDomain(v)` is BUILT IN 2B.19 AND CONSUMED HERE.** Do not write a second copy. Its
   rule is in that session's entry; the short version is that it is **conservative — it strips
   `www.` and nothing else label-wise.**
2. **`companiesByEmailDomain(email)`** returning an **array**. **`domain` is the match key**;
   normalised `website` is a **transitional fallback** for records whose `domain` is empty, is
   `"domain.com"`, or is a slug. Comment it as transitional and name Phase 2C as what removes it.
   **Checking only one field silently fails on most of his real data** — for opposite reasons on
   the two halves.
2b. **`resolveCompanyByName()` writes a normalised `domain`, and writes it EMPTY when there is no
   email** — the `"domain.com"` placeholder stops being written. ⚠️ **`domain` stays an exported CSV
   column and keeps its name**; only the value written to NEW records changes. Existing records are
   not touched.
3. ⚠️ **CALL IT BEFORE `resolveCompanyByName()`, WHICH CREATES A COMPANY AS A SIDE EFFECT.** This is
   the same ordering rule contract P6 already enforces for the duplicate-email check, and for the
   same reason: resolving first means every warning leaves a stray company behind. BUILD_NOTES
   records this trap; it now has a second instance.
4. **The blocklist gates the matcher, not just the seed.** `FREE_EMAIL_DOMAINS` — gmail, outlook,
   hotmail, yahoo, icloud, aol, proton/protonmail, gmx, live, msn, me.com, mac.com. Without it, one
   company accidentally created with `domain: "gmail.com"` becomes the employer of every personal
   address in the database. **Michael's own `youravdept.com` is NOT on this list** — it is a real
   company he wants matched; it was only ever proposed for the *website-seed* blocklist and that
   proposal is withdrawn.
5. **The warning UI is a REUSE, not an invention.** `renderDuplicateEmailWarning()` /
   `hideDuplicateEmailWarning()` (P6, Session 2B.7) already put an inline warning with an action
   inside `#modal-prospect`, and `hideDetailEmailWarning()` does the same in the detail view. Build
   both new branches on that pattern. ⛔ **Not a second modal** — the 2B.15 rule applies here too.
6. **The multi-match picker is a list inside that same warning block**, not a new surface.
7. ⚠️ **IT FIRES WHEN THE EMAIL IS ENTERED, NOT AT SAVE. Michael asked for this explicitly:**
   *"I want the company name to get entered immediately after I enter the email address."* So the
   trigger is a **`change`/`blur` listener on `#pros-email`** that fills `#pros-company` **while the
   form is still open** — he tabs out of Email and the company is simply there. In the detail view
   the equivalent already exists: `commitProspectField()`'s `email` branch.
   **`saveProspect()` keeps a backstop call** for the case where the field never blurs (paste, then
   click Save directly) — but the backstop is not the feature, and a session that only implements
   the Save-time version has not built what he asked for.
8. ⚠️ **NEVER SILENTLY RELINK A PROSPECT THAT ALREADY HAS A COMPANY.** Editing an existing record's
   email must not move it to a different employer without asking. Same warning, same choice.
9. **Carried from the earlier draft of this session, all still wanted:** the website seed from the
   email domain on the 0-match path; the offline **name suggestion** from the domain
   (`spl-productions.com` → "Spl Productions"), only into a blank box; a **"Look up"** button
   opening a web search in a new tab; and **removing the dropdown arrow** with
   `::-webkit-calendar-picker-indicator { display: none }` **scoped to `#pros-company` and
   `#pd-company` by id — NOT a bare `input[list]` rule.** Verified working 2026-09-02: the arrow
   goes, filtering and scrolling stay. ⚠️ Not in the `🧱 HUB SHELL` block (contract S5).

**THE DIRECTION MICHAEL SET, 2026-09-02:** *"Eventually, there should be no different companies
sharing the same domain."* **That means unique on `domain`, the identity field.** **2B.18 stops NEW ones** — that is what the warning and the picker are
for. **It does not merge the ones already there**, and must not try: that is **Finding 10b**, which
is already scoped for **Phase 2C** as normalised host-only uniqueness with a **collision report
before enforcement**, and merging existing duplicates is its own §4 decision. This session makes the
collision report worth running; it is not the report.

⛔ **NO ONLINE LOOKUP.** A browser cannot read another site's page (CORS), so it needs a third-party
enrichment API — a **§4 new dependency** whose key would sit in client-side JS in a **PUBLIC repo**.
**Phase 4**, on a Cloud Function. Michael accepted this and chose the offline route. Do not revive it.

### Done when — every one pasted, not summarised

- **His scenario, end to end:** "Your AV Department" (website `youravdept.com`) in Vantage, then
  `michaelh@youravdept.com` typed into the **Email** box with **Company blank** → **the Company box
  fills the moment Email loses focus, before anything is saved.** Paste the box's value read
  immediately after the blur, and the resulting `companyId`. **Reading it after Save does not
  demonstrate this** — the whole request is that it happens in the form.
- **The conflict branch:** same email, Company box typed as "Your AV Dept" → **the warning appears
  and no second company is created**. Paste the company count before and after. Screenshot it.
- **The multi-match branch:** two companies on one domain → both offered. Screenshot.
- **Match on `domain` alone**, against a company whose `website` is empty. Pasted. This is the one
  that proves it works on his real data.
- **A blocked domain matches nothing:** `x@gmail.com` → no link, no warning. Pasted.
- **An existing prospect's email edited to a new domain does NOT silently relink.** Pasted.
- 0-match path still seeds the website; name suggestion only fills a blank box; "Look up" opens the
  right search; **no arrow on either input and type-ahead still filters and scrolls.** Screenshots.
- Console clean · `check_ids.py` at baseline · `CACHE_NAME` bumped.

- **Backup coverage:** `state.companies` modified on the 0-match path; **`prospect.companyId`
  modified** on the match paths. Both covered by the ZIP bundle — no new field, no new store. **Say
  so in the summary per §4.** ⚠️ **Still NOT the bulk back-fill he declined**; that stays declined.
- **Needs his eyes:** the warning's wording, and the suggested-name format on a hyphenated domain.
- **Risk and fallback:** ⚠️ **`commitProspectField()` repaints only what depends on the field
  (P5).** The email commit now changes `companyId`, so the Company box, the header subtitle and the
  Company tab can all go stale. Repaint those specifically; **a full view render is exactly what P5
  exists to prevent** — it destroys the caret. If the detail-view branch proves too entangled, ship
  the modal branch first and leave the detail view on today's behaviour; the two are independent.

## Estimate

| | |
| --- | --- |
| **Sessions** | **7**, plus the close |
| **Mix** | 1 L · 4 M · 2 S |
| **My attention** | **~57 min**, plus 20 for the close → **~77 min** |
| **Against the forecast** | The phase plan forecast **13–14 sessions** against 10 planned, expecting the review to produce 3–4. It produced **7**. Above the band — and the honest reading is that the +35% contingency was too small, not that this pass over-reported. Six of the seven trace to defects or decisions, not preferences. **Say this plainly in 2B.10's calibration.** |
| **Most likely to overrun** | **2B.17** — the design does not exist, so the estimate is a placeholder. Runner-up **2B.14**: the change is one word per function but it spans eight sites across three hubs, and its failure mode (Title silently keeping AND) is invisible. |

---

## Phase 2C — deferred, needs its own intake

A coherent theme, and **not** 2B's. Do not smuggle these in as backlog.

- **Finding 9** — task-completion reachout defaults to `"Email"`; add `"Task"` as a counting reachout
  type, with the migration and the restore-wipe protection.
- **Finding 10b + 15** — company uniqueness, host-only. ⚠️ **KEYED ON `domain`, NOT `website` —
  Michael settled the field semantics on 2026-09-02 and this entry's original wording is
  SUPERSEDED.** `domain` is the identity (normalised bare host, unique); `website` is free-form
  display. **Collision report before enforcement**; merging existing duplicates is a separate §4
  decision. **The report must expect three shapes in `domain`**: real hosts, the literal
  `"domain.com"` placeholder, and import slugs like `spl-productions` — the last two are false
  identities that will look like enormous collision clusters and are not.
- **The CSV import writes the identity field wrong, at scale.** It sets `domain: p.companyId`, which
  is a slug whenever the sheet has no website column, and it **never reads the prospect's email**.
  Now that `domain` is the identity this is the single largest source of bad identities in the
  database. Belongs with 10b — the fix and the collision report want to land together.
- **Finding 10d** — opening duplicate companies to compare. ⚠️ **Still unconfirmed with Michael**, and
  if it means a company detail view it is out of scope for 2B entirely.
- **Finding 12** — the reachout modal overflows; `#modal-choose-tags` already carries the fix pattern.
- **MediaHub and CampaignHub tag semantics** — if 2B.14's exception is declined, they land here.
- **The Audience Query Engine** — tag choosers, plus its joined-string matcher, which produces silent
  false positives across tag boundaries. **Correctness, not tidy-up.**

## Still owed by Michael

1. ~~**The P8 revision**~~ — **APPROVED 2026-09-03 and APPLIED** to `phase-2b-prospect-detail-view.md` §P8 at the 2B.15 close. The tag filter is the shared pop-out; the accessor and the wrapper id are unchanged. **2B.15 is done.** Two design points went with it, both Michael's: the confirm button reads **"Apply Filter"** in filter mode (it saves nothing), and the **"Create a New Tag" block is hidden** there (a tag nobody carries filters to zero rows).
2. ~~**The cross-compartment exception**~~ — **GRANTED 2026-09-02, full scope.** It covered 2B.13 and covers 2B.14 and 2B.18.
3. **The ID layout design** — gates 2B.17.
4. **`LA` = Louisiana or Los Angeles** — 2B.11 asks, and can start without it.
5. **10d's meaning** — one word.
6. Three carried cosmetics from 2B.4, raised twice, unanswered. Leaving them is a valid answer.
