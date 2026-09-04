# Phase 3 Run Sheet — what is LEFT

*Vantage — a Prospecting Relationship Manager*

> **Rewritten 2026-09-04 16:40 EDT.** Replaces the 12:16 version, which was
> written six hours earlier and put a review gate in front of everything that
> could not be passed. Everything already finished has been cut out of this
> sheet rather than struck through — the completed record lives in
> `ai/phases/phase-3-outreach-launch.md` and
> `ai/archive/2026-09-04_1216_AIContext.md`.

---

## ⛔ THE ONE CHANGE FROM THE LAST SHEET: THE REVIEW MOVED

The old Step 2R required **"a day of REAL outreach, not a walkthrough"** before
anything else could run. **Vantage's data is not real and the business is still
in development, so that gate could never be passed** — not by waiting a day, not
by waiting a month. It would have blocked the phase indefinitely.

**The review is not cancelled. It moved to the last thing before the close.**
It now runs after sequencing works, which is the first point at which there is a
whole feature to review and the first realistic moment for genuine use. **The
contract half of a review is already done** — Session 3.5 audited amendments
A1–A4 against the code and found all four true in the product — so what moved is
the *usage* half, which is the half that needed real use in the first place.

⚠️ **Say what this costs, once, so it is a decision and not an accident.**
Phase 1 ran 11 sessions against 8 and Phase 2B ran 17 against 10, and **in both
cases every extra session came from a review pass.** That contingency is still
unspent. Moving the review later does not remove those sessions; it moves them,
and they now land between Step 2B and the close rather than before Step 0B.
**Budget for them there.**

---

## Where things stand

**Compartment A — outreach launch — is BUILT and closed as a compartment.**
Sessions 3.1, 3.1b, 3.2, 3.3, 3.3c and 3.4 all shipped. A task carries a
channel, kind, recipient, subject and body; one button opens Gmail composed on
the work account; LinkedIn opens on the right person with two explicit numbered
copies. Session 3.5 ran the export → wipe → restore drill on the real database
with all nine CSVs md5-identical either side, re-verified a snapshot restore,
and audited A1–A4. **None of that is re-run.**

**Compartment B — enrollment and scheduling — does not exist.** No sequence
entity, no steps, no enrollments, no business-day advance. The `sequences` tab in
`PROSPECT_DETAIL_TABS` is `enabled: false` with `render: null`, **and filling it
is what this compartment is for.**

**State, verified from the tree 2026-09-04 16:30 EDT:**

| | |
| --- | --- |
| `app.js` | **18,793** lines |
| `index.html` | **3,981** |
| `style.css` | **5,192** |
| `CACHE_NAME` | **v134** |
| **HEAD** | **`f932fceb`** — local `main` and `origin/main` equal, **IN SYNC: true** |
| One-glance version tell | `typeof linkedinSlug` → `"function"` · `typeof gmailSearchUrl` → `"undefined"` · `LINKEDIN_COMPOSE_ROUTE_LIVE` → `false` |

> ⚠️ **`DECLARATIONS.md`'s Stack line still reads 13,270 / 3,250 / 3,680 and is
> ~5,500 lines light on `app.js`.** It is there so a session can size a change.
> The correction is a standing proposal awaiting Michael; **3.5b applies it.**

### Source of truth

The authoritative copy is **this file in the repo**. `ai/DIRECTIVES.md`,
`DECLARATIONS.md`, `DECISIONS.md` and `BUILD_NOTES.md` **outrank it**; if any of
them disagrees with a line here, they win. The workflow itself lives in
`ai/APP_BUILD_WORKFLOW.md`.

⚠️ **A Google Doc mirror of this sheet exists for pasting from.** It is a
**mirror, not a second source.** If the two ever disagree, the repo wins and the
doc gets regenerated — never edited to match. **Three planning documents pointing
at a session that had already run is how Phase 2B lost a session's boot**; two
copies of one sheet is the same failure waiting.

Disposable. Deleted at the phase close along with `ai/phases/phase-3-RUNSHEET.md`.

---

## The remaining steps — in order

| Step | What | Output | New conversation? |
| :---: | --- | --- | :---: |
| **0B** | ▶ **NEXT.** Intake the enrollment compartment (Prompt 1) | `ai/spec/sequence-enrollment-scope.md` | Yes |
| **1B** | Plan enrollment and merge both halves (Prompt 3) | `ai/phases/phase-3-sequencing.md` | Yes |
| **2B** | Build — the enrollment and producer sessions | Sequencing, working | Yes, one each |
| **2R** | **Review the whole feature**, then plan the response | `phase-3-REVIEW-FINDINGS.md` → `phase-3-review-response-plan.md` | Yes — two |
| **2Rb** | Run the response sessions | Fixes | Yes, one each |
| **3** | **Close** — Session `3.5b`. Always last | Phase 4 starting point | Yes |

Each step is a **new conversation.** That is Rule 1 and it dominates cost.
Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first and
attach nothing — every prompt reads the repo itself.

### Session numbering — one rule, and it REVERSED when the review moved

**Everything from here takes 3.6 and up.** The old sheet had Step 2R claim
numbers first because it ran first. **It no longer runs first, so the order of
claiming flips:**

- **Step 1B claims numbers first**, starting at **3.6**.
- **Step 2R's response plan continues from the next free number** — it does not
  start over at 3.6.
- **`3.5b` keeps its letter and always runs last.** This is the 1.8 and 2B.10
  precedent.

⛔ **A session that ships out of numeric order owes this sheet an edit in the
same close, not just a handoff line.** Phase 2B lost a boot to three planning
documents that all pointed at a session which had already run.

---

# Step 0B — Intake the enrollment compartment

*One conversation. Produces a scope. No code, no plan. **This is the next thing
to run.***

```
Intake Phase 3, compartment B: sequence enrollment and scheduling.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md, ai/AIContext.md, ai/spec/taskhub-scope.md, and
ai/spec/sequence-outreach-launch-scope.md - which is compartment A, already
built. Also read ai/phases/phase-3-outreach-launch.md's frozen contracts Q1-Q8
AND the four amendments A1-A4 that follow them: this compartment WRITES those
fields and must not redefine them.

THE OLD SCOPE IS SUPERSEDED AND MUST NOT BE BUILT FROM.
claude/sequence-feature-scope.md, in the Claude project, carries a supersession
banner listing exactly what is wrong with it. Short version: the task queue is a
stored entity and not a projection; currentStepIndex became currentStepId;
currentStepBody became a per-step array snapshotted at enrollment; dates are
"YYYY-MM-DD" strings; TaskHub is a top-level hub; and it names
processSingleCSVContent() as the restore router. That function DOES exist - it
is a private inner function of importCSVContacts(), serving contact import - but
it is NOT the restore path. The restore router is
handleRestoreFile() -> processRestoreFile().

WHAT SURVIVES FROM IT, and should not be re-derived - its section 8 decisions
all still hold: business-day math is weekends-only with no holiday calendar;
enrollment has a start-step and a start-timing control; re-enrollment is allowed
behind an explicit confirmation when there is prior history; unenroll keeps
history; and the four conference merge fields exist - conferenceName,
conferenceVenue, conferenceStart, conferenceEnd - where conferenceVenue is ONE
combined field.

WHAT COMPARTMENT A ALREADY SETTLED, and this compartment inherits rather than
re-decides:
- A step declares channel + kind. Kind decides destination, whether a subject
  exists, and the character ceiling. See Q2.
- A sequence resolves merge tokens at TASK-CREATION time and writes literal text
  into task.msgSubject and task.msgBody. A task never stores an unresolved
  token. There is ONE render path, not one for hand-typed and one for
  sequence-written.
- A body may carry markdown - a link, bold, italic - and the converter that
  flattens it for LinkedIn and emits HTML for email already exists. A step
  template is authored in the same three forms. Amendment A2.
- The [Email] merge token still needs adding to the token list. prospect.email
  exists; prospect.linkedin exists. Neither needs building.
- Business-day arithmetic already exists as shiftTaskDate(dateStr, n, mode) with
  test vectors, Phase 1 contract C11. REUSE IT. Do not write a second
  addBusinessDays().
- Q6 validates the literal value on a task. This compartment validates the
  TEMPLATE. Both are needed and neither replaces the other.

ASK ME ABOUT AT LEAST THESE, because they are not determinable from the files:
- Whether a sequence is per-prospect or can be enrolled in bulk, and whether
  bulk enrollment is in scope for the first version.
- What happens to an enrollment's pending tasks when I edit the sequence
  afterwards.
- Whether a reply or a completed task advances the sequence, stops it, or
  neither - and how Vantage would even know, given it never sends.

CONTEXT YOU WILL NOT FIND IN THE FILES: the data in this app is NOT real and the
business is still in development. Do not gate anything on real usage, real sends
or real replies, and do not propose a scope decision that can only be settled by
watching real outreach. Ask me instead.

Follow PROMPT 1 in ai/APP_BUILD_WORKFLOW.md. Write the result to
ai/spec/sequence-enrollment-scope.md.

Stop after the scope. Do not plan sessions.
```

---

# Step 1B — Plan the enrollment compartment and merge

*One conversation, after Step 0B.*

```
Plan Phase 3, compartment B, and merge it with compartment A into one phase
plan.

READ FIRST: ai/spec/sequence-enrollment-scope.md - the approved scope from Step
0B - plus ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/BUILD_NOTES.md (MAP
especially) and ai/AIContext.md. Report in 3 lines what you found that changes
the plan.

COMPARTMENT A IS BUILT AND ITS CONTRACTS ARE FROZEN AND SHIPPED. Carry
ai/phases/phase-3-outreach-launch.md's Q1-Q8 and amendments A1-A4 across
VERBATIM, marked as built. Do not re-derive them, do not renumber them, and do
not re-plan sessions 3.1 through 3.4.

Follow PROMPT 3 in ai/APP_BUILD_WORKFLOW.md exactly - compartments, session
sizing, contract-first ordering, and the three estimates per session (SIZE, MY
TIME, CONFIDENCE).

NUMBERING: you claim numbers FIRST, starting at 3.6. The review moved to after
the build, so its response sessions continue from whatever number you stop at -
this is the reverse of what the previous run sheet said and it is deliberate.
3.5b is the phase close, keeps its letter, and ALWAYS RUNS LAST. This is the 1.8
and 2B.10 precedent.

CALIBRATION - measured, not guessed. Absorb it; do not re-derive it.
- Phase 1: 8 sessions planned, 11 run. All three additions came from ONE review
  pass over ONE session.
- Phase 2B: 10 planned, 17 run - the review produced SEVEN. That is +70%, double
  the +35% contingency that was carried.
- Phase 3 compartment A: 5 planned, 7 run. EVERY session came in at its
  estimated size - zero re-sizes, the first compartment with none - and BOTH
  extra sessions came from amendments authorised mid-phase, not from
  underestimation.
- THE REVIEW HAS STILL NOT RUN. Its contingency is unspent and it now lands
  AFTER your sessions rather than before them. Carry it as a separate line in
  the estimate; do not fold it into per-session sizes.
- THE CONCLUSION THAT MATTERS: session growth has TWO independent sources -
  review response, and mid-phase amendments - and only the first has ever been
  budgeted. Budget them separately.
- Per-session SIZES have been right nearly every time. Do not inflate them. The
  overrun is COUNT, not size.
- NEVER size a phase close below M.
- My attention estimates have come in roughly 2.5x UNDER across three phases.
  Say so plainly rather than quietly correcting them.
- Budget two CACHE_NAME bumps per session.

Write the merged plan to ai/phases/phase-3-sequencing.md - a NEW file carrying
both compartments. Leave ai/phases/phase-3-outreach-launch.md in place as the
historical record of compartment A; do not delete or edit it.

THEN - also update this run sheet, ai/phases/phase-3-sequencing-RUNSHEET.md:
fill in Step 2B's session list with the real numbers, titles, sizes and my-time
estimates. Change only that list, and tell me to regenerate the Google Doc
mirror.

Stop after the plan. Do not start a session.
```

---

# Step 2B — Run the sessions

*One session, one conversation. Never two.*

**The sessions** — *filled in by Step 1B.*

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☐ | **3.6** | — | | |
| ☐ | **3.7** | — | | |
| ☐ | … | | | |

Each one is **Prompt 4** from `ai/APP_BUILD_WORKFLOW.md`. Only the first line
changes between sessions:

```
Run Session <N.n> from ai/phases/phase-3-sequencing.md.
```

⛔ **THE BACKUP-COVERAGE HARD LIMIT WILL FIRE ON MOST OF THESE, AND THAT IS THE
POINT.** DIRECTIVES §4: any session creating or modifying a store of
user-writable data states in its summary whether it is covered by backup and
restore, and stops to ask if it is not. **The enrollment compartment introduces
new entities — sequences, steps, enrollments — so nearly every session in it
creates a store.** Each one needs a CSV in the ZIP bundle, a line in
`wipeAllData()` (which clears an **explicit list**, by hand), a defaults
migration in `ensureStateDefaults()`, and a restore leg. **A store left out of
`wipeAllData()` silently turns every future drill into a test that cannot
fail** — that has already happened twice here, with `state.tasks` in 1.3 and
`state.taskSettings` in 2B.7.

---

# Step 2R — Review the whole feature, then plan the response

*Two conversations, after Step 2B. **Moved here 2026-09-04** from before Step 0B.*

**Phase 1 overran by three sessions and Phase 2B by seven, and both came from a
review pass over the one session that first showed the thing working.** This
sheet names the review point in advance so it is planned work rather than a
surprise. **It is now the point at which sequencing works end to end** — a
sequence enrolls a prospect, produces tasks, and those tasks launch — because
that is the first moment there is a whole feature to review.

⚠️ **This review does NOT wait on real outreach.** The old sheet demanded a day
of real sends; the data is not real and the business is in development, so that
gate was unpassable and it is gone. Review what the feature does, by using it
against the test data, end to end.

```
Review Phase 3 end to end, after the last session in ai/phases/phase-3-sequencing.md.

READ FIRST: ai/phases/phase-3-sequencing.md - especially every frozen contract
and every amendment - ai/AIContext.md, ai/spec/sequence-outreach-launch-scope.md
and ai/spec/sequence-enrollment-scope.md.

Sequencing is built. Interview me about what it actually does when I drive it,
then write ai/phases/phase-3-REVIEW-FINDINGS.md.

MY DATA IS NOT REAL AND THE BUSINESS IS STILL IN DEVELOPMENT. Do not ask what
happened on a real send, a real reply or a real acceptance, and do not gate a
finding on evidence that cannot exist yet. Ask what the SURFACE does.

Ask specifically about:
- How many clicks it takes to enroll a prospect and get the first task, and how
  many to get from a task to an open compose window, per channel.
- Whether anything has to be retyped or re-copied that the app already knows.
- Whether the two thread copy buttons behave as a sequence in practice, or
  whether I lose the address by clicking both.
- Whether the character counters fire where they should, and whether the
  over-limit behaviour is right - on the TEMPLATE and on the resolved VALUE,
  which are two different moments.
- Whether merge tokens resolve to what I expected on a real record, and what
  happens when a field is empty.
- Whether editing a sequence after enrollment did what I expected to the
  pending tasks.
- Whether the LinkedIn profile destination was the right call, or whether I
  wanted the composer for people I am already connected to.
- Whether manual entry is still a surface I would use now that sequences exist,
  or whether it became scaffolding after all.
- What I reached for that was not there.

Separate findings into: contract violations (stop and tell me), things that need
a session, and things that are preferences I should just decide. Do not write a
response plan yet.
```

Then, in a **second** conversation, plan the response sessions into
`ai/phases/phase-3-review-response-plan.md`, following Prompt 3's sizing and
estimate rules. **They continue from the next free number after Step 1B's.**

---

# Step 3 — Close the phase

*One final conversation. This is Session `3.5b` and it always runs last.*

```
Close Phase 3. Run Session 3.5b from ai/phases/phase-3-sequencing.md.

READ FIRST: ai/archive/2026-09-04_1216_AIContext.md - the Session 3.5
compartment close. MUCH OF THIS PHASE'S CLOSE IS ALREADY DONE. Carry its output
forward rather than re-deriving it. Specifically, these ran on real data and do
NOT need repeating unless something below changed them:
- The A1-A4 audit against the code. All four true.
- Compartment A's estimate calibration.
- The BUILD_NOTES.md curation for compartment A.
- The DECISIONS.md and DECLARATIONS.md proposals.

WHAT THIS SESSION ACTUALLY OWES:

1. RE-PROVE THE EXPORT PATH. The enrollment compartment almost certainly added
   stores - sequences, steps, enrollments - so assume the drill is MANDATORY and
   say why if you conclude otherwise. Full export, wipe, restore, counts pasted,
   every new column shown surviving character-identical. Prove the wipe actually
   cleared before believing the restore. Check every new store is in
   wipeAllData()'s explicit list.

2. RE-VERIFY A SNAPSHOT RESTORE. Tier 1 is still the sole protection.

3. ESTIMATE CALIBRATION ACROSS BOTH COMPARTMENTS. Compartment A ran 7 against a
   planned 5 with zero re-sizes, both extras from mid-phase amendments. Report
   what compartment B did, whether splitting the phase in two with an intake in
   the middle changed the pattern Phase 1 and Phase 2B set, and - separately -
   what the review produced once it finally ran. Say what it means for Phase 4.

4. AUDIT EVERY NEW FROZEN CONTRACT AND AMENDMENT AGAINST THE CODE, the same way
   3.5 audited A1-A4, and say plainly whether each is true in the product.

5. CURATE ai/BUILD_NOTES.md and audit ai/DECLARATIONS.md for drift. Propose; do
   not apply. Still one page after. The Stack line counts are the known stale
   item - real is 18,793 / 3,981 / 5,192 as of 3.4.

6. WRITE ai/AIContext.md as a PHASE-BOUNDARY handoff: what exists now, what is
   deferred, what Phase 4 starts from.

7. TELL ME EXACTLY WHAT TO BACK UP, and the filename to use.

8. DELETE ai/phases/phase-3-RUNSHEET.md and
   ai/phases/phase-3-sequencing-RUNSHEET.md, and tell me to delete the Google
   Doc mirror. All three are spent at this point. Tell me; I delete them.

9. NEXT PHASE - Phase 4 is Hosting and, unlike Phase 3, it does NOT need an
   intake. Its pre-flight already exists at
   ai/spec/phase-4-firebase-preflight.md. Read it, tell me whether it is still
   current, and tell me to run Prompt 3.
```

⚠️ **The pre-flight's counts are already stale and the close should say so
rather than re-measure by surprise:** it records 651 prospects and 1,090
companies against today's **652** and **1,091**, and the whole state at ~1,466 KB
against today's **~1,526 KB**. **Its substance is unchanged** — still over
Firestore's 1 MiB document limit, so per-entity decomposition stays load-bearing.

---

# Standing reminders

## Before each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`.
  Most Done-when checks are against the live app.
- **Close every other Vantage window.** Two windows share one `localStorage` but
  keep independent in-memory state, and whichever saves last silently overwrites
  the other. **Enforce it before an automated session, not after.**
- **If the conversation has Claude in Chrome**, let it drive `localhost:5000` and
  read the console itself. That removes nearly all the copy-pasting.
- **There is no `device_bash` on this machine.** The bridge stages and commits
  files but executes nothing, so **git is always Michael-runs-it.** Hand over
  commands with repeated `-m` flags; do not go looking for a fourth door.
- **Verify git state; do not repeat it from a handoff.** Session 3.4's handoff
  said two files were uncommitted and by the next session they were committed and
  pushed — and 3.5's handoff made the same mistake in the other direction, saying
  five documents were uncommitted when they had been pushed six minutes later.
  **Stage `.git/refs/heads/main`, `.git/refs/remotes/origin/main` and
  `.git/COMMIT_EDITMSG`** — equal SHAs mean the push landed, and
  `COMMIT_EDITMSG`'s mtime against the source files' proves the commit came after
  the edits.
- **`resize_window` does not work on this machine.**
- **The first reload after a cache bump still serves the OLD document.** Ask for
  a one-glance version tell with every summary.
- **Two dialogs freeze browser automation.** Stub `window.prompt` /
  `window.alert` / `window.confirm` before calling anything that raises one —
  and **make the prompt stub return `"YES"` for `wipeAllData()`**, or the wipe
  silently does nothing and the restore that follows passes against data that
  was never cleared.

## Still true for this phase

- **⛔ THE DATA IS NOT REAL AND THE BUSINESS IS STILL IN DEVELOPMENT.** No step,
  scope decision, contract or Done-when may be gated on real usage, real sends,
  real replies or real acceptances. **A gate nobody can pass is not a safeguard,
  it is a stall** — the 12:16 run sheet had one and it blocked the phase.
  Ask Michael instead.
- **Vantage never sends, on any channel, permanently.** No email is sent, no
  draft is created via any API, no LinkedIn action is automated. A sequence
  produces a task; Michael clicks the button.
- **No routing.** A recipient address must never enter `location.hash`, a URL bar
  or `document.title`. Imported `prospectId` values are already email addresses.
- **Do not repurpose `task.notes`, `task.source` or `task.sourceRef`.** They mean
  what they already mean. A sequence-written task sets `source` **and**
  `channel`; conflating them makes "did a sequence make this" unanswerable.
- **`state.taskSettings` takes new settings; do not start a sibling store.**
  `wipeAllData()` clears it whole, which is the entire reason.
- **Both query surfaces stay DEFERRED** — `renderAqInspectorDrawer()`, the
  `aq-insp-*` ids and the Audience Query Engine are not touched.
- **Amendments A1–A4 are true in the product**, audited against the code at 3.5.
  No Bcc anywhere; the clipboard carries HTML for email and flattened text for
  LinkedIn; the email `thread` kind opens nothing and offers two numbered
  copies; the Gmail account is targeted by `?authuser=`, never by a path segment.

## Traps that make a half-fix look finished

- **⚠️⚠️ THE APP RUNS PERFECTLY WITH THE SERVER DOWN.** `sw.js` is cache-first,
  so with `npx serve` stopped the app still boots, renders all six views and
  shows a clean console — **entirely out of the previous version's cache**, which
  reads exactly like a failed `CACHE_NAME` bump. **The tell is that `sw.js` is
  the one file NOT in `ASSETS`.** One call settles it: fetch a cached asset, an
  unreal path, and `/sw.js`. Server up gives `200 / 404 / 200`.
- **⛔ A `CACHE_NAME` BUMP DOES NOT LAND ON `reg.update()` ALONE.**
  `unregister()`, delete every `vantage*` cache, then reload **twice**.
- **⛔ `device_commit_files` CAN REPORT SUCCESS AND WRITE THE PREVIOUS BYTES.**
  **It is the staged PATH that goes stale, not the act of re-copying to it** —
  it fired on a *first* commit from a brand-new path whose file had been edited
  in place afterwards, and the second edit was silently dropped. **Finish every
  edit, then copy the finished file to a path nothing has ever been committed
  from, then commit, then re-stage and `md5sum`.** The file-size tell fails when
  the two versions are the same length.
- **⛔ A RESTORE LEG THAT COULD NOT HAVE FAILED PROVES NOTHING.** Clear the value
  first, prove it genuinely cleared, then restore. A MATCH against a value that
  was never wiped is decoration. This has already cost two sessions here.
- **⛔ VALIDATING THE TEMPLATE IS NOT VALIDATING THE VALUE.** A 290-character
  connection note overflows once `[Company]` resolves to "Northwestern Mutual
  Financial Network". Both moments, or neither is real.
- **⛔ NEVER STORE `"Re:"` IN `msgSubject`.** It looks right on the first
  follow-up and reads `"Re: Re: …"` on the second. The prefix is added by the
  renderer, for `msgKind === "thread"` only.
- **⛔ `state.activeView` AND `state.selectedProspectId` ARE BOTH PERSISTED AND
  BOTH MOVE THE DATABASE BYTE COUNT.** `switchView()` back to the opening view
  and account for a nulled `selectedProspectId` before any byte-exact claim.
- **⚠️ A FRESHLY CREATED RECORD IS MISSING DEFAULT FIELDS UNTIL A RESTORE ADDS
  THEM.** The create literal and `ensureStateDefaults()` have drifted, so an
  export → wipe → restore is **not byte-neutral even when nothing is wrong.**
  Found 2026-09-04. Do not report it as a defect in the drill.
- **⛔ `#view-data-management` HAS NO CONSTANT NODE COUNT.** The invariant is
  `total − select.options.length`, which reads **53**. A bare total reports a
  regression every time the snapshotter writes a file.
- **⛔ THE REPO IS PUBLIC. WRITE UP PLACEHOLDERS.** The data is not real, but the
  outreach fields hold addresses and profile URLs by design and at least one
  record is a family member. A verification proves a string round-tripped, not
  who it named.
- **⛔ THE `computer` CLICK COORDINATE IS `css × (screenshotWidth ÷ innerWidth)`
  AND IS NOT THE POSITION IN THE PICTURE.** Re-derive the scale from a live
  `getBoundingClientRect()` in the same call as the click, every time — the
  window has resized mid-session twice, and `devicePixelRatio` has read 0.75 and
  1 on this machine in consecutive sessions. Better still, drive checks with
  `el.click()` and `form_input` and spend no coordinate at all.
- **⚠️ THE EXTENSION'S CONTENT FILTER BLOCKS ON RESULT KEY NAMES AND ON QUERY
  STRINGS, AND IT IS NOT AN ERROR.** Known triggers: `tokens`, `authuser`,
  anything containing `Session`, a bare host string, a `?bust=` URL. **Rename
  the key blandly and return a derived scalar.**

## Backup points — do not skip

| When | What |
| --- | --- |
| Before **any session touching the task record shape or adding a store** | Manual ZIP |
| Before **3.5b** | Manual ZIP **and** a proved snapshot write. ⚠️ **NOT "a confirmed green chip" — the chip is a known display defect.** The real gate is `saveBackupFile`'s **`wroteToFolder: true`**, and confirm the file on disk afterwards. |
| At **phase close** | Full ZIP, stored outside the project folder |

Backups live in
`C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic
snapshots in its `snapshots\` subfolder. The stale sibling `..\backups\` is
**not** in use.

## If something goes wrong

| Symptom | What it means |
| --- | --- |
| A session stops and says a **frozen contract** needs to change | Correct behaviour. It is a plan revision, not a session decision. Amend the plan, in writing, per `DECISIONS.md` 2026-09-03. |
| A session **grinds on the same error three times** | It is told to stop and report. Let it. |
| A session wants work **outside its compartment** | It is told to put it in the backlog. Let it. |
| A session says a new store is **not covered by backup** | DIRECTIVES §4. It is right to stop. Answer it. |
| A session **stops on a gate that needs real usage** | It is wrong and this sheet says so. The data is not real. Tell it to ask you instead, and fix the document that carried the gate. |
