# Phase 2 Run Sheet — Prospect Detail View

Disposable convenience file. Delete it at phase close.
The workflow itself lives in `ai/APP_BUILD_WORKFLOW.md`; this is just a copy-paste sheet so you don't have to go find the right prompt each time.

**Written 2026-08-30 during Session 1.8, before Phase 2 was planned.** Step 2's session list is deliberately empty — it gets filled by the planning session in Step 1, because nobody knows the sessions until the plan exists.

---

## ⚠️ Read this first — Phase 2 has FOUR steps, not three

Phase 1 went: plan → sessions → close. **Phase 2 has an extra step in front**, and the Phase 1 close will not tell you about it.

`ai/spec/prospect-detail-view-scope.md` carries a stop banner dated 2026-08-29: the document captures approved *direction*, not a scoped feature. It was written from documentation rather than from `app.js`, and its §5 still lists work that must happen before planning is safe.

Prompt 5's closing line is scripted and will say *"take your backup, then Prompt 3 to plan Phase 2."* **Ignore that for this phase.** The correct order is:

| Step | What | Prompt | Output |
| --- | --- | --- | --- |
| **0** | **Intake** — interrogate the scope against the real code | below | a revised, approved scope |
| **1** | **Plan** — turn the approved scope into sessions | below | `ai/phases/phase-2-prospect-detail-view.md` + this sheet's session list |
| **2** | **Build** — one session per conversation | below | the feature |
| **3** | **Close** — verify, calibrate, curate, hand off | below | Phase 3 starting point |

Each step is a **new conversation**. Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first. Attach nothing — every prompt reads the repo itself.

---

## STEP 0 — Intake

One conversation. Produces an approved scope, no code.

**Why not the full Prompt 1:** Prompt 1's Steps 0–2 are for a *new* project — they ask for the folder, calibrate the `[BRACKETS]` in DIRECTIVES §0, and triage a brain-dump into standing files. None of that applies. DIRECTIVES §0 was closed out on 2026-08-28 and Vantage is established. What Phase 2 actually needs is Prompt 1's **Step 3 interrogation**, run against real code. Prompt 3 already sanctions this shape — *"first run a fast version of Prompt 1's interrogation on it — same seven categories, but report only what qualifies as MUST RESOLVE."*

```
Spec intake for Phase 2 — Prospect Detail View.

You are a senior architect doing intake. You are NOT writing a plan and NOT
writing code in this conversation. Output is analysis only.

THE SOURCE: ai/spec/prospect-detail-view-scope.md — read it in full, including
both banners at the top. It is approved DIRECTION, not a scoped feature.

DO NOT run Prompt 1 Steps 0-2. This is an established project: the folder is
connected, DIRECTIVES §0 was closed out 2026-08-28, and there is nothing to
triage into standing files. Start at the interrogation.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md (MAP especially), ai/AIContext.md, and
ai/spec/phase-4-firebase-preflight.md. Note that ai/APP_SCOPE.md does not
exist in this repo — do not go looking for it.

Then READ THE ACTUAL CODE, which is the thing §5 says was never done:
- the Prospect Hub slide-out inspector (renderInspector and everything it calls)
- renderAqInspectorDrawer and its aq-insp-p-* duplication
- openProspectModal and every call site
- the six existing view panels, so the detail view is built the same way
Report in 3 lines what you found in the code that changes the scope.

SETTLE §5's remaining items. They are the reason this intake exists:
1. The detail view's data contract.
2. The tab component's contract.
3. What the AQ preview is allowed to render.

INTERROGATE — Prompt 1's seven categories, but report ONLY what qualifies as
MUST RESOLVE. Quote the source or the code for each. Category A is the
priority: anything expensive to reverse — data migration, an identifier
embedded everywhere, a change to how records are identified.

Carry these in from Phase 1, they are settled and must not be re-litigated:
- Full-screen view, NOT a hoisted/movable/resizable panel. Michael decided
  this 2026-08-29; the panel gets no further investment.
- Reachable from three hubs: Prospect Hub, TaskHub, Campaign Hub (a prospect
  inside an audience list). NOT Media Hub.
- It stops at the sidebar. Build it as a view panel inside #main-canvas like
  the six existing hubs. Do NOT use position:fixed;inset:0 and do NOT compute
  a left offset — #app-layout is a grid and already does this, animated.
- Back arrow restores the ORIGIN, not just the origin view: {view, taskId}
  stamped on open, replayed on back. Opened from a task editor, back reopens
  that editor.
- Unsaved edits save before navigating; if saveTaskFromEditor() validation
  fails, do NOT navigate.
- The Sequences tab is a RESERVED SLOT, not built. Phase 3 fills it.
- The interim Phase 1 Tasks subsection migrates into a tab. That rework was
  costed and accepted in DECISIONS 2026-08-28.

QUESTIONS: one batch, max 7, only what changes the shape of the phase.
Nothing determinable from the files or the code. Anything reversible —
decide it, log it as an assumption.

OUTPUT: a revised ai/spec/prospect-detail-view-scope.md with the stop banner
removed and replaced by a dated "ready for Prompt 3" note. Show me the diff
before writing. Stop after that — do not plan the phase in this conversation.
```

---

## STEP 1 — Plan the phase

New conversation, once the revised scope is approved.

```
Plan Phase 2: Prospect Detail View.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md (MAP especially), ai/AIContext.md,
ai/spec/prospect-detail-view-scope.md (the REVISED one — it must no longer
carry the stop banner; if it does, stop and tell me: intake has not run),
and the relevant code. Report in 3 lines what you found that changes the plan.

Note: ai/APP_SCOPE.md does not exist in this repo. Do not look for it.

Then follow PROMPT 3 in ai/APP_BUILD_WORKFLOW.md exactly — compartments,
session sizing, contract-first ordering, and the three estimates per session
(SIZE, MY TIME, CONFIDENCE).

Two things Phase 1 learned that this plan should absorb:
- Phase 1 was planned as 8 sessions and ran as 11. Three were added mid-phase
  from a review pass. Budget for that shape rather than assuming it away.
- No Phase 1 session finished on one CACHE_NAME bump. The review pass is a
  bump trigger like any other. Do not plan as though it isn't.

Write the plan to ai/phases/phase-2-prospect-detail-view.md and print it.

THEN — also update ai/phases/phase-2-RUNSHEET.md: fill in the "The sessions"
list in Step 2 with the real session numbers, titles, sizes and my-time
estimates from the plan you just wrote, and correct the session count in
Step 2's intro line. That file already exists and is otherwise complete;
change only that list and that number.

Stop after the plan and the run sheet update. Do not start Session 2.1.
```

---

## STEP 2 — Run the sessions

Phase 2 is **`<count>` sessions** — *filled in by Step 1.*

For each session, four things:

1. Open a **new conversation**
2. Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app`
3. Paste the block below, with the session number on the first line
4. When it finishes, it tells you the next session number

**Only line 1 ever changes.** Attach nothing.

```
Run Session 2.1 from ai/phases/phase-2-prospect-detail-view.md.

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

VERIFY — run the checks in "Done when" and paste the real output. Not a summary,
not "tests pass." If you didn't run it, say you didn't run it.

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

For every session after the first, change **only** the first line:

```
Run Session 2.2 from ai/phases/phase-2-prospect-detail-view.md.
```

### The sessions

*Filled in by Step 1. Tick them off as they land — the agent tells you the next one each time; this list is just so you can see the shape.*

- [ ] **2.1** — …
- [ ] **2.2** — …

---

## STEP 3 — Close the phase

One final new conversation.

```
Close Phase 2.

1. Verify the phase goal is met. Run the checks, paste real output. List
   anything incomplete or deferred.

2. ESTIMATE CALIBRATION — compare the phase plan's estimates against the actuals
   logged in the archived AIContext files. Report: predicted vs. actual session
   count, where sizes were wrong and in which direction, and my predicted vs.
   actual attention time. Then say what this implies for the remaining phases —
   if we ran 40% long here, say so and re-estimate what's left. Estimates that
   are never checked are decoration.

   Phase 1 ran 11 sessions against a planned 8. Say whether Phase 2 repeated
   that pattern or not, and what it means for Phases 3 and 4.

3. Curate ai/BUILD_NOTES.md — it's read every session, so it stays lean. Merge
   duplicates, delete what's no longer true, delete what turned out not to
   matter, regroup under clean topics, refresh MAP against the real file tree.
   Report what you cut.

4. Audit ai/DECLARATIONS.md against what we actually built. Where we've drifted,
   or made a decision that belongs there, propose the amendment — don't apply
   it. Add anything significant to ai/DECISIONS.md with its reasoning. Still one
   page after.

5. Write ai/AIContext.md as a phase-boundary handoff: what exists now, what's
   deferred, what the next phase starts from.

6. Tell me exactly what to back up, and the filename to use.

7. NEXT PHASE — Phase 3 is Sequencing, and its scope is SUPERSEDED
   (claude/sequence-feature-scope.md in the Claude project, which carries a
   supersession banner). It needs re-scoping from scratch, not a Prompt 3.
   Do not tell me to run Prompt 3 next. Tell me to run intake first, the same
   way Phase 2 did.
```

---

## Before you start each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`. Most "Done when" checks are console output against the live app.
- **Close every other Vantage window.** Two open windows share one `localStorage` but keep separate in-memory state, and whichever saves last silently overwrites the other. Found the hard way in Session 1.8 — it cost 55 tasks and a confusing half-hour. Also true of the installed PWA.
- **If the conversation has Claude in Chrome, ask it to drive `localhost:5000`** and read the console itself. That removes nearly all the copy-pasting.
- **Two dialogs freeze browser automation:** `wipeAllData()` uses `prompt()` and `alert()`. An agent driving Chrome must stub `window.prompt` / `window.alert` / `window.confirm` before calling anything that raises one, or the tab locks up and only you can clear it.

## Backup points — don't skip these

- **Before 2.1** — manual ZIP export, stored outside the project folder.
- **Before any session that touches the prospect record shape** — the plan flags these; take a ZIP.
- **At phase close** — full ZIP, stored outside the project folder.

Backups live in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic snapshots are in its `snapshots\` subfolder.

## If something goes wrong

- A session stops and says a **frozen contract** needs to change → that's correct behavior. It's a plan revision, not a session decision. Come back and we amend the plan.
- A session **grinds on the same error three times** → it's told to stop and report. Let it.
- A session wants to do work **outside its compartment** → it's told to put it in the backlog. Let it.
- A session says the **scope still carries the stop banner** → intake hasn't run. Go back to Step 0.
