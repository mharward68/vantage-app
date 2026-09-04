# Phase 3 Run Sheet — the REST of Sequencing

*Vantage — a Prospecting Relationship Manager*

> ## ▶ THE OUTREACH HALF IS BUILT. THE SEQUENCING HALF IS NOT SCOPED.
>
> *Written 2026-09-04 at the Session 3.5 compartment close, to replace
> `ai/phases/phase-3-RUNSHEET.md`, which is spent from Step 2A back.*
>
> **Compartment A — outreach launch — is COMPLETE and in real use.** Sessions
> 3.1, 3.1b, 3.2, 3.3, 3.3c and 3.4 all shipped. A task carries a channel, kind,
> recipient, subject and body; one button opens Gmail composed on the work
> account; LinkedIn opens on the right person with explicit numbered copies. It
> was closed as a **compartment** close on 2026-09-04.
>
> **Compartment B — enrollment and scheduling — does not exist.** No sequence
> entity, no steps, no enrollments, no business-day advance. The `sequences` tab
> in `PROSPECT_DETAIL_TABS` is `enabled: false` with `render: null`, and that is
> the compartment that fills it.
>
> **State, read from the tree on 2026-09-04:** `app.js` **18,793** ·
> `index.html` **3,981** · `style.css` **5,192** · `CACHE_NAME` **v134** ·
> **HEAD `f932fceb`, in sync with origin.** One-glance version tell:
> `typeof linkedinSlug` is `"function"`, `typeof gmailSearchUrl` is
> `"undefined"`.
>
> ⛔ **NEXT IS NOT A SESSION. IT IS A DAY OF REAL OUTREACH, THEN STEP 2R.**

> ### Source of truth
>
> The authoritative copy is this file in the repo. **`ai/DIRECTIVES.md`,
> `DECLARATIONS.md`, `DECISIONS.md` and `BUILD_NOTES.md` outrank it**; if any of
> them disagrees with a line here, they win. The workflow itself lives in
> `ai/APP_BUILD_WORKFLOW.md`.
>
> Disposable. Delete at the phase close, along with
> `ai/phases/phase-3-RUNSHEET.md`.

---

## What is already done — do not re-run any of it

| | Output |
| --- | --- |
| ~~Step 0A~~ — intake, outreach launch | `ai/spec/sequence-outreach-launch-scope.md` |
| ~~Step 1A~~ — plan, outreach launch | `ai/phases/phase-3-outreach-launch.md` |
| ~~Step 2A~~ — build, 3.1 → 3.4 | The outreach feature, usable by hand |
| ~~Session 3.5~~ — **compartment** close, ran early 2026-09-04 | Drill, snapshot re-verify, A1–A4 audit, calibration, curation, proposals |

⛔ **Session 3.5 already ran, out of order, on Michael's instruction, and it did
NOT close the phase.** What it did is done and must not be redone: the
export → wipe → restore drill on real data (all nine CSVs md5-identical either
side), the snapshot restore re-verify, the audit of amendments A1–A4 against the
code (**all four true in the product**), compartment A's estimate calibration,
the `BUILD_NOTES.md` curation, and the `DECISIONS.md` / `DECLARATIONS.md`
proposals. **The real phase close is `3.5b`, it is Step 3 below, and it still
runs last.** Full output: `ai/archive/2026-09-04_1216_AIContext.md`.

**Do not re-run Prompt 3 for compartment A.** It is planned and built. Step 1B
plans B and merges the two into one document; it does not re-derive A's sessions
and it does not touch frozen contracts Q1–Q8.

---

## The remaining steps

| Step | What | Output | New conversation? |
| :---: | --- | --- | :---: |
| **2R** | **Review** compartment A after a day of real outreach, then plan the response | `phase-3-REVIEW-FINDINGS.md` → `phase-3-review-response-plan.md` | Yes — two |
| **0B** | **Intake** the enrollment compartment (Prompt 1) | `ai/spec/sequence-enrollment-scope.md` | Yes |
| **1B** | **Plan** enrollment and merge both halves (Prompt 3) | `ai/phases/phase-3-sequencing.md` | Yes |
| **2B** | **Build** — the review-response, enrollment and producer sessions | Sequencing | Yes, one each |
| **3** | **Close** — Session `3.5b`. Always last | Phase 4 starting point | Yes |

Each step is a **new conversation**. That is Rule 1 and it dominates cost.
Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first and
attach nothing — every prompt reads the repo itself.

### Session numbering — one rule, so two planning steps don't collide

**Everything from here takes 3.6 and up.** Step 2R's response plan claims
numbers **first**, starting at 3.6. Step 1B then continues from the next free
number rather than starting over. **`3.5b` keeps its letter and always runs
last**, exactly as 1.8 and 2B.10 did. This is the mechanism that failed in Phase
2B, where three planning documents pointed at a session that had already run —
**a session that ships out of numeric order owes this sheet an edit in the same
close, not just a handoff line.**

---

# Step 2R — Review compartment A, then plan the response

*Two conversations. Run this before Step 0B.*

**Phase 1 overran by three sessions and Phase 2B by seven, and both came from a
review pass over the one session that first showed the thing working.** This
sheet names the review point in advance so it is planned work rather than a
surprise.

⚠️ **Use a day of REAL OUTREACH, not a walkthrough.** Real first-touch emails
through the Gmail button, real follow-ups through the two copy controls, real
LinkedIn opens against real prospects. A walkthrough finds cosmetic problems; a
day of use finds the ones that cost clicks.

```
Review Phase 3, compartment A, after Session 3.4.

READ FIRST: ai/phases/phase-3-outreach-launch.md — especially frozen contracts
Q1-Q8, the four amendments A1-A4 that follow them, and the Open risks —
ai/AIContext.md, and ai/spec/sequence-outreach-launch-scope.md.

I have used the outreach launch for a full day of real work. Interview me about
what I actually did, then write ai/phases/phase-3-REVIEW-FINDINGS.md.

Ask specifically about:
- How many clicks a real send took, start to finish, per channel.
- Whether anything had to be retyped or re-copied.
- Whether the two thread copy buttons behaved as a sequence in practice, or
  whether I lost the address by clicking both.
- Whether the Workspace journaling rule caught everything I expected it to.
  Vantage emits no Bcc - amendment A1 - so this is a question about the rule,
  not about the app.
- Whether the character counters fired on anything real, and whether the
  over-limit behaviour was right.
- Whether the LinkedIn profile destination was the right call in practice, or
  whether I wanted the composer for people I am already connected to.
- Whether manual entry is a surface I would actually use, or only scaffolding.
- What I reached for that was not there.

Separate findings into: contract violations (stop and tell me), things that need
a session, and things that are preferences I should just decide. Do not write a
response plan yet.
```

Then, in a **second** conversation, plan the response sessions into
`ai/phases/phase-3-review-response-plan.md`, following Prompt 3's sizing and
estimate rules. **They take 3.6 and up.**

⚠️ **One question in the block above changed since the old run sheet.** The Bcc
question is gone: **amendment A1 retired the Bcc outright** — the Google
Workspace outbound rule blind-copies the work account, and Vantage neither emits
nor displays one. Asking "did the Bcc reach everything" invites a finding about
a mechanism that is not in the product.

---

# Step 0B — Intake the enrollment compartment

*One conversation, after Step 2R. Produces a scope. No code, no plan.*

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

NUMBERING: the review-response sessions from Step 2R have already claimed
numbers from 3.6 upward. Continue from the next free number; do not start over.
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
  underestimation. The review had not run when it closed, so its contingency is
  still unspent.
- THE CONCLUSION THAT MATTERS: session growth has TWO independent sources -
  review response, and mid-phase amendments - and only the first has ever been
  budgeted. Budget them separately.
- Per-session SIZES have been right nearly every time. Do not inflate them. The
  overrun is COUNT, not size.
- NEVER size a phase close below M.
- My attention estimates have come in roughly 2.5x UNDER across three phases.
  Say so plainly rather than quietly correcting them.
- Budget two CACHE_NAME bumps per session.
- Use the Step 2R review's ACTUAL output rather than a contingency percentage.

Write the merged plan to ai/phases/phase-3-sequencing.md - a NEW file carrying
both compartments. Leave ai/phases/phase-3-outreach-launch.md in place as the
historical record of compartment A; do not delete or edit it.

THEN - also update this run sheet, ai/phases/phase-3-sequencing-RUNSHEET.md:
fill in Step 2B's session list with the real numbers, titles, sizes and my-time
estimates. Change only that list.

Stop after the plan. Do not start a session.
```

---

# Step 2B — Run the sessions

*One session, one conversation. Never two.*

**The sessions** — *filled in by Step 2R's response plan and Step 1B.*

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

1. RE-PROVE THE EXPORT PATH - but ONLY IF the enrollment compartment changed the
   task record shape or added a store. It writes contract Q1's five fields and
   introduces no new ones, so it may not have. Say which, and why, before
   deciding. If any new store landed, the drill is mandatory: full export, wipe,
   restore on real data, counts pasted, and every new column shown surviving
   character-identical. Prove the wipe actually cleared before believing the
   restore.

2. RE-VERIFY A SNAPSHOT RESTORE. Tier 1 is still the sole protection.

3. ESTIMATE CALIBRATION ACROSS BOTH COMPARTMENTS. Compartment A ran 7 against a
   planned 5 with zero re-sizes, both extras from mid-phase amendments. Report
   what compartment B did, whether splitting the phase in two with an intake in
   the middle changed the pattern Phase 1 and Phase 2B set, and what it means for
   Phase 4.

4. AUDIT ANY NEW FROZEN CONTRACTS AND AMENDMENTS AGAINST THE CODE, the same way
   3.5 audited A1-A4, and say plainly whether each is true in the product.

5. CURATE ai/BUILD_NOTES.md and audit ai/DECLARATIONS.md for drift. Propose; do
   not apply. Still one page after. The Stack line counts are the known stale
   item - real is 18,793 / 3,981 / 5,192 as of 3.4.

6. WRITE ai/AIContext.md as a PHASE-BOUNDARY handoff: what exists now, what is
   deferred, what Phase 4 starts from.

7. TELL ME EXACTLY WHAT TO BACK UP, and the filename to use.

8. DELETE ai/phases/phase-3-RUNSHEET.md and
   ai/phases/phase-3-sequencing-RUNSHEET.md. Both are spent at this point. Tell
   me; I delete them.

9. NEXT PHASE - Phase 4 is Hosting and, unlike Phase 3, it does NOT need an
   intake. Its pre-flight already exists at
   ai/spec/phase-4-firebase-preflight.md. Read it, tell me whether it is still
   current, and tell me to run Prompt 3.
```

⚠️ **The pre-flight's counts are already stale and the next close should say so
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
  pushed. **Stage `.git/refs/heads/main`, `.git/refs/remotes/origin/main` and
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

## Still true for this compartment

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

## Traps that make a half-fix look finished

*The compartment-A-specific ones are retired with it. These still bite.*

- **⚠️⚠️ THE APP RUNS PERFECTLY WITH THE SERVER DOWN.** `sw.js` is cache-first,
  so with `npx serve` stopped the app still boots, renders all six views and
  shows a clean console — **entirely out of the previous version's cache**, which
  reads exactly like a failed `CACHE_NAME` bump. **The tell is that `sw.js` is
  the one file NOT in `ASSETS`.** One call settles it: fetch a cached asset, an
  unreal path, and `/sw.js`. Server up gives `200 / 404 / 200`.
- **⛔ A `CACHE_NAME` BUMP DOES NOT LAND ON `reg.update()` ALONE.**
  `unregister()`, delete every `vantage*` cache, then reload **twice**.
- **⛔ `device_commit_files` CAN REPORT SUCCESS AND WRITE THE PREVIOUS BYTES**
  when a staged path is reused, and **the file-size tell fails when the two
  versions are the same length** — a one-character version bump is exactly the
  change a byte count cannot see. **Write each revision to a NEW staged path and
  re-stage and md5-compare.**
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
- **⛔ TEST AGAINST REAL RECORDS, WRITE UP PLACEHOLDERS. THE REPO IS PUBLIC.**
  A verification proves a string round-tripped, not who it named. This bites
  hardest here, because the outreach fields hold real addresses and profile URLs
  by design.
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
| Before **3.5b** | Manual ZIP **and** a proved snapshot write. Non-negotiable if the drill runs. ⚠️ **NOT "a confirmed green chip" — the chip is a known display defect.** The real gate is `saveBackupFile`'s **`wroteToFolder: true`**, and confirm the file on disk afterwards. |
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
