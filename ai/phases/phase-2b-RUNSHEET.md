# Phase 2B Run Sheet — Prospect Detail View

*Vantage — a Prospecting Relationship Manager*

> ## ⏸ BLOCKED ON PHASE 2A. Do not start this phase until 2A has closed.
>
> *Written 2026-08-30, after the Phase 2 intake.*
>
> **Step 0 is done.** Intake ran on 2026-08-30.
> `ai/spec/prospect-detail-view-scope.md` is approved and **no longer carries a
> stop banner**. When you do start, go straight to Step 1 — do not run an
> intake.
>
> **Why it waits.** The detail view is one screen tall with only its tab body
> scrolling, and its back arrow sits in 2A's header band. Phase 2A delivers
> both. Building this first would mean building it twice.
>
> **Numbered 2B, not renumbered.** Sequencing stays Phase 3, Hosting stays
> Phase 4.

> ### Source of truth
>
> The authoritative copy is **`ai/phases/phase-2b-RUNSHEET.md`** in the repo. Any
> Word or Google Doc copy is generated from it — if the two disagree, the repo
> wins, and the copy is regenerated rather than edited. A convenience copy that
> drifts is the exact failure the standing-file discipline exists to prevent.
>
> Disposable. Delete at phase close. The workflow itself lives in
> `ai/APP_BUILD_WORKFLOW.md`.

---

## The steps

| Step | What | Output |
| :---: | --- | --- |
| ~~0~~ | ~~Intake~~ | ✅ **Done 2026-08-30** — `ai/spec/prospect-detail-view-scope.md` |
| **1** | **Plan** — turn the approved scope into sessions | `ai/phases/phase-2b-prospect-detail-view.md`, plus this sheet's session list |
| **2** | **Build** — one session per conversation | The feature |
| **3** | **Close** — verify, calibrate, curate, hand off | Phase 3 starting point |

Each step is a **new conversation**. Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first. Attach nothing — every prompt reads the repo itself.

---

## What this phase builds

Two compartments:

**A. The prospect detail view** — a full-screen record view replacing the ProspectHub slide-out prospect inspector. An identity block carrying all 17 editable fields, and a tab strip below it: Interactions, Tasks, Audiences, Campaigns, Company, and a reserved Sequences slot.

**B. The ProspectHub directory rework** — sticky, purple, resizable and reorderable column headers on both directory tables, and a modern replacement for the tag chooser.

> **The riskiest thing in the phase, and it isn't the detail view.** Generalising
> the column-layout machinery refactors code that shipped on 2026-08-30. That
> session's Done-when must include a **full TaskHub regression — resize,
> reorder, persistence across a reload, and a ZIP round trip — before either
> ProspectHub table is touched.** See the scope's §7.4.

---

# Step 1 — Plan the phase

*One conversation, once Phase 2A has closed. Produces a plan, no code.*

```
Plan Phase 2B: Prospect Detail View.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md (MAP especially), ai/AIContext.md,
ai/spec/prospect-detail-view-scope.md (approved 2026-08-30 — if it carries a
stop banner, something is wrong; tell me), ai/spec/app-shell-scope.md (Phase
2A, which this builds on and which must already have shipped), and the
relevant code. Report in 3 lines what you found that changes the plan.

Note: ai/APP_SCOPE.md does not exist in this repo. Do not look for it.

Then follow PROMPT 3 in ai/APP_BUILD_WORKFLOW.md exactly — compartments,
session sizing, contract-first ordering, and the three estimates per session
(SIZE, MY TIME, CONFIDENCE).

TWO ORDERING CONSTRAINTS ARE FIXED by the scope and are not the planner's to
re-sequence:
- Session 2B.1 introduces detailProspectId (§7.1) and little else. Until it
  lands, the old inspector and the new view share one persisted cursor,
  state.selectedProspectId, which the deferred Advanced Query drawer also
  writes.
- The column-layout generalisation (§7.4) is proven against TaskHub — resize,
  reorder, persistence, ZIP round trip — BEFORE either ProspectHub table is
  touched. Sessions 1.10 and 1.11 shipped 2026-08-30; breaking them while
  building their successor is the outcome to engineer against.

PHASE 1 CALIBRATION — measured at the close, 2026-08-30. Absorb all of it;
do not re-derive it.
- Per-session SIZES were right 10 times out of 11. Do not inflate them.
- The overrun was session COUNT: 8 planned, 11 run. All three additions came
  from ONE review pass over ONE session (1.5), on the day it shipped. Carry a
  +35% session-count contingency — this phase ships a great deal of new UI.
- NEVER size a phase-close session below M. Session 1.8 was sized S, ran L,
  and consumed 45 of the phase's 88 attention minutes.
- Attention time came in UNDER (105 predicted, 88 actual). Leave that method
  alone.
- No Phase 1 session finished on one CACHE_NAME bump — v65 to v83 is 19 bumps
  across 11 sessions. Budget two per session.
- The scope's own estimate is 7-10 sessions. It supersedes the original run
  sheet's 7-9, which was written before Phase 2 split. If your plan lands far
  outside 7-10, say why rather than silently disagreeing.

CARRIED OUT OF PHASE 1 — these need a home in this plan, per the
no-workarounds standard in DECISIONS.md 2026-08-30. Do not leave them in a
backlog for a third phase:
- state.taskSettings is missing from wipeAllData()'s clear list. Two lines,
  plus a re-run of the Task Date Mode leg of the restore drill — the 1.8
  drill's dateMode MATCH could not have failed, because the value was never
  cleared.
- var(--color-danger) is undefined and has SIX live call sites: app.js 7775,
  8024, 8065, 8498 and index.html 1680, 2582, 2704. Five destructive controls
  across three hubs render without their red. One token definition repairs all
  six.

Write the plan to ai/phases/phase-2b-prospect-detail-view.md and print it.

THEN — also update ai/phases/phase-2b-RUNSHEET.md: fill in the "The sessions"
list in Step 2 with the real session numbers, titles, sizes and my-time
estimates from the plan you just wrote, and correct the session count in
Step 2's intro line. That file already exists and is otherwise complete;
change only that list and that number.

Stop after the plan and the run sheet update. Do not start Session 2B.1.
```

---

# Step 2 — Run the sessions

Phase 2B is **10** sessions as planned — forecast **13–14** once the +35% session-count contingency is applied. Those extra ones are not planned work; they are what reviewing Session 2B.6 is expected to produce, and they take numbers **2B.11 and up**. **2B.10 keeps its number and always runs last.**

For each session, four things:

| | |
| :---: | --- |
| 1 | Open a **new conversation** |
| 2 | Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` |
| 3 | Paste the block below, with the session number on the first line |
| 4 | When it finishes, it tells you the next session number |

**Only line 1 ever changes.** Attach nothing.

```
Run Session 2B.1 from ai/phases/phase-2b-prospect-detail-view.md.

BOOT — report in 5 lines or fewer:
1. ai/DIRECTIVES.md and ai/DECLARATIONS.md — what constrains this session, and
   which Hard Limits (§4) it's likely to touch
2. ai/AIContext.md — where the last session ended, open items
3. ai/BUILD_NOTES.md — MAP, plus any topic relevant here
4. The phase plan: this session and its frozen contracts
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
- LEAVE THE APP USABLE. Real outreach happens in it between sessions. No session
  ends with the old prospect inspector removed and the new view incomplete.
- Both query surfaces are DEFERRED. Do not touch renderAqInspectorDrawer(), the
  aq-insp-* ids, or the Audience Query Engine. The AQ drawer being a subsection
  behind is known and accepted — do not "fix" it.

VERIFY — run the checks in "Done when" and paste the real output. Not a summary,
not "tests pass." If you didn't run it, say you didn't run it. A passing state
check is not evidence the user can see the right thing — screenshot it.

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

*Filled in by Step 1. Tick them off as they land — the agent tells you the next one each time; this list is just so you can see the shape.*

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☐ | **2B.1** | Navigation substrate — `detailProspectId`, the origin record, the empty view panel | M | ~5 min |
| ☐ | **2B.2** | Column-layout machinery generalised, proven against TaskHub | M | ~10 min |
| ☐ | **2B.3** | Identity block — 17 fields, the single field writer, Delete, `--color-danger` ⚠️ ZIP first | L | ~12 min |
| ☐ | **2B.4** | Tab strip, Interactions tab, Tasks tab | M | ~8 min |
| ☐ | **2B.5** | Audiences, Campaigns and Company tabs | M | ~8 min |
| ☐ | **2B.6** | **Cutover** — four entry points, prospect card retired, company inspector narrowed ← **review here** | L | ~12 min |
| ☐ | **2B.7** | Email uniqueness, import skip-and-report, `taskSettings` in `wipeAllData()` ⚠️ ZIP first | M | ~8 min |
| ☐ | **2B.8** | Both ProspectHub directory tables adopt the generalised layout | M | ~10 min |
| ☐ | **2B.9** | `#prospect-tag-chooser` replaced with the Advanced Query picker | M | ~6 min |
| ☐ | **2B.10** | **Phase close** — drill, curation, declarations audit, export re-prove ⚠️ ZIP + green snapshot first | M | ~20 min |

---

# Step 3 — Close the phase

*One final new conversation.*

```
Close Phase 2B.

1. Verify the phase goal is met. Run the checks, paste real output. List
   anything incomplete or deferred.

2. ESTIMATE CALIBRATION — compare the phase plan's estimates against the actuals
   logged in the archived AIContext files. Report: predicted vs. actual session
   count, where sizes were wrong and in which direction, and my predicted vs.
   actual attention time. Then say what this implies for the remaining phases.
   Estimates that are never checked are decoration.

   Phase 1 ran 11 sessions against a planned 8. Say whether 2A and 2B repeated
   that pattern, and what it means for Phases 3 and 4.

3. Curate ai/BUILD_NOTES.md — it's read every session, so it stays lean. Merge
   duplicates, delete what's no longer true, delete what turned out not to
   matter, regroup under clean topics, refresh MAP against the real file tree.
   Report what you cut.

4. Audit ai/DECLARATIONS.md. Amendments already owed are named in
   ai/spec/prospect-detail-view-scope.md §9 — the seventh view panel that is
   not a hub, the two DECISIONS entries (Advanced Query deferred not reversed;
   email is unique not the key), and two BUILD_NOTES entries. Propose them;
   don't apply them. Still one page after.

5. RE-PROVE THE EXPORT PATH. DECISIONS.md 2026-08-30 made the ZIP/CSV bundle
   the most protected thing in the app — the bridge to whatever gets built
   next. Run a full export → wipe → restore drill on real data and paste the
   counts, even though this phase added no columns.

6. Write ai/AIContext.md as a phase-boundary handoff: what exists now, what's
   deferred, what the next phase starts from. Include the two deferred query
   surfaces and where their analysis lives.

7. Tell me exactly what to back up, and the filename to use.

8. NEXT PHASE — Phase 3 is Sequencing, and its scope is SUPERSEDED
   (claude/sequence-feature-scope.md in the Claude project, which carries a
   supersession banner). It needs re-scoping from scratch, not a Prompt 3.
   Do not tell me to run Prompt 3 next. Tell me to run intake first, the same
   way Phase 2 did.
```

---

# Standing reminders

## Before you start each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`. Most "Done when" checks are against the live app.
- **Close every other Vantage window.** Two windows share one `localStorage` but keep separate in-memory state, and whichever saves last silently overwrites the other. Found the hard way in Session 1.8 — it cost 55 tasks and a confusing half-hour. Also true of the installed PWA.
- **If the conversation has Claude in Chrome**, ask it to drive `localhost:5000` and read the console itself. That removes nearly all the copy-pasting.
- **Two dialogs freeze browser automation:** `wipeAllData()` uses `prompt()` and `alert()`. An agent driving Chrome must stub `window.prompt` / `window.alert` / `window.confirm` before calling anything that raises one, or the tab locks up and only you can clear it.
- **The first reload after a cache bump still serves the OLD document.** The second reload gets the new build. Ask for a one-glance version tell with every summary.

## Backup points — don't skip these

| When | What |
| --- | --- |
| Before **2B.1** | Manual ZIP export, stored outside the project folder |
| Before any session touching the **prospect record shape** | The plan flags these — take a ZIP |
| At **phase close** | Full ZIP, stored outside the project folder |

Backups live in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic snapshots are in its `snapshots\` subfolder.

## If something goes wrong

| Symptom | What it means |
| --- | --- |
| A session stops and says a **frozen contract** needs to change | Correct behaviour. It's a plan revision, not a session decision. Come back and amend the plan. |
| A session **grinds on the same error three times** | It's told to stop and report. Let it. |
| A session wants work **outside its compartment** | It's told to put it in the backlog. Let it. |
| A session says the scope **still carries a stop banner** | Something has overwritten it — intake ran on 2026-08-30. Stop and tell me. |
| TaskHub's **column drag breaks** | The §7.4 generalisation. Stop — that regression gate exists precisely for this. |
| A **click does nothing** after a drag | The one-shot suppress flag. It must be cleared at the start of the next mousedown, or it eats the *next* genuine click instead. |
