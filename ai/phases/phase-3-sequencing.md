# Phase 3: Sequencing — both compartments

**Compartment A — Outreach launch:** planned 2026-09-02, **BUILT AND CLOSED.** Sessions 3.1, 3.1b, 3.2, 3.3, 3.3c, 3.4, QA'd at 3.5.
**Compartment B — Enrollment and scheduling:** planned here, 2026-09-04, from `ai/spec/sequence-enrollment-scope.md` (approved by Michael the same day, decision queue empty).
**Merged:** 2026-09-04 · Prompt 3, Step 1B of `ai/phases/phase-3-sequencing-RUNSHEET.md`.
**Depends on:** Phase 1 (closed 2026-08-30), Phase 2A, Phase 2B (2B.10 outstanding), compartment A.

> ## ⛔ THIS FILE REPLACES `phase-3-outreach-launch.md` AS THE ONE TO RUN FROM
>
> `ai/phases/phase-3-outreach-launch.md` **stays on disk, unedited, as the historical
> record of compartment A** — its full session detail, its own estimate table and its own
> risk list are there and are not reproduced here. **Nothing in it is deleted and nothing
> in it is re-planned.**
>
> What is carried across into this file, **verbatim and marked BUILT**: frozen contracts
> **Q1–Q8** and amendments **A1–A4**. They are read-only. A compartment-B session that
> contradicts one of them has shipped the wrong thing.
>
> **Prompt 4 sessions from 3.6 onward name THIS file:**
> `Run Session <N.n> from ai/phases/phase-3-sequencing.md.`

> ## ⛔ WHAT THIS PLAN FOUND THAT CHANGED IT — three lines, per Prompt 3
>
> 1. **The compartment-A plan's `app.js` line numbers are all stale and `BUILD_NOTES.md`
>    says so in two places.** This plan therefore cites **function and id names only** —
>    there is not one `app.js` line number in it, deliberately. Grep for the name.
> 2. **`PROSPECT_DETAIL_TABS` was reordered at 2B.16 and Sequences is now 4th of 6, not
>    6th** — contract P4's written order is stale and its amendment is still unapplied, so
>    Session 3.15 flips `enabled` on a row it must locate **by key, never by index**. The
>    tab is a real `<button disabled>`, so nothing in JS needs a guard removed.
> 3. **The scope's proposed refinement to `DECISIONS.md` 2026-08-27 — dropping the stored
>    `status` from a snapshot entry — is ADOPTED in contract E2**, because a stored copy of
>    a derived value is a second source of truth; it is listed under Amendments owed for
>    Michael to apply. And `AIContext.md`'s create-path-drift finding turns scope
>    Assumption 9 from a note into a **Done-when in 3.6**: the create literal and
>    `ensureStateDefaults()` have already drifted once in this codebase and the new stores
>    must not be born that way.

**No questions.** Prompt 3 asks only for what changes the plan's structure and is not
determinable from the files. The scope was approved with its decision queue empty, its
eleven decisions are recorded, and its nine assumptions are all reversible. The one item
it explicitly deferred to this plan — *"whether the enrollment review modal also gets the
full markdown toolbar is a Prompt 3 sizing call"* — is decided in Assumption B7 below and
costs nothing either way. Nothing blocks.

---

## Goal — what's true after that isn't now

Compartment A's goal is already true and is not restated. What compartment B adds:

- **A sequence exists as a thing you can build** — a named, reusable, ordered list of steps,
  each declaring a delay, a channel, a kind and a message template with merge tokens.
- **Enrolling a prospect is a review pass, not a click.** Every step from the starting step
  onward is merge-resolved against that prospect, shown with its live counter and its HTML
  preview, **editable in place**, flagged for anything wrong, and only then committed.
- **An enrollment is frozen at commit.** It carries its own copy of every remaining step.
  Editing the master sequence afterwards cannot reach anyone in flight — by construction.
- **Only the live step is scheduled.** Completing its task advances the enrollment: the next
  step becomes live, its due date is computed from the **completion** date through the
  existing `shiftTaskDate()`, and its task is created. Everywhere, bulk included.
- **A prospect can be in exactly one live enrollment**, across all sequences, and a second
  attempt is refused by name rather than offered as a swap.
- **Stopping is manual and it keeps history.** Unenroll takes an optional reason, leaves the
  one open task standing by default, and writes a prospect timeline entry that is registered
  as a non-reachout.
- **Every way the chain breaks is visible.** A deleted task stalls the enrollment on screen
  with a Recreate action; a missing prospect or sequence is kept, labelled and counted.
- **Two new stores are covered by backup and restore before any UI reads them**, the ZIP goes
  from 9 CSVs to 11, and a drill proves a multi-paragraph body with commas and quotes
  survives its JSON cell character-identical.
- **The `sequences` tab in `PROSPECT_DETAIL_TABS` is live.**

## Out of scope

Compartment A's out-of-scope list still holds in full. Compartment B adds:

- **Sending**, on any channel, permanently. A sequence produces a task; Michael clicks.
- **Any reply, open, acceptance, bounce or response signal**, and anything derived from one.
  ⛔ **Nothing here may be gated on, or designed around, a reply signal.** Reading mail is a
  restricted OAuth scope and the request was **withdrawn, not deferred**; LinkedIn has no API.
- **Metrics, analytics, completion rates or reporting of any kind.** `unenrollReason` is a
  note, not a funnel.
- **Bulk enrollment** — scope Decision 4. One prospect at a time. Bulk *unenroll* is in.
  Bulk enroll lands later as one additive session with no migration.
- **Editing an enrollment's snapshot after commit** — scope Decision 8. Deferred to a named
  follow-on, to be revisited at Step 2R.
- **Flipping `LINKEDIN_COMPOSE_ROUTE_LIVE`.** It ships `false`; one line reverses it and that
  line is not this compartment's.
- **Text / SMS.** Not built, not stubbed, **no reserved value in the channel enum.**
- **Branching, conditions, A/B variants, or any step that is not linear.** No recurring
  sequences, no template library, no per-step attachments, no holiday calendar.
- **Both query surfaces** — `renderAqInspectorDrawer()`, the `aq-insp-*` ids and the Audience
  Query Engine stay **DEFERRED and untouched**. Do not "fix" the inconsistency by porting.
- **Routing.** P9 holds. A recipient address must never enter `location.hash`, a URL bar or
  `document.title`.
- **Phase 2C's work** — the sixteen-store `wipeAllData()` gap and the `ensureStateDefaults()`
  `length === 0` reseed defect are **not fixed here.** ⛔ **The new stores simply must not
  inherit them.**
- **A seventh hub.** The sequence builder is a Campaign Hub sub-tab.
- **Seeded example sequences, ever.** An empty first run shows an empty state.

## Assumptions

Compartment A's nine assumptions stand as written in `phase-3-outreach-launch.md` and are not
restated. Compartment B's are numbered **B1–B12** so the two sets can never be confused.
Every one is reversible.

**B1–B9 are the scope's own nine assumptions, carried unchanged.** In short: two new
top-level stores and not three (steps nest in their sequence, the snapshot nests in its
enrollment, JSON-in-a-cell per the `p.history` precedent); the builder is a Campaign Hub
sub-tab; token syntax stays the `[Token]` bracket form, case-insensitive on the name and
exact on the brackets; a step's delay reads `taskDateMode()`; sequence names are not enforced
unique; no seeded examples; the review modal reuses the 3.3c converter and counters; the task
title is `"<Sequence name> — step <n>: <kind label>"`; and `ensureStateDefaults()` back-fills
every field on every enrollment record. Full text and reasoning: `ai/spec/sequence-enrollment-scope.md` §12.

**B10 — The enrollment review modal gets the FULL 3.3c authoring surface, toolbar included.**
This is the sizing call the scope handed to Prompt 3. Decided **yes**, and it is the cheaper
answer, not the richer one: `taskBodyWrapSelection()` and `taskBodyInsertLink()` already
exist and already operate on a textarea's `selectionStart`/`selectionEnd`, so reusing them is
a call; *omitting* the toolbar means either a second, poorer editing surface or a rule about
which markdown a user may type where. ⛔ **The renderer is shared either way and is never
cloned** — `outreachBodyToHtml()` and `outreachFlattenBody()`, the same two functions that
build the clipboard. Reversible: deleting the three toolbar buttons is a CSS-and-markup
change that touches no logic.

**B11 — The contract letter for this compartment is `E`.** Phase 1 used `C`, Phase 2A used
`S`, Phase 2B used `P`, compartment A used `Q`. ⚠️ **DIRECTIVES' Gate E is a different thing
and is never referred to as a contract in this file** — a gate is `Gate E`, a contract is `E5`.

**B12 — The enrollment commit path is built and verified one session before the modal that
calls it.** Session 3.11 therefore ships functions with no UI caller, which is deliberate and
precedented: 2B.1 shipped `openProspectDetail()` with nothing calling it until 2B.6, recorded
as that plan's Assumption 3. Reasoning: the snapshot builder, the one-live gate and the first
task's creation are the parts of enrollment that can be *wrong* rather than merely *ugly*, and
they are fully verifiable from the console. Splitting here puts the risky half in its own
session with its own Done-when. Reversible: if 3.11 comes in small, 3.12 absorbs it.

---

## Frozen contracts — COMPARTMENT A · BUILT AND SHIPPED · read-only

> ⛔ **EVERYTHING IN THIS SECTION IS CARRIED VERBATIM FROM
> `ai/phases/phase-3-outreach-launch.md` AND IS IN THE PRODUCT TODAY.** It was audited
> against the code at Session 3.5 on 2026-09-04 and **all four amendments were verified
> true**. Do not re-derive it, do not renumber it, do not "improve" it. Compartment B
> **writes** these fields; it does not redefine them.
>
> The one-glance version tell for the code these contracts describe: `typeof linkedinSlug`
> is `"function"`, `typeof gmailSearchUrl` is `"undefined"`, `LINKEDIN_COMPOSE_ROUTE_LIVE`
> is `false`.

> ## ⛔ SIX OF THE EIGHT HAVE BEEN AMENDED. READ § Frozen-contract amendments BELOW BEFORE BUILDING Q1, Q2, Q3, Q4, Q5, Q6 OR Q7.
>
> **A4 (2026-09-04) — Q4's `gmailBase()` IS WRONG AND RETURNS A 404 FROM REAL GMAIL.** The account goes in `?authuser=`, never in the `/mail/u/<address>/` path. **This is the first contract here amended because it was FACTUALLY WRONG rather than because a decision changed** — and it was found only by opening the URL, which is exactly what Assumption 8 exists to force. `tf=cm` and the four compose terms are unaffected.
>
> **A1 (2026-09-03) — Q3, Q4, Q5 still say Vantage emits a Bcc. It does not.**
> **A2 (2026-09-04) — Q1, Q4, Q5, Q6, Q7 still describe a plain-text clipboard and one Body box. The clipboard carries HTML, bodies may hold links, and the Body box becomes two disclosures.**
> **A3 (2026-09-03, recorded 2026-09-04) — Q2, Q4, Q5 still say `thread` opens a Gmail search. It opens NOTHING; the builder is cut.**
>
> The contracts below are left as originally written — that is this project's
> convention, and the amendment record is the mechanism — but **a session that
> builds Q4's `&bcc=` term, or `gmailSearchUrl()`, or writes Q5's clipboard
> helper as `writeText`, because it read this section and not the amendments has
> shipped the wrong thing.** The amendments section is immediately after Q8.
>
> ⚠️ **A3 IS THE WARNING ABOUT THIS SECTION ITSELF.** It was decided on
> 2026-09-03 and lived in the scope and the run sheet for a full day while this
> plan still described the cut mechanism as live. **The plan is not automatically
> the newest document — check the amendments, the scope and the run sheet before
> trusting a contract paragraph.**

### Q1 — The task's five outreach fields

```js
task.channel    = "email" | "linkedin" | "";   // "" = not an outreach task
task.msgKind    = "compose" | "thread" | "connect" | "inmail" | "message" | "";
task.msgTo      = "sally.quinn@acmellc.com";   // or a LinkedIn profile URL
task.msgSubject = "AV production for the Acme Summit";   // resolved, NO "Re:" prefix
task.msgBody    = "Dear Sally,\n\n…";          // resolved, editable
```

- **All five hold literal text.** A task never stores an unresolved merge token — Phase 1's rule, and it holds identically whether a sequence wrote the value or Michael typed it. There is one code path, not two.
- `channel === ""` hides the whole block and every button. It is the default for a manually created task and the migrated value for every task that predates this feature.
- **`msgKind` is one field, not two.** The five values are unambiguous across both channels; an email mode plus a LinkedIn kind would be two fields that must never disagree.
- **`msgSubject` never stores `"Re:"`.** The prefix is display-only, added by the renderer for `msgKind === "thread"`. Storing it means a second follow-up reads `"Re: Re: …"`.
- `source` / `sourceRef` are **not** touched — Assumption 5.

### Q2 — Channel, kind, and what each one means

| `channel` | `msgKind` | Opens | Subject? | Body ceiling |
| --- | --- | --- | --- | --- |
| `email` | `compose` | Gmail compose, **prefilled** | Yes | URL length, Q6 |
| `email` | `thread` | Gmail search for the contact | Inherited, shown as `Re:` | none |
| `linkedin` | `connect` | LinkedIn **profile** page | No | **300** |
| `linkedin` | `inmail` | LinkedIn composer | Yes | **1900** |
| `linkedin` | `message` | LinkedIn composer | No | **3000** |

- `connect` is a connection request with a note. Different destination, different ceiling, different gesture — it is its own kind, not a message variant.
- The kind, not the step's position, decides whether a subject exists. This is what delivers "only the first LinkedIn step carries a subject" without a positional rule anywhere in the code.

### Q3 — Settings: two keys, no new store

```js
state.taskSettings.workGmailAddress = "";   // "" disables every email button
state.taskSettings.emailBcc         = "michaelh@youravdept.com";
```

- Defaults seeded in `ensureStateDefaults()` beside `dateMode` (`app.js` 1262–1267).
- **Backup coverage is two rows in `prm_settings.csv`**, written at `generateSettingsCSV()` beside `["Task Date Mode", …]` (`app.js` 2084), and read back by the same restore leg:

```js
rows.push(["Outreach Work Gmail", (state.taskSettings && state.taskSettings.workGmailAddress) || ""]);
rows.push(["Outreach Bcc",        (state.taskSettings && state.taskSettings.emailBcc) || ""]);
```

- **`wipeAllData()` needs no new line.** It clears `state.taskSettings` whole, as of 2B.7. That is the entire reason these keys go there and not into a store of their own.
- **`emailBcc` is read at click time, never snapshotted onto a task.** Changing it applies immediately to tasks that already exist, which is the only sane behaviour for a logging address.
- Blank `emailBcc` omits the parameter and hides the Bcc line. Blank `workGmailAddress` disables email buttons with a message naming Settings — it never silently falls back to `/u/0/`.

### Q4 — The URL builders

**Account targeting.** Gmail accepts an address in place of the account index and redirects to whichever `/u/N/` that account currently occupies. `/u/0/` reflects sign-in order and renumbers silently when an account is added — a wrong-inbox bug that surfaces months later as "the button stopped working."

```js
function gmailBase() {
  return `https://mail.google.com/mail/u/${encodeURIComponent(state.taskSettings.workGmailAddress)}/`;
}

// msgKind "compose"
function gmailComposeUrl(task) {
  const bcc = state.taskSettings.emailBcc;
  return gmailBase() +
    `?to=${encodeURIComponent(task.msgTo)}` +
    `&su=${encodeURIComponent(task.msgSubject)}` +
    `&body=${encodeURIComponent(task.msgBody)}` +
    (bcc ? `&bcc=${encodeURIComponent(bcc)}` : ``) +
    `&tf=cm`;
}

// msgKind "thread"
function gmailSearchUrl(task) {
  const q = `to:${task.msgTo} OR from:${task.msgTo}`;
  return gmailBase() + `#search/${encodeURIComponent(q)}`;
}
```

**`tf=cm` is the compose parameter. `view=cm&fs=1` is NOT.** That pairing is widely copied from older answers; `fs` no longer does anything and `view=cm` has been superseded. A session that "fixes" this by restoring the old pair has broken it.

Newlines survive as `%0A` and render as line breaks in the composer.

**LinkedIn.**

```js
function linkedinSlug(prospect) {
  return (prospect && prospect.linkedin || "")
    .match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1] || "";
}
```

**The prospect record key is `linkedin`, not `linkedinUrl`** — verified against P5 of `phase-2b-prospect-detail-view.md` and `#pros-linkedin`. Anything that assumes otherwise reads a field that does not exist and silently disables every LinkedIn button.

```js
// inmail, message
`https://www.linkedin.com/messaging/compose/?recipient=${encodeURIComponent(slug)}`
// connect
`https://www.linkedin.com/in/${encodeURIComponent(slug)}/`
```

**The `?recipient=` composer route is undocumented.** It works today and is not a supported API. Session 3.4 verifies it live before relying on it, and its fallback — the profile URL plus a toast saying to click Message — is written in the same session, not deferred. A no-match slug disables the button with the reason shown; it never opens something wrong.

### Q5 — The launch handler, and the order operations must happen in

```js
window.open(url, "vantage-gmail");     // or "vantage-linkedin"
```

- **`window.open` is called SYNCHRONOUSLY inside the click handler. No `await` before it, ever.** Clipboard writes, `saveState()` and every re-render happen after. This is the single most likely way this feature ships broken, and it fails only under a popup blocker — which means it passes every console check.
- Named targets mean each channel reuses the window Vantage opened for it.
- **A web page cannot detect or focus a tab the user opened by hand.** Browsers forbid it. Reusing Vantage's own tab is the closest achievable version of "go to it if it's already open," and a future session must not attempt to "fix" this.
- **LinkedIn buttons open only — they never touch the clipboard.** With two things to paste and one clipboard, an implicit copy means never knowing what is on it. Every LinkedIn copy is a separate, labelled click.
- Email `thread` copies the body on open and toasts "Body copied — remember Bcc." (Whether this should also become explicit, for consistency with LinkedIn, is scope §9.5 and is Michael's call, not a session's.)
- Clipboard writes go through one helper: `navigator.clipboard.writeText`, falling back to a hidden textarea plus `document.execCommand("copy")`, falling back to selecting the field's text. Never assume the first works — it needs a secure context and a live gesture.

### Q6 — Validation, at two moments

| `msgKind` | Subject | Body |
| --- | --- | --- |
| `connect` | — | 300 |
| `inmail` | 200 | 1900 |
| `message` | — | 3000 |
| `compose` | — | assembled URL ≤ ~2000 chars |

- **Validate when typed, and again when resolved.** A 290-character connection note plus a company called "Northwestern Mutual Financial Network" overflows. The producer half validates the *template*; this half validates the *literal value on the task*, and both are needed.
- **An over-limit value is never blocked or truncated.** The counter goes red and the button warns before opening. Blocking would silently drop a step out of a sequence, which is worse than a visible over-length task.
- Over the compose URL ceiling: open with To, Bcc and Subject only, copy the body, toast "Body copied — paste into Gmail." Degrade, never fail silently.

### Q7 — Manual entry and auto-fill

The task editor gains, below its existing fields: **Channel** (None / Email / LinkedIn, defaulting to None), **Kind** (the options valid for that channel), **To**, **Subject** (only for kinds that have one), **Body** with its live counter.

- **To auto-fills from the linked prospect.** Session 1.9 gave tasks a prospect link; choosing Email fills from `prospect.email`, choosing LinkedIn from `prospect.linkedin`. **The field stays editable** — auto-fill is a starting value, not a lock — and an orphan task simply requires typing it.
- Auto-fill fires on channel change only, and **only into an empty field.** It never overwrites a value already there, typed or sequence-written.
- `createElement` / `appendChild` throughout. `innerHTML +=` destroys listeners and has bitten this codebase.

### Q8 — What does not change

- **No new top-level store.** No `state.outreachSettings`, no `state.emailTemplates`. Q3 is the whole persistence story beyond the five task columns.
- **No new CSV file.** Five columns appended to `TASKS_CSV_HEADERS`, two rows added to `prm_settings.csv`. Nothing joins the ZIP bundle.
- **`notes` is not repurposed** — Assumption 7.
- **`source` / `sourceRef` are not repurposed** — Assumption 5.
- **No routing.** P9 holds unchanged. A recipient address must never enter a URL, hash or `document.title` — imported `prospectId` values are already email addresses (`app.js` 2275, 10487) and this feature adds real addresses to a second surface. The Gmail and LinkedIn URLs are `window.open` targets, never `location.hash`.
- **`#modal-prospect` is untouched.** So is every Phase 2B surface.
- **The `sequences` tab stays `enabled: false`.**
- **No email is sent, and no draft is created via any API.**

---

## Frozen-contract amendments

*A frozen contract is not modified mid-phase by a session. It is amended by Michael, in writing, with the reasoning in `DECISIONS.md` and the record here. This section is the one place a later session learns that a contract above no longer describes what gets built. Following the 2B P5 / P8 / P9 precedent.*

### A1 — 2026-09-03 · **Q3, Q4, Q5: Vantage emits no Bcc.** Authorised by Michael at the close of Session 3.1.

**His words:** *"Google Workspace Bcc rule is in place. Vantage does not Bcc emails."* The Workspace outbound content-compliance rule blind-copies every message sent from the work account — including replies typed straight into Gmail — so the logging the Bcc existed to provide already happens, and happens in cases Vantage could never reach. Full reasoning, rejected alternatives and the reversal condition: `ai/DECISIONS.md`, 2026-09-03.

| Contract | As frozen | **As amended** |
| --- | --- | --- |
| **Q3** | `state.taskSettings.emailBcc = "michaelh@youravdept.com"`, seeded, exported as `["Outreach Bcc", …]`, restored, read at click time | **The key does not exist.** No seed, no `OUTREACH_BCC_DEFAULT`, no settings row, no restore leg. ⚠️ **`workGmailAddress` is untouched** — it targets the right inbox and has nothing to do with this. |
| **Q4** | `gmailComposeUrl()` appends `(bcc ? \`&bcc=${encodeURIComponent(bcc)}\` : \`\`)` | **The term is deleted.** Not made conditional on a blank setting — **the parameter does not exist.** Everything else in Q4 stands, `tf=cm` included. |
| **Q5** | email `thread` copies the body and toasts *"Body copied — remember Bcc."* | **Copy-on-open stands; the toast reads "Body copied."** Only the Bcc half of the message goes. |

**Consequences a later session must not re-derive:**

- **Open Risk 6 is RETIRED, not mitigated.** It was the risk this rule removes.
- **Scope §7.6 and §9.2's "scope reduction for 3.3" is now this amendment.** Do not re-open it as an unanswered question — it is answered.
- **Scope §9.7 (the Bcc spelling) is MOOT.** Michael confirmed `michaelh@youravdept.com` correct on screen at 3.1's close and the value was retired the same hour. **The section stays as the record of how to settle a silent-failure value** — render it from live state and have the human read it — which is the part worth keeping.
- ⛔ **IT COSTS A REPAIR PASS ON A SHIPPED SESSION. SEE SESSION 3.1b BELOW.**

### A2 — 2026-09-04 · **Q1, Q4, Q5, Q6: Vantage produces CLICKABLE LINKS, and the clipboard carries HTML.** Authorised by Michael after the close of Session 3.2.

**His question:** *"Can I create, copy, and paste active links from Vantage?"* — a lead-magnet URL sitting behind the words *"Tech RFP"*. **The answer is yes.** A body may carry a markdown link, `[Tech RFP](https://…)`, stored literally; the copy control writes `text/html` alongside `text/plain`, so a paste into Gmail arrives with the phrase blue, underlined and clickable and the URL not visible. Full reasoning, the three rejected shapes and the reversal condition: `ai/DECISIONS.md`, 2026-09-04.

| Contract | As frozen | **As amended** |
| --- | --- | --- |
| **Q1** | the five fields hold literal text | **Unchanged in force, clarified in scope.** `[Tech RFP](https://…)` IS literal text — it resolves to itself and is not a merge token — so the one-path rule stands. What changes is that the STORED string and the PASTED string are no longer the same, which used to be true by accident. **Three forms only: link, `**bold**`, `*italic*`. Font family and size are excluded by decision.** |
| **Q4/Q5** email `compose` | opens Gmail prefilled with To, Subject **and** body | **A body containing a link opens with To and Subject ONLY**, copies the rich body, toasts *"Body copied — paste into Gmail."* Not a new mechanism — **it is Q6's over-long-URL degrade path gaining a second trigger**, because `&body=` is plain text and cannot carry a link either way. A body with no link is untouched and still one click. |
| **Q5** the clipboard helper | `navigator.clipboard.writeText`, then a hidden textarea + `execCommand`, then select-the-field | **`navigator.clipboard.write()` with a `ClipboardItem` carrying `text/html` AND `text/plain`.** The two existing fallbacks stand and gain a third below them: **plain text with the URL left visible and bare.** |
| **Q6** | counters measure the value | **Email kinds count the STORED string** — inert, since neither `compose` nor `thread` has a per-field ceiling. **LinkedIn kinds count the FLATTENED output**, because that is what LinkedIn receives and counts; markup that never arrives must not push a legal 300-character note over. |
| **Q7** | Channel, Kind, To, Subject, **Body** with its live counter | **The single Body box becomes TWO STACKED DISCLOSURES** — **"Edit Task"** (a formatting toolbar plus the textarea) and **"Preview task in HTML"** (read-only, rendered by the same converter that builds the clipboard, so preview and paste cannot disagree). **New task: Edit expanded, Preview contracted. Existing task: the reverse.** Both always reachable; these are defaults, not restrictions. **Look, labels and behaviour are identical on every task and every channel** — only the preview's *contents* differ, which is a preview doing its job. Everything else in Q7 is unchanged. |

**Consequences a later session must not re-derive:**

- ⛔ **`window.open` IS STILL CALLED SYNCHRONOUSLY FIRST.** The clipboard write is a promise. This amendment makes the handler busier and makes that rule *easier* to break, not looser. It is untouched.
- ⛔ **LINKEDIN GETS FLATTENED TEXT — NEVER HTML, AND NEVER THE RAW STORED STRING.** The converter ALWAYS runs and has two outputs: `text/html` for the email kinds, **flattened plain text** for the three LinkedIn kinds (`**bold**` → `bold`, `[Tech RFP](https://…)` → `Tech RFP (https://…)`). A LinkedIn copy carries no `text/html` flavour and no markup. **A session that "unifies" the two copy paths for tidiness ships one defect or the other.** *(This line originally read "must never convert" and was corrected 2026-09-04 — copying the stored string unconverted puts raw `[…](…)` into a connection note.)*
- ⛔ **THE COUNTER FOLLOWS THE OUTPUT ON LINKEDIN.** A `connect` note is measured on the **flattened** length, because that is what LinkedIn receives and counts — markup that never arrives must not push a legal note past 300. Email kinds keep counting the stored string; they have no per-field ceiling, so nothing changes there.
- **A rich contenteditable body was REJECTED** — it fights the counters, the CSV column and Q1's one-path rule. Do not re-propose it as an improvement.
- ⚠️ **UNLIKE A1, THIS COSTS NO REPAIR PASS.** Session 3.2 shipped the body field and **no clipboard code at all**, so the whole of this lands inside 3.3, which writes the helper anyway.
- **What would reverse it:** Gmail refusing an HTML flavour written from this origin. **Live, not settled** — `BUILD_NOTES.md` records that clipboard behaviour differs between `localhost` and a hosted origin, which matters again at Phase 4. **If it fails, the third fallback is not a rework — the link still works, only the hiding is lost.**

### A3 — 2026-09-03 · **Q2, Q4, Q5: email `thread` builds NO URL and opens NOTHING.** Authorised by Michael on 2026-09-03. ⚠️ **Recorded here 2026-09-04 — this is a TRANSCRIPTION, not a new decision.**

⛔ **THIS AMENDMENT EXISTS BECAUSE THE PLAN WAS THE ONLY DOCUMENT THAT MISSED IT.** `ai/spec/sequence-outreach-launch-scope.md` §7.3 and §16 carry the decision with Michael's own words, and `ai/phases/phase-3-RUNSHEET.md` carries it too — **both dated 2026-09-03, and both since before Session 3.1 ran.** The plan below still defines `gmailSearchUrl()` in Q4, still lists it in 3.3's tasks and Done-when, and still owes a `BUILD_NOTES.md` entry about it at 3.5. **A session reading only the plan would build a cut function, verify it, and record a finding about a mechanism that is not in the product.** Found and recorded at the close of 3.2.

**His words, from the scope:** *"…in my gmail so, replace."* A `thread` task is a follow-up inside a conversation that already exists in his inbox — he finds it himself, in Gmail, where he is already looking.

| Contract | As frozen | **As amended** |
| --- | --- | --- |
| **Q2** | `thread` → "Opens Gmail search for the contact" | **`thread` opens NOTHING.** No launch button, no URL, no `window.open`. |
| **Q4** | `gmailSearchUrl(task)` returning `gmailBase() + #search/…` | **The function is CUT.** Not written, not stubbed. `gmailBase()` and `gmailComposeUrl()` are unaffected. |
| **Q5** | `thread` copies the body on open and toasts | **TWO explicit copy buttons — address and message — and nothing opens.** Both values (`msgTo`, `msgBody`) already exist on the task, so this needs no new field and no builder. **Two buttons, not three.** |

**Consequences a later session must not re-derive:**

- ⛔ **THE `#search/` ACCOUNT-REDIRECT RISK IS RETIRED, NOT UNRESOLVED.** 3.3's risk paragraph and 3.5's owed `BUILD_NOTES.md` entry about whether a fragment survives `/mail/u/<address>/` → `/mail/u/N/` are **both moot** — nothing builds the fragment. Do not go and test it.
- ⚠️ **AND THE TWO COPY BUTTONS ARE A SEQUENCE, NOT A PAIR** — there is one clipboard, so the second copy overwrites the first. `Copy address` → paste → find the thread → `Copy message` → paste. **Do not lay them out as two equivalent options side by side**; that shape invites clicking both, and losing the address is silent and reads as the first button being broken. (Already in the run sheet's traps; repeated here because this is the session that builds them.)
- **`compose` is untouched by A3** and still opens Gmail prefilled — as amended by A1 (no Bcc) and A2 (To and Subject only when the body carries a link).

### A4 — 2026-09-04 · **Q4: the account is targeted by `?authuser=`, NOT by the address in the path.** Authorised by Michael during Session 3.3, from live evidence.

⛔ **Q4's `gmailBase()` RETURNS "Temporary Error (404)" FROM REAL GMAIL.** This is the first amendment in the phase forced by a contract being *wrong* rather than by a decision changing, and it was found the only way it could be — by opening the URL. Four navigations isolated it, in this order:

| URL | Result |
| --- | --- |
| `/mail/u/<address>/?to=…&tf=cm` — Q4 as frozen, built by the shipped button | **Temporary Error (404)** |
| the same with a **literal `@`** instead of `%40` | **Temporary Error (404)** — so it is **NOT** the `encodeURIComponent`, which was the obvious first suspect and is innocent |
| `/mail/u/0/?to=…&su=…&body=…&tf=cm` | ✅ 200, compose, every parameter intact |
| `/mail/?authuser=<address>&to=…&su=…&body=…&tf=cm` | ✅ 200 — Google resolves the address and **redirects to `/u/N/` carrying every parameter** |

**The third line is what makes the diagnosis safe rather than a guess: `tf=cm`, `to`, `su`, `body` and `%0A` were never the problem, and none of them is touched by this amendment. Only the account segment moves.**

| Contract | As frozen | **As amended** |
| --- | --- | --- |
| **Q4** | `` gmailBase() → `https://mail.google.com/mail/u/${encodeURIComponent(workGmailAddress)}/` `` | **`` gmailBase() → `https://mail.google.com/mail/` ``**, and `gmailComposeUrl()` gains `` `?authuser=${encodeURIComponent(gmailWorkAddress())}` `` as its **first** term. The other four terms and their order are unchanged. |

**Consequences a later session must not re-derive:**

- ⛔ **THIS IS NOT A LICENCE TO FALL BACK TO `/u/0/`.** Q4's reasoning is why `authuser=` was chosen over the thing that plainly works: **`/u/0/` reflects sign-in order and renumbers silently when another Google account is added**, which surfaces months later as "it started composing from the wrong address". `authuser=` names the account and lets Google resolve the index — Q4's intent exactly. Only the *place the address is written* has changed.
- **AND IT DEGRADES BETTER, which is the second reason not to undo it.** With the named account **not signed in** to the browser, `authuser=` lands on Google's sign-in page **carrying the whole compose payload in `continue=`**, so the message still opens once signed in. The frozen path form gave a 404 dead end and the typed message was gone.
- **`%40` is fine in the QUERY STRING.** The verified open used `authuser=…%40gmail.com` and Gmail resolved it. The encoding was only ever a problem in the path, and it was not the problem there either.
- ⚠️ **THE WORK ACCOUNT IS NOT SIGNED IN TO THE VERIFYING BROWSER PROFILE**, so 3.3's real open was confirmed against the account that is (`/u/0/`, personal). **The mechanism is proved; "it lands in the work inbox" is not, and 3.4 or the 3.5 close owes that one confirmation** once `michaelh@youravdept.com` is signed in.

---

## Frozen contracts — COMPARTMENT B · written literally; later sessions treat as read-only

*A frozen contract is not modified mid-phase by a session. It is amended by Michael, in
writing, with the reasoning in `DECISIONS.md` and the record in § Frozen-contract amendments
at the end of this file. Following the 2B P5 / P8 / P9 and the compartment-A A1–A4 precedent.*

⛔ **THERE ARE NO `app.js` LINE NUMBERS IN THIS SECTION OR ANYWHERE BELOW IT, AND THAT IS
DELIBERATE.** `BUILD_NOTES.md` records that every line number in the compartment-A plan was
wrong within one session of being written. **Grep for the function name.** The MAP is written
in names for the same reason.

### E1 — The sequence record and the step record

```js
state.sequences = [
  {
    id,                       // "seq-<epoch>"
    name,                     // required, non-empty. NOT enforced unique — B5.
    status,                   // "active" | "archived"   — the audienceLists precedent
    createdAt,                // "YYYY-MM-DD"
    steps: [
      {
        id,                   // "sstep-<epoch>" — STABLE. currentStepId points at this.
        order,                // 1-based integer, contiguous
        delayDays,            // integer >= 0
        channel,              // "email" | "linkedin"
        kind,                 // "compose" | "thread" | "connect" | "inmail" | "message"
        subject,              // TEMPLATE, tokens intact. "" for kinds with no subject.
        body                  // TEMPLATE, tokens intact. May carry markdown.
      }
    ]
  }
];
```

- **Steps nest. They are not a third top-level store.** The precedent is
  `audienceLists.prospectIds` for the nesting and `p.history` for the CSV cell.
- **`id` on a step is stable and is never regenerated.** An enrollment's snapshot points at
  it, so provenance survives a template edit. Reordering rewrites `order`, never `id`.
- **`delayDays`, not `delayBusinessDays`.** The global All Days / Business Days setting
  (`state.taskSettings.dateMode`, read through `taskDateMode()`) already owns that question
  for the whole app; encoding an answer in the field name produces two date-counting rules.
- **`status` is `"active" | "archived"`**, per DECLARATIONS. Archiving preserves; it never
  destroys.
- **A step's `channel` and `kind` are Q2's values and Q2's table is the authority.** This
  contract adds no channel and no kind, and **there is no reserved value for SMS.**

### E2 — The enrollment record and the snapshot entry

```js
state.sequenceEnrollments = [
  {
    id,                       // "enr-<epoch>"
    sequenceId,
    prospectId,
    status,                   // "active" | "completed" | "unenrolled"
    currentStepId,            // stable step id, or null when not active
    enrolledAt,               // "YYYY-MM-DD"
    unenrolledAt,             // "YYYY-MM-DD" | ""
    unenrollReason,           // "" | "Replied" | "Not interested" | "Wrong person" | free text
    steps: [                  // THE SNAPSHOT. Resolved at enrollment, frozen thereafter.
      {
        stepId,               // the sequence step's id — provenance survives a template edit
        order,
        delayDays,
        channel,
        kind,
        subject,              // RESOLVED literal text
        body,                 // RESOLVED literal text
        dueDate,              // "YYYY-MM-DD" on the LIVE step only, "" everywhere else
        completedDate,        // "YYYY-MM-DD" | ""
        taskId                // the task this step produced, "" until it is live
      }
    ]
  }
];
```

**⛔ ONE RULE FOR READING AN ENROLLMENT, AND NO STORED REDUNDANCY:**

- a snapshot entry with a non-empty `completedDate` is **done**;
- the entry whose `stepId === enrollment.currentStepId` is **live**, and it is the only one
  carrying a `dueDate` and a `taskId`;
- everything else is **pending**.

⚠️ **THIS AMENDS `DECISIONS.md` 2026-08-27, WHICH SPECIFIES THE ENTRY AS
`{ stepId, body, status, dueDate, completedDate }` WITH A STORED `status`.** A stored
`status` is derivable from `currentStepId` plus `completedDate`, and a stored copy of a
derived value is a second source of truth that can disagree with the first. **Everything
load-bearing in that decision is unchanged:** every step from the starting step onward is
merge-resolved and copied in at enrollment, and only the live step carries a due date. The
added fields — `channel`, `kind`, `subject`, `order`, `delayDays`, `taskId` — could not have
been anticipated there because that entry predates compartment A. **Listed under Amendments
owed; Michael applies it.**

- ⛔ **Enrollments are their own top-level collection and are NOT nested in the prospect
  record.** Gate B's test is whether multi-user later requires migrating data: a top-level
  collection takes an `ownerId` without touching anyone's records. Nesting would also put the
  fastest-growing thing in the app inside a prospect document, and
  `ai/spec/phase-4-firebase-preflight.md` already records the state object over Firestore's
  1 MiB per-document limit.
- **`sequenceId` and `prospectId` are the only stored links.** An enrollment whose either
  link does not resolve is an **orphan**: kept, rendered with the missing half named, and
  counted in the restore summary. **Never silently discarded** — E3 and the orphan table.

### E3 — The two CSV column contracts, and how they are read

**Two new files join the ZIP bundle. ⚠️ THE ZIP GOES FROM 9 CSVs TO 11.** Session 3.5's
drill asserted *"9 CSVs and no new file"*; the next drill asserts **11**, and the close says
so rather than reporting a regression.

```
prm_sequences.csv             Sequence Id · Name · Status · Created At · Steps
prm_sequence_enrollments.csv  Enrollment Id · Sequence Id · Prospect Id · Status ·
                              Current Step Id · Enrolled At · Unenrolled At ·
                              Unenroll Reason · Steps
```

- ⛔ **THE HEADER TEXT IS THE CONTRACT AND THE COLUMN ORDER IS NOT.**
  `restoreProspectsFromCSV()`'s header-name mapping is the pattern and is followed exactly: a
  backup taken before a column existed restores that field `""`, and a newer backup restores
  through an older build with the extra columns ignored. Both directions safe by construction.
  **Never index by position.** Renaming a header is a restore-compatibility change; reordering
  is free.
- **The nested `steps` array rides as JSON in a single cell**, exactly as
  `p.history ? JSON.stringify(p.history) : ""` already does in all four prospect CSV writers.
  `convertToCSV()` quotes every field unconditionally and `parseCSV()` tracks quote state
  across newlines, so multi-paragraph, comma- and quote-laden values round-trip exactly.
  ⛔ **Do NOT add newline-stripping to "protect" the CSV, and do not base64 a cell.**
  ⚠️ **`parseCSVRow()` is a separate, simpler function that does NOT handle escaped quotes —
  it is not an equivalent and must not be reached for here.**
- **Enum coercion on restore.** `status`, `channel` and `kind` are coerced to their enum; an
  unrecognised value degrades to `""`, following `restoreTasksFromCSV()`.
- **The trim split.** Identifiers, enums and dates trim. ⛔ **`subject` and `body` DO NOT** —
  leading and trailing whitespace is content there, exactly as `notes`, `msgSubject` and
  `msgBody` already are.
- **A malformed `steps` cell degrades to `[]` and is counted in the restore summary.** It
  never throws and never discards the enrollment row that carried it.

### E4 — The task a step produces, and the `sourceRef` composite

```js
{
  id,                     // minted by the existing path
  prospectId,             // the enrollment's prospect. NEVER blank.
  title,                  // "<Sequence name> — step <n>: <kind label>"
  notes:      "",         // ⛔ NOT the message body. notes keeps its Phase 1 meaning.
  dueDate,                // per E6
  status:     "open",
  completedDate: "",
  createdAt,              // todayLocalDateStr()
  source:     "sequence",
  sourceRef:  `${enrollmentId}:${stepId}`,
  channel,    msgKind,    // copied from the snapshot entry
  msgTo,                  // prospect.email for email, prospect.linkedin for linkedin
  msgSubject, msgBody     // copied VERBATIM from the snapshot. Already literal.
}
```

- ⛔ **`notes`, `source` and `sourceRef` are not repurposed.** `source` records **where a
  task came from**; `channel` records **what it is**. A sequence task sets both. Conflating
  them makes "did a sequence make this" unanswerable. This is compartment A's Assumption 5,
  and `task.source` / `task.sourceRef` have been sitting unused since Session 1.3 precisely
  so that this compartment is additive rather than a migration over every task.
- **`sourceRef` is the `enrollmentId:stepId` composite**, and it costs one `split(":")`. It
  survives a task completed late or out of order and makes "which step was this" answerable
  from the task alone, in the CSV. The bare enrollment id would lean on the enrollment's live
  pointer being correct at read time — which is exactly what a stalled enrollment breaks.
- ⛔ **`msgSubject` never stores `"Re:"`.** Q1's rule, unchanged. The prefix is display-only.
- **The task is minted through the existing create path**, not by a second `state.tasks.push`
  literal. ⚠️ `AIContext.md` 2026-09-04 records that the create literal and
  `ensureStateDefaults()` have **already drifted once** in this codebase.

### E5 — Merge tokens: the list, and when they resolve

| Token | Source |
| --- | --- |
| `[First Name]` | `prospect.firstName` |
| `[Last Name]` | `prospect.lastName` |
| `[Company]` | `getCompanyName(prospect.companyId)` |
| `[Title]` | `prospect.title` |
| `[Email]` | `prospect.email` — **new to the list; the field already exists** |
| `[Conference Name]` | `prospect.conferenceName` |
| `[Conference Start Date]` | `prospect.conferenceStart` |
| `[Conference End Date]` | `prospect.conferenceEnd` |
| `[Conference City/Venue]` | `prospect.conferenceVenue` — **ONE combined field** |

- **`[LinkedIn]` is deliberately NOT a token.** The profile URL is plumbing Vantage consumes
  to build a destination; there is no reason to paste it into message text.
- ⛔ **Tokens resolve ONCE, AT ENROLLMENT, into the snapshot.** Task creation copies
  already-literal text. Nothing downstream of the snapshot ever sees a token, and there is
  **one render path**, not one for hand-typed and one for sequence-written.
  **Consequence, stated so it is not discovered:** a prospect corrected after enrollment does
  not change the copy of steps not yet sent. That is what "frozen" costs and it is the
  accepted price of the property it buys.
- **An unresolvable token resolves to an EMPTY STRING** — not to a visible `[Company]`, not
  to a placeholder. The review pass counts and names every token that resolved empty. If one
  slips through, an awkward sentence is a better failure than a prospect receiving literal
  `[Company]`.
- **Matching is case-insensitive on the token name; the bracket form is exact.**
- ⛔ **THE ONE PLACE TOKENS AND MARKDOWN COLLIDE.** `OUTREACH_MD_RE` is
  `/\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g`. Its link branch requires
  `]` **immediately** followed by `(`, and the URL run forbids whitespace, so
  `Dear [First Name],` is untouched — **verified against the live regex, not assumed.** But
  **`[Company](Chicago)` is parsed as a markdown link.** Narrow, real, and closed by the
  template validator: **any `[` … `](` sequence whose bracket content matches a known token
  name is rejected at authoring time.**

### E6 — Scheduling and advance

```js
nextDueDate = shiftTaskDate(completedDate, nextStep.delayDays, taskDateMode());
```

- ⛔ **`shiftTaskDate()` IS ALREADY BUILT** — Phase 1 contract C11, UTC arithmetic, frozen
  test vectors in its own comment. **Call it. Do not re-derive it, and do not write a second
  `addBusinessDays()`.**
- **Delays count from the previous step's COMPLETION date, not its due date.** A step
  completed two days late slides everything after it by two days. Nothing catches up.
- **Weekends only. No holiday calendar.** Thanksgiving is a working day as far as Vantage is
  concerned; the workaround is TaskHub's bulk shift. Per `DECISIONS.md` 2026-08-28 **the
  All Days / Business Days setting is never retroactive** — flipping it changes future
  arithmetic and does not move dates already computed.
- **The starting step's own `delayDays` is IGNORED.** A delay applies only to a step reached
  by advancing. Start timing defaults to `todayLocalDateStr()`; a custom date replaces it.

**Advance, in full:**

1. Stamp `completedDate` on the live snapshot entry.
2. If a next snapshot entry exists: set `currentStepId` to it, set its `dueDate` per the call
   above, create its task per E4, store the new `taskId` on it, **clear the previous entry's
   `dueDate`**.
3. If none exists: `status = "completed"`, `currentStepId = null`. The enrollment leaves the
   active set.

- ⛔ **THE ADVANCE HANGS OFF `completeTask()` AND NOWHERE ELSE.** `BUILD_NOTES.md` records it
  as the single writer and that `saveTaskFromEditor()` already delegates its whole
  open→completed transition to it. Hooking anywhere else fires twice or not at all. **If a
  later session adds a fourth completion surface, route it through `completeTask()`.**
- **Bulk Mark Complete advances too, per task.** Its existing confirmation gains one line
  naming how many of the selection are sequence steps — *"12 tasks — 7 are sequence steps and
  will schedule their next step."* Refusing sequence tasks in bulk would silently stall the
  sequences it skipped, which is the invisible-failure shape DIRECTIVES §3 rules against.
- ⛔ **ADVANCE IS ONE-WAY.** Unticking "Mark complete" on a task that already advanced returns
  **the task** to open. It does **not** retract the advance and does **not** delete the next
  task. It **warns**, naming what already happened. Retracting means deleting a task the app
  just created, fired by unticking a checkbox — a destructive data change on the lightest
  possible gesture.

### E7 — One live enrollment per prospect, and re-enrollment

- **A prospect may have at most ONE enrollment with status `active`, across ALL sequences** —
  not one per sequence. Michael, 2026-09-04.
- **A second attempt is a HARD REFUSAL with the live enrollment named** — *"Sally Quinn is
  live in Conference Follow-Up, step 2 of 5"* — plus a link to it. ⛔ **It is not a prompt
  offering to unenroll her for you.** A one-click swap is how someone loses a sequence they
  were halfway through.
- `completed` and `unenrolled` enrollments **do not count as live.**
- **Re-enrolment is allowed behind an explicit confirmation** whenever this prospect has any
  prior `completed` or `unenrolled` enrollment in **this** sequence: the banner names the
  sequence and the date and replaces Enroll with a confirmation the user clicks through. **No
  prior history → no friction.**
- **Start at step N snapshots steps N onward only. No history entries are backfilled for
  steps that were never sent.**
- This rule is also what **caps snapshot storage growth at one snapshot per prospect**,
  whatever the sequence count — see Open Risk 3.

### E8 — Validation: three moments, and none replaces another

| Moment | What is measured | Where |
| --- | --- | --- |
| **Template** | the step template, tokens unresolved | sequence builder — 3.10 |
| **Resolved copy** | the merge-resolved text, before commit | enrollment review — 3.12 |
| **Literal value on a task** | the stored task field | compartment A's Q6 — **already built** |

⛔ **VALIDATING THE TEMPLATE IS NOT VALIDATING THE VALUE.** A 290-character connection note
overflows the moment `[Company]` resolves to "Northwestern Mutual Financial Network". Both,
or neither is real.

- **Ceilings come straight from `TASK_MSG_LIMITS`, unchanged:** `connect` body 300 · `inmail`
  subject 200 / body 1900 · `message` body 3000 · `compose` and `thread` **no per-field
  ceiling** (`0` means no ceiling, not zero characters). ⛔ **`compose`'s real constraint is
  the assembled URL at ~2000 characters, which cannot be measured without
  `gmailComposeUrl()`. Do not approximate it from the body alone** — a wrong ceiling that
  looks authoritative is worse than an honest count.
- **LinkedIn counts the FLATTENED output** (amendment A2), because that is what LinkedIn
  receives and counts. Email kinds count the stored string.
- **The enrollment preflight FLAGS EVERYTHING AND BLOCKS NOTHING.** Per step in the review:

| Condition | Behaviour |
| --- | --- |
| Resolved body or subject over the kind's ceiling | Counter red, named warning. **Not blocked, not truncated.** |
| Email step and `prospect.email` is blank | Named warning: this step will produce a task with no recipient. |
| LinkedIn step and `prospect.linkedin` yields no `/in/` slug | Named warning. **A non-matching value is a data error to fix, not a format to support** — Michael, 2026-09-03. **Do not add Sales Navigator URL handling.** |
| One or more tokens resolved empty | Count them and name them. |

  Both existing precedents point here: compartment A's *"flag at enrollment, not at click
  time"*, and Q6's *"blocking would silently drop a step out of a sequence, which is worse
  than a visible over-length task."* And it is far stronger under a review pass than it was
  under a one-click enroll — a flag beside text you are already reading is not something that
  gets missed.
- **The template validator rejects** an empty step list, a step with an empty body, and any
  `[Token](` sequence per E5.

### E9 — What does not change

- **Two new stores. Not three, and no others.** No `state.sequenceSteps`, no
  `state.sequenceTemplates`, no per-sequence settings object.
- **`state.taskSettings` gains nothing.** `dateMode` and `workGmailAddress` are the two keys
  and they stay the two keys.
- ⛔ **`wipeAllData()` gains exactly TWO hand-written lines**, both to `[]`. It clears an
  **explicit list**, not everything. `state.tasks` was missed in Session 1.3 and
  `state.taskSettings` in the same session, and the consequence was a restore drill that
  could not fail for four months.
- ⛔ **`ensureStateDefaults()` uses `if (state.sequences === undefined)`, NEVER
  `if (!state.sequences || state.sequences.length === 0)`.** The `length === 0` guard is the
  live Phase 2C defect: it cannot tell "the user emptied this" from "this key is missing", so
  it reseeds on every boot and every restore. **A new store must not be born carrying it.**
- **The restore router is `handleRestoreFile()` → `processRestoreFile()`**, and both of its
  branches — the ZIP entry and the single-CSV `fileName.includes(...)` — get a leg.
  ⚠️ **`processSingleCSVContent()` is NOT the restore path.** It exists, as a private inner
  function of `importCSVContacts()` serving contact import, and greps as three hits.
- **Local snapshots need no per-store code.** Tier 1 serialises the whole state object and
  captures both new stores automatically. **The ZIP/CSV path is the one that needs work.**
- **`notes`, `source` and `sourceRef` are not repurposed** — E4.
- **No routing.** P9 holds unchanged.
- **No new dependency, no build step, no framework.** DIRECTIVES §4.
- **`CACHE_NAME` is bumped in `sw.js` on every session that touches `index.html`, `app.js` or
  `style.css`. Budget TWO bumps per session.**

### E10 — Authoring rules that apply to every UI session in this compartment

Not a new decision — the codebase's own accumulated rules, gathered here so a session does
not have to find them.

- **`createElement` / `appendChild`.** ⛔ **`innerHTML +=` destroys listeners** and has bitten
  this codebase specifically.
- **Static markup in `index.html`, ONE delegated listener on the static container, a `data-*`
  attribute as the opt-in** — the `data-tab-key` / `data-pd-key` convention.
- ⛔ **A modal opened from another modal needs the `z-index: 999999` escalation.** Every
  `.modal-overlay` is `z-index: 200`, so DOM order otherwise decides which one is touchable.
  **The enrollment review modal is opened from the prospect detail view — 3.12 checks whether
  it qualifies and says which.**
- **Per-record lookups inside a render loop use a `Map` built once per render, never a
  `.find()` per row.** At 652 prospects and 1,091 companies a `find()` inside a predicate is
  O(n×m) per keystroke.
- ⛔ **Reuse the TaskHub selection pattern exactly** where selection is needed: a module-scope
  `Set`, and **a per-row checkbox handler must not re-render its own table** — mutate the Set
  and repaint only the dependent summary text. **The header select-all is the one documented
  exception and may re-render.** TaskHub carries comments at both sites saying the asymmetry
  is deliberate.
- **Every input labeled, every control keyboard-operable, focus visible.** ⚠️ **Authoring
  habits, not Gate F** — Gate F is inert (§0 accessibility target `none`) and **a session is
  never blocked on them.**
- **`style.css`: the `🧱 HUB SHELL` block stays LAST** — contract S5. A new block goes before
  it, or a new entry goes inside it.

---

## Sessions — COMPARTMENT A · shipped, not re-planned

⛔ **FULL DETAIL FOR ALL SEVEN IS IN `ai/phases/phase-3-outreach-launch.md` AND IS NOT
REPRODUCED HERE.** This table exists so a reader of this file knows what already ran and what
its numbers were. **Nothing here is re-opened.**

| Session | Title | Compartment | Size | Status |
| :---: | --- | :---: | :---: | --- |
| **3.1** | Task outreach fields, settings, and their backup coverage | DATA | M | ✅ Shipped 2026-09-03 |
| **3.1b** | Remove the Bcc (amendment **A1**) | DATA | S | ✅ Shipped 2026-09-03 |
| **3.2** | The outreach block: manual entry, auto-fill, counters | UI | M | ✅ Shipped 2026-09-04 · `CACHE_NAME` v128 |
| **3.3** | Email launch: URL builders, buttons, every guard | UI + LOGIC | M | ✅ Shipped 2026-09-04 · v131 · produced amendment **A4** |
| **3.3c** | The authoring surface: toolbar, two disclosures, live preview | UI | M | ✅ Shipped 2026-09-04 (split from 3.3 under **A2**) |
| **3.4** | LinkedIn launch: slug, three kinds, explicit copy controls | UI | M | ✅ Shipped 2026-09-04 · `CACHE_NAME` v134 |
| **3.5** | Compartment QA — drill, curation, A1–A4 audit | QA | M | ✅ Ran 2026-09-04 as a **compartment** close. **The phase stayed open.** |

**Compartment A actual: 5 planned, 7 run. Every session came in at its estimated size — zero
re-sizes, the first compartment in this project with none — and BOTH extra sessions came from
amendments Michael authorised mid-phase, not from underestimation.** Planned ~56 min of his
attention; ran ~23.

⛔ **`3.5b` IS THE REAL PHASE CLOSE AND IT STILL RUNS LAST.** It is planned at the end of this
file. What 3.5 already did and **must not be redone**: the export→wipe→restore drill on real
data (all nine CSVs md5-identical either side), the snapshot restore re-verify, the A1–A4
audit against the code, the compartment-A calibration, the `BUILD_NOTES.md` curation, and the
`DECISIONS.md` / `DECLARATIONS.md` proposals.

---

## Sessions — COMPARTMENT B

**Contract-first ordering.** ⛔ **Backup lands before UI**, per DIRECTIVES §4 and the precedent
both prior phases set. The order below is the scope's own build order with the contract item
absorbed into this document, where it belongs.

⛔ **THE BACKUP-COVERAGE HARD LIMIT (DIRECTIVES §4) FIRES ON 3.6 AND 3.8 AND ON NOTHING ELSE
IN THIS COMPARTMENT.** Every other session states in its summary that it creates no store and
modifies none. Say it explicitly rather than leaving it unremarked — a session that is silent
on it reads as a session that did not check.

### Session 3.6 — The two stores, their backup coverage, and the drill

- **Compartment:** DATA · **Depends on:** compartment A shipped
- **Goal:** `state.sequences` and `state.sequenceEnrollments` exist per E1 and E2, default
  correctly, survive a reload, ride in the ZIP as **two new CSVs**, restore by header name,
  keep orphans in both directions, and survive export → `wipeAllData()` → restore
  **character-identical on a multi-paragraph body carrying commas, quotes and newlines.**
  **No UI. Nothing renders. Nothing creates a sequence except the console.**
- **Size: L** · My time: ~12 min · **Confidence: High**

  **Sized L, and it should NOT be split — here is the reasoning, per Prompt 3.** The obvious
  cut is one session per store. It is rejected for three reasons and each is sufficient:
  (1) DIRECTIVES §4 makes a store without backup coverage a stop-and-ask, so a split that
  ships `state.sequences` before its restore leg is not available; (2) the two stores share
  **one** CSV pattern, **one** ZIP-count change (9 → 11) and **one** drill, so splitting means
  running the destructive drill against real data **twice**, which costs two backup points and
  two of Michael's confirmations for no new information; (3) the work is one shape repeated,
  not two subsystems — the second store is the first store's functions with different field
  names. **Confidence is High rather than Low because the CSV round trip has now been proved
  four times across two phases, which is what makes an L here safe.** ⚠️ **If it does run
  long, the cut line is the ENROLLMENTS half** — sequences ship complete with their own drill
  leg and enrollments become 3.6b. Do not cut the drill.
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. `ensureStateDefaults()`: both stores, ⛔ **guarded `=== undefined`, never
     `length === 0`** — E9. Filed beside the existing store defaults.
  2. **The per-record back-fill loop**, per assumption B9: every sequence, step, enrollment
     and snapshot entry gets every field in E1/E2 defaulted, so a record created through the
     app's own create path reads `""` rather than `undefined` after a restore.
     ⛔ **Build the create literal from the same field list** — `AIContext.md` 2026-09-04
     records that the two have already drifted once here.
  3. `wipeAllData()`: **two hand-written lines**, both to `[]`. Nothing else in that function
     changes.
  4. Export: `generateSequencesCSV()` / `exportSequencesCSV()` and
     `generateSequenceEnrollmentsCSV()` / `exportSequenceEnrollmentsCSV()`, filed beside the
     existing CSV writers, and **both added to `exportZIPBackup()`'s bundle beside the
     existing nine.** Nested `steps` as JSON in one cell, per E3.
  5. Restore: `restoreSequencesFromCSV()` and `restoreSequenceEnrollmentsFromCSV()`, plus
     their `describe…Restore()` summary helpers, wired into **`processRestoreFile()` — BOTH
     the ZIP-entry branch AND the single-CSV `fileName.includes(...)` branch.** Header-name
     mapping, enum coercion, the trim split, malformed-JSON degrade to `[]`.
  6. **Orphan handling, both directions**, per the table in Open Risk 5: an enrollment whose
     `prospectId` or `sequenceId` does not resolve is **kept and counted in the restore
     summary**, never discarded.
  7. Bump `CACHE_NAME`. **Budget two bumps.**
- **Inputs needed from me:** none. **One backup confirmation before the session** — see
  Backup points.
- **Done when:**
  - Console: paste `state.sequences` and `state.sequenceEnrollments` after a fresh boot,
    both `[]`, and paste `"sequences" in state` and `"sequenceEnrollments" in state` as
    `true` — **a missing key and an empty array must be distinguishable.**
  - Console: **set both stores to `[]` by hand, reload, and paste them still `[]`.** This is
    the `length === 0` regression check and it is the one that proves the new stores did not
    inherit the Phase 2C defect. ⛔ **A store that reseeds here has failed the session.**
  - Console: build one sequence with **three** steps and one enrollment with a **five-entry**
    snapshot, entirely from the console, `saveState()`, reload, paste both back unchanged.
  - Console: paste both CSVs' header rows and one full data row each, showing the `steps`
    cell as valid JSON that `JSON.parse()` round-trips to the same object.
  - **ZIP round trip, driven per `BUILD_NOTES.md`** — stub `prompt`/`alert`/`confirm` into a
    capture array (⚠️ **the `prompt` stub must return `"YES"` or the wipe silently does
    nothing**), wrap `saveBackupFile` to stash the blob: export → paste the ZIP's entry list
    showing **11 CSVs** → `wipeAllData()` → **paste both stores showing them genuinely
    emptied** → restore → paste both back.
    ⛔ **A leg that could not have failed proves nothing.**
  - Console: the snapshot body used in the drill carries **at least 4 newlines, 2 double
    quotes, 2 commas, a markdown link and trailing whitespace**; paste
    `first difference index` as **`-1`** for `subject` and for `body`, and paste the trailing
    whitespace count preserved.
  - Console: restore a **hand-made enrollments CSV whose `Sequence Id` and `Prospect Id` both
    point at nothing**, and paste the restore summary's orphan counts and the enrollment
    still present in state.
  - Console: restore a **sequences CSV with the columns in a different order and one column
    absent**, and paste the record restored with the missing field `""` and no error.
  - Console: restore a **sequences CSV whose `Steps` cell is malformed JSON**, and paste
    `steps` as `[]`, the row still present, and no exception.
  - Clean console; `node --check app.js` parses; `check_ids.py` at baseline; all six views
    render; state survives reload.
- **Needs my eyes:** nothing rendered this session.
- **Risk and fallback:** the one real risk is the JSON-in-a-cell round trip on a body holding
  quotes and newlines. `convertToCSV()` quotes unconditionally and `parseCSV()` tracks quote
  state, proved in 1.3, 2B.7, 3.1 and 3.5. **If it ever fails, the fallback is base64 on that
  one cell — ⛔ do NOT add a third file**, per the C17 instruction beside `generateSettingsCSV()`.
- **⚠️ Backup point: manual ZIP + a proved snapshot write before this session.** Its Done-when
  calls `wipeAllData()` against real data.

### Session 3.7 — Merge tokens: the resolver and the template validator

- **Compartment:** LOGIC · **Depends on:** 3.6
- **Goal:** E5 exists as pure functions. The nine tokens resolve against a prospect,
  unresolvable ones become empty strings and are **counted and named**, and the template
  validator rejects the three things E8 says it rejects. **Nothing calls any of it yet** —
  the builder and the review modal are 3.10 and 3.12.
- **Size: S** · My time: ~4 min · **Confidence: High**
- **Genuinely S.** Pure functions over an object, no DOM, no state mutation, no store. Every
  check is a console call with a literal expected value. It is its own session rather than
  folded into 3.10 because it is **LOGIC** and 3.10 is **UI**, and because a resolver that
  rides along inside a builder session is the one that gets half-tested.
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. The token table as one module-scope constant — **one enumeration, nothing else lists the
     nine.** Filed with the general helpers, beside `getCompanyName()`, because two sessions
     consume it.
  2. `resolveMergeTokens(text, prospect)` → `{ text, emptyTokens: [] }`. Case-insensitive on
     the name, exact on the brackets, **empty string for anything unresolvable**, and the
     names of every token that resolved empty returned beside the text.
  3. `[Email]` added to the list. ⛔ **`[LinkedIn]` is NOT a token and must not be added.**
  4. `validateStepTemplate(step)` per E8 — empty body, and the `[Token](` collision per E5.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste the resolver's output for a body carrying **all nine tokens** against a
    fully-populated real prospect, and paste `emptyTokens` as `[]`.
  - Console: the same body against a prospect with **no company, no title and no conference
    fields**, showing every gap as an **empty string** — ⛔ **paste that the output contains
    no `[` character** — and `emptyTokens` naming exactly the tokens that were empty.
  - Console: paste `[first name]`, `[FIRST NAME]` and `[First Name]` all resolving, and
    `[ First Name ]` and `{First Name}` **not** resolving.
  - Console: ⛔ **the collision check.** Paste `outreachConvertBody()`'s output for
    `Dear [First Name],` showing it **untouched**; then paste `validateStepTemplate()`
    rejecting `[Company](Chicago)` and **accepting** `[Tech RFP](https://example.com)`.
  - Console: paste a resolved body containing `**bold**` and a markdown link going through
    `outreachBodyToHtml()` **unchanged in meaning** — resolution must not disturb the
    converter and the converter must not disturb resolution.
  - Console: `validateStepTemplate()` on a step with an empty body, and on a sequence with an
    empty step list.
  - Clean console; `check_ids.py` at baseline; state survives reload.
- **Needs my eyes:** nothing rendered.
- **Risk and fallback:** low. The single thing to get right is the regex boundary between a
  token and a markdown link, and it has one decisive check above. If the two ever cannot be
  separated cleanly, the fallback is to change the token delimiter — **which is a
  breaking change to nothing, because no template exists yet.** That is the whole reason this
  session lands before the builder.

### Session 3.8 — The two history types, and one writer

- **Compartment:** DATA · **Depends on:** 3.6
- **Goal:** `"Enrolled in Sequence"` and `"Unenrolled from Sequence"` exist, are registered as
  **non-reachouts**, survive restoring an older settings backup, and are written by **exactly
  one function**. ⛔ **Nothing calls that function yet** — 3.11 and 3.14 do, and each will call
  it at the moment it is written rather than a later session going back into two shipped
  functions to add calls.
- **Size: S** · My time: ~4 min · **Confidence: High**
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. Both values added to **`NON_REACHOUT_TYPES`**, beside `"Task Completed"`,
     `"Added to Vantage"` and `"Entered into Vantage"`. They are timeline entries and nothing
     more: they do **not** move `getLastReachoutDate()`, do **not** feed the Advanced Query
     date filters, and are **not** counted in the dashboard's reachout total.
  2. Filtered out of the manual "log a reachout" dropdown, which offers contact types only.
     `openInteractionModal()` already filters by `isRealReachout()` — **confirm, do not
     rebuild.**
  3. ⛔ **BOTH HALVES OF THE C6 MIGRATION.** Add the values to the **first-run literal** *and*
     push them **idempotently** in the `else` branch of `ensureStateDefaults()`.
     `restoreSettingsFromCSV()` replaces each list wholesale, so restoring an older backup
     drops values added since. **One half alone is a silent regression.**
  4. **One writer** — `logSequenceHistory(prospect, kind, detail)` — routed the way every path
     routes through `logTaskCompletionHistory()`. ⛔ **Do not add a second history writer.**
     Use **`newHistoryId(prospect)`** for the id: `hist-${Date.now()}` collides inside a loop
     and **duplicate history ids are destructive, not cosmetic.**
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste `state.reachoutTypes` containing both values after a fresh boot, and
    `NON_REACHOUT_TYPES` containing both.
  - Console: ⛔ **the C6 both-halves check.** Restore a **pre-3.8 settings CSV** whose reachout
    list lacks both values, then paste `state.reachoutTypes` showing them **back**, and paste
    that nothing was duplicated.
  - Console: write one entry of each type onto a real prospect through the writer, then paste
    `getLastReachoutDate(p)` **unchanged** and the dashboard's reachout count **unchanged**,
    and paste the entries **present in `p.history`** — the timeline shows them, the maths does
    not. *(This is the Interactions-tab rule: `isRealReachout()` is not applied to the
    timeline, and a session that "fixes" that is removing the feature.)*
  - Console: paste the manual reachout dropdown's options showing **neither value present**.
  - Console: call the writer twice inside one loop and paste the two history ids as
    **different**.
  - Clean console; `check_ids.py` at baseline; state survives reload.
- **Needs my eyes:** nothing rendered.
- **Risk and fallback:** low. The only trap is the C6 half-migration, and it has a check above
  that cannot pass by accident.

### Session 3.9 — Campaign Hub: the Sequences sub-tab and the sequence list

- **Compartment:** UI · **Depends on:** 3.6
- **Goal:** A fifth sub-tab, **Sequences**, alongside Campaigns / Audiences / Email Accounts /
  Domains. It lists sequences with an **Active / Archived** strip, creates one, renames it,
  archives and restores it, and deletes one **no enrollment has ever referenced**. **No step
  editing yet** — a sequence created here has zero steps and says so.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. The sub-tab, through the existing `campaignViewSubState` / `switchCampaignSubTab()`
     machinery. ⛔ **No seventh hub** — DECLARATIONS records six.
  2. The list, and the Active/Archived strip **mirroring `audienceListStatusFilter` exactly**;
     Archive / Restore mirroring `archiveAudienceList()` / `restoreAudienceList()`.
  3. Create and rename. Names are **not enforced unique** — B5.
  4. **Delete is available only for a sequence no enrollment has ever referenced**, and the
     button is disabled with the reason named otherwise. ⛔ **Archiving preserves; it never
     destroys** — DECLARATIONS.
  5. **The archive-with-live-enrollments prompt is NOT built here** — it needs the unenroll
     path and is Session 3.14. **Until then, archiving a sequence with live enrollments simply
     archives it and they keep running**, which is one of the two answers that prompt will
     offer. Say so in the summary; it is a known temporary state, not a defect.
  6. Empty state: no sequences, no seeded examples, ever.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste `campaignViewSubState` after clicking each of the five sub-tabs, and paste
    the four pre-existing ones rendering unchanged.
  - Console: create two sequences, archive one, paste `state.sequences` showing the two
    statuses, and paste the Active and Archived lists' row counts.
  - Console: paste the delete button's `disabled` and its reason for a sequence with an
    enrollment against it, and **enabled** for one without.
  - Console: reload and paste the list rendering from state, not from a cache.
  - **Screenshot** the sub-tab at canvas width, Active and Archived, sidebar pinned and
    unpinned, and the empty state.
  - Clean console; `check_ids.py` at baseline; **CampaignHub regresses clean** — all four
    existing sub-tabs render and their own tables still resize.
- **Needs my eyes:** whether Sequences sits in the right place in the sub-tab strip, and
  whether the Active/Archived strip reads the same as the Audiences one.
- **Risk and fallback:** low. CampaignHub's sub-tab machinery has four working consumers. The
  one thing to watch is that **CampaignHub's older per-table resizer
  (`makeTableColumnsResizable()`, `.col-resize-handle`) is different machinery from the
  `COLUMN_TABLES` registry** — ⛔ **do not register the sequence list with either.** Column
  layout is out of scope for this compartment.

### Session 3.10 — The step editor

- **Compartment:** UI · **Depends on:** 3.7, 3.9
- **Goal:** A sequence's steps can be added, reordered and removed; each declares a delay, a
  channel, a kind, an optional subject and a body; the body is authored on **3.3c's surface**;
  counters read against `TASK_MSG_LIMITS`; a **token picker** inserts at the cursor; and
  **3.7's template validator is wired to Save.**
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. Add / reorder / remove. **Reordering rewrites `order`, never `id`** — E1. Contiguous
     1-based after every operation.
  2. Per step: delay in days; channel picker; kind picker with options from
     **`TASK_CHANNEL_KINDS`** and defaults per **`CHANNEL_DEFAULT_KIND`** and the rule below.
  3. ⛔ **Per-step kind defaults, inherited from compartment A §3.1 and overridable per step:**
     email step 1 → `compose`, later email steps → `thread`; LinkedIn step 1 → `inmail`, later
     LinkedIn steps → `message`; **`connect` is never a default.** This is what delivers "only
     the first LinkedIn step carries a subject" **through the kind rather than through a
     positional rule anywhere in the code.**
  4. Subject shown **only for kinds that have one** (`taskKindHasSubject()`) and **hidden
     entirely, not disabled**, for the rest. ⚠️ **The task editor DETACHES its subject group
     from the document rather than hiding it, and that asymmetry is deliberate there** — this
     surface is a different one and may hide; **do not go and "unify" the two.**
  5. Body on 3.3c's surface — `taskBodyWrapSelection()`, `taskBodyInsertLink()`,
     `renderTaskBodyPreview()`. ⛔ **The renderer is `outreachBodyToHtml()` /
     `outreachFlattenBody()`. THERE IS NO SECOND RENDERER AND THERE MUST NEVER BE ONE.**
     ⚠️ **The toolbar must dispatch a real `input` event after it writes `.value`** — assigning
     `.value` fires nothing and three repaints hang off `input`.
  6. **Template-level counters** against `TASK_MSG_LIMITS`, flattened for LinkedIn kinds per
     A2. ⚠️ **`0` means no ceiling, not zero characters**, and **`compose` gets an honest bare
     count, never an approximated URL length.**
  7. **The merge-token picker** — E5's nine, inserting at the cursor.
  8. `validateStepTemplate()` wired to Save, with the reason named. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: build a five-step sequence, reorder step 4 to position 2, paste every step's `id`
    **unchanged** and every `order` contiguous and 1-based.
  - Console: remove a middle step and paste `order` re-contiguous with the remaining ids intact.
  - Console: paste the kind select's options for each channel matching **Q2 exactly**, and
    paste the defaulted kind for step 1 and step 3 on each channel, and that **`connect` is
    never the default**.
  - Console: paste that the Subject control is **absent from this surface** for `thread`,
    `connect` and `message`, and present for `compose` and `inmail`.
  - Console: paste the counter text and computed colour at **299 / 300 / 301** on a `connect`
    step, measured **flattened** — put `**bold**` in the body and show the count is the
    flattened length, not the stored one.
  - Console: select a range, click **B**, paste the field value showing `**…**` around exactly
    the selection; click a token in the picker and paste it inserted **at the caret**.
  - Console: paste the preview's `innerHTML` and `outreachClipboardPayload()`'s `text/html`
    for the same body, showing them **identical**.
  - Console: Save with an empty body → paste the refusal and the reason. Save with
    `[Company](Chicago)` → paste the refusal. Save with `[Tech RFP](https://…)` → **saves.**
  - Reload; the sequence and every step survive. Clean console; `check_ids.py` at baseline;
    **the task editor regresses clean** — its own toolbar, counters and preview still work.
  - **Screenshot** a three-step sequence with a mixed email/LinkedIn set.
- **Needs my eyes:** whether the per-step block is readable at five steps, and whether the
  token picker belongs beside the body or above it. **This is the surface I will author in.**
- **Risk and fallback:** the real risk is **reusing 3.3c's surface without cloning it** — the
  functions read `#task-msg-body` by id and this surface has many bodies. ⛔ **Parameterise the
  existing functions by element; do not copy them.** If parameterising turns out to reach into
  the task editor's own behaviour, the fallback is a **thin adapter that calls the same
  converter** — the converter is the part that must not fork; the selection helpers may.

### Session 3.11 — The enrollment commit path

- **Compartment:** LOGIC · **Depends on:** 3.7, 3.8, 3.10
- **Goal:** E5, E6's start-timing rule and E7 exist as functions. Given a prospect, a
  sequence, a starting step and a start date, the app builds the frozen snapshot, refuses a
  second live enrollment **by name**, detects prior history for the re-enrollment
  confirmation, writes the enrollment, creates the first task per E4, and writes one history
  entry through 3.8's writer. ⛔ **No UI. Called from the console only** — assumption B12.
- **Size: M** · My time: ~6 min · **Confidence: High**
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. `buildEnrollmentSnapshot(sequence, prospect, startStepId)` — **pure**. Returns the entry
     array for steps `startStepId` onward, every `subject` and `body` **resolved through 3.7**,
     `dueDate` / `completedDate` / `taskId` all `""`.
  2. `liveEnrollmentFor(prospectId)` and `priorEnrollments(prospectId, sequenceId)` — both
     **pure reads**, both returning enough to write E7's refusal sentence and the
     re-enrollment banner.
  3. `commitEnrollment(...)` — writes the record, sets `currentStepId` to the starting step,
     sets its `dueDate` from **start timing, ignoring that step's own `delayDays`** per E6,
     creates its task through the existing create path, stores the `taskId`, calls
     `logSequenceHistory()`, `saveState()`.
  4. **The preflight, as a pure function** — `enrollmentPreflight(snapshot, prospect)`
     returning E8's four conditions per step. ⛔ **It checks EVERY step's destination, not
     just the starting one** — a mixed-channel sequence run against someone with no LinkedIn
     URL produces a dead task at step 3, and that is a Done-when, not a design note.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: enroll a real prospect at **step 1** of a five-step sequence; paste the
    enrollment, showing five snapshot entries, **entry 1 carrying the only `dueDate` and the
    only `taskId`**, and the other four with both `""`.
  - Console: enroll at **step 4**; paste **two** snapshot entries and paste that **no history
    entries were backfilled** for steps 1–3.
  - Console: paste one snapshot `body` beside the sequence template it came from, showing the
    template's tokens **still intact** and the snapshot's **fully resolved** — the freeze,
    demonstrated in one paste.
  - Console: ⛔ **edit the master sequence's step 3 body, then paste the live enrollment's
    entry 3 UNCHANGED.** This is Decision 7 and it must be true by construction.
  - Console: paste the created task showing `source: "sequence"`,
    `sourceRef === "<enrollmentId>:<stepId>"`, `notes === ""`, `msgSubject` with **no `"Re:"`
    prefix**, and `msgTo` matching `prospect.email` or `prospect.linkedin` for its channel.
  - Console: ⛔ **the one-live gate.** Attempt a second enrollment in a **different** sequence
    and paste the refusal object naming the live sequence and **"step N of M"**. Then set the
    first to `completed` and paste the second attempt **succeeding**.
  - Console: paste `priorEnrollments()` returning the completed one, so the banner has
    something to name.
  - Console: paste `enrollmentPreflight()` for a prospect with **no email** and a
    **non-`/in/` LinkedIn value**, against a sequence mixing both channels, showing warnings
    on **the steps at every position, not only the first**, plus an over-ceiling flag from a
    long `[Company]` and a named empty token.
  - Console: paste that **nothing hard-blocked** — every preflight above still commits.
  - Reload; both records survive. Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** nothing rendered.
- **Risk and fallback:** the risk is a snapshot that is subtly not frozen — a shared object
  reference back into the sequence's own steps. ⛔ **Build each entry as a NEW object literal;
  never spread the step and mutate it**, and the master-edit check above is what catches it.
  Fallback: none needed; if the check fails the session is not done.

### Session 3.12 — The enrollment review modal

- **Compartment:** UI · **Depends on:** 3.11
- **Goal:** Enrolling is the three-part review pass the scope specifies — **Setup**, **Review**
  and **Commit** — opened from the prospect detail view, with every step's resolved copy
  **editable in place**, live counters, HTML preview, the preflight strip, the one-live
  refusal and the re-enrollment confirmation.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. **Setup:** sequence picker listing **`active` sequences only**; **Start at step**,
     defaulting to 1; **Start timing**, defaulting to *Start now*
     (`todayLocalDateStr()`) with a custom date replacing it; the **re-enrollment banner**
     when 3.11 reports prior history, replacing Enroll with a confirmation.
  2. **Review:** every step from the starting step onward, in order — step number, channel,
     kind, **the delay in words** (*"+3 business days after step 2"*, reading
     `taskDateMode()`), resolved subject (`compose` and `inmail` only) and resolved body
     **both editable in place**, the live counter (flattened for LinkedIn), the HTML preview,
     and the **preflight strip** naming everything 3.11 flagged.
  3. **Commit:** calls 3.11's `commitEnrollment()` with the **edited** copy.
     ⛔ **After commit the snapshot is read-only.** A step's copy is editable again only when
     its task lands, in the task editor.
  4. **The one-live refusal**, rendered per E7 — named, with a link to the live enrollment,
     and ⛔ **no offer to unenroll for you.**
  5. ⚠️ **The `z-index: 999999` escalation.** This modal is opened from the prospect detail
     view. **Check whether it qualifies and state which in the summary** — every
     `.modal-overlay` is `z-index: 200` and DOM order otherwise decides which is touchable.
  6. Bump `CACHE_NAME`. **Budget two.**
- **Inputs needed from me:** none. **One look at the review pane at four or five steps.**
- **Done when:**
  - Console: paste the sequence picker's options showing **archived sequences absent**.
  - Console: open at Start-at-step 3 and paste the review pane's rendered step count matching
    the snapshot length; paste the delay wording for step 4 in both date modes.
  - Console: edit step 2's body in the pane, commit, and paste the **stored** snapshot
    carrying the edit and the **master sequence template unchanged**.
  - Console: paste the counter at 299 / 300 / 301 on a `connect` step **measured flattened**,
    and paste the preview's `innerHTML` equal to the converter's output for the same body.
  - Console: paste the preflight strip's text for a prospect with no email, an unusable
    LinkedIn value, an over-ceiling resolved body and an empty token — **four distinct named
    warnings** — and then **commit anyway**, pasting the enrollment written. ⛔ **Nothing
    hard-blocks.**
  - Console: with a live enrollment present, open Enroll and paste the **refusal text naming
    the sequence and "step N of M"**, and paste that **no unenroll control exists** in it.
  - Console: with only a completed prior enrollment, paste the **re-enrollment confirmation**
    present; with no prior history, paste it **absent**.
  - Console: paste the modal's computed `z-index` **and** the detail view's, and state which
    is on top.
  - **Screenshot** the three parts at canvas width, and one step showing counter, preview and
    a preflight warning together.
  - Clean console; `check_ids.py` at baseline; **the task editor regresses clean.**
- **Needs my eyes:** whether the review pane is readable at five steps without becoming a
  scroll marathon, and whether editing in place feels right or wants a per-step expand.
- **Risk and fallback:** this is the session most likely to produce an amendment, because it
  is the surface Michael specified himself and has not yet seen. **That is expected and it is
  budgeted** — see the estimate's amendment line. The technical risk is the modal-over-modal
  stacking, which has one decisive check above. **If the pane crowds at five steps, the
  fallback is per-step disclosures defaulting to expanded — same content, one wrapper.
  ⛔ Do NOT fall back to a wizard that shows one step at a time**; seeing the whole sequence
  before committing is the point of the feature.

### Session 3.13 — Advance

- **Compartment:** LOGIC · **Depends on:** 3.11
- **Goal:** E6's advance is true everywhere a task can be completed. Completing a
  sequence-produced task stamps its snapshot entry, makes the next step live, dates it from
  the **completion** date through `shiftTaskDate()`, and creates its task. Bulk Mark Complete
  does the same, per task, behind a confirmation that names the count. **Advance is one-way.**
- **Size: M** · My time: ~6 min · **Confidence: High**
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. The advance, hung off **`completeTask()` and nowhere else.** ⛔ `saveTaskFromEditor()`
     already delegates its whole open→completed transition to it — **do not add a second
     hook there.**
  2. **`bulkCompleteTasks()` advances per task.** Its confirmation gains **one line** naming
     how many of the selection are sequence steps.
  3. **Last-step completion** sets `status = "completed"`, `currentStepId = null`.
  4. **One-way:** unticking Mark complete on a task that already advanced returns **the task**
     to open, **warns naming what already happened**, and **retracts nothing and deletes
     nothing.**
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: complete step 1's task from the **editor checkbox**; paste the enrollment showing
    entry 1 with a `completedDate` and no `dueDate`, entry 2 live with a `dueDate` and a
    `taskId`, and the new task's `sourceRef` pointing at entry 2's `stepId`.
  - Console: ⛔ **the double-advance check, and it is the one that matters.** Paste
    `state.tasks.filter(t => t.sourceRef === "<enr>:<step2>").length` as **`1`**, then repeat
    the completion through **`saveTaskFromEditor()`** and paste it **still `1`**. Two tasks
    for one step looks like a data bug and is a wiring bug.
  - Console: paste the due date computed from the **completion** date, not the due date — set
    the completion two days late and paste the next due date two days later than a
    same-day completion would have given, **in both date modes**, against `shiftTaskDate()`'s
    own frozen vectors.
  - Console: bulk-complete a selection of **12 tasks of which 7 are sequence steps**; paste
    the confirmation text containing **7**, and paste 7 enrollments advanced and 5 tasks
    completed with no enrollment touched.
  - Console: complete the **last** step; paste `status === "completed"`,
    `currentStepId === null`, and **no new task created**.
  - Console: untick Mark complete on an advanced task; paste the task back to `open`, paste
    the **warning text**, and paste the next step's task **still present** and the enrollment
    **still advanced**.
  - Console: complete a task whose `source` is `"manual"` and paste **no enrollment touched**
    and no error.
  - Clean console; `check_ids.py` at baseline; **TaskHub regresses clean** — filters, sort,
    pagination, selection, column resize and reorder.
- **Needs my eyes:** the bulk confirmation's wording. It is the one sentence in this
  compartment that has to be right in a hurry.
- **Risk and fallback:** ⛔ **the whole risk is firing twice or not at all**, and the check
  above is written to catch both. `BUILD_NOTES.md` names `completeTask()` as the single writer
  and that is the only place to hook. **Fallback: none — if the count is 2, the session is not
  done.**

### Session 3.14 — Stop, stall, and cascade

- **Compartment:** LOGIC · **Depends on:** 3.8, 3.11
- **Goal:** Every way the chain ends or breaks, as functions. Unenroll with an optional reason
  and an optional open-task delete; a deleted task shows as **stalled** with a working
  **Recreate task**; archiving a sequence with live enrollments offers the two answers;
  deleting a prospect cascades **and** every enrollment render is null-guarded.
- **Size: M** · My time: ~6 min · **Confidence: High**
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. `unenrollEnrollment(id, { reason, deleteOpenTask })` — sets `status = "unenrolled"`,
     `unenrolledAt`, `currentStepId = null`, writes the history entry through 3.8's writer.
     ⛔ **History is KEPT** — the record stays with its completed steps and its full snapshot
     intact. It stops producing tasks; it does not vanish.
  2. **The one open task is left standing by default.** `deleteOpenTask` defaults **false**.
     *(Only one open task can exist per enrollment, because only the live step is ever
     scheduled. "Pending tasks" is always singular here.)*
  3. `enrollmentIsStalled(enrollment)` — the live entry's `taskId` no longer resolves — and
     `recreateEnrollmentTask(enrollment)`. ⛔ **Nothing auto-recreates.** A deleted task was
     deleted deliberately; the stall is **visible, never silent, and Michael's to fix.**
  4. `archiveSequenceWithLiveEnrollments(id, choice)` — the two answers: **let them finish**,
     or **unenroll them**. Archived sequences do not appear in the enrollment picker.
  5. **Prospect delete cascades**, and ⛔ **every enrollment render also gets a defensive null
     guard.** Both, because each is two lines and `renderAudienceInspector()` already carries
     this exact pattern for this exact class.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: unenroll with a reason; paste `status`, `unenrolledAt`, `unenrollReason`,
    `currentStepId === null`, **the full snapshot still present**, and the **open task still
    present**.
  - Console: unenroll with `deleteOpenTask: true`; paste the task gone and the enrollment's
    snapshot still intact.
  - Console: paste the history entry written by **the one writer**, and paste
    `getLastReachoutDate()` **unmoved**.
  - Console: delete a live enrollment's task, then paste `enrollmentIsStalled()` as `true`;
    call `recreateEnrollmentTask()` and paste a new task with the **same `sourceRef`** and the
    **same due date**, and the entry's `taskId` repointed.
  - Console: archive a sequence with 3 live enrollments choosing **let them finish** — paste
    all 3 still `active`; undo, archive choosing **unenroll** — paste all 3 `unenrolled` and
    their open tasks still standing.
  - Console: paste the enrollment picker's options showing the archived sequence **absent**.
  - Console: delete a prospect with a live enrollment; paste the enrollment gone; then
    **hand-write an orphan enrollment** and paste every render path returning **without
    throwing**.
  - Clean console; `check_ids.py` at baseline; state survives reload.
- **Needs my eyes:** the archive prompt's two-way wording, and whether "leave the task
  standing" unchecked-by-default is right once it is in front of him.
- **Risk and fallback:** the risk is a cascade that deletes more than it should. ⛔ **Delete
  the enrollment, never the tasks it produced** — a sequence task that outlives its enrollment
  is an ordinary open task with a dead reference, and that is the specified behaviour.
  Fallback: if the cascade proves contentious, the reversible alternative is to **orphan
  rather than cascade** — the orphan machinery from 3.6 already handles it.

### Session 3.15 — Prospect detail: the Sequences tab

- **Compartment:** UI · **Depends on:** 3.12, 3.13, 3.14
- **Goal:** `PROSPECT_DETAIL_TABS`'s `sequences` row is live. The tab shows the live
  enrollment with its **full snapshot read-only**, a stall banner with **Recreate task**, an
  **Enroll** button that names the reason when E7's gate applies, per-enrollment **Unenroll**,
  and past enrollments collapsed.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. ⛔ **Flip `enabled` to `true` and set `render: renderDetailSequences` on the row LOCATED
     BY KEY, never by index.** 2B.16 reordered the array — Sequences is **4th of 6** now, not
     6th, and contract P4's written order is stale with its amendment still unapplied. The
     only positional read in the codebase is `|| PROSPECT_DETAIL_TABS[0]`, which wants "the
     first tab", and **there is no `nth-child` rule on `.detail-tab`.**
  2. `renderDetailSequences()`, filed in `app.js § 👤 RENDER VIEW: PROSPECT DETAIL` with the
     other tab bodies. ⛔ **The tab component's rule holds: bodies render on demand and hold
     no cache.**
  3. The live enrollment — sequence name, **"step 3 of 5"**, the live step's due date, and the
     **full snapshot read-only**: every step's resolved subject and body, so what is coming is
     visible without opening the master template.
  4. The **stalled** banner and its Recreate task action, calling 3.14.
  5. The **Enroll** button, opening 3.12; **disabled with the reason named** when E7 applies.
  6. **Past enrollments** — completed and unenrolled — collapsed, showing sequence, dates,
     outcome and reason. ⚠️ **The `.pd-company-card` disclosure precedent applies here: the
     collapsed state is a class on an element the renderer throws away — no `state` field, no
     `localStorage`, no settings row, no `wipeAllData()` line.**
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste the `sequences` row from `PROSPECT_DETAIL_TABS` showing `enabled: true`,
    and paste the **array order unchanged** — six rows, same keys, same labels.
  - Console: paste the tab strip's six buttons with **none disabled**, and paste
    `renderProspectDetailTabBody()` landing on interactions when `detailTab` is unset.
  - Console: on a prospect with a live enrollment, paste the rendered "step N of M", the due
    date, and the **number of read-only step blocks equal to the snapshot length**.
  - Console: paste that **no input, textarea or contenteditable exists** inside the snapshot
    region — `inputsInSnapshot: 0`. The snapshot is read-only after commit and that assertion
    is what proves it.
  - Console: delete the live task, re-render, paste the **stall banner text**; click Recreate
    and paste the banner gone and the task back.
  - Console: paste the Enroll button `disabled` with its reason for a prospect already live,
    and **enabled** for one who is not.
  - Console: paste the past-enrollments section listing a completed and an unenrolled record
    with its reason, and paste the collapsed state absent from `state` and `localStorage`.
  - Console: on a prospect with **no enrollments ever**, paste the empty state and no error.
  - **Screenshot** the tab with a live enrollment, and with only past ones.
  - Clean console; `check_ids.py` at baseline; **the other five tabs regress clean** — paste
    each rendering, and paste `refreshAfterTaskChange()` still repainting the tasks tab.
- **Needs my eyes:** whether the full read-only snapshot is the right amount of information on
  this tab or too much, and whether Sequences reads oddly at position 4 now that it is live.
- **Risk and fallback:** low — this is one boolean and one renderer, on machinery with five
  working consumers. The one trap is **locating the row by index**; the first Done-when
  catches it. If the full snapshot overwhelms the tab, the fallback is the same disclosure
  pattern as past enrollments — **collapsed by default, header always readable.**

### Session 3.16 — The sequence detail view

- **Compartment:** UI · **Depends on:** 3.14, 3.15
- **Goal:** Opening a sequence shows every enrollment against it — name, current step, due
  date, status — with per-row **Unenroll**, row checkboxes plus a header select-all, a bulk
  **Unenroll** bar, and the archive-with-live-enrollments prompt from 3.14 wired to the
  Archive action 3.9 shipped.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. The enrolled-contacts table, off the sequence list from 3.9.
  2. Per-row Unenroll with 3.14's confirmation, including the **unchecked-by-default** delete
     line and the optional reason.
  3. ⛔ **Selection: reuse the TaskHub pattern exactly** — a module-scope `Set`; **a per-row
     checkbox handler must NOT re-render its own table** (mutate the Set, repaint only the
     dependent summary text); **the header select-all is the one documented exception and may
     re-render.** TaskHub carries comments at both sites saying so.
  4. The bulk Unenroll bar, appearing at ≥1 checked, confirming with the count and showing the
     open-task line **once**, with its count.
  5. Wire 3.14's archive prompt to the Archive action.
  6. ⛔ **A `Map` built once per render for the prospect lookup**, never a `.find()` per row.
  7. Orphan rendering: **"(missing prospect)"** and **"(missing sequence)"** — kept, labelled,
     never dropped.
  8. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste the table's row count against
    `state.sequenceEnrollments.filter(e => e.sequenceId === id).length`, and one row's current
    step and due date against the enrollment.
  - Console: ⛔ **the selection-repaint check.** Tick a row checkbox and paste that the
    `<tbody>` node is **the same object reference** before and after — the handler must not
    re-render — and that the summary text changed. Then click select-all and paste the
    header checkbox state and the Set size.
  - Console: bulk-unenroll 3 of 5; paste 3 `unenrolled` and 2 `active`, the confirmation text
    containing **3**, and the open-task line shown **once** with its count.
  - Console: archive with live enrollments; paste both branches per 3.14.
  - Console: hand-write an enrollment with a dead `prospectId`; paste the row rendered
    **"(missing prospect)"** and **not dropped**.
  - **Screenshot** the view with 5 enrollments, 2 selected, bulk bar visible.
  - Clean console; `check_ids.py` at baseline; **TaskHub's own selection regresses clean** —
    two independent `Set`s must not have been merged into one.
- **Needs my eyes:** whether the bulk bar reads the same as TaskHub's, and whether the per-row
  unenroll confirmation is too heavy for a row action.
- **Risk and fallback:** the risk is copying TaskHub's selection **including its
  TaskHub-specific parts**. ⛔ **The `Set` is a new module-scope one, not TaskHub's.** If the
  bulk bar's styling fights the existing rules, the fallback is 3.9's own block in
  `style.css` — **not new rules appended after `🧱 HUB SHELL`, which is contract S5.**

### Session 3.17 — End-to-end test pass and the 11-CSV drill

- **Compartment:** QA · **Depends on:** 3.6 through 3.16
- **Goal:** The scope's build-order item 10, run as one pass. Every behaviour that no single
  session could check because it crosses sessions, plus the drill at its new shape.
  ⛔ **This is NOT the phase close.** `3.5b` is, and it always runs last.
- **Size: M** · My time: ~15 min · **Confidence: High**
- **Sized M and it genuinely is one.** It writes no feature code. It is M rather than S
  because it calls `wipeAllData()` against real data and because a QA session that finds
  something has to record it properly — **1.8 was sized S, ran L, and ate 45 of Phase 1's 88
  minutes.**
- **Files:** modified `ai/BUILD_NOTES.md`, `ai/AIContext.md`. **No code, unless a fix is
  trivial and obviously correct — anything else becomes a numbered session.**
- **Tasks — the scope's own list, in order:**
  1. Enroll at step 1, and enroll a second prospect **mid-sequence**.
  2. Advance singly, and advance in **bulk**.
  3. Complete the **last** step and see the enrollment complete.
  4. Unenroll **with** and **without** deleting the open task.
  5. Delete a task and see the **stall**; recreate it.
  6. Archive a sequence with a live enrollment, **both answers**.
  7. Delete a prospect with a live enrollment.
  8. A **resolved-copy overflow** on a long company name; an **empty token**.
  9. A prospect with **no email**, and one with an **unusable LinkedIn URL**.
  10. The **one-live gate** refusing a second enrollment; a **re-enrollment confirmation**.
  11. ⛔ **A full export → wipe → restore round trip covering both new stores.** Asserts
      **11 CSVs**, both stores in `wipeAllData()`'s explicit list, and a **multi-step snapshot
      with newlines, commas and quotes surviving its JSON cell character-identical.**
  12. **Report the database size delta**, so there is a measured baseline for the snapshot
      growth Open Risk 3 describes.
- **Inputs needed from me:** the backup confirmation, and one click if the snapshot folder
  needs re-granting.
- **Done when:** every one of the twelve has real pasted output; the drill's assertions are
  stated as **11**, not 9; anything found is either fixed-and-shown or written up as a
  numbered session, never left as prose.
- **Needs my eyes:** the whole feature, driven once end to end, before Step 2R reviews it.
- **⚠️ Backup point: manual ZIP AND a proved snapshot write before this session.**
  ⚠️ **NOT "a confirmed green chip"** — the chip is a known display defect. The gate is
  `saveBackupFile`'s **`wroteToFolder: true`** plus the file confirmed on disk.

---

## ⏸ Step 2R — the review, and its response sessions

**After 3.17, and before `3.5b`.** Two conversations, per the run sheet: the review writes
`ai/phases/phase-3-REVIEW-FINDINGS.md`, then a response plan writes
`ai/phases/phase-3-review-response-plan.md`. ⛔ **Its sessions continue from 3.18 — they do
not start over at 3.6.**

⛔ **THE REVIEW HAS NOT RUN AND ITS CONTINGENCY IS ENTIRELY UNSPENT.** It is carried as its
own line in the estimate below and is **not** folded into any per-session size above.

### Session 3.5b — Phase close

- **Compartment:** QA · **Depends on:** **everything**, including Step 2R's response sessions.
  ⛔ **ALWAYS LAST.** This is the 1.8 and 2B.10 precedent.
- **Size: M** · My time: ~20 min · **Confidence: High**
- ⛔ **NEVER SIZED BELOW M.** `DECISIONS.md` 2026-08-30: a phase close is not a small session.
- **What 3.5 already did and MUST NOT BE REDONE:** the compartment-A drill, the snapshot
  restore re-verify, the A1–A4 audit, the compartment-A calibration, the `BUILD_NOTES.md`
  curation and the amendment proposals.
- **Tasks:**
  1. **Calibration across BOTH compartments** — and say plainly whether Phase 3 repeated the
     8→11 and 10→17 pattern, **separating review-driven growth from amendment-driven growth**,
     which is this project's newest and least-tested conclusion.
  2. **Re-run the export → wipe → restore drill.** ⚠️ **It is no longer conditional.**
     3.5's note said "only if the enrollment compartment changes the task record shape" —
     it does not change the shape, but it **adds two CSVs to the bundle**, so the drill's own
     assertions changed and must be re-proved at **11**.
  3. **Re-verify a snapshot restore.** Tier 1 is still the sole protection until Phase 4.
  4. **Apply nothing; propose everything.** The amendments owed are listed at the end of this
     file and they are Michael's to apply.
  5. **Delete `ai/phases/phase-3-RUNSHEET.md`** and mark `phase-3-sequencing-RUNSHEET.md`
     spent.
  6. **Phase 4 handoff**, and a **currency check on `ai/spec/phase-4-firebase-preflight.md`** —
     it has not been read for currency yet and that is this session's job. Phase 4 does **not**
     need an intake.
  7. **Report the database size delta across the whole phase**, per 3.17's baseline.
- **Done when:** every check has real pasted output; `BUILD_NOTES.md` is curated with what was
  cut **reported**; `DECLARATIONS.md` is still one page.
- **Needs my eyes:** the amendments, and the calibration's conclusion for Phase 4.
- **⚠️ Backup point: manual ZIP and a proved snapshot write. Non-negotiable.**

---

## Session order

```
─── COMPARTMENT A — outreach launch ─────────────────────────────  BUILT AND CLOSED
3.1   Task fields + settings          (DATA,  M)  ✅ 2026-09-03
3.1b  Remove the Bcc — amendment A1   (DATA,  S)  ✅ 2026-09-03
3.2   Outreach block                  (UI,    M)  ✅ 2026-09-04  v128
3.3   Email launch + converter        (UI+LG, M)  ✅ 2026-09-04  v131 — produced A4
3.3c  Authoring surface               (UI,    M)  ✅ 2026-09-04  — split from 3.3 under A2
3.4   LinkedIn launch                 (UI,    M)  ✅ 2026-09-04  v134
3.5   Compartment QA                  (QA,    M)  ✅ 2026-09-04  — compartment close only

─── COMPARTMENT B — enrollment and scheduling ───────────────────  PLANNED HERE
3.6   Two stores + backup + drill     (DATA,  L)  ← the DIRECTIVES §4 gate.  BACKUP FIRST.
3.7   Merge tokens                    (LOGIC, S)  after 3.6
3.8   History types + one writer      (DATA,  S)  after 3.6   ∥ parallelizable with 3.7
3.9   Sequences sub-tab + list        (UI,    M)  after 3.6   ∥ parallelizable with 3.7/3.8
3.10  The step editor                 (UI,    M)  after 3.7 AND 3.9
3.11  Enrollment commit path          (LOGIC, M)  after 3.7, 3.8, 3.10
3.12  Enrollment review modal         (UI,    M)  after 3.11        ← most likely to overrun
3.13  Advance                         (LOGIC, M)  after 3.11  ∥ parallelizable with 3.12
3.14  Stop, stall, cascade            (LOGIC, M)  after 3.8, 3.11 ∥ parallelizable with 3.12
3.15  Prospect detail Sequences tab   (UI,    M)  after 3.12, 3.13, 3.14
3.16  Sequence detail view            (UI,    M)  after 3.14, 3.15
3.17  End-to-end test pass + drill    (QA,    M)  after everything above

─── STEP 2R — the review ────────────────────────────────────────  CONTINGENCY, UNSPENT
      Review the whole feature, then plan the response.  Two conversations.
      Its sessions take 3.18+ and continue from there.  They do NOT restart at 3.6.

3.5b  PHASE CLOSE                     (QA,    M)  ▶ ALWAYS LAST.  After 3.18+.
```

**Parallelizable, marked above and worth almost nothing in practice.** 3.7, 3.8 and 3.9 depend
only on 3.6 and touch disjoint parts of `app.js`; 3.12, 3.13 and 3.14 depend only on 3.11 and
likewise. ⚠️ **But one session is one conversation and they run one at a time — the marking
exists so that if one is blocked, the next is obvious, not so two can run at once.** ⛔ **Never
two sessions in one conversation.** That is Rule 1 and it dominates cost.

**Every session leaves the app usable and every one is additive.** Nothing in compartment B
removes a shipped behaviour. The one temporary state is named in 3.9 task 5: between 3.9 and
3.14, archiving a sequence with live enrollments simply archives it.

## Phase estimate

| | |
| --- | --- |
| **Compartment A — actual** | **5 planned, 7 run.** Every session came in at its estimated size — **zero re-sizes, the first compartment here with none** — and **both** extra sessions came from amendments authorised mid-phase, not underestimation. ~56 min planned, **~23 actual.** |
| **Compartment B — sessions planned** | **13** — twelve build sessions (3.6–3.17) plus the phase close `3.5b`. |
| **Mix** | **1 L · 10 M · 2 S.** The one L is 3.6, and its no-split reasoning is written into the session. The two S are genuinely small pure-function sessions; ⛔ **the close is M and is never sized below it.** |
| **My attention — by the unchanged method** | **~95 min** across 3.6–3.17, plus **~20 min** for `3.5b` = **~115 min.** Only two sessions exceed 10 minutes: 3.6 at 12 and 3.17 at 15. |
| ⚠️ **My attention — what actually happens** | **These numbers have come in roughly 2.5× UNDER across three phases and I am saying so rather than quietly correcting them.** Phase 3 compartment A planned ~56 and ran ~23. On that record the realistic figure for the 13 sessions above is **~45 min, not ~115.** ⛔ **The per-session numbers are deliberately NOT adjusted** — the method is the thing being calibrated, and silently scaling it destroys the only measurement there is. Read the ~115 as the method's output and the ~45 as the expectation. |
| **CONTINGENCY 1 — review response** | ⛔ **A SEPARATE LINE. NOT FOLDED INTO ANY SIZE ABOVE.** The review has **still not run** and its contingency is **entirely unspent**. Phase 1: 3 extra sessions from **one** review pass over **one** session. Phase 2B: **7** — +70%, double the +35% that was carried. Against twelve build sessions with more UI surface than 2B had, budget **5–8 sessions**, numbered **3.18+**, **~30–45 min** of attention. |
| **CONTINGENCY 2 — mid-phase amendments** | ⛔ **A SECOND SEPARATE LINE, AND THIS IS THE ONE THAT HAS NEVER BEEN BUDGETED.** Compartment A grew 5 → 7 entirely from amendments Michael authorised mid-phase — **+40% from a source no plan had a line for.** Compartment B is more decision-dense than A on its UI surfaces, and **3.12 is a screen he specified himself and has not yet seen**. Budget **2–4 sessions**, lettered in place (`3.12b`) as `3.1b` and `3.3c` were, **~10–20 min.** |
| **Sessions forecast, Phase 3 whole** | **7 (built) + 13 (planned) + 2–4 (amendments) + 5–8 (review response) = 27–32.** |
| **Most likely to overrun** | **3.12, the enrollment review modal** — not because it is technically hard but because it is **the surface Michael designed and has not seen**, and it is where an amendment is most likely to come from. Runner-up **3.10**, whose one real risk is reusing 3.3c's authoring surface *without cloning it*. ⚠️ **3.6 is the LARGEST session and is NOT the most likely to overrun** — the CSV round trip has now been proved four times across two phases, which is exactly why an L is acceptable there. |
| **The overrun is COUNT, not SIZE** | Per-session sizes have been right nearly every time and are **not inflated here.** ⛔ **Session growth in this project has TWO independent sources — review response and mid-phase amendments — and only the first has ever been budgeted. Both have their own line above.** |
| **`CACHE_NAME` budget** | **Two bumps per session** on the twelve code sessions — 3.17 and `3.5b` write no code and should bump nothing. **~24 bumps, v134 → roughly v158.** *(Phase 2B ran 1.4/session, the first phase under budget; do not plan on repeating it.)* ⚠️ **The first reload after a bump still serves the old document — hand over a one-glance version tell with every summary.** |

## Backup points

- ⚠️ **Before 3.6** — manual ZIP **and** a proved snapshot write. Its Done-when calls
  `wipeAllData()` against real data.
- ⚠️ **Before 3.17** — the same. It calls `wipeAllData()` again.
- ⚠️ **Before `3.5b`** — the same. Non-negotiable.
- **At the phase close** — full ZIP, retained outside the project folder per DECLARATIONS.

⛔ **THE GATE IS NOT "A GREEN CHIP" — THE CHIP IS A KNOWN DISPLAY DEFECT.** The real gate is
`saveBackupFile`'s **`wroteToFolder: true`**, confirmed by the file on disk afterwards.
Backups live in `..\backups-production\`; automatic snapshots in its `snapshots\` subfolder.
⚠️ The stale sibling `..\backups\` is **not** in use — do not restore from it without checking
dates.

## Open risks

1. ⛔ **THE REVIEW HAS NOT RUN, AND IT NOW LANDS AFTER THE BUILD RATHER THAN BEFORE IT.**
   Every session-count overrun in this project's history came from a review pass — Phase 1's
   three, Phase 2B's seven — and **none of that contingency has been spent yet.** It is
   carried as its own estimate line and its sessions take 3.18+. The risk is not that the
   review produces sessions; it is that someone reads the 13-session plan as the phase's size.
   **It is not.**

2. **Mid-phase amendments are the second growth source and the newer one.** Compartment A's
   entire overrun came from them. ⛔ **A frozen contract is amended by Michael in writing, with
   the reasoning in `DECISIONS.md` and the record in this file's amendments section — never by
   a session editing a contract paragraph.** A3 is this phase's own lesson: it was decided on
   2026-09-03, lived in the scope and the run sheet for a full day, and **the plan was the one
   document that missed it.** ⛔ **The plan is not automatically the newest document.**

3. **Snapshotting bodies is the largest data-growth mechanism this compartment introduces, and
   `saveState()` has no `try/catch`.** The database is ~1.53 MB today at 652 prospects and
   1,091 companies; a 5-step sequence with ~1,000-character bodies costs roughly **5 KB per
   enrollment**; Chrome's per-origin ceiling is around 5 MB. ⛔ **Decision 4 (no bulk enroll)
   and Decision 6 (one live enrollment per prospect) cap this hard**, which is why it is a
   risk and not a blocker. **It becomes live the moment bulk enrollment is built**, and it
   interacts badly with a known path: `loadDatabase()`'s catch branch reseeds from
   `prm_data.json` and `fetchFreshSeed()` ends in `saveState()`, so **a corrupt or truncated
   write replaces the database with four fictional people and overwrites the evidence.**
   ⛔ **THE BULK-ENROLLMENT FOLLOW-ON SESSION CARRIES A `try/catch` AROUND `saveState()` WITH A
   VISIBLE FAILURE AS ITS FIRST TASK, NOT ITS LAST.** 3.17 and `3.5b` report the size delta so
   there is a measured baseline before that session is ever written.

4. **The advance can fire twice, and two tasks for one step reads as a data bug rather than a
   wiring bug.** Three surfaces complete a task today and `saveTaskFromEditor()` already
   delegates its whole transition to `completeTask()`. **The advance goes in `completeTask()`
   and nowhere else**, 3.13 has an explicit count-must-be-1 Done-when, and **if a later
   session adds a fourth completion surface it routes through `completeTask()`.**

5. **Restore replaces only the entities whose CSV is present, so orphaning is a reachable,
   silent path.** Restoring prospects without enrollments — or enrollments without their
   sequences — produces orphans in either direction.

   | Orphan | Rule |
   | --- | --- |
   | Enrollment whose `prospectId` does not resolve | **Kept**, rendered "(missing prospect)", **counted in the restore summary** |
   | Enrollment whose `sequenceId` does not resolve | **Kept**, rendered "(missing sequence)", **counted in the restore summary** |
   | Task whose `sourceRef` enrollment does not resolve | **Kept.** An ordinary open task with a dead reference. **Never deleted on restore.** |

   ⛔ **READ THE RESTORE SUMMARY'S COUNT LINE, NOT THE SUCCESS BANNER ABOVE IT.** Nothing is
   silently discarded; that is the guarantee Gate C exists for.

6. **Phase 2C's two live defects are not fixed here and the new stores must not inherit
   them** — the sixteen-store `wipeAllData()` gap, and the `ensureStateDefaults()`
   `length === 0` reseed that cannot tell "the user emptied this" from "this key is missing".
   3.6 has a dedicated Done-when for the second, and it is the one check in that session that
   cannot pass by accident.

7. **A sequence can produce a task its prospect cannot receive.** The kind is per-step;
   reachability is per-prospect. A mixed-channel sequence run against someone with no LinkedIn
   URL produces a dead task at step 3. E8's preflight flags it — **but only if the review pass
   checks EVERY step's destination, not just the starting one.** That is a Done-when in 3.11
   and again in 3.12, not a design note.

8. **Live contact addresses reach a third surface.** DIRECTIVES §0 compliance is still
   `NOT DECIDED` and **the repo is public.** This compartment does not change what data is
   held, but it puts resolved copy carrying real names, companies and addresses into a new
   store and a new CSV. **P9's no-routing rule is what keeps addresses out of the address bar
   and browser history and must not be relaxed for convenience**, and ⛔ **sessions test
   against real records and write up placeholders.**

---

## Frozen-contract amendments — COMPARTMENT B

⚠️ **There are TWO sections with this name in this file, deliberately.** Compartment A's —
A1 through A4 — is carried verbatim inside the compartment-A contracts section above, where
it belongs beside the contracts it amends. **This one is compartment B's, and it is empty.**

*This section is the one place a later session learns that an `E` contract above no longer
describes what gets built.*

**Compartment B: none yet.** The first one goes here, in the A1–A4 format: the contract, as
frozen, as amended, and the consequences a later session must not re-derive.

## Amendments owed to the standing files — proposed, not applied. Michael applies these.

⛔ **A session does not apply these. It proposes and moves on.** They are collected here so
`3.5b` has one list rather than nine handoffs' worth.

**Owed by this plan:**

1. **`DECISIONS.md` 2026-08-27, the snapshot entry shape.** The stored `status` is dropped;
   `channel`, `kind`, `subject`, `order`, `delayDays` and `taskId` are added. See contract E2
   for the full statement and the reasoning. **Everything load-bearing in the original entry
   is unchanged.**
2. **`DECLARATIONS.md` Conventions — the state list gains `sequences` and
   `sequenceEnrollments`**, both arrays, both hand-added to `wipeAllData()`. This is the line
   a session reads to size a change and it is wrong the moment 3.6 ships.
3. **`DECLARATIONS.md` Backup — the ZIP is 11 CSVs, not 9.**
4. **`ai/spec/taskhub-scope.md` §2's wording** — it says merge tokens resolve **at task
   creation**. Decision 1 settles it: **resolution happens once, at enrollment; task creation
   copies.** Both documents end up true — a task never stores a token — but the *validation*
   moment for resolved copy moved.
5. **`ai/spec/sequence-outreach-launch-scope.md` §11** asks for an `ensureStateDefaults()`
   migration giving *"existing sequence steps"* a `channel: "email"` default by position.
   ⛔ **There are no existing sequence steps.** That line was written when compartment B was
   expected to land first. **There is no back-fill to write; every step is born with a
   channel.** Its §5.2 also gives step fields with no `id` and no `order`; E1 adds both.

**Carried, still owed from earlier closes — a ninth close now carrying them:** the five
`DECISIONS.md` DECLARATIONS amendments; the two proposed at 2A.6; the domain-is-identity
amendment; the **2B.16 P4 and 2B.17 P5 divergence amendments** (⚠️ **P4's is load-bearing for
Session 3.15** — the tab array's live order is not P4's written order); the `DECLARATIONS.md`
Stack line counts (declared ~13,270 / ~3,250 / ~3,680 against a real 18,793 / 3,981 / 5,192 at
3.4); `LA` = Louisiana or Los Angeles; Finding 10d's meaning; and the three 2B.4 cosmetics —
**leaving them is a valid answer and saying so closes them.**

---

**Next: start a NEW conversation and run Prompt 4 for Session 3.6.**

```
Run Session 3.6 from ai/phases/phase-3-sequencing.md.
```

⚠️ **Take the manual ZIP and prove a snapshot write first.** 3.6's Done-when calls
`wipeAllData()` against real data.
