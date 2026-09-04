# Phase 3 Run Sheet — Sequencing

> ## ⛔ SUPERSEDED FROM STEP 2R ONWARD — 2026-09-04
>
> **The rest of Phase 3 is run from `ai/phases/phase-3-sequencing-RUNSHEET.md`.**
> That sheet covers the review, the enrollment intake, the merged plan, sessions
> 3.6+ and the `3.5b` close, with the prompts corrected for amendments A1–A4 and
> for the fact that Session 3.5 already ran as a compartment close.
>
> **This file is kept as the historical record of Steps 0A, 1A and 2A** — the
> intake, the plan and sessions 3.1 → 3.4. Its Step 2R, 0B, 1B, 2B and 3 blocks
> are stale: **Step 2R's Bcc question asks about a mechanism amendment A1
> removed**, and Step 3 is written as though the close has not started.
> **Do not paste a prompt out of this file.** Both sheets are deleted at the
> phase close.


*Vantage — a Prospecting Relationship Manager*

> ## ▶ RUNNING — two sessions in. Updated 2026-09-04, after Session 3.2.
>
> *Written 2026-09-02. Revised at the Phase 2B close, and again here — the
> banner this replaced said Phase 3 was blocked on 2B.10's drill, which ran on
> 2026-09-03.*
>
> **Phase 2B is CLOSED.** All twenty-two sessions ran; the export → wipe →
> restore drill and the snapshot drill both ran against the production database
> and it came back to its exact opening byte count.
>
> **Phase 3 has shipped 3.1 and 3.2.** `CACHE_NAME` is **v128**. `app.js`
> **17,849** · `index.html` **3,876** · `style.css` **4,991**. **Committed and
> pushed at `7a853f1`** — read out of `git log`, not carried from a handoff.
>
> ⛔ **NEXT IS 3.1b, AND IT MUST LAND BEFORE 3.3.** Four deletions plus a cache
> bump: it removes the Bcc that amendment A1 retired, and 3.3 is the session
> that would otherwise build `&bcc=` straight back in.
>
> ⚠️ **THREE FROZEN CONTRACTS HAVE BEEN AMENDED SINCE THIS SHEET WAS WRITTEN —
> A1, A2, A3 — AND TWO OF THEM CHANGE WHAT 3.3 BUILDS.** Summarised below;
> written in full in `ai/phases/phase-3-outreach-launch.md § Frozen-contract
> amendments`. **Read them before running 3.3.**
>
> **Numbered 3, not renumbered.** Hosting stays Phase 4, and its pre-flight
> already exists at `ai/spec/phase-4-firebase-preflight.md`.

> ### Source of truth
>
> The authoritative copy is **`ai/phases/phase-3-RUNSHEET.md`** in the repo. Any
> Word or Google Doc copy is generated from it — if the two disagree, the repo
> wins, and the copy is regenerated rather than edited.
>
> Disposable. Delete at phase close. The workflow itself lives in
> `ai/APP_BUILD_WORKFLOW.md`.

---

## ⚠️ This phase is scoped in halves, and the order is unusual

Phase 3 has two compartments. **Only one is scoped**, and the intake for the
other deliberately runs *in the middle of the phase* rather than at the start.

| Compartment | Scope | Status |
| --- | --- | --- |
| **A. Outreach launch** — what a task carries, and how it reaches Gmail or LinkedIn | `ai/spec/sequence-outreach-launch-scope.md` | ✅ Approved 2026-09-02. **Planned:** `ai/phases/phase-3-outreach-launch.md` |
| **B. Enrollment and scheduling** — sequences, steps, enrollments, business-day advance | `claude/sequence-feature-scope.md` — **SUPERSEDED** | ⛔ **Not scoped. Needs an intake.** |

**Compartment A has no dependency on sequences existing.** Every field it adds
can be typed by hand, so 3.1–3.4 ship a complete, usable feature — one-off email
and LinkedIn outreach with validation, Bcc and launch buttons — before a single
sequence entity exists.

**That is why the intake for B runs after 3.4, not before.** You will have used
the outreach fields for a week of real outreach before designing the machinery
that writes them. Scoping B first would mean designing a producer for a consumer
nobody has used yet.

---

## The steps

| Step | What | Output |
| :---: | --- | --- |
| ~~0A~~ | ~~Intake — outreach launch~~ | ✅ **Done 2026-09-02** — `ai/spec/sequence-outreach-launch-scope.md` |
| ~~1A~~ | ~~Plan — outreach launch~~ | ✅ **Done 2026-09-02** — `ai/phases/phase-3-outreach-launch.md` |
| **2A** | **Build** — sessions 3.1 → 3.4, one per conversation | The outreach feature, usable by hand |
| **2R** | **Review** — a day of real outreach after 3.4, then respond | `…-REVIEW-PASS.md` → `…-REVIEW-FINDINGS.md` → `…-review-response-plan.md` |
| **0B** | **Intake** — the enrollment compartment | `ai/spec/sequence-enrollment-scope.md` |
| **1B** | **Plan** — enrollment sessions, merged into one phase plan | The enrollment half of the plan |
| **2B** | **Build** — the enrollment and producer sessions | Sequencing |
| **3** | **Close** — Session 3.5. Always last. | Phase 4 starting point |

Each step is a **new conversation**. Connect
`C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first. Attach nothing
— every prompt reads the repo itself.

**Do not re-run Prompt 3 for compartment A.** It is planned. Step 1B plans B and
merges the two into one document; it does not re-derive A's five sessions or
touch its frozen contracts Q1–Q8.

---

## What this phase builds

**A. Outreach launch.** A task carries a channel, a kind, a recipient, a subject
and a body. One button opens Gmail composed — recipient, Bcc, subject and body
prefilled on the work account — or opens Gmail searching a contact's history for
a follow-up. Another opens LinkedIn on the right person, with subject and body
one labelled click from the clipboard each. Everything is validated against the
real ceiling for its channel. Vantage never sends.

**B. Enrollment and scheduling.** Named reusable sequences, steps with
business-day delays, prospects enrolled one at a time, and the task queue those
enrollments produce. **Not scoped — see Step 0B.**

> **The riskiest thing in this phase is not the feature, it is the guards.**
> A popup blocker, a denied clipboard permission and an over-long URL all produce
> a button that *looks* like it worked. Every one of them passes a console
> check. Contract Q5's synchronous-`window.open` rule and Session 3.3's
> deliberate popup-blocker test exist for exactly this, and they are the parts
> most likely to be skipped under time pressure. **Do not skip them.**

---

# Step 2A — Run sessions 3.1 through 3.4

Compartment A was **5** sessions as planned. It is **7** as of 2026-09-04:
**3.1b** was added when amendment A1 retired the Bcc after 3.1 had already
shipped it, and **3.3c** when amendment A2 grew 3.3 past a single session.
Forecast **8–9** once contingency is applied. The contingency is what reviewing
Session 3.4 is expected to produce, and it takes numbers **3.6 and up**.
**3.5 keeps its number and always runs last.**

⚠️ **Worth separating at the 3.5 calibration: both extra sessions came from
amendments Michael authorised mid-phase, not from a session being
underestimated.** Those are different failures and only one of them is an
estimating problem. Do not let the phase report "7 against a planned 5" as though
it were the 1.8 pattern repeating.

---

## ⚠️ Three amendments, and what each one changes

*Full text: `ai/phases/phase-3-outreach-launch.md § Frozen-contract amendments`.
This table is the reminder, not the record.*

| | Date | Changes | Effect on the sessions |
| :---: | --- | --- | --- |
| **A1** | 2026-09-03 | Q3, Q4, Q5 | **Vantage emits NO Bcc.** The Workspace outbound rule already journals everything sent from the work account. `emailBcc`, its seed, its constant, its CSV row and its restore leg all go. **`workGmailAddress` is untouched.** → **costs Session 3.1b**, and 3.3 must not build `&bcc=`. |
| **A2** | 2026-09-04 | Q1, Q4, Q5, Q6, Q7 | **Clickable links.** A body may hold `[text](url)`, `**bold**`, `*italic*` — three forms, list closed, **no font family or size**. The clipboard carries `text/html` + `text/plain`; LinkedIn gets **flattened text**, never markup and never HTML. A `compose` body with a link opens Gmail **To + Subject only** and copies the body. Counters follow the flattened output on LinkedIn. The Body box becomes **two disclosures**. → **grew 3.3, then split off Session 3.3c**. |
| **A3** | 2026-09-03 *(recorded 2026-09-04)* | Q2, Q4, Q5 | **Email `thread` opens NOTHING.** `gmailSearchUrl()` is cut — not written, not stubbed. **Two explicit copy buttons, address and message.** → shrinks 3.3, and retires the `#search/` redirect risk entirely. |

⛔ **A3 IS ALSO A WARNING ABOUT HOW THESE DOCUMENTS DRIFT.** It was decided on
2026-09-03 and lived in the **scope** and in **this run sheet** for a full day
while the **phase plan** still described the cut mechanism as live — Q4 defined
the function, 3.3's tasks built it, its Done-when checked it, and 3.5 owed a
`BUILD_NOTES.md` entry about it. **A session reading only the plan would have
built a cut function and verified it.** Found at the 3.2 close. **The plan is not
automatically the newest document.**

For each session, four things:

| | |
| :---: | --- |
| 1 | Open a **new conversation** |
| 2 | Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` |
| 3 | Paste the block below, with the session number on the first line |
| 4 | When it finishes, it tells you the next session number |

**Only line 1 ever changes.** Attach nothing.

```
Run Session 3.1 from ai/phases/phase-3-outreach-launch.md.

BOOT — report in 5 lines or fewer:
1. ai/DIRECTIVES.md and ai/DECLARATIONS.md — what constrains this session, and
   which Hard Limits (§4) it's likely to touch
2. ai/AIContext.md — where the last session ended, open items
3. ai/BUILD_NOTES.md — MAP, plus any topic relevant here
4. The phase plan: this session and its frozen contracts Q1–Q8
5. Confirm compartment(s), goal, done-criteria, inputs needed from me

Ask only what genuinely blocks you, all at once, before starting. Anything
reversible: pick the simplest option, log it, keep moving. Do not stop mid-run
for something optional.

EXECUTE
- Stay in this session's compartment(s). Work found elsewhere goes to the phase
  backlog — do not do it.
- Do not modify a frozen contract. If it must change, stop and tell me.
- Follow DECLARATIONS. DIRECTIVES §4 Hard Limits are absolute — each has an
  observable trigger; when one fires, stop and ask. "I considered it" is not
  compliance.
- Close calls use the DIRECTIVES §5 procedure: gates eliminate, then the ladder
  decides at the first rung where options actually differ.
- THREE STRIKES: three failed attempts at the same error — stop, report what you
  tried and what you think is actually wrong. Do not grind.
- LEAVE THE APP USABLE. Real outreach happens in it between sessions. Every
  session in this compartment is purely additive; none removes a working surface.

  PHASE 3 STANDING RULES — these are contract Q8 and they are not negotiable:
- VANTAGE NEVER SENDS. No email is sent, no draft is created via any API, and no
  LinkedIn action is automated. Vantage opens a page; I do the rest.
- NO NEW TOP-LEVEL STORE. The setting goes on state.taskSettings, which
  wipeAllData() already clears. No state.outreachSettings, no new CSV file.
- READ THE THREE AMENDMENTS BEFORE TRUSTING A FROZEN CONTRACT. A1, A2 and A3 are
  in the phase plan after Q8. Q1-Q7 are all amended by at least one of them, and
  a contract paragraph that contradicts an amendment is the stale one.
- VANTAGE EMITS NO BCC (A1). No &bcc= term, no emailBcc key, no Bcc line on
  screen. The Workspace rule already journals the work account.
- EMAIL thread OPENS NOTHING (A3). No gmailSearchUrl(), not even stubbed. Two
  explicit copy buttons, address then message, and they are a SEQUENCE - there
  is one clipboard and the second overwrites the first.
- LINKEDIN NEVER RECEIVES MARKUP OR HTML (A2). The converter always runs; it
  flattens for LinkedIn and emits HTML only for email.
- window.open IS CALLED SYNCHRONOUSLY INSIDE THE CLICK HANDLER. No await before
  it, ever. Clipboard writes, saveState() and re-renders all happen after.
- NO ROUTING. A recipient address must never enter location.hash, a URL bar or
  document.title. Imported prospectId values are already email addresses.
- DO NOT REPURPOSE task.notes, task.source or task.sourceRef. They mean what
  they already mean.
- The sequences tab in PROSPECT_DETAIL_TABS stays enabled: false.
- Both query surfaces are still DEFERRED: renderAqInspectorDrawer(), the
  aq-insp-* ids, and the Audience Query Engine are not touched.

VERIFY — run the checks in "Done when" and paste the real output. Not a summary,
not "tests pass." If you didn't run it, say you didn't run it. A passing state
check is not evidence the user can see the right thing — screenshot it.

A LAUNCH BUTTON CANNOT BE VERIFIED BY PASTING GMAIL'S DOM. Build the URL, paste
it, and decode every parameter back to prove it survived. Confirm ONE real open
per channel by screenshot. This is plan Assumption 8 — it is a deliberate
weakening of the usual standard, not a shortcut you invented.

END OF SESSION — every step, in order:
1. ARCHIVE — move ai/AIContext.md to ai/archive/YYYY-MM-DD_HHMM_AIContext.md
   using the real current date and time. Confirm it moved.
2. NEW CONTEXT — fresh ai/AIContext.md. ONE PAGE. Timestamp, session run, what
   was done, files changed, assumptions, open items, exact next step.
3. ESTIMATE ACTUALS — record in ai/AIContext.md: estimated size vs. what it
   actually was, and roughly how much of my time it really took. One line.
4. BUILD NOTES — append only what a FUTURE session would waste time
   rediscovering. File under the right topic heading. Update MAP if files moved
   or were added. Durable findings only. Nothing qualifies? Write nothing and
   say so.
5. SUMMARY — short, in chat. What got done, what I should know, what's next.
   Include anything from "Needs my eyes."
6. ASK — continue or stop? If continue, tell me the next session number.
   Do not run the next session in this conversation.
```

For every session after the first, change **only** the first line.

## The sessions

*Tick them off as they land — the agent tells you the next one each time.*

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ✅ | **3.1** | Task outreach fields, settings, and their backup coverage | M | ran ~8 min |
| ☐ | **3.1b** | **Remove the Bcc (amendment A1)** — four deletions + a cache bump. ⛔ **MUST land before 3.3** | S | ~2 min |
| ✅ | **3.2** | The outreach block — manual entry, auto-fill, counters | M | ran ~4 min |
| ☐ | **3.3** | Email launch — the `compose` URL, the clipboard helper, the converter, two `thread` copy buttons, every guard. **A1 + A2 + A3 all land here** | M | ~10 min |
| ☐ | **3.3c** | **The authoring surface** — Bold/Italic/Link toolbar, the two disclosures, the live preview. Pure UI over 3.3's converter | M | ~8 min |
| ☐ | **3.4** | LinkedIn launch — slug, three kinds, explicit copy controls ← **review here** | M | ~10 min |
| ☑ | **3.5** | **COMPARTMENT close — RAN 2026-09-04 12:16, early, on Michael's instruction.** Drill, snapshot re-verify, A1–A4 audit (all four true), calibration, curation, proposals — **all done.** ⛔ **The phase is NOT closed.** | M | ~4 min actual |
| ☐ | **3.5b** | **THE REAL PHASE CLOSE — always last, after 3.6+.** Owes: both-compartment calibration; the drill again **only if** enrollment changes the task record shape; delete this run sheet; Phase 4 handoff; `phase-4-firebase-preflight.md` currency check | S/M | ~10 min |

**Strictly sequential, and the order is 3.1b → 3.3 → 3.3c → 3.4 → 3.5.** Each
builds on the previous session's surface and **none of them removes a working
one** — 3.1b removes only a setting that nothing reads.

⚠️ **3.3 and 3.3c were one session until 2026-09-04.** They were split so the
half that can fail invisibly — popup blocker, clipboard permission, URL ceiling,
Gmail's treatment of an HTML flavour — is separate from the half that can only
look wrong. **Do not recombine them to save a handoff.**

## Before these start — ✅ ALL FOUR ANSWERED 2026-09-03

*The four gating questions this sheet was written around are closed. Kept with
their answers rather than deleted, because two of them CHANGED WHAT GETS BUILT.*

| # | Question | Answer, 2026-09-03 | Effect |
| :---: | --- | --- | --- |
| 1 | The work Gmail address, entered in Settings | ⛔ **STILL OWED as of 2026-09-04.** `workGmailAddress` reads `""` in the live database. A value to type, not a decision. | 3.3. Blank correctly disables every email button with a message naming Settings. |
| 1b | **The real lead-magnet URL** — the Tech RFP one | ⛔ **NEW, owed for 3.3.** | A2's link check verified against `example.com` proves the mechanism and not the thing actually sent. |
| 2 | LinkedIn free or Premium? | **Premium, with Sales Navigator.** | ✅ `connect` is **BUILT**, not cut. The "may be cut mid-session" risk is retired. |
| 3 | ~~Confirm the seeded Bcc default~~ | ⛔ **MOOT — amendment A1 retired the Bcc entirely, hours after 3.1 seeded it.** The value was confirmed correct on screen and then deleted. **Do not re-open the spelling question; there is no Bcc.** | 3.1b removes it |
| 4 | Google Workspace with admin access? | **Yes, and the outbound compliance rule is SET.** | ⚠️ **SCOPE CUT: 3.3 drops §7.6's Bcc workaround entirely** — no rendered Bcc line, no separate copy control, no "remember Bcc" toast. The `compose` Bcc stays. |

### ⚠️ AND FOUR MORE DECISIONS LANDED THE SAME DAY — 3.3 GOT SMALLER, NOT BIGGER

| Decision | Effect on the sessions |
| --- | --- |
| **Only `/in/` LinkedIn profile URLs are saved.** Sales Navigator is how he FINDS people, not what he SAVES. | §7.4's regex is correct as written. ⛔ **Do not add Sales Navigator URL handling** — a `sales/lead/` value is a data error to fix, not a format to support. **Run the §9.4 probe once during 2B.10's drill** as a health check on the 651. |
| **Email `thread` is TWO COPY BUTTONS — address and message.** | ⛔ **§7.3's `#search/` builder is CUT. A `thread` task opens NO URL at all.** Both values (`msgTo`, `msgBody`) already exist in §5.1, so this needs **no new fields and no URL builder**. |
| **Vantage reads no mail.** The earlier "pull the previous thread into the task" request is **withdrawn**, and the Gmail restricted-scope cliff with it. | Nothing to build. **Do not resurrect it as an unbuilt idea.** |
| **Gmail is ASSUMED open on the work account.** | ⛔ The "otherwise pop up a reminder" half **cannot be built** — a page cannot see across origins to a Gmail tab or its signed-in account. **A static hint line replaces it.** |

## Traps that make a half-fix look finished

Each of these **passes a spot-check while still broken.**

- **3.3 — `tf=cm` is correct and `view=cm&fs=1` is stale.** The old pairing is
  everywhere online; `fs` no longer does anything and `view=cm` was superseded.
  A session that "corrects" the URL back to the old form has broken it, and the
  compose window will still open — just not reliably.
- **3.3 — `window.open` behind an `await` passes every console check.** It fails
  only under a popup blocker, on your machine, later. The Done-when tests this
  deliberately because nothing else will catch it.
- **3.4 — the prospect key is `linkedin`, NOT `linkedinUrl`.** The wrong key
  reads `undefined`, yields no slug, and silently disables every LinkedIn button
  with no error anywhere. Verified 2026-09-02 against P5 and `#pros-email`'s
  sibling `#pros-linkedin`.
- **3.4 — `?recipient=` is undocumented.** Verify it live in-session. If it does
  not open addressed, **shipping the profile-URL fallback is the correct
  outcome, not a strike.** Record which one shipped in BUILD_NOTES.
- **3.1 — a restore leg that could not have failed proves nothing.** Session
  2B.7's lesson: clear the value first, paste it *genuinely cleared*, then
  restore. A MATCH against a value that was never wiped is decoration.
- **3.2 — auto-fill must not overwrite a typed recipient.** Only visible if you
  type a value, switch channel, and switch back. A one-way test passes while the
  bug is live.
- **3.1/Q1 — never store `"Re:"` in `msgSubject`.** It looks right on the first
  follow-up and reads `"Re: Re: …"` on the second. The prefix is added by the
  renderer.
- **3.2/Q6 — validating the template is not validating the value.** A
  290-character connection note overflows once `[Company]` resolves to
  "Northwestern Mutual Financial Network." Both moments, or neither is real.

### Added 2026-09-04, from Session 3.2 — every one of these cost real time

- **⚠️⚠️ THE APP RUNS PERFECTLY WITH THE SERVER DOWN, AND IT COST A FULL
  STOP-AND-ASK.** `sw.js` is cache-first, so with `npx serve` stopped the app
  still booted, rendered all six views, read 651 prospects and showed a clean
  five-line console — **entirely out of the previous version's cache.** Every
  symptom pointed at a failed `CACHE_NAME` bump instead. **The tell is that
  `sw.js` is the one file NOT in `ASSETS`**, so it alone must come off the
  network. One call settles it: fetch a cached asset, an unreal path, and
  `/sw.js`. Server up gives `200 / 404 / 200`; server down gives
  `200 / THREW / THREW`. ⛔ **A cached asset answering 200 is NOT evidence the
  server is up — it is what makes this invisible.** In `BUILD_NOTES.md` now.
- **⛔ `state.activeView` IS PERSISTED, SO ITS STRING LENGTH MOVES THE DATABASE
  BYTE COUNT.** End a session on `data-management` having started on
  `dashboard` and the rollback reports **6 bytes** of residue — `"data-management"`
  is 15 characters against `"dashboard"`'s 9. It reads exactly like leaked data.
  **`switchView()` back to the opening view before any byte-exact claim.**
- **DO NOT COUNT A PANEL'S NODES INSIDE A `switchView()` SWEEP LOOP** — it reads
  a half-rendered panel. `#view-data-management` returned 54 against a baseline
  of 68 in the loop, and **68 when measured on its own.** Looks like a
  regression in a view the session never touched.
- **⛔ `computer.zoom`'s region is NOT the click coordinate space** — the two
  differ by exactly `devicePixelRatio`, because the returned image is
  letterboxed. Clicks want `css × (imgW ÷ innerWidth)`; zoom wants that **times
  `devicePixelRatio`.** Cost two dead calls.
- **⛔ TEST AGAINST REAL RECORDS, WRITE UP PLACEHOLDERS. THE REPO IS PUBLIC.**
  3.2's fixtures used one of the 651 real contacts — correct — and the first
  draft of the handoff then quoted her **name, work email, employer and LinkedIn
  URL** as evidence. Caught before the commit. **A verification proves a string
  round-tripped, not who it named.** This bites hardest from here on, because the
  outreach fields hold addresses and profile URLs by design.

### Added 2026-09-03, from the decisions above

- **⚠️ 3.3 — A CLIPBOARD WRITE THAT SILENTLY FAILS LOOKS EXACTLY LIKE ONE THAT
  WORKED, and this phase now leans on the clipboard where it used to lean on a
  URL.** `navigator.clipboard.writeText()` needs a **secure context and a real
  user gesture**, returns a promise that can reject with nothing in the console,
  and behaves differently on `localhost` than on a hosted origin — which will
  matter at Phase 4. **Every copy button needs a visible success state and a
  fallback, and the Done-when must exercise them on the real machine, not in the
  console.** The risk did not disappear when the popup-blocker path was cut; it
  moved.
- **⚠️ 3.2 — THERE IS ONE CLIPBOARD, SO THE TWO BUTTONS ARE A SEQUENCE, NOT A
  PAIR.** The second copy overwrites the first: `Copy address` → paste → open the
  thread → `Copy message` → paste. **Do not lay them out as two equivalent
  options side by side** — that shape invites clicking both, and losing the
  address is silent and reads as the first button not working.
- **⛔ 3.3 — THERE IS NO PASTE BUTTON AND THERE CANNOT BE ONE.** A page cannot
  put text into another origin's input. Michael's own phrasing was *"a button
  that is a copy and paste of the message"*; a session reading that line alone
  could try to build a paste. **Vantage's job ends at the clipboard.**

## Backup points for this step

| When | What |
| --- | --- |
| Before **3.1** | Manual ZIP — its Done-when calls `wipeAllData()` against real data |
| Before **3.5** | Manual ZIP **and** a proved snapshot write. Non-negotiable. ⚠️ **NOT "a confirmed green chip" — the chip is a known display defect** (it read Protected and Not protected an hour apart with nothing changed). **The real gate is `saveBackupFile`'s `wroteToFolder: true`.** |

---

# Step 2R — Review after 3.4, then the response sessions

*Run this before Step 0B. It is the point at which outreach launch is complete
and used for real work.*

**Phase 1 overran by three sessions and Phase 2B by seven, and both came from a
review pass over the one session that first showed the thing working.** This
sheet names the review point in advance so it is planned work rather than a
surprise.

Use a **day of real outreach** — not a walkthrough. Send real first-touch emails
through 3.3's button, real follow-ups through the thread search, and real
LinkedIn messages through 3.4's, against real prospects. Then:

```
Review Phase 3, compartment A, after Session 3.4.

READ FIRST: ai/phases/phase-3-outreach-launch.md (especially the frozen
contracts Q1–Q8 and the Open risks), ai/AIContext.md, and
ai/spec/sequence-outreach-launch-scope.md.

I have used the outreach launch for a full day of real work. Interview me about
what I actually did, then write ai/phases/phase-3-REVIEW-FINDINGS.md.

Ask specifically about:
- How many clicks a real send took, start to finish, per channel.
- Whether anything had to be retyped or re-copied.
- Whether the Bcc reached everything I expected it to, and what it missed.
- Whether the character counters fired on anything real, and whether the
  over-limit behaviour was right.
- Whether manual entry is a surface I would actually use, or only scaffolding.
- What I reached for that was not there.

Separate findings into: contract violations (stop and tell me), things that need
a session, and things that are preferences I should just decide. Do not write a
response plan yet.
```

Then plan the response sessions the same way 2B did, into
`ai/phases/phase-3-review-response-plan.md`. **They take numbers 3.6 and up.
3.5 keeps its number and still runs last.**

---

# Step 0B — Intake the enrollment compartment

*One conversation, after Step 2R. Produces a scope, no code, no plan.*

```
Intake Phase 3, compartment B: sequence enrollment and scheduling.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md, ai/AIContext.md, ai/spec/taskhub-scope.md, and
ai/spec/sequence-outreach-launch-scope.md — which is compartment A, already
built. Also read ai/phases/phase-3-outreach-launch.md's frozen contracts Q1–Q8:
this compartment WRITES those fields and must not redefine them.

THE OLD SCOPE IS SUPERSEDED AND MUST NOT BE BUILT FROM.
claude/sequence-feature-scope.md, in the Claude project, carries a supersession
banner listing exactly what is wrong with it. Short version: the task queue is a
stored entity and not a projection; currentStepIndex became currentStepId;
currentStepBody became a per-step array snapshotted at enrollment; dates are
"YYYY-MM-DD" strings; TaskHub is a top-level hub; and it names
processSingleCSVContent(), a function that has never existed — the real restore
router is processRestoreFile().

WHAT SURVIVES FROM IT, and should not be re-derived — its §8 decisions all still
hold: business-day math is weekends-only with no holiday calendar; enrollment
has a start-step and a start-timing control; re-enrollment is allowed behind an
explicit confirmation when there is prior history; unenroll keeps history; and
the four conference merge fields exist (conferenceName, conferenceVenue,
conferenceStart, conferenceEnd — note conferenceVenue is ONE combined field).

WHAT COMPARTMENT A ALREADY SETTLED, and this compartment inherits rather than
re-decides:
- A step declares channel + kind. Kind decides destination, whether a subject
  exists, and the character ceiling. See Q2.
- A sequence resolves merge tokens at TASK-CREATION time and writes literal text
  into task.msgSubject / task.msgBody. A task never stores an unresolved token.
- The [Email] merge token still needs adding to the token list. prospect.email
  exists; prospect.linkedin exists. Neither needs building.
- Business-day arithmetic already exists as shiftTaskDate(dateStr, n, mode) with
  test vectors, Phase 1 contract C11. REUSE IT. Do not write a second
  addBusinessDays().

Follow PROMPT 1 in ai/APP_BUILD_WORKFLOW.md. Ask me what you need. Write the
result to ai/spec/sequence-enrollment-scope.md.

Stop after the scope. Do not plan sessions.
```

---

# Step 1B — Plan the enrollment compartment and merge

*One conversation, after Step 0B.*

```
Plan Phase 3, compartment B, and merge it with compartment A.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md (MAP especially), ai/AIContext.md,
ai/spec/sequence-enrollment-scope.md (just approved), and
ai/phases/phase-3-outreach-launch.md. Report in 3 lines what you found that
changes the plan.

COMPARTMENT A IS ALREADY PLANNED AND ITS SESSIONS HAVE RUN. Do not re-derive
sessions 3.1–3.4, do not renumber them, and do not modify frozen contracts
Q1–Q8. Your job is the enrollment sessions plus the outreach PRODUCER sessions
that depend on them, merged into one phase plan.

THE PRODUCER SESSIONS are the second half of compartment A and were deliberately
left unplanned because their entities did not exist. They are: sequence step
channel/kind/subject/body plus step export-restore; the sequence builder's
channel picker, kind picker, conditional subject field and template-level
counters; and token resolution at task creation. They WRITE Q1's five fields and
introduce no new ones.

Follow PROMPT 3 in ai/APP_BUILD_WORKFLOW.md exactly — compartments, session
sizing, contract-first ordering, and the three estimates per session (SIZE, MY
TIME, CONFIDENCE).

NUMBERING: enrollment and producer sessions take 3.6 and up, alongside whatever
the 3.4 review produced. 3.5 is the phase close, keeps its number, and ALWAYS
RUNS LAST. This is the 1.8 and 2B.10 precedent.

CALIBRATION — measured, not guessed. Absorb it; do not re-derive it.
- Phase 1: 8 sessions planned, 11 run. All three additions came from ONE review
  pass over ONE session.
- Phase 2B: 10 planned, 17 run — the review produced SEVEN. That is +70%, double
  the +35% contingency that was carried.
- Per-session SIZES have been right nearly every time. Do not inflate them.
  The overrun is COUNT, not size.
- NEVER size a phase close below M.
- Attention-time estimates have come in UNDER. Leave that method alone.
- Budget two CACHE_NAME bumps per session.
- Compartment A's review has already run by now; use its actual output rather
  than a contingency percentage if the numbers are in front of you.

Write the merged plan to ai/phases/phase-3-sequencing.md — a NEW file that
carries both compartments. Leave ai/phases/phase-3-outreach-launch.md in place
as the historical record of compartment A; do not delete or edit it.

THEN — also update ai/phases/phase-3-RUNSHEET.md: fill in Step 2B's session
list with the real numbers, titles, sizes and my-time estimates. Change only
that list.

Stop after the plan and the run sheet update. Do not start a session.
```

---

# Step 2B — Run the enrollment and producer sessions

*Same four things per session. Same prompt block as Step 2A, with the plan
filename changed to `ai/phases/phase-3-sequencing.md`.*

## The sessions

*Filled in by Step 1B.*

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☐ | **3.6** | — | | |
| ☐ | **3.7** | — | | |
| ☐ | … | | | |

---

# Step 3 — Close the phase

*One final new conversation. This is Session **3.5b** and it always runs last.*

> ⚠️ **Session 3.5 already ran, early, on 2026-09-04, as a COMPARTMENT close.** Steps 1, 2, 3, 5 and 6 below
> are **done** for the outreach-launch compartment — do not re-run them from scratch. Read
> `ai/archive/2026-09-04_1216_AIContext.md` first and carry its output forward. **Step 5 (the drill) only
> needs re-running if the enrollment compartment changed the task record shape.** Step 2's calibration must
> now cover BOTH compartments, and Steps 4, 7, 8 and 9 are the ones still genuinely owed.

```
Close Phase 3.

1. Verify the phase goal is met. Run the checks, paste real output. List
   anything incomplete or deferred.

2. ESTIMATE CALIBRATION — compare both compartments' estimates against the
   actuals logged in the archived AIContext files. Report: predicted vs. actual
   session count, where sizes were wrong and in which direction, and my
   predicted vs. actual attention time.

   Phase 1 ran 11 against a planned 8. Phase 2B ran 17 against a planned 10.
   Say whether Phase 3 repeated it, whether splitting the phase into two
   compartments with an intake in the middle changed the pattern, and what it
   means for Phase 4.

3. Curate ai/BUILD_NOTES.md — it's read every session, so it stays lean. Merge
   duplicates, delete what's no longer true, delete what turned out not to
   matter, regroup under clean topics, refresh MAP against the real file tree.
   Report what you cut.

4. Audit ai/DECLARATIONS.md. Amendments owed by this phase:
   - A DECISIONS.md entry for why the Gmail API was declined, and precisely what
     would reverse it.
   - A BUILD_NOTES.md entry: tf=cm is the compose parameter; view=cm&fs=1 is
     stale and will be "helpfully" restored by a future session if this is not
     written down.
   - A BUILD_NOTES.md entry recording whether #search/ survives Gmail's account
     redirect, and which LinkedIn route shipped — the ?recipient= composer or
     the profile-URL fallback.
   - A BUILD_NOTES.md entry: window.open must be synchronous in the click
     handler, and why the failure is invisible to every state check.
   Propose them; don't apply them. Still one page after.

5. RE-PROVE THE EXPORT PATH. This phase added five task CSV columns and two
   settings rows, so this is not a formality. Full export → wipe → restore on
   real data, counts pasted, and the five columns shown surviving
   character-identical — including a msgBody holding newlines and quotes.

6. RE-VERIFY A SNAPSHOT RESTORE. Tier 1 is still the sole protection.

7. Write ai/AIContext.md as a phase-boundary handoff: what exists now, what's
   deferred, what Phase 4 starts from.

8. Tell me exactly what to back up, and the filename to use.

9. NEXT PHASE — Phase 4 is Hosting, and unlike Phase 3 it does NOT need an
   intake. Its pre-flight already exists at
   ai/spec/phase-4-firebase-preflight.md. Read it and tell me whether it is
   still current, then tell me to run Prompt 3.
```

---

# Standing reminders

## Before you start each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`. Most "Done when" checks are against the live app.
- **Close every other Vantage window.** Two windows share one `localStorage` but keep separate in-memory state, and whichever saves last silently overwrites the other. Session 2B.9 is the first where it demonstrably cost verification time rather than just risking data — the console showed the boot sequence three times in one second. **Enforce it before an automated session, not after.**
- **If the conversation has Claude in Chrome**, ask it to drive `localhost:5000` and read the console itself. That removes nearly all the copy-pasting.
- **Two dialogs freeze browser automation:** `wipeAllData()` uses `prompt()` and `alert()`. Stub `window.prompt` / `window.alert` / `window.confirm` before calling anything that raises one, or the tab locks and only you can clear it.
- **The first reload after a cache bump still serves the OLD document.** The second gets the new build. Ask for a one-glance version tell with every summary.
- **There is no `device_bash` on this machine** — four consecutive sessions have run without a shell. The bridge stages and commits files but executes nothing. **Git state is UNKNOWN and no session can claim what has been committed.** Verify it yourself before a session you might want to revert.
- **`resize_window` does not work on this machine.**

## New to this phase

- **These buttons leave the app.** A session cannot verify Gmail or LinkedIn state. It verifies the URL string and decodes it back; one real open per channel is confirmed by screenshot. Do not accept "the button works" without both halves.
- **Automated sessions will open real Gmail compose windows.** Use a sandbox prospect, not a live one, for anything the agent drives — a stray Send is not recoverable.
- **The Bcc reaches email compose only.** Follow-up replies and every LinkedIn send are composers you open by hand. The task shows the address with a copy control; that is the workaround, and the real fix is a Workspace journaling rule.

## Backup points — don't skip these

| When | What |
| --- | --- |
| Before **3.1** | Manual ZIP export, stored outside the project folder |
| Before any session touching the **task record shape** | The plan flags these — take a ZIP |
| Before **3.5** | Manual ZIP **and** a proved snapshot write. Non-negotiable. ⚠️ **NOT "a confirmed green chip" — the chip is a known display defect** (it read Protected and Not protected an hour apart with nothing changed). **The real gate is `saveBackupFile`'s `wroteToFolder: true`.** |
| At **phase close** | Full ZIP, stored outside the project folder |

Backups live in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic snapshots are in its `snapshots\` subfolder. The stale sibling `..\backups\` is not in use.

## If something goes wrong

| Symptom | What it means |
| --- | --- |
| A session stops and says a **frozen contract** needs to change | Correct behaviour. It's a plan revision, not a session decision. Come back and amend the plan. |
| A session **grinds on the same error three times** | It's told to stop and report. Let it. |
| A session wants work **outside its compartment** | It's told to put it in the backlog. Let it. |
| A session proposes **sending email from Vantage**, or adding OAuth | Stop. That is Q8 and scope §13, decided not deferred. |
| A session wants to **automate a LinkedIn action** | Stop. It violates LinkedIn's user agreement and risks the account. |
| A **launch button does nothing** | Popup blocker, and almost certainly an `await` before `window.open`. Q5. |
| **LinkedIn buttons are all disabled** | The `linkedinUrl` / `linkedin` key mistake. Q4. |
| A follow-up subject reads **"Re: Re: …"** | `"Re:"` was stored instead of rendered. Q1. |
| The composer opens **unaddressed** | The undocumented `?recipient=` route has changed. The profile-URL fallback is correct — take it, and update BUILD_NOTES. |
