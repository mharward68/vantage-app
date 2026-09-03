# Phase 2B — Review Pass Findings

**Opened:** 2026-09-01 · during the review pass that blocks Session 2B.10
**Status:** ✅ **PASS COMPLETE** — closed 2026-09-01. Parts A, B and C all walked.
**Method:** `ai/phases/phase-2b-REVIEW-PASS.md`
**Reviewer:** Michael, at the live app · findings diagnosed against source in the same session

> **Fifteen findings**, one withdrawn (13). A6 and Part B produced **no new findings** — see below.
> **Sessions can now be numbered off this file.**

---

## The screen's job, in Michael's words

> **"Confirm the contact I am reading and editing."**

Said at A3 when asked where his eye landed. Better than anything in the plan, and the thing to judge
every later change to this surface against.

---

## Validated by use — not findings, but worth more than findings

- **Assumption 4 (field-level commit, no Save button) is CONFIRMED.** Michael edited a live record,
  navigated back to the previous query results, and the change was already there. *"I love it. No
  need for save button. That's the way it should be."* **This retires phase Open Risk 6**
  ("field-level commit on the app's busiest screen"). No Save button, no `blur` fallback.
- **P4's landing tab is right.** Interactions first, Tasks close. Confirmed by use.
- **The duplicate-email guard works, and its wording is accepted.** Michael hit it by accident — the
  best kind of test — and reported it works perfectly. **Carried unanswered since 2B.7. Closed.**
- **Banked review Finding 2b (mouse back button) is DEAD.** Michael walked all four entry points and
  reached for the mouse back button **zero times**. *"In some cases it would be nice but that is one
  I can live with."* **P9's routing ban stands; no scope amendment needed.** A scope amendment
  retired on evidence rather than argument.

---

## Two plan revisions are required

Neither is a session decision. Both need Michael's explicit amendment.

1. **Contract P8 is revised** — Finding 6. ProspectHub's tag filter moves off the Advanced Query
   picker onto the shared pop-out chooser.
2. **Finding 5 leaves this phase's compartment.** MediaHub and CampaignHub tag filters must change
   for the rule to hold app-wide, and neither is Phase 2B's. One session across all surfaces is the
   only way to stop them disagreeing — but that is an authorised exception, not a scope widening.

**Two softer contract touches**, both one-clause amendments, nothing like P8: Finding 7 brushes P5
(*"in the field order of `#modal-prospect`"*), Finding 8 brushes P4 (which writes the six tab rows in
a specific order).

---

## Finding 1 — Geography search: no abbreviations, misleading placeholder, West Virginia bleed

**Seen:** `VA` returns **0 contacts, 0 companies**. `Virginia` returns **56 and 77**. Screenshotted on
the production database.

**Cause** — `app.js` 3611–3618 (contacts), 3443–3455 (companies):

```js
matchGeo = geoTerms.some(term => {
  if (term.length === 2) {
    return stateStr === term;        // strict equality, state field only
  }
  return loc.includes(term) || city.includes(term) || stateStr.includes(term);
});
```

No abbreviation↔name mapping anywhere. Michael's `state` field holds **full names**, so a 2-char term
can never match. Fails both ways: `Virginia` never matches a record holding `VA`.

**Three defects in one matcher:**

1. **No abbreviation support** — the above.
2. **The placeholder advertises unsupported syntax.** `index.html` 248 reads
   `"Geography (e.g. VA, MD, DC)..."` — instructing the user to type the one thing that cannot match.
   Ladder 2: the control lies about what it does. This is why it reads as broken rather than limited.
3. **`Virginia` matches West Virginia.** For terms >2 chars, `stateStr.includes(term)`, and
   `"west virginia".includes("virginia")` is `true`. Silent, present in the shipped 56.

**Do NOT fix by dropping the 2-char branch.** It exists for a reason: `"va"` is a substring of
Ne**va**da, Syl**va**nia, **Va**ncouver. Loosening it makes `VA` return Nevada.

**Fix:** a 50-state abbreviation↔full-name map. Expand each term to both forms and compare whole
state values rather than substrings — resolves all three, **no stored data changes**.

**Third copy, out of bounds.** Same matcher at `app.js` 10919 in the **Audience Query Engine**
(`#query-geography`), deferred. Fixing ProspectHub means the two surfaces understand geography
differently until the Engine is un-deferred. **Accepted divergence — must go into `BUILD_NOTES.md`.**

**Size:** S–M · ProspectHub directory · in scope

---

## Finding 2 — Column-resize cursor near-invisible in light mode

**Seen:** the `col-resize` glyph turns grey against the light-purple header and nearly disappears.
Photographed straddling the boundary: solid black above the header, grey on it. **Dark mode is fine**
— photographed, crisply visible.

**Cause:** the Windows resize cursor is drawn with a mask and takes colour from what's underneath.
Against the light header it resolves near the header's own luminance.

**NOT occlusion.** The OS composites the pointer above everything the page paints. The reorder drop
line is `z-index: 300` and reorder was confirmed working. **Do not chase the stacking context.**

**Fix:** a custom cursor bitmap — `cursor: url("data:image/svg+xml,…") 12 12, col-resize`. Black glyph,
white halo, renders identically on light purple, dark blue and the pale gap, because it no longer
depends on the background. Data URI keeps it in `style.css`, no new file, no build step. Get the
**hotspot** right (a wrong one makes the drag feel offset) and stay at **32×32**. The `, col-resize`
fallback is mandatory.

**All three tables.** Confirmed on the Companies header by photo and by code.

**Size:** XS · shared column-layout machinery (2B.2) · in scope

### Finding 3 (folded into 2) — cursor falls to `pointer` mid-drag, TaskHub only

**Not perceptible to Michael; real in the code.** Reproduced from live values:

```
TASKHUB
1. HOVER divider @716   body:(none)      th inline: col-resize  th computed: col-resize
2. MOUSEDOWN @716       body: col-resize th inline: col-resize  th computed: col-resize
3. DRAG to 756          body: col-resize th inline: (none)      th computed: pointer   ← 
4. MOUSEUP              body:(none)      th inline: (none)      th computed: pointer
widthChanged: 339 → 379 (resize itself correct) · restored: true

PROSPECTHUB (baseline th computed cursor "auto", no class)
3. DRAG +40             body: col-resize th inline: (none)      th computed: col-resize ← holds
```

**Cause:** the thead `mousemove` at `app.js` 5805 keeps firing during a resize and unconditionally
rewrites the cursor — nothing checks whether a resize is in flight:

```js
hitTh.style.cursor = layoutResizeTarget(hitTh, e.clientX) ? "col-resize" : "";
```

ProspectHub headers have no cursor rule so they inherit body's `col-resize` and it holds; TaskHub's
`.taskhub-sortable` (`style.css` 262) sets `cursor: pointer` and wins. It *blinks* because the pointer
keeps re-crossing dividers as it drags.

> ⚠️ **TRAP — a custom bitmap does NOT fix this.** At step 3 the inline cursor is wiped and
> `.taskhub-sortable`'s `pointer` wins regardless of body. A session building only Finding 2 will look
> correct on ProspectHub — the surface anyone would naturally test — and still blink on TaskHub.
> **Two independent fixes, same handler.**

**Fix:** a guard so `mousemove` skips the cursor while a resize is live. XS, rides with 2.

---

## Finding 4 — ProspectHub filter fields full-width; cap at Row 1's width

**Seen:** geography and tag fields span the whole card while the name/company/title search is narrow.
Direct consequence: the tag picker's **`+ Add` sits ~1,700px from the tag label.**

**Cause:** one inline style and an omission.

```html
<div class="search-box-wrapper" style="flex: 1; max-width: 400px; margin: 0;">  <!-- Row 1 -->
<div class="search-box-wrapper">                                                <!-- Row 2 -->
<div class="search-box-wrapper" id="prospect-tag-chooser">                      <!-- Row 3 -->
```

**No `.search-box-wrapper` rule exists in `style.css`** — only `.search-box-wrapper input
{ width: 100% }`. Row 1 is 400px solely from a hand-written inline style. Predates this phase.

**Decision:** cap all three at **400px** via one CSS rule, folding Row 1's inline style into it so the
widths come from one place. Michael: *"You could narrow it to 250 and it would be fine"* — chip
wrapping at 400px is a non-issue.

**Dependency:** if Finding 6 ships, Row 3 becomes a button and its width stops mattering — Rows 1 and
2 still need this.

**Size:** XS · pure CSS · ProspectHub directory · in scope

---

## Finding 5 — Include semantics: OR within a picker, AND across pickers

**The rule, in Michael's operational wording** — recorded this way because the AND/OR labels were
being used inconsistently and this version cannot be misread:

> **Adding a term never reduces the result count.** Multiple selections broaden; they never narrow.

**Evidence — Advanced Query, two prospect tags.** `7-7-26 Auto-eight` + `Tumbler Audience`, both
included → **1 result** (Michael Harward, who holds both). **Expected 11.**

> **Scope note:** both terms are **prospect tags**. The test demonstrates the **tags picker only**.
> Extending OR to the other four pickers is Michael's design decision, **not something this test
> proved.** Do not repeat it as evidence about audiences.

**This reverses shipped, reviewed behaviour — it is not a regression fix.** 2B.9's Done-when verified
narrowing (`"test"` → 4, `+ "Fintech"` → 1) and it passed review. Recorded so nobody reads the change
as repairing a break and goes hunting for one.

| Surface | Function / line | Compartment |
| --- | --- | --- |
| AQ modal — Title | `matchesIncludeExcludeSmart` 8134 | AQ modal · in scope |
| AQ modal — Tags, Campaigns, Audiences, Industry | `matchesIncludeExclude` 8097 | AQ modal · in scope |
| AQ modal — company tags text field | `matchesTagsFilter` 7898 | AQ modal · in scope |
| ProspectHub — prospect tags | 3624 | ProspectHub · in scope |
| ProspectHub — company tags | 3631, 3464 | ProspectHub · in scope |
| ProspectHub — both-lists branch | 3642 | ProspectHub · in scope |
| **MediaHub tag rail** | 7389 | ⚠️ **outside 2B — backlog** |
| **CampaignHub tags** | 9867 | ⚠️ **outside 2B — backlog** |
| **Audience Query Engine** | 10929, 10935 | deferred — see below |

**Cross-picker stays AND.** Each picker is its own `if (!matches…) return false`: *anyone in tag A
**or** B, who **also** holds tag X **or** Y, who is **also** a VP **or** Director.*

> ⚠️ **TRAP — TWO functions, not one.** `matchesIncludeExclude` (8097) and
> `matchesIncludeExcludeSmart` (8134). Both `.every()`. Change one and **Title silently keeps AND**,
> passing any spot-check that doesn't use Title.

**Exclude is already correct** — both use `.some()`, which stays right under OR. The carried question
*"should hub filters offer exclude at all"* is **CLOSED: no.** Include/exclude belongs in Advanced
Query; hub filters are include-only.

**Acceptance test, Michael's own:** `7-7-26 Auto-eight` + `Tumbler Audience` both included →
**11 results, Michael Harward appearing once.**

**Separately — the Audience Query Engine doesn't compare tags at all.** `app.js` 10929:

```js
const tags = (p.tags || []).join(" ").toLowerCase();
if (!tags.includes(prospectTagsQuery)) return false;
```

Multiple tags are **unexpressible**, and it **matches across tag boundaries** — `["Meeting","Planner"]`
joins to `"meeting planner"` and is returned by a query for `meeting planner` though the prospect
carries no such tag. **Silent false positives in the surface used to build a list you then email.**
Deferred with the Engine; Michael wants tag choosers built there when it is un-deferred. **File as
correctness, not semantics tidy.**

**Size:** M in-compartment · 2 backlog items · deferred work

---

## Finding 6 — ProspectHub tag filter → pop-out chooser · **P8 REVISION**

**Seen:** `+ Add` is across the screen (Finding 4), and Michael wants a checkbox beside each tag. He
prefers a pop-out like MediaHub's "Choose Associated Tags", provided results show on close as they do
on **Save Tags**.

**Contradicts frozen contract P8**, which specifies `#prospect-tag-chooser` **is** the Advanced Query
picker. Flagged and stopped. **Michael has chosen the pop-out; P8 needs formal revision first.**

**Three things make it cheap:**

1. **P8 contains its own escape hatch** — *"the id is the contract, the widget is not."* 2B.9 built to
   it: **`prospectTagFilterTerms()` is the single accessor.** A new widget feeds that one function;
   `renderProspectsView()` doesn't change.
2. **The pop-out already exists and already knows about prospects.** `#modal-choose-tags` is generic —
   `renderTagsChecklistGrid(availableTags, selectedTags)` takes any list, and `saveChosenTags()`
   already branches on `tagSelectionTarget === "prospect"` beside `"campaign"` and `"media"`. A
   **fourth target**, not a new modal — the same "reuse, not invention" argument 2B.9 used.
3. **The pop-out is already the house pattern. 2B.9's picker is the outlier:**

   | Surface | Control |
   | --- | --- |
   | MediaHub — assign tags | `#modal-choose-tags` |
   | CampaignHub — assign tags | `#modal-choose-tags` |
   | `#modal-prospect` — assign tags | `#modal-choose-tags` |
   | **Prospect detail view** — `✏️ Choose Tags` (2B.3, `btn-pd-edit-tags`) | `#modal-choose-tags` |
   | **ProspectHub directory — filter by tag** (2B.9) | **AQ inline picker** ← only one |

   Not reversing a judgment on taste: 2B.9 adopted the widget used in one other surface when four
   already shared a different one. **Durable — belongs in `BUILD_NOTES.md` regardless.**

**Open design point:** the modal's job today is *assigning* tags (a write). As a filter chooser its
**Save Tags** button means "apply filter." Label and empty state need a decision — not a blocker, but
not to be improvised in the session.

**Advanced Query's chooser is NOT touched.** Stated twice by Michael. Only semantics change.

**Size:** M · **P8 revision required first**

---

## Finding 7 — Identity block layout redesign · **DEFERRED BY MICHAEL**

**Wanted:** first name, last name, then title underneath, company underneath, etc. Michael:
*"Glad to do that later if it makes sense"* — and later, that he'd rather get further along with an
actual ID design before deciding the things that depend on it.

**Mechanically cheap.** `PROSPECT_DETAIL_FIELDS` is the **only** enumeration of the 17 — the fill loop
reads it and the commit path reads `data-pd-key` off the touched control. Reordering is reordering
rows in one array plus the matching `.form-group` order.

**Brushes P5**, which says fields render *"in the field order of `#modal-prospect`."* One-clause
amendment — amend deliberately, or the two surfaces silently disagree about which order is canonical.

**Three things fold into this session as inputs:**

- **Notes gets taller, plus a pop-out expander** (Part B, 2026-09-01). Michael: *"I will make the
  note section taller on the redesign and likely add a pop out function."*
- **The four conference fields STAY VISIBLE.** Michael: *"I'm not living with it. I want to keep those
  visible. I'll probably clean it up by putting them off to the side inside a shape (purely cosmetic
  fix)."* ⚠️ **Collapse and disclosure were offered and REJECTED.** Written down explicitly because
  the banked Company-tab finding *is* a collapse pattern, and without this note a later session would
  reasonably assume the two should match. **They must not.**
- **The tab strip's visual weight.** Michael would bring it down slightly to give the ID section more
  room — but wants the ID designed first. **Blocked on this finding, not unanswered.**
- **The name renders twice** — header-band subtitle and the First Name field. Michael's eye goes to
  the field. Whether the subtitle earns its space is an ID-section decision.

**Size:** M when it runs · ProspectHub detail view · in scope

---

## Finding 8 — Tab order

**New order:** Interactions, Tasks, **Company**, **Sequences**, Audiences, Campaigns.

Company to 3rd, Sequences to 4th. Consistent with the screen's stated job: Interactions and Tasks are
"what's happening with this person," Company is the next reach; Audiences and Campaigns are
list-management, a different mode.

**Mechanically one array.** `PROSPECT_DETAIL_TABS` is the single source for the strip and the bodies.
**Brushes P4**, which writes the six rows in a specific order — one-clause amendment.

**Noted, Michael's call:** this puts the **disabled** Sequences tab mid-strip rather than parked at the
end. Right once Phase 3 enables it; slightly odd until then.

**Pairs with the banked Company-tab collapse finding** — both change that tab, so one session.

**Size:** XS · in scope

---

## Finding 9 — Task-completion reachout defaults to "Email" · **BACKLOG · DATA CORRECTNESS**

**Seen:** completing a task and ticking "also log as reachout" writes a history entry typed
**`"Email"`** unless the dropdown is changed by hand.

**Cause** — `resetTaskReachoutBlock()`, `app.js` 4444–4451:

```js
const selectable = (state.reachoutTypes || []).filter(t => !NON_REACHOUT_TYPES.includes(t));
...
sel.value = selectable[0] || "";     // ← whatever happens to be first
```

`state.reachoutTypes` seeds as `["Email","Call","Campaign","LinkedIn","In-Person",…]`;
`NON_REACHOUT_TYPES` strips the three bookkeeping types; `selectable[0]` is **"Email"** — first in the
seed array, chosen by nobody.

**Not cosmetic.** That type feeds `isRealReachout()` → `getLastReachoutDate()` and the dashboard
counts. A mistyped reachout moves the numbers decisions are made from.

**DECISION — Michael:** *"I like that reachout is quantifiable. Adding 'task' and then making that the
type for reachout add from a task is the right solution."*

- Add **`"Task"`** as a real reachout type — **NOT** in `NON_REACHOUT_TYPES`, so it counts.
- It becomes the default type when logging a reachout from a completed task.
- **Name confirmed as `"Task"`.** The `"Task"` / `"Task Completed"` similarity was raised — one counts,
  one is excluded, differing by a word. Michael chose to keep `"Task"`. **Not an oversight; do not
  re-open it as one.**

**Implementation requirements:**

1. **Migration required.** `state.reachoutTypes` is seeded at `app.js` 1409; the three later additions
   each have an `if (!includes(...)) push(...)` in the defaults path. `"Task"` needs the same or
   existing databases never receive it.
2. **The restore trap, already documented at line 1419.** `restoreSettingsFromCSV()` replaces
   `state.reachoutTypes` **wholesale** (2679). Restoring a pre-change ZIP drops `"Task"` while history
   entries typed `"Task"` remain, pointing at a type the list no longer holds. `ensureStateDefaults()`
   always runs post-restore, so the migration line re-adds it. **This is why the other three have it.**
3. **Backup coverage: YES.** `reachoutTypes` exports as `Reachout Type` rows in the settings CSV
   (2061). No new export or restore work.
4. **The default must go regardless.** No pre-selection — a placeholder, and ticking the box without
   choosing either blocks or falls back. Same class as the geography placeholder: a control asserting
   something the user never said.

**Historical mistyped entries — DECIDED: leave them.** Michael: *"Gotcha. Leave it. That's fine."*
Every reachout already logged this way is typed `"Email"` in `p.history`. The Email count will not
drop when this ships. Correcting them retroactively is a §4 destructive change needing its own
rollback plan. **Not scheduled.**

**Compartment:** the task editor is Phase 1's surface, not 2B's → **backlog**, flagged as data
correctness rather than cosmetics.

---

---

## Finding 10 — Duplicate company records · **BACKLOG** · logged 2026-09-01

**Seen in production:** `SPL Productions` (AV company tag) · `SPL` · `SPL Productions` (Chicago) —
three records for one company. Also `YourAVdept` and `Your AV Department`, **both holding the URL
`youravdept.com`.** Michael: *"I don't want to expressly block this from happening but I do want to
discourage it."* Discourage, not prevent — that framing governs every sub-item below.

**Root mechanism:** `resolveCompanyByName()` (`app.js` 6568) matches on **exact name**,
case-insensitively, and **mints a new company on any miss**. Typing `SPL` where `SPL Productions`
exists creates a second record silently. Nothing warns.

### 10a — `domain` and `website` are two fields for one concept

**`resolveCompanyByName()` seeds `website: ""`, and that empty string defeats the existing
back-fill.** `ensureStateDefaults()` at 1443 already says:

```js
if (c.website === undefined) c.website = c.domain || "";
```

`""` is *defined*, so it never fires. Meanwhile the seed derives
`domain: (email||"").split("@")[1] || "domain.com"`. Net effect — **the email-derived value lands in
`domain`, which nothing displays and no editor writes; `website`, the field shown in the Companies
table and edited at `#comp-website` (11379), stays empty forever.** This is Michael's *"email does not
populate company website."*

The app already treats the two as interchangeable — Advanced Query searches both (8475), the CSV
exports both (8903). `domain` is effectively **write-once at creation and otherwise vestigial**.

**Fix is one line** (seed `website` from the same derived value), plus a decision about whether the
two fields should be reconciled at all. **Do not "tidy" by deleting `domain`** — it is exported, and
dropping a CSV column is a restore-compatibility change.

### 10b — Block two companies sharing the same URL

Michael wants this to work like the P6 duplicate-email guard: refuse, name the existing record.

**Key it on `website`, not `domain`.** `website` is the field he populates and the one holding
`youravdept.com` twice. `domain` carries the literal fallback string **`"domain.com"`** on every
company created without an email — a rule keyed on `domain` would refuse the second such company and
blame the wrong thing. **Requires URL normalisation** (`https://`, `www.`, trailing slash, case)
before comparison, or `youravdept.com` and `https://www.youravdept.com/` read as different.

**No new persisted field needed** — `website` exists. P9 is not violated.

### 10c — Populate the company autocomplete · **HALF-BUILT, NOT MISSING**

```html
<input type="text" id="pros-company" placeholder="Stripe" list="companies-datalist">
<datalist id="companies-datalist"></datalist>          <!-- index.html 1497-1498 -->
```

The input is **already wired** to a datalist and **nothing in `app.js` ever populates it** — zero
references. An earlier note called this "dead markup"; it is unfinished markup, which is a different
thing and a much cheaper one. Filling it targets exactly the path that produced the three SPL records.

⚠️ **`#pros-company` is the CREATE modal only.** The detail view uses `#pd-company`, which has no
datalist at all. **Both need it or half the leak stays open.**

This is the "discourage" half of Michael's framing, and the cheapest item in the whole cluster.

### 10d — Open the duplicates to compare them

⚠️ **NEEDS ONE WORD FROM MICHAEL.** Logged as *"I want to be able to open iterations."* Read as: click
each duplicate company record to compare and decide which to keep. **Not confirmed.** Note that a
**company detail view is explicitly out of scope** for Phase 2B (scope §3, Assumption 7) — if that is
what this means, it belongs to a later phase, not the backlog.

**Compartment:** company records and the create path — **outside 2B** → backlog. 10c is the exception
worth pulling forward if a ProspectHub session is open anyway.

---

## Finding 11 — Company URL in the prospect ID section · **READ-ONLY, DERIVED**

**RESOLVED 2026-09-01.** Michael: *"I am fine to make the company URL read only. However it can
populate with a Lookup with company is selected."*

- **Read-only display**, not an input. Populates from the selected company's `website` when the
  company is chosen.
- **Editing happens in the company slider**, so a prospect screen never mutates a record other
  prospects share. That was the whole problem and this closes it.

**Lighter P5 touch than first sized.** P5 enumerates **17 *editable* fields**. A read-only derived
display is not one — no `data-pd-key`, no `commitProspectField()` path, no 18th row in
`PROSPECT_DETAIL_FIELDS`. A note in P5's table is courtesy, not an amendment.

> ⚠️ **SEQUENCING — 10a MUST SHIP FIRST, OR THIS SHIPS INTO AN EMPTY COLUMN.**
> This field displays `company.website`. Per **10a**, `resolveCompanyByName()` seeds `website: ""`,
> which defeats the back-fill at `app.js` 1443 — so **most existing companies hold an empty
> `website`** while the email-derived value sits unseen in `domain`. Build 11 before 10a and it
> renders blank on nearly every prospect, and it will read as "the new field is broken" when the
> actual fault is a one-line seed. **10a → 11.**

**Also applies:** Finding 14 — it is an external URL, so `target="_blank"` via `ensureUrlProtocol()`.

---

## Finding 13 — ~~Lock company name + URL~~ · **WITHDRAWN, SUPERSEDED**

**Kept as a record so it is not re-proposed.** The original proposal was to lock both the company name
and URL on the prospect ID section, click opening the company slider.

**Withdrawn because Michael's model is better and is already the code.** He restated the intent as:
*"it's either a select existing company that populates while typing or it becomes a unique entry and
Nate becomes the only contact in that company."*

That is **precisely what `resolveCompanyByName()` already does** — exact case-insensitive name match
returns the existing company; a miss mints `comp-${Date.now()}` with this prospect as its only
contact. Both branches exist and are correct.

**What is actually missing is UI, not model.** The "pick the existing one" branch has **no
affordance** — nothing shows that `SPL Productions` exists while you type `SPL` — so the mint branch
is the default by accident. That is **10c**, and it is the whole fix for the name.

**What the withdrawal avoids:** locking `#pd-company` would have removed prospect **reassignment**
(the only way to move `Nate Dillion` from `SPL AV` to `SPL Productions` from this screen), and would
have conflicted with 10c by removing the input the autocomplete needs.

**The name/URL asymmetry, which is why only the URL is read-only:**

| | Typing does what | Safe? |
| --- | --- | --- |
| Company **name** | **Reassigns** — repoints `prospect.companyId`. Touches no shared record. | ✅ editable |
| Company **URL** | **Mutates** — writes into a company record other prospects point at. | ❌ read-only (Finding 11) |

---

## Finding 15 — **RESOLVED: unique company URLs are the requirement; autocomplete is the mechanism**

**Michael, 2026-09-01:** *"The primary is I want all URLs to be unique (including www.domain.com and
domain.com). How we accomplish that is secondary but I want as efficient, frictionless as possible.
Autocomplete seems best."*

**A confirm-on-create dialog is therefore NOT wanted.** Frictionless was the stated priority. Do not
add a confirmation prompt to the mint branch.

### The two mechanisms catch different failures. Neither is redundant.

| Mechanism | Catches | Misses | Style |
| --- | --- | --- | --- |
| **Normalized URL uniqueness** (10b) | `YourAVdept` / `Your AV Department`, both `youravdept.com` | Companies with **no URL** | Enforced, blocking — P6's shape |
| **Name autocomplete** (10c) | The duplicate **before** either record has a URL — the SPL case | Nothing, but it is passive | Frictionless, non-blocking |

> ⚠️ **URL UNIQUENESS ALONE WOULD NOT HAVE STOPPED THE SPL PROBLEM.**
> `resolveCompanyByName()` mints a company from a **typed name**, and per **10a** `website` is empty on
> everything it creates. At the moment a duplicate is born there is usually **no URL to compare**.
> The three SPL records almost certainly hold no website at all. **10c is what catches those.**

### Normalization — compare on HOST only

Strip scheme · strip leading `www.` · lowercase · drop trailing slash · **drop path and query**.

So `youravdept.com`, `https://www.youravdept.com/` and `http://YourAVdept.com/about` all reduce to
`youravdept.com`. Host-only is the right grain here: one company, one domain.

**Key it on `website`, not `domain`** — see 10b. `domain` carries the literal fallback `"domain.com"`
on every company created without an email, and would produce false collisions.

### Report before enforcing

Violations already exist — that is how this surfaced. **A uniqueness rule dropped onto dirty data does
not fix what is already there**, and P6 set the precedent explicitly: it stops new duplicates and does
not clean up existing ones. So the session runs a **collision report first**, so the size of the
cleanup is known before the rule lands. Merging companies is a §4 destructive change (it repoints
`prospect.companyId` on live records) and needs its own decision and rollback plan — **not bundled
into the uniqueness work.**

---

## Finding 14 — URLs open in a new tab · **CONVENTION, mostly already true**

Michael: *"All URLS should open in a new browser."*

**Already satisfied for every `http` anchor in the app.** The only anchors lacking `target="_blank"`
are `tel:` (3829, 8663), `mailto:` (8662) and one `href="#"` JS hook in the deferred AQ drawer (8655)
— and those are **correct as they are**: a phone or mail link should hand off to the OS app, never
open a browser tab. **Do not "fix" them.**

**The real gap is URLs that are not links at all.**

- **Prospect `linkedin` is NEVER rendered as a clickable link anywhere in the app.** It appears only
  in CSV export rows (1855, 1991, 2009, 2107). On the detail view's ID section it is a plain text
  input — a profile URL you are looking straight at and cannot click.
- Finding 11's company URL will be a new link and must follow the rule from the start.

**Record as a convention** — *every external URL renders as an anchor with `target="_blank"`, via
`ensureUrlProtocol()`; `tel:` and `mailto:` are exempt* — so new links inherit it instead of
re-deciding. Candidate for the `DECLARATIONS.md` amendment batch 2B.10 already owes.

**Size:** XS for the convention · S for the LinkedIn link (it interacts with Finding 7's layout, since
the field is currently an editable input and a link needs somewhere to live)

---

## A6 and Part B — walked 2026-09-01, no new findings

- **A6, narrow window / sidebar collapse** — *"Feels fine to me."* Recorded as **judged acceptable in
  use**, not as *verified not broken*: the sub-1150px S1 break was previously observed as real, and
  Michael's call is that it does not warrant a session. **This retires the carried item flagged as
  "2B.11's ground."**
- **Both themes** — exercised throughout the pass; Michael worked in dark mode for most of it and
  supplied light-mode photographs for Finding 2.
- **The empty prospect, all six empty states** — *"yes, it's good."* No finding. This was the check
  most likely to produce one.
- **The longest note** — Michael will handle it in the ID redesign: **taller, plus a pop-out**. Folded
  into Finding 7 as a third input.
- **Dangling company reference** — ✅ **behaves correctly, and the expectation that it would not was
  MINE and was wrong.** See the note below.
- **Deleting a prospect** — ⚠️ **UNVERIFIED.** Michael deleted a *company* to produce the dangling
  case, which is a different path. The Delete Prospect confirmation and its post-delete navigation
  were **not exercised in this pass.** Recorded as unverified rather than passed.

### ⚠️ Durable note — the dangling-reference empty state is NOT reachable by deleting a company

`renderDetailCompany()` has three empty states, and BUILD_NOTES warns the middle one — *"points at a
company record that no longer exists"* — is the easy one to delete by mistake. **You cannot reach it
by deleting a company.**

```js
// deleteCompany(), app.js 11312 → 11323
p.companyId = "";     // every prospect pointing at it is cleanly unlinked
```

(The same unlink runs at 8819.) So deleting a company yields a prospect with **genuinely no company**,
and *"not linked to a company"* is the **correct** message — verified by screenshot.

The dangling state arises only from a **CSV import or ZIP restore** carrying a prospect whose
`companyId` names a company row that is not present. It is a data-integrity edge, not a UI path.

**A session that tries to test that empty state by deleting a company will conclude the guard is
broken when it is fine.** This exact wrong turn was made during the review pass and caught only by
reading `deleteCompany()`. **Belongs in `BUILD_NOTES.md`.**


## Closed by this pass

- ✅ **Exclude on hub filters** (open since 2B.9) — **no.**
- ✅ **`+ Add` verb** — moot; the button goes with Finding 6.
- ✅ **Twelve default column widths** (open since 2B.8) — **fine as shipped.** Every `prospects` and
  `companies` width reads `0` in `state.columnLayouts` — never dragged — and the cold look raised
  nothing.
- ✅ **Duplicate-email wording** (open since 2B.7) — works, wording accepted.
- ✅ **Default landing tab** (open since 2B.4) — Interactions is right.
- ✅ **A1, ProspectHub cold** — no finding. *"Looks great."*
- ✅ **Banked review Finding 2b** — dead, zero back-button reaches.

## Still open, not chased

Three carried cosmetics from 2B.4, raised twice and not answered — leaving them as-is is a legitimate
answer: the non-sticky Interactions table header · the redundant "Tasks" heading inside the Tasks tab ·
the `.pd-add-block` label "ADD THIS PROSPECT TO AN AUDIENCE".

## Still unreviewed

**A6** (the sub-1150px identity-block S1 break) · **Part B** (both themes · an empty prospect's six
empty states · a dangling company reference · the longest note · a real delete) · **Part C** already
absorbed above.

**Banked before this pass, still unbuilt:** Review Finding 1 (Company tab collapses by default) and
Review Finding 2a (chip navigation leaves `detailProspectId` set — one branch, no routing). **2b is
now dead.**

## Grouping — pass complete, ready to number

- **Filter column** — Findings 1 + 4. Same three-field stack, one session.
- **Resize cursor** — Findings 2 + 3. Same handler. Both fixes or neither.
- **Include semantics** — Finding 5, in-compartment surfaces. Needs the cross-compartment exception.
- **Tag filter pop-out** — Finding 6. Needs the P8 revision first.
- **Company tab** — banked Finding 1 (collapse) + Finding 8 (tab order). Same tab.
- **ID layout** — Findings 7 + 11 (+ Finding 14's LinkedIn link), when Michael is ready. One session,
  same block. **13 is withdrawn.** ⚠️ **10a must ship before 11.** Unblocks the tab-strip weight
  question.
- **Backlog:** MediaHub + CampaignHub tag semantics · AQ Engine tag choosers and its joined-string
  matcher · Finding 9 (task reachout type) · **Finding 10 (company duplication, 4 parts — 10c is the
  cheap one)** · **Finding 12 (reachout modal overflow)** · banked Finding 2a. **Finding 14's convention goes in
  the `DECLARATIONS.md` amendment batch 2B.10 already owes.**

## Backup coverage — DIRECTIVES §4

**No store of user-writable data was created or modified.** Diagnosis only. The one mutation — a
synthetic TaskHub column resize, 339 → 379px — was snapshotted before and restored after;
`state.columnLayouts` verified byte-identical, `matchesOriginal: true`. Console 5 lines, zero red.
Snapshot chip green throughout.

**Note for whoever builds Finding 9:** that one DOES modify a persisted store (`state.reachoutTypes`)
and must state its coverage. It is covered — see Finding 9 item 3.
