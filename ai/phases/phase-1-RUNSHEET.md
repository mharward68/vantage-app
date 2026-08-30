# Phase 1 Run Sheet — TaskHub

Disposable convenience file. Delete it at phase close.
The workflow itself lives in `ai/APP_BUILD_WORKFLOW.md`; this is just a copy-paste sheet so you don't have to find Prompt 4 eight times.

---

## How this works

Phase 1 is **8 sessions**. Each session is **one new conversation**.

For each one you do exactly four things:

1. Open a **new conversation**
2. Connect the folder `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app`
3. Paste the block below, with the session number on the first line
4. When it finishes, it tells you the next session number

**Only line 1 of the block ever changes.** Everything under it is identical every time.

You don't attach any documents. The agent reads `ai/phases/phase-1-taskhub.md`, `ai/spec/taskhub-scope.md` and the standing files itself.

---

## Paste this — ready to go for Session 1.1

```
Run Session 1.1 from ai/phases/phase-1-taskhub.md.

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
Run Session 1.2 from ai/phases/phase-1-taskhub.md.
```

---

## The eight sessions

Tick them off as they land. The agent tells you the next one each time — this list is just so you can see the shape.

- [ ] **1.1** — Snapshot writer, health state, and restore · L · ~15 min of your time
- [ ] **1.2** — Snapshot retention and binary mirror · M · ~5 min
- [ ] **1.3** — Task data model, defaults migration, backup and restore · M · ~10 min
- [ ] **1.4** — Prospect Hub inspector: subsections and the task editor · M · ~10 min
- [ ] **1.5** — TaskHub view: nav, color, filters, sortable table, pagination · L · ~10 min
- [ ] **1.6** — Selection, bulk complete, and history logging · M · ~5 min
- [ ] **1.7** — Bulk due-date editor, business-day arithmetic, global setting · M · ~5 min
- [ ] **1.8** — Realistic restore drill, BUILD_NOTES curation, phase close · S · ~10 min

Then, in one final new conversation, paste this whole block (Prompt 5):

```
Close Phase 1.

1. Verify the phase goal is met. Run the checks, paste real output. List
   anything incomplete or deferred.

2. ESTIMATE CALIBRATION — compare the phase plan's estimates against the actuals
   logged in the archived AIContext files. Report: predicted vs. actual session
   count, where sizes were wrong and in which direction, and my predicted vs.
   actual attention time. Then say what this implies for the remaining phases —
   if we ran 40% long here, say so and re-estimate what's left. Estimates that
   are never checked are decoration.

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

6. Tell me exactly what to back up, and the filename to use. Then:
   "Next: take your backup, then Prompt 3 to plan Phase 2."
```

Same rules as Prompt 4: new conversation, connect the folder, paste the whole block, attach nothing.

---

## Before you start each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`. Most "Done when" checks are console output against the live app.
- **Expect to run some checks yourself.** The agent writes the code; you may need to paste console output back. If the conversation has Claude in Chrome available, ask it to drive `localhost:5000` and read the console itself — that removes most of the copying.

## Backup points — don't skip these

- **Before 1.1** — manual ZIP export. ✅ *done 2026-08-29*
- **Before 1.3** — confirm an automatic snapshot exists and the health chip is green. First session to add new persisted state.
- **Before 1.8** — manual ZIP **and** a confirmed snapshot. 1.8 runs `wipeAllData()` against your real data. Non-negotiable.
- **At phase close** — full ZIP, stored outside the project folder.

## If something goes wrong

- A session stops and says a **frozen contract** needs to change → that's correct behavior. It's a plan revision, not a session decision. Come back and we amend the plan.
- A session **grinds on the same error three times** → it's told to stop and report. Let it.
- A session wants to do work **outside its compartment** → it's told to put it in the backlog. Let it.
