# Scope: Sequence Enrollment and Scheduling (Phase 3, compartment B)

**Status:** Approved by Michael 2026-09-04, decision queue empty. **No code written.**
**Belongs in:** `ai/spec/sequence-enrollment-scope.md`
**Phase:** 3, compartment B. Compartment A — outreach launch — is **built and closed** (Sessions 3.1–3.4, QA'd at 3.5).
**Produced by:** Prompt 1 intake, `ai/APP_BUILD_WORKFLOW.md`, run as Step 0B of `ai/phases/phase-3-sequencing-RUNSHEET.md`.

**Prepared against, and verified in the code rather than inferred:** `ai/DIRECTIVES.md`,
`ai/DECLARATIONS.md`, `ai/DECISIONS.md`, `ai/BUILD_NOTES.md`, `ai/AIContext.md` (Session 3.5
handoff, amended 16:40), `ai/spec/taskhub-scope.md`, `ai/spec/sequence-outreach-launch-scope.md`,
`ai/phases/phase-3-outreach-launch.md` frozen contracts Q1–Q8 and amendments A1–A4, and
`app.js` at 18,793 lines (staged and read, `CACHE_NAME` v134, HEAD `f932fceb`).

**Supersedes:** `claude/sequence-feature-scope.md` (Claude project, banner-marked retired
2026-08-28) for the enrollment and scheduling half. That document's §8 decisions survive and are
carried below rather than re-derived; everything else in it is superseded.

---

## 0. The five things this document is built on, so they are not re-litigated

1. **Vantage never sends, on any channel, permanently.** A sequence produces a task; Michael
   clicks the button. Scope §13 of compartment A.
2. **The task queue is a stored entity, not a projection.** `ai/spec/taskhub-scope.md` reversed
   the old scope's §3 ruling. A sequence is a **producer** of `state.tasks` rows.
3. **The restore router is `handleRestoreFile()` → `processRestoreFile()`.**
   `processSingleCSVContent()` exists and is a private inner function of `importCSVContacts()`
   serving contact import. It greps as three hits and is **not** the restore path.
4. **Dates are `YYYY-MM-DD` strings.** Never ISO timestamps.
5. **An enrollment identifies its live step by stable id (`currentStepId`), never by index.**

---

## 1. What this builds

A **sequence** is a named, reusable, ordered list of **steps**. Each step declares a channel, a
kind, a delay, and a message template carrying merge tokens.

**Enrolling** a prospect in a sequence resolves every token against that prospect, opens a
**review pass** over the resulting copy, and — on commit — writes a frozen **enrollment** holding
its own copy of every step from the starting step onward.

Only the **live** step is ever scheduled. Completing its task advances the enrollment: the next
step becomes live, its due date is computed from the completion date, and its task is created.

Nothing here sends anything, reads anything, or tracks anything.

### 1.1 What already exists and is only being filled in

| Thing | State today |
| --- | --- |
| `shiftTaskDate(dateStr, n, mode)` | **Built**, `app.js` 6642, UTC arithmetic, frozen C11 test vectors in the comment. **Reuse it. Do not write a second `addBusinessDays()`.** |
| The four conference prospect fields | **Built.** `conferenceName` · `conferenceVenue` · `conferenceStart` · `conferenceEnd`, defaulted at `app.js` 1580–1583, in all four CSV writers and both importers. `conferenceVenue` is ONE combined field. |
| `prospect.email`, `prospect.linkedin` | **Built.** Keys are `email` and `linkedin` — **not `linkedinUrl`**. |
| `PROSPECT_DETAIL_TABS` sequences tab | **Built as a placeholder.** `{ key: "sequences", label: "Sequences", enabled: false, render: null }` at `app.js` 9044, 4th of 6. A real `<button disabled>`, which dispatches no click. **This compartment flips one boolean and writes the renderer.** |
| The five task outreach fields | **Built.** `channel` · `msgKind` · `msgTo` · `msgSubject` · `msgBody`, contract Q1, in `TASKS_CSV_HEADERS` (18 columns). |
| `TASK_CHANNEL_KINDS`, `CHANNEL_DEFAULT_KIND`, `TASK_MSG_LIMITS` | **Built**, `app.js` 5122–5154. |
| The markdown converter | **Built.** `OUTREACH_MD_RE`, `outreachConvertBody()`, `outreachBodyToHtml()`, `outreachFlattenBody()`, `outreachClipboardPayload()`, `outreachCountedLength()`. |
| `task.source` / `task.sourceRef` | **Built and deliberately unused since Session 1.3**, so that this compartment is additive rather than a migration over every task. |
| Merge-token machinery | ⛔ **Does not exist.** Zero hits for `[First Name]` or any resolver anywhere in `app.js`. All new. |
| `state.sequences`, enrollments | ⛔ **Do not exist.** Greenfield. |

---

## 2. What compartment A settled, inherited whole

- **A step declares channel + kind.** The kind decides the destination, whether a subject
  exists, and the character ceiling. Contract Q2.
- **A task never stores an unresolved merge token.** There is ONE render path, not one for
  hand-typed and one for sequence-written.
- **A body may carry markdown** — a link, `**bold**`, `*italic*`, and nothing else. Font family
  and size are excluded by decision. Amendment A2.
- **LinkedIn gets flattened text, never HTML and never the raw stored string.** Email gets HTML.
  One converter, two outputs. `outreachClipboardPayload()` is the one place that decides.
- **Vantage emits no Bcc** (A1), **email `thread` opens nothing** (A3), **Gmail is targeted by
  `?authuser=`** (A4). All four amendments audited true in the product at Session 3.5.
- **Q6 validates the literal value on a task. This compartment validates the TEMPLATE and the
  RESOLVED COPY.** Three moments, all needed, none replacing another.
- **`LINKEDIN_COMPOSE_ROUTE_LIVE` ships `false`.** Both builders are retained; one line reverses
  it. A sequence's LinkedIn steps inherit whatever that switch is set to. **This compartment does
  not flip it.**

---

## 3. Data model

**Two new top-level stores. Not three.** Steps nest inside their sequence the way
`audienceLists.prospectIds` does; the enrollment's snapshot nests inside the enrollment the way
`prospect.history` does — and `p.history` already round-trips as a JSON cell through
`convertToCSV()`, which is the precedent this follows.

```js
state.sequences = [
  {
    id,                       // "seq-<epoch>"
    name,                     // required, unique-ish, not enforced
    status,                   // "active" | "archived"   — the audienceLists precedent
    createdAt,                // "YYYY-MM-DD"
    steps: [
      {
        id,                   // "sstep-<epoch>" — STABLE. currentStepId points at this.
        order,                // 1-based integer, contiguous
        delayDays,            // integer >= 0. See §6.2 on why it is not "delayBusinessDays".
        channel,              // "email" | "linkedin"
        kind,                 // "compose"|"thread"|"connect"|"inmail"|"message"
        subject,              // template, tokens intact. "" for kinds with no subject.
        body                  // template, tokens intact. May carry markdown.
      }
    ]
  }
];

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
        stepId,               // the sequence step's id, so provenance survives a template edit
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

### 3.1 How to read an enrollment — one rule, no stored redundancy

- A snapshot entry with a non-empty `completedDate` is **done**.
- The entry whose `stepId === enrollment.currentStepId` is **live**. It is the only one carrying
  a `dueDate` and a `taskId`.
- Everything else is **pending**.

> ⚠️ **PROPOSED REFINEMENT to `DECISIONS.md` 2026-08-27, for Michael to accept at the plan.**
> That entry specifies the snapshot entry shape as `{ stepId, body, status, dueDate,
> completedDate }` — with a stored `status`. A stored `status` is derivable from `currentStepId`
> plus `completedDate`, and a stored copy of a derived value is a second source of truth that can
> disagree with the first. The shape above drops `status` and adds `channel`, `kind`, `subject`,
> `order`, `delayDays` and `taskId`, which the 2026-08-27 entry could not have anticipated because
> it predates compartment A. **Everything load-bearing in that decision is unchanged: every step
> from the starting step onward is merge-resolved and copied in at enrollment, and only the live
> step carries a due date.**

### 3.2 Foreign keys and what a broken one means

`sequenceId` and `prospectId` are the only stored links. An enrollment whose `sequenceId` or
`prospectId` does not resolve is an **orphan** and is treated exactly the way an orphaned task is:
**kept, counted, and reported in the restore summary.** Never silently discarded. See §10.4.

### 3.3 Why enrollments are their own collection — Gate B

Enrollments are **not** nested inside the prospect record and must not be. Gate B's test is
whether multi-user later requires migrating data; a top-level collection takes an `ownerId` field
without touching anyone's records. Nesting would also put the largest-growing thing in the app
inside the prospect document, and `ai/spec/phase-4-firebase-preflight.md` already records the
state object over Firestore's 1 MiB per-document limit.

---

## 4. Merge tokens

### 4.1 The list

| Token | Source |
| --- | --- |
| `[First Name]` | `prospect.firstName` |
| `[Last Name]` | `prospect.lastName` |
| `[Company]` | `getCompanyName(prospect.companyId)` |
| `[Title]` | `prospect.title` |
| `[Email]` | `prospect.email` — **new to the list; the field itself already exists** |
| `[Conference Name]` | `prospect.conferenceName` |
| `[Conference Start Date]` | `prospect.conferenceStart` |
| `[Conference End Date]` | `prospect.conferenceEnd` |
| `[Conference City/Venue]` | `prospect.conferenceVenue` — ONE combined field |

**`[LinkedIn]` is deliberately NOT a token.** The profile URL is plumbing Vantage consumes to
build a destination; there is no reason to paste it into message text.

### 4.2 Resolution — once, at enrollment

Tokens resolve **only at enrollment**, into the snapshot. Task creation copies already-literal
text. Nothing downstream of the snapshot ever sees a token. Decision 1.

**Consequence, stated so it is not discovered:** a prospect corrected after enrollment does not
change the copy of steps not yet sent. That is what "enrollments are frozen" costs and it is the
accepted price of the property it buys.

### 4.3 An unresolvable token resolves to an empty string

Not to a visible `[Company]`, not to a placeholder. The review pass (§5) counts and names every
token that resolved empty, so the gap is visible before you commit. If one ever slips through,
an awkward sentence is a better failure than a prospect receiving literal `[Company]`.

### 4.4 ⛔ The one place tokens and markdown collide

`OUTREACH_MD_RE` is `/\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g`. Its link
branch requires `]` **immediately** followed by `(`, and the URL run forbids whitespace. So
`Dear [First Name],` is untouched — **verified against the live regex, not assumed.**

**But `[Company](Chicago)` — a token followed with no space by a parenthetical — is parsed as a
markdown link.** Narrow, real, and cheap to close: **the template validator rejects any `[` … `](`
sequence whose bracket content matches a known token name.**

---

## 5. Enrollment is a review pass, not a one-click action

**Michael, 2026-09-04:** *"I want to edit each step when enrolling. Otherwise only editable when
task is served."*

Enrolling opens a modal with three parts, in order:

**1. Setup.**
- **Sequence** — a picker listing `active` sequences only.
- **Start at step** — defaults to step 1. Choosing step 4 snapshots steps 4 onward only.
  **No history entries are backfilled for steps that were never sent.**
- **Start timing** — defaults to **Start now**, meaning the starting step is due
  `todayLocalDateStr()`. A custom date replaces it. **The starting step's own `delayDays` is
  ignored** — a delay applies only to a step reached by advancing.
- **Re-enrollment banner**, if this prospect has any prior `completed` or `unenrolled` enrollment
  in this sequence: names the sequence and the date, and replaces Enroll with a confirmation the
  user must click through. No prior history → no friction.

**2. Review.** Every step from the starting step onward, in order, each showing:
- Step number, channel, kind, and the computed delay in words ("+3 business days after step 2").
- **Resolved subject** (only for `compose` and `inmail`) and **resolved body**, both **editable in
  place**.
- The live character counter against `TASK_MSG_LIMITS` for that kind, red past the ceiling, and —
  for LinkedIn kinds — measuring the **flattened** length, per amendment A2.
- The HTML preview, rendered by `outreachBodyToHtml()`.
- A preflight strip naming anything wrong (§9.3).

⛔ **The review pane calls `outreachBodyToHtml()` and `outreachFlattenBody()`. There is no second
renderer and there must never be one.** `BUILD_NOTES` is explicit about this and the reason is
that one function feeding both the preview and the clipboard is what makes "what you see is what
pastes" structural rather than tested.

**3. Commit.** Writes the enrollment, sets `currentStepId` to the starting step, dates it, and
creates its task. **After commit the snapshot is read-only.** A step's copy is editable again only
when its task lands, in the task editor.

### 5.1 One live enrollment per prospect. Hard gate.

**Michael, 2026-09-04.** A prospect may have at most **one** enrollment with status `active`,
across **all** sequences — not one per sequence.

- Attempting a second is a **hard refusal with the live enrollment named** — *"Sally Quinn is
  live in Conference Follow-Up, step 2 of 5"* — plus a link to it.
- **It is not a prompt offering to unenroll her for you.** A one-click swap is how someone loses a
  sequence they were halfway through.
- `completed` and `unenrolled` enrollments do not count as live. Re-enrolling later is fine and
  hits the re-enrollment confirmation above.

**This also caps §14.3's storage growth at one snapshot per prospect**, whatever the sequence
count, which is a second reason it is the right rule.

---

## 6. Scheduling and advance

### 6.1 The one function

```js
nextDueDate = shiftTaskDate(completedDate, nextStep.delayDays, taskDateMode());
```

`shiftTaskDate()` is already built, already frozen as contract C11, already carries its test
vectors in a comment, and already does its arithmetic in UTC so a DST boundary cannot eat a step.
**Call it. Do not re-derive it, and do not write a second `addBusinessDays()`.**

### 6.2 Why the field is `delayDays`, not `delayBusinessDays`

The global All Days / Business Days setting (`state.taskSettings.dateMode`, read through
`taskDateMode()`) governs **all** date arithmetic in the app. Naming the field
`delayBusinessDays` would encode an answer the setting already owns, and would produce two
date-counting rules in one app.

Per `DECISIONS.md` 2026-08-28, **the setting is never retroactive** — flipping it changes future
arithmetic and does not move dates already computed.

**No holiday calendar.** Mon–Fri only. Thanksgiving is a working day as far as Vantage is
concerned; the workaround is TaskHub's bulk shift.

**Delays are counted from the previous step's COMPLETION date, not its due date.** A step
completed two days late slides everything after it by two days. Nothing catches up.

### 6.3 Advance — Decision 2

**Completing a sequence-produced task advances its enrollment.** In full:

1. Stamp `completedDate` on the live snapshot entry.
2. If a next snapshot entry exists: set `currentStepId` to it, set its `dueDate` per §6.1, create
   its task (§6.5), store the new `taskId` on it, clear the previous entry's `dueDate`.
3. If none exists: set `status = "completed"`, `currentStepId = null`. The enrollment leaves the
   active set.

⛔ **The advance hangs off `completeTask()` and nowhere else.** `BUILD_NOTES` records that it is
the single writer and that `saveTaskFromEditor()` already delegates its whole open→completed
transition to it. Hooking anywhere else fires twice or not at all. **If a later session adds a
fourth completion surface, route it through `completeTask()`.**

**Bulk Mark Complete advances too**, per task. Its existing confirmation gains one line naming how
many of the selection are sequence steps — *"12 tasks — 7 are sequence steps and will schedule
their next step."* Refusing sequence tasks in bulk would silently stall the sequences it skipped,
which is the invisible-failure shape DIRECTIVES §3 rules against; naming the count is the honest
version. Ladder rung 1: the stable option is the one where the same gesture always means the same
thing.

### 6.4 Advance is one-way

Unticking "Mark complete" on a task that already advanced its enrollment returns **the task** to
open. It does **not** retract the advance and does **not** delete the next task. It **warns**,
naming what already happened. Retracting would mean deleting a task the app just created, fired
by unticking a checkbox — a destructive data change on the lightest possible gesture.

### 6.5 The task a step produces

```js
{
  id,                     // minted by the existing path
  prospectId,             // the enrollment's prospect. NEVER blank — §15.4's create rule.
  title,                  // "<Sequence name> — step <n>: <kind label>"
  notes:      "",         // ⛔ NOT the message body. notes keeps its Phase 1 meaning.
  dueDate,                // per §6.1
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

- ⛔ **`notes`, `source` and `sourceRef` are not repurposed.** `source` records where a task came
  from; `channel` records what it is. A sequence task sets **both**. Conflating them makes "did a
  sequence make this" unanswerable.
- **`sourceRef` is the `enrollmentId:stepId` composite** — Decision 2b. It survives a task
  completed late or out of order, it makes "which step was this" answerable from the task alone in
  the CSV, and it costs one `split(":")`. The plain enrollment id would lean on the enrollment's
  live pointer being correct at read time, which is exactly what a stalled enrollment breaks.
- ⛔ **`msgSubject` never stores `"Re:"`.** The prefix is display-only, added by the renderer for
  `msgKind === "thread"`. Storing it reads `"Re: Re: …"` on the second follow-up.

---

## 7. Stopping, and every way the chain breaks

### 7.1 Unenroll — Decision 4

Available per-enrollment from the prospect's Sequences tab and from the sequence detail view, and
in bulk from the sequence detail view.

- Sets `status = "unenrolled"`, `unenrolledAt = todayLocalDateStr()`, `currentStepId = null`.
- **History is kept.** The enrollment record stays with its completed steps and its full snapshot
  intact. It stops producing tasks; it does not vanish.
- **The one open task is left standing by default.** The confirmation carries one extra line —
  *"Sally has 1 open task from this sequence — also delete it?"* — **unchecked by default**. Bulk
  unenroll shows it once with a count.
- **An optional reason** is captured: Replied / Not interested / Wrong person / free text, blank
  allowed. Stored on `unenrollReason`. **This is a note, not a metric** — see §13.

> **Only one open task exists per enrollment**, because only the live step is ever scheduled.
> "Pending tasks" is always singular here.

### 7.2 A sequence task deleted instead of completed

The enrollment can no longer advance. It does **not** silently auto-recreate the task — that would
resurrect something deliberately deleted.

- The live snapshot entry's `taskId` no longer resolves.
- The Sequences tab renders the enrollment as **stalled**, naming the step, with an explicit
  **Recreate task** action.
- Visible, never silent, and Michael's to fix.

### 7.3 Archiving and deleting a sequence

- **Sequences archive; they do not hard-delete while any enrollment has ever referenced them.**
  The `audienceLists` precedent — archiving preserves, it never destroys.
- **Archiving a sequence with live enrollments** prompts with the count and offers a choice: let
  them finish, or unenroll them. `DECISIONS.md` 2026-08-27.
- Archived sequences do not appear in the enrollment picker.
- A sequence no enrollment has ever referenced may be deleted outright.

### 7.4 Deleting a prospect with a live enrollment

**Cascade the delete, and add a defensive null guard in every enrollment render.** Both, because
each is two lines and the codebase already carries this pattern — `renderAudienceInspector()` got
a null guard for exactly this class. `DECISIONS.md` 2026-08-27.

### 7.5 There is no automatic stop-on-reply, and there cannot be one

Vantage never sends, so it has no thread to watch. Reading mail is `gmail.readonly` — a
**restricted** scope requiring an annual third-party CASA assessment, recorded as the scope cliff
in `DECISIONS.md` 2026-08-27 and **withdrawn, not deferred**, at compartment A scope §9.8. LinkedIn
has no API at all.

⛔ **Nothing in this compartment may be gated on, or designed around, a reply signal.** The manual
stop is §7.1's unenroll, and its optional reason is where "she replied" gets recorded.

---

## 8. Surfaces

### 8.1 Sequence builder — Campaign Hub, new "Sequences" sub-tab

Alongside the existing Campaigns / Audiences / Email Accounts / Domains sub-tabs
(`campaignViewSubState`, `switchCampaignSubTab()`, `app.js` 11544/11601).

- **Sequence list** with an Active / Archived tab strip, identical to the audience-list one
  (`audienceListStatusFilter`, `app.js` 12524). Archive / Restore actions mirroring
  `archiveAudienceList()` / `restoreAudienceList()`.
- **Sequence editor:** name; add / reorder / remove steps.
- **Per step:** delay in days; channel picker; kind picker (options from `TASK_CHANNEL_KINDS`,
  defaulting per `CHANNEL_DEFAULT_KIND` and §8.1a); subject field **shown only for kinds that have
  one** (`taskKindHasSubject()`) and hidden entirely, not disabled, for the rest; body with the
  authoring surface and a **template-level** counter against `TASK_MSG_LIMITS`.
- **A merge-token picker** listing §4.1's nine tokens, inserting at the cursor.

**8.1a Per-step kind defaults**, inherited from compartment A §3.1 and overridable per step:
email step 1 → `compose`, later email steps → `thread`; LinkedIn step 1 → `inmail`, later LinkedIn
steps → `message`; **`connect` is never a default.** This delivers "only the first LinkedIn step
carries a subject" through the kind rather than through a positional rule.

### 8.2 Sequence detail — enrolled contacts

Opening a sequence shows every enrollment against it: name, current step, due date, status.

- Per-row **Unenroll** with the §7.1 confirmation.
- Row checkboxes plus a header select-all, and a bulk **Unenroll** action bar that appears once
  ≥1 row is checked, confirming with the count.
- ⛔ **Reuse the TaskHub selection pattern exactly**: a module-scope `Set`, and — per
  `BUILD_NOTES` — **a per-row checkbox handler must not re-render its own table.** Mutate the Set,
  repaint only the dependent summary text. The header select-all is the one documented exception
  and may re-render. TaskHub carries comments at both sites saying the asymmetry is deliberate.

### 8.3 Prospect detail → Sequences tab

`PROSPECT_DETAIL_TABS`'s `sequences` row flips to `enabled: true` with
`render: renderDetailSequences`. One boolean and one renderer.

Shows, in order:

- **The live enrollment**, if any: sequence name, "step 3 of 5", the live step's due date, and the
  **full snapshot read-only** — every step's resolved subject and body, so what is coming is
  visible without opening the master template. A **stalled** banner with a Recreate task action
  when §7.2 applies. Unenroll.
- **An Enroll button**, disabled with the reason named when §5.1's gate applies.
- **Past enrollments** — completed and unenrolled — collapsed, showing sequence, dates, outcome
  and reason.

⛔ **The Advanced Query drawer (`renderAqInspectorDrawer`, `aq-insp-*`) is DEFERRED and is not
touched.** It is a subsection behind by design; do not "fix" the inconsistency by porting anything
across. Both query surfaces stay deferred.

### 8.4 Authoring rules that apply to every surface here

- `createElement` / `appendChild`. **`innerHTML +=` destroys listeners** and has bitten this
  codebase specifically.
- Static markup in `index.html`, **one delegated listener** on the static container, a `data-*`
  attribute as the opt-in — the `data-tab-key` / `data-pd-key` convention.
- **A modal that can be opened from another modal needs the `z-index: 999999` escalation.** Every
  `.modal-overlay` is `z-index: 200`, so DOM order otherwise decides which one is touchable. The
  enrollment review modal is opened from the prospect detail view; check whether it qualifies.
- Every input labeled, every control keyboard-operable, focus visible. **Authoring habits, not
  Gate F** — Gate F is inert (§0 accessibility target `none`) and a session is never blocked on
  them.
- Per-record lookups inside a render loop use a **`Map` built once per render**, never a `.find()`
  per row. At 652 prospects and 1,091 companies a `find()` inside a predicate is O(n×m) per
  keystroke.

---

## 9. Validation — three moments, and none replaces another

| Moment | What is measured | Where |
| --- | --- | --- |
| **Template** | the step template, tokens unresolved | sequence builder, §8.1 |
| **Resolved copy** | the merge-resolved text, before commit | enrollment review, §5 |
| **Literal value on a task** | the stored task field | compartment A's Q6, already built |

⛔ **VALIDATING THE TEMPLATE IS NOT VALIDATING THE VALUE.** A 290-character connection note
overflows the moment `[Company]` resolves to "Northwestern Mutual Financial Network". Both, or
neither is real.

### 9.1 Ceilings

Straight from `TASK_MSG_LIMITS`, unchanged: `connect` body 300 · `inmail` subject 200 / body 1900 ·
`message` body 3000 · `compose` and `thread` **no per-field ceiling** (`0` means no ceiling, not
zero characters). `compose`'s real constraint is the assembled URL at ~2000 characters, which
cannot be measured without `gmailComposeUrl()`. **Do not approximate it from the body alone.**

### 9.2 LinkedIn counts the flattened output

Per amendment A2: a `connect` note is measured on the **flattened** length, because that is what
LinkedIn receives and counts. Markup that never arrives must not push a legal 300-character note
over. Email kinds count the stored string.

### 9.3 The enrollment preflight — Decision 7: flag everything, block nothing

Per step in the review pass:

| Condition | Behaviour |
| --- | --- |
| Resolved body or subject over the kind's ceiling | Counter red, named warning. **Not blocked, not truncated.** |
| Email step and `prospect.email` is blank | Named warning: this step will produce a task with no recipient. |
| LinkedIn step and `prospect.linkedin` yields no `/in/` slug | Named warning. **A non-matching value is a data error to fix, not a format to support** — Michael, 2026-09-03. Do not add Sales Navigator URL handling. |
| One or more tokens resolved empty | Count and names them. |

**Nothing hard-blocks the enrollment.** Both existing precedents point here: compartment A's *"flag
at enrollment, not at click time"* and Q6's *"blocking would silently drop a step out of a
sequence, which is worse than a visible over-length task."* And it is much stronger under a review
pass than it was under a one-click enroll — a flag beside text you are already reading is not
something that gets missed.

### 9.4 Template validator

Rejects an empty step list, a step with an empty body, and — per §4.4 — any `[Token](` sequence
that would be swallowed by the markdown link branch.

---

## 10. Backup coverage — DIRECTIVES §4, and this is the binding gate

⛔ **Nothing here is done until all of this is covered.** DIRECTIVES §4 fires on every session in
this compartment: *any session creating or modifying a store of user-writable data states in its
summary whether it is covered by backup/restore, and stops to ask if it is not.*

### 10.1 The five hooks every new store needs, in the session that introduces it

1. **`ensureStateDefaults()`** — a default for each store.
   ⛔ **Use `if (state.sequences === undefined)`, NEVER `if (!state.sequences || state.sequences.length === 0)`.**
   The `length === 0` guard is the live Phase 2C defect: it cannot tell "the user emptied this"
   from "this key is missing", so it reseeds on every boot and every restore. **A new store must
   not be born carrying it.**
2. **`wipeAllData()`** — one hand-written line per store. It clears an **explicit list**, not
   everything. `state.tasks` was missed in Session 1.3 and `state.taskSettings` in the same
   session; the consequence was a restore drill that could not fail for four months. Both stores
   wipe to `[]`; neither is vocabulary the app needs to function.
3. **Export** — `generateSequencesCSV()` / `exportSequencesCSV()` and
   `generateSequenceEnrollmentsCSV()` / `exportSequenceEnrollmentsCSV()`, added to
   `exportZIPBackup()`'s bundle beside the existing nine.
4. **Restore** — `restoreSequencesFromCSV()` and `restoreSequenceEnrollmentsFromCSV()`, wired into
   **`processRestoreFile()`** — both the ZIP-entry branch and the single-CSV
   `fileName.includes(...)` branch.
5. **A drill against non-empty data.** ⛔ **A restore leg that could not have failed proves
   nothing.** Clear the value, prove it genuinely cleared, then restore.

### 10.2 The CSV contract

- ⛔ **The header TEXT is the contract and the column ORDER is not.**
  `restoreProspectsFromCSV()`'s header-name mapping is the pattern: a backup taken before a column
  existed restores that field `""`, and a newer backup restores through an older build with the
  extra columns ignored. Both directions safe by construction. **Follow it; never index by
  position.**
- **Nested arrays ride as JSON in a single cell** — `steps` on a sequence and `steps` on an
  enrollment. The precedent is `p.history ? JSON.stringify(p.history) : ""`, already in all four
  prospect CSV writers. `convertToCSV()` quotes every field unconditionally and `parseCSV()` tracks
  quote state across newlines, so multi-paragraph, comma- and quote-laden values round-trip
  exactly. ⛔ **Do NOT add newline-stripping to "protect" the CSV, and do not base64 a cell.**
  ⚠️ `parseCSVRow()` is a separate, simpler function that does **not** handle escaped quotes — do
  not reach for it as an equivalent.
- **Enum coercion on restore.** `channel` and `kind` are coerced to their enum; an unrecognised
  value degrades to `""`, following what `restoreTasksFromCSV()` already does.
- **The trim split.** Identifiers, enums and dates trim. **`subject` and `body` do not** —
  leading and trailing whitespace is content there, exactly as `notes`, `msgSubject` and `msgBody`
  already are.
- ⚠️ **The ZIP goes from 9 CSVs to 11.** Session 3.5's drill asserted *"9 CSVs and no new file."*
  The next drill asserts 11, and the close should say so rather than report a regression.

### 10.3 Two new reachout types, and both halves of the C6 migration

`"Enrolled in Sequence"` and `"Unenrolled from Sequence"` — Decision 8.

- Added to **`NON_REACHOUT_TYPES`** alongside `"Task Completed"`, `"Added to Vantage"` and
  `"Entered into Vantage"`. They are timeline entries and nothing more: they do **not** move
  `getLastReachoutDate()`, do **not** feed the Advanced Query date filters, and are **not** counted
  in the dashboard's reachout total. §14's whole lesson, applied.
- Filtered out of the manual "log a reachout" dropdown, which offers contact types only.
- ⛔ **Both halves of C6 are required**: add the value to the **first-run literal** *and* push it
  **idempotently** in the `else` branch of `ensureStateDefaults()`. `restoreSettingsFromCSV()`
  replaces each list wholesale, so restoring an older backup drops values added since. One half
  alone is a silent regression.
- **One writer.** Route enrollment and unenrollment history through a single function, the way
  every path routes through `logTaskCompletionHistory()`. **Do not add a second history writer.**
  Use `newHistoryId(prospect)` for the id — `hist-${Date.now()}` collides inside a loop and
  duplicate history ids are destructive, not cosmetic.

### 10.4 Orphans, both directions

| Orphan | Rule |
| --- | --- |
| Enrollment whose `prospectId` does not resolve | **Kept**, rendered "(missing prospect)", counted in the restore summary |
| Enrollment whose `sequenceId` does not resolve | **Kept**, rendered "(missing sequence)", counted in the restore summary |
| Task whose `sourceRef` enrollment does not resolve | **Kept.** It is an ordinary open task with a dead reference. Never deleted on restore. |

**Restore replaces only the entities whose CSV is present**, so restoring prospects without
enrollments — or enrollments without their sequences — is a reachable, silent orphaning path. **Read
the restore summary's count line, not the success banner above it.** Tasks are never silently
discarded and neither are enrollments; that is the guarantee Gate C exists for.

### 10.5 Snapshots

Local snapshots serialise the whole state object, so both new stores are captured automatically by
Tier 1 with no per-store code. **The ZIP/CSV path is the one that needs explicit work.** Tier 1
remains the sole protection until Phase 4.

### 10.6 `CACHE_NAME`

Bumped in `sw.js` on every session that touches `index.html`, `app.js` or `style.css`. Not
optional. **Budget two bumps per session.**

---

## 11. Decisions resolved with Michael, 2026-09-04

1. **Merge tokens resolve at ENROLLMENT**, into the enrollment's own snapshot of every step from
   the starting step onward. Task creation copies already-literal text. Confirms and completes
   `DECISIONS.md` 2026-08-27.
2. **Completing a task advances its enrollment**, everywhere including bulk Mark Complete, whose
   confirmation names how many of the selection are sequence steps. Advance hangs off
   `completeTask()` and nowhere else. **Advance is one-way** — unticking warns, never retracts.
3. **`sourceRef` is the `enrollmentId:stepId` composite**, with `source: "sequence"`.
4. **Bulk enrollment is OUT of the first version.** One prospect at a time. Bulk **unenroll** is
   in. Bulk enroll lands later as one additive session with no migration.
5. **Unenroll leaves the one open task standing**, with an offer to delete it in the same
   confirmation, **unchecked by default**.
6. **One live enrollment per prospect, across all sequences.** A hard refusal naming the live
   enrollment, not a prompt offering to swap.
7. **Editing the master sequence cannot reach anyone in flight, ever** — by construction, not by
   rule. There is no "push update to live enrollments" action and there never will be.
8. **Every step is editable at the moment of enrollment, in the review pass, and read-only
   thereafter** until its task lands. Michael's design, and better than any of the three options
   offered.
9. **The enrollment preflight flags everything and blocks nothing.** Empty tokens resolve to empty
   strings and are counted in the review.
10. **There is no automatic stop-on-reply and there cannot be one.** The manual stop is unenroll,
    which takes an optional reason and writes a prospect timeline entry registered in
    `NON_REACHOUT_TYPES`.

### 11.1 Carried from the superseded scope's §8, unchanged

Business-day math is weekends-only with **no holiday calendar** · enrollment has a **start-step**
and a **start-timing** control · **re-enrollment is allowed behind an explicit confirmation** when
there is prior history · **unenroll keeps history** · **the four conference merge fields exist**,
`conferenceVenue` being ONE combined field.

---

## 12. Assumptions — reversible, logged, object at the plan

1. **Two new top-level stores, not three.** Steps nest in their sequence; the snapshot nests in its
   enrollment; two new CSVs. The alternative — steps as their own rows in their own CSV — is more
   readable in a spreadsheet and more restore code, and the repo's precedent is JSON-in-a-cell.
2. **The sequence builder lives as a Campaign Hub sub-tab.** No seventh hub. DECLARATIONS records
   six and adding one is an amendment.
3. **Token syntax stays the `[Token]` bracket form**, matching everything already written and read.
   Matching is case-insensitive on the token name; the bracket form is exact.
4. **A step's delay uses `taskDateMode()`**, so flipping the global setting changes future sequence
   arithmetic the same way it changes everything else. Reversible to always-business in one line.
5. **Sequence names are not enforced unique.**
6. **No seeded example sequences, ever.** `DECISIONS.md` 2026-09-03: *"I don't want to restore
   fictional data."* An empty first run shows an empty state.
7. **The enrollment review modal reuses the 3.3c authoring surface's converter and counters.**
   Whether it also gets the full markdown toolbar is a Prompt 3 sizing call; **the renderer is
   shared either way, never cloned.**
8. **Task title format** is `"<Sequence name> — step <n>: <kind label>"`. Cosmetic, one line.
9. **`ensureStateDefaults()` back-fills the new fields on every enrollment record**, because a
   record created through the app's own create path does not carry the full default field set until
   a restore runs — the create literal and `ensureStateDefaults()` have already drifted once,
   found 2026-09-04. Build the create literal from the same field list.

---

## 13. Out of scope

- **Sending**, on any channel. Permanently.
- **Any reply, open, acceptance, bounce or response signal**, and anything derived from one.
- **Metrics, analytics, completion rates or reporting of any kind.** `unenrollReason` is a note,
  not a funnel.
- **Bulk enrollment** — Decision 4, deferred to a named follow-on session.
- **Editing an enrollment's snapshot after commit** — Decision 8, deferred to a named follow-on
  session, to be revisited at the Step 2R review.
- **The Gmail API, OAuth, or drafts created by Vantage.** Reading mail is a restricted scope and
  the request was withdrawn, not deferred.
- **Any LinkedIn API or automated LinkedIn action.**
- **Flipping `LINKEDIN_COMPOSE_ROUTE_LIVE`.** It ships `false`; one line reverses it and that line
  is not this compartment's.
- **Text / SMS.** Not built, not stubbed, **no reserved value in the channel enum.**
- **Branching, conditions, A/B variants, or any step that is not linear.**
- **Recurring sequences, sequence templates library, per-step attachments.**
- **A holiday calendar.**
- **Both query surfaces** — `renderAqInspectorDrawer()`, the `aq-insp-*` ids and the Audience Query
  Engine stay DEFERRED and untouched.
- **Routing.** P9 holds. A recipient address must never enter `location.hash`, a URL bar or
  `document.title`. Imported `prospectId` values are already email addresses.
- **Phase 2C's work** — the sixteen-store `wipeAllData()` gap and the `length === 0` reseed defect
  are not fixed here. **The new stores simply must not inherit them.**

---

## 14. Findings carried into Prompt 3

Everything below was found during the interrogation and is not settled by the decisions above. It
is the plan's input, not the plan.

### 14.1 The one contradiction that was live, now resolved

`DECISIONS.md` 2026-08-27 said tokens resolve **at enrollment**; `taskhub-scope.md` §2 and the Step
0B brief said **at task creation**. Decision 1 resolves it: **resolution happens once, at
enrollment; task creation copies.** Both documents end up true — a task never stores a token — but
the *validation* moment for resolved copy moves from task creation to enrollment, which is what
§9's three-moment table records. **`taskhub-scope.md` §2's wording should be amended at the phase
close.**

### 14.2 Two lines in compartment A's scope that describe work that does not exist

`sequence-outreach-launch-scope.md` §11 asks for an `ensureStateDefaults()` migration giving
*"existing sequence steps"* a `channel: "email"` default with kind by position. **There are no
existing sequence steps.** That line was written when compartment B was expected to land first.
There is no back-fill to write; every step is born with a channel.

Its §5.2 also gives step fields as `channel/kind/subject/body` with no id and no order. §3 above
adds `id`, `order` and `delayDays`, which it needed and did not have.

### 14.3 ⛔ Snapshotting bodies is the largest data-growth mechanism this compartment introduces, and `saveState()` has no guard

`app.js` 1828 is `localStorage.setItem("vantage_prm_database", JSON.stringify(state));` — **no
`try/catch`.**

The database is ~1.53 MB today at 652 prospects and 1,091 companies. A 5-step sequence with
~1,000-character bodies costs roughly **5 KB per enrollment**. Chrome's per-origin ceiling is
around 5 MB.

**Decision 4 (no bulk enroll) and Decision 6 (one live enrollment per prospect) together cap this
hard**, which is why it is a finding rather than a blocker. But it becomes live the moment bulk
enrollment is built, and it interacts badly with a known path: `DECISIONS.md` 2026-09-03 records
that `loadDatabase()`'s catch branch reseeds from `prm_data.json` and `fetchFreshSeed()` ends in
`saveState()`, so a corrupt or truncated write replaces the database with four fictional people
**and overwrites the evidence**.

**Recommendation for Prompt 3:** the bulk-enrollment follow-on session carries a `try/catch` around
`saveState()` with a visible failure as its **first** task, not its last. And this compartment's
close should report the database size delta so there is a measured baseline.

### 14.4 Advance must not fire twice

There are three surfaces that complete a task today: the editor checkbox, the bulk bar, and
`saveTaskFromEditor()` — which already delegates its whole transition to `completeTask()`. The
advance goes in `completeTask()` and the plan should make "no second advance path" an explicit
Done-when, because the failure — two tasks minted for one step — looks like a data bug rather than
a wiring bug.

### 14.5 A sequence can produce a task its prospect cannot receive

The kind is per-step; reachability is per-prospect. A mixed-channel sequence run against someone
with no LinkedIn URL produces a dead LinkedIn task at step 3, and §9.3 flags it at enrollment —
but only if the review pass checks **every** step's destination, not just the starting one. That is
a Done-when, not a design note.

### 14.6 Session 3.5's drill assertions change

The next export → wipe → restore drill asserts **11 CSVs**, not 9; adds two new stores to the
`wipeAllData()` explicit-list check; and must prove a multi-step snapshot with newlines, commas and
quotes survives its JSON cell character-identical. `3.5b` already owes this drill and its run sheet
already assumes it is mandatory.

### 14.7 Gate check, for the record

| Gate | Verdict |
| --- | --- |
| **A** Data protection | ✅ Passes. Sequence copy is the same class of data tasks already carry. |
| **B** No foreclosed scale | ✅ Passes **because** enrollments are a top-level collection (§3.3). Nesting them in the prospect record would fail it. |
| **C** Recoverability | ⚠️ **The binding gate.** §10 is the whole answer, and every item in it is required. |
| **D** Observability | Inert until hosting. |
| **E** Client/server boundary | ✅ Passes. The array shape is the contract; render and filter code reads state. |
| **F** Accessibility | Inert (§0 target `none`). §8.4's three habits apply to new markup; a session is never blocked on them. |

**DIRECTIVES §3 conflicts:** no new collision. The one close call — advancing many enrollments from
one bulk-complete click — is *UX quality vs Stability*, and §3 pre-decides it for stability.
**No gap in the directives was found.**

---

## 15. Build order

Contract-first. **Backup lands before UI**, per DIRECTIVES §4 and the precedent both prior phases
set.

1. **Contract.** Freeze the sequence record, the step record, the enrollment record, the snapshot
   entry, the two CSV column contracts, and the `sourceRef` composite format. Nothing else.
2. **Data model + backup/restore.** Both stores, `ensureStateDefaults()` with `=== undefined`
   guards, two hand-written `wipeAllData()` lines, two export CSVs into the ZIP, two restore legs
   through `processRestoreFile()`, orphan handling both directions. **Ends with a real drill on
   non-empty data including a multiline, comma- and quote-laden snapshot.**
3. **Merge tokens.** The nine-token list, the resolver, `[Email]` added, the `[Token](` validator.
4. **Sequence builder.** Campaign Hub sub-tab, list with Active/Archived, step editor, kind
   defaults, token picker, template counters.
5. **Enrollment.** The review-pass modal — setup, per-step resolved review with editing and
   preflight, commit. The §5.1 one-live gate and the re-enrollment confirmation.
6. **Scheduling and advance.** `shiftTaskDate()` wired into `completeTask()`, single and bulk, the
   bulk confirmation count, one-way advance, last-step completion.
7. **Prospect detail Sequences tab.** Flip the boolean, write `renderDetailSequences()`, live
   enrollment, stall banner and Recreate task, past enrollments.
8. **Sequence detail view.** Enrolled contacts, per-row unenroll, bulk selection and bulk unenroll,
   archive-with-live-enrollments prompt.
9. **History.** Two `NON_REACHOUT_TYPES` values, both halves of the C6 migration, one writer,
   `newHistoryId()`.
10. **Test pass and stop point.** Enroll at step 1 and mid-sequence; advance singly and in bulk;
    complete the last step; unenroll with and without deleting the task; delete a task and see the
    stall; archive a sequence with a live enrollment; delete a prospect with a live enrollment;
    a resolved-copy overflow on a long company name; an empty token; a prospect with no email and
    one with an unusable LinkedIn URL; the one-live gate refusing a second enrollment; a
    re-enrollment confirmation; and a full export → wipe → restore round trip covering both new
    stores.

---

## 16. Next

**Step 1B — Prompt 3.** A new conversation. It plans this compartment and merges it with
compartment A into `ai/phases/phase-3-sequencing.md`, carrying Q1–Q8 and A1–A4 across verbatim as
built. **Numbering starts at 3.6.** The review (Step 2R) runs after the build and its response
sessions continue from the next free number. **`3.5b` closes the phase and always runs last.**
