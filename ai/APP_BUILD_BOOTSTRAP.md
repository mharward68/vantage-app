# App Build Bootstrap — a portable version of the Vantage process

Paste **Prompt A** into a new claude.ai Project with your scope in it. It produces the standing documents, the first phase plan, and the single session prompt you then repeat until the app is built.

Generalised from the Vantage build, 2026-08-30.

---

## How the memory works — read this first, it's the part that breaks

Claude has no memory between conversations. The continuity in this process comes from **documents you keep, not from Claude remembering.** Every session starts by reading them and ends by rewriting them.

**In claude.ai:** create a **Project**. Its knowledge is the memory. Claude writes each standing document as an artifact; **you save it into Project knowledge.** That copy step is manual and it is the single most likely thing to be skipped — skip it and the next session starts blind while sounding perfectly confident.

**In Claude Code or Cowork with a connected folder:** the same documents live in an `ai/` folder in the repo and Claude reads and writes them directly. No copy step. If your project is a repo, prefer this — it removes the only manual link in the chain.

Either way the documents are the same six:

| File | What it is | Who edits it |
| --- | --- | --- |
| `DIRECTIVES.md` | **How to decide.** Gates, tiebreakers, hard limits. | You, deliberately |
| `DECLARATIONS.md` | **What was decided.** Stack, conventions, environment. One page. | Amended at phase close |
| `DECISIONS.md` | **Why**, and what was rejected. Dated log, append-only. | Grows every phase |
| `BUILD_NOTES.md` | **What was discovered.** Gotchas a future session would waste time rediscovering. | Every session |
| `CONTEXT.md` | **Where things stand right now.** One page. Rewritten every session. | Every session |
| `phase-N-plan.md` | Sessions, frozen contracts, done-criteria. | Per phase |

`DECLARATIONS.md` is the standard of truth. If a document disagrees with it, it wins. If it disagrees with the code, the code wins and the document gets corrected.

---

## The shape of the process

```
PROMPT A  (once)          → interrogate scope, calibrate directives, write the standing docs
PROMPT B  (once a phase)  → turn approved scope into numbered sessions
PROMPT C  (repeated)      ← THIS IS THE ONE YOU PASTE OVER AND OVER
PROMPT D  (end of phase)  → verify, calibrate estimates, curate, hand off
```

**One session = one new conversation.** Never two. This is the rule that dominates cost and quality, and it is the one people break first.

---

## PROMPT A — Bootstrap

Paste once, into a new Project, with your scope where marked. It will stop twice for your approval.

```
You are a senior architect doing intake on a product idea. In this
conversation you write NO code and NO implementation plan. Output is
analysis and standing documents only.

THE SCOPE:

<<< PASTE YOUR SCOPE HERE — plain English is fine and preferred. A
    brain-dump, bullets, a pasted doc. No template required. >>>

Work through the four steps below IN ORDER, stopping where told.

────────────────────────────────────────────────────────────
STEP 1 — CALIBRATE THE DIRECTIVES.  Stop for my approval.

Propose a value for each parameter below, one line of reasoning each.
Flag any you are guessing at rather than inferring from the scope.

  SCALE HORIZON      How many users, realistically, and by when? Every
                     reversibility judgement hangs off this. Too high and
                     we over-build at zero users; too low and we design a
                     ceiling into the data model.
  DATA SENSITIVITY   The worst thing that will end up in this database.
                     Be specific. This sets what data protection costs and
                     where the privacy line falls.
  UX TIER            Rough / Functional / Polished / Premium.
  ACCESSIBILITY      A conformance target, or `none`. If `none`, say so
                     plainly so I can object.
  PLATFORMS          Web / mobile web / native / desktop.
  TELEMETRY          A tool, or an explicit deferral with a trigger for
                     when it activates.
  RECOVERY           Backup and restore: what, where, how often, and the
                     retention rule.
  COMPLIANCE         Any real obligation the data implies — GDPR, HIPAA,
                     CAN-SPAM, PCI. "None" is an answer; guessing is not.

Argue SCALE HORIZON and DATA SENSITIVITY explicitly. The rest can be brief.

Name any gate that goes inert because a parameter is `none`, so I can
object before it disappears.

STOP. Wait for my approval. Everything downstream inherits these.

────────────────────────────────────────────────────────────
STEP 2 — INTERROGATE THE SCOPE.  Stop for my answers.

Find what must be settled before planning is safe. Quote the scope for
each. Sort into:

  MUST RESOLVE   expensive or impossible to reverse later
  SHOULD RESOLVE cheaper now than later, but survivable
  ASSUMED        you decided it yourself; state the decision and move on

A decision is MUST RESOLVE if undoing it would require migrating existing
data, touching every record, changing how users are identified, or
breaking a public contract. Everything else is cheaper to decide badly
and fix than to debate now.

Ask me only what you cannot determine from the scope. ONE batch, maximum
seven questions. Anything reversible: decide it, log it under ASSUMED.

STOP. Wait for my answers.

────────────────────────────────────────────────────────────
STEP 3 — WRITE THE STANDING DOCUMENTS.

Produce each as a separate artifact I can save into Project knowledge.
Tell me explicitly, at the end, to save all of them — that copy step is
the memory, and if I skip it the next session starts blind.

DIRECTIVES.md — how to decide. Four sections:

  §0 PARAMETERS   the table from Step 1.
  §1 GATES        binary, non-negotiable, all must hold. Derive them from
                  MY parameters, not from a generic list. Each gate says
                  what it costs today and when it becomes load-bearing.
                  A gate that is inert today says so, and says what
                  activates it.
  §2 LADDER       ranked tiebreakers for when all gates hold and it is
                  close. Default order — Stability, then UX quality, then
                  Simplicity, then Efficiency — unless my scope argues
                  otherwise. A rung never overrides a gate.
  §3 HARD LIMITS  stop and ask. EVERY ONE NEEDS AN OBSERVABLE TRIGGER —
                  a condition a session can notice firing, not a
                  disposition. "Be careful with migrations" is not a hard
                  limit. "Any change that alters or deletes existing data
                  → stop, present the rollback plan, wait" is.
                  Always include: destructive data changes, new
                  dependencies or frameworks, secrets, auth changes,
                  changing a frozen contract, and any cache-busting step
                  my stack needs.
  §4 PROCEDURE    gates eliminate first; then the ladder decides at the
                  first rung where options genuinely differ; still tied,
                  take the simplest and log it as an assumption.

DECLARATIONS.md — what was decided. ONE PAGE, and keep it one page.
Stack, conventions, environment, and a "Done means" checklist that every
session must satisfy. Include these five in Done means:

  - The app runs, with a clean console or clean test run.
  - Existing behaviour still works, and state survives a restart.
  - Any new or changed store of user data is stated as covered or not
    covered by backup/restore.
  - Verification is pasted real output. Never a claim, never a summary.
  - The app is left usable, not merely building.

DECISIONS.md — dated log. One entry per real decision: what was chosen,
why, and what was rejected with the reason. Seed it with everything
settled in Steps 1 and 2. Append-only; never rewrite history here.

BUILD_NOTES.md — durable findings. Start with a MAP section: where things
live, so a session can find a region of the codebase without scrolling.
Empty of findings at first. It fills as we build.

CONTEXT.md — the handoff. Write the first one saying: nothing built yet,
here is the scope, here is the next step.

────────────────────────────────────────────────────────────
STEP 4 — PROPOSE THE PHASE ORDER.

A numbered list of phases, one line each. Each phase must deliver
something usable on its own — not a layer, a capability. Say which phase
carries the highest risk and why.

Do NOT plan any phase in detail. That is Prompt B, in its own
conversation.

End by telling me: "Save all documents to Project knowledge, then start a
NEW conversation and run Prompt B for Phase 1."
```

---

## PROMPT B — Plan a phase

Once per phase. New conversation.

```
Plan Phase <N>: <name>.

READ FIRST from Project knowledge: DIRECTIVES.md, DECLARATIONS.md,
DECISIONS.md, BUILD_NOTES.md (the MAP especially), CONTEXT.md, and the
scope. If this project has code already, read the code the phase touches
— not the documentation about it. Report in three lines what you found
that changes the plan.

QUESTIONS: only what changes the plan's structure. One batch, max seven.
Nothing determinable from the documents or the code. Anything reversible,
decide it and log it under Assumptions.

COMPARTMENTS — every session gets ONE:
  DATA schema, migrations, queries      API endpoints, integrations
  AUTH identity, sessions, permissions  LOGIC business rules, validation
  STATE client state, data flow         UI  components, layout, styling
  INFRA build, env, deploy              QA  tests, error handling

A session spanning two compartments is usually two sessions. Two is
allowed when splitting makes the work meaningless — justify it in one
sentence. Three or more: split.

CONTRACT-FIRST — the phase's FIRST session defines and FREEZES the
interfaces: types, schemas, signatures, event names, record shapes. It
does nothing else. Write them LITERALLY, as code, not as description.
Later sessions build against them independently. Changing a frozen
contract afterwards is a plan revision that stops the session and comes
back to me — never a silent edit.

SESSION SIZING — the largest chunk that can be completed and objectively
verified without asking me anything mid-run. Not the smallest; sessions
carry a fixed startup cost. If a session needs my input partway through,
it is mis-scoped: move that input to its Inputs list, or split there.

Write the plan with, for each session:
  - Compartment · Depends on · Goal
  - Size S/M/L · My time ~N min · Confidence High/Low
  - Files created and modified
  - Tasks, as an ordered checklist
  - Inputs needed from me — gathered BEFORE the session, never mid-run.
    "None" wherever possible.
  - DONE WHEN — objectively checkable, with the exact command to run
  - Needs my eyes — only what cannot be verified programmatically
  - Risk and fallback

Then: total session count, the S/M/L mix, my total attention time, and
which session is most likely to overrun. Flag every L session and say
whether it should be split. A Low-confidence L is the most dangerous item
in any plan — call it out and propose a spike session to convert it to
High before building.

Finally, list the backup points: always the phase close, plus any session
that touches existing data.

Produce the plan as an artifact. Tell me to save it to Project knowledge,
then start a NEW conversation and run the session prompt for Session <N>.1.
```

---

## PROMPT C — The session prompt

**This is the one you repeat.** New conversation each time. Change only the number on line 1.

```
Run Session <N.n> from the phase plan.

BOOT — report in 5 lines or fewer:
1. DIRECTIVES — what constrains this session, and which Hard Limits it is
   likely to touch
2. CONTEXT — where the last session ended, and open items
3. BUILD_NOTES — the MAP, plus any topic relevant here
4. The phase plan — this session, and its frozen contracts
5. Confirm compartment, goal, done-criteria, and inputs needed from me

Treat the documents as evidence, not scripture. If one contradicts the
code, the CODE WINS — say so and correct the document. Claims copied
forward across sessions go stale silently; a one-command check beats
trusting a sentence.

Ask only what genuinely blocks you, all at once, before starting.
Anything reversible: pick the simplest option, log it, keep moving. Do
not stop mid-run for something optional.

EXECUTE
- Stay in this session's compartment. Work found elsewhere goes to the
  backlog — record it, do not do it.
- Do not modify a frozen contract. If it must change, STOP and tell me.
- Hard Limits are absolute. Each has an observable trigger; when one
  fires, stop and ask. "I considered it" is not compliance.
- Close calls: gates eliminate, then the ladder decides at the first rung
  where the options actually differ.
- THREE STRIKES — three failed attempts at the same error: stop, report
  what you tried and what you think is actually wrong. Do not grind.

VERIFY — run the checks in "Done when" and paste the REAL OUTPUT. Not a
summary, not "tests pass." If you did not run it, say you did not run it.
A check that passes is not evidence if the check itself might be broken —
if a verification returns nothing, prove the verification works before
calling it clean.

END OF SESSION — every step, in order:
1. ARCHIVE the current CONTEXT.md under a dated name. Confirm it moved.
2. NEW CONTEXT.md — ONE PAGE. Timestamp, session run, what was done,
   files changed, assumptions made, open items, exact next step.
3. ESTIMATE ACTUALS — one line in CONTEXT.md: estimated size vs. what it
   actually was, and roughly how much of my time it really took.
4. BUILD_NOTES — append only what a FUTURE session would waste time
   rediscovering. Durable findings, not a session log. Update the MAP if
   files moved or were added. Nothing qualifies? Write nothing and say so.
5. BACKUP COVERAGE — state whether this session created or changed any
   store of user data, and whether it is covered by backup/restore.
6. SUMMARY in chat — short. What got done, what I should know, what needs
   my eyes.
7. ASK — continue or stop? If continue, tell me the next session number.
   Do NOT run the next session in this conversation.

Give me every changed document as an artifact and remind me to save them
to Project knowledge.
```

---

## PROMPT D — Close a phase

New conversation, once per phase.

```
Close Phase <N>.

1. Verify the phase goal is met. Run the checks, paste real output. List
   anything incomplete or deferred.

2. ESTIMATE CALIBRATION. Compare the plan's estimates against the actuals
   in the archived CONTEXT files. Report predicted vs. actual session
   count, where sizes were wrong and in which direction, and my predicted
   vs. actual attention time. Then say what it implies for the remaining
   phases — if we ran 40% long, say so and re-estimate what is left.
   Estimates that are never checked are decoration.

3. CURATE BUILD_NOTES. It is read every session, so it stays lean. Merge
   duplicates, delete what is no longer true, delete what turned out not
   to matter, regroup under clean topics, refresh the MAP against the
   real file tree. Report what you cut.

4. DRIFT AUDIT. Read DECLARATIONS line by line against what we actually
   built, and against the code — not against your memory of it. Every
   line that is now factually wrong gets corrected. VERIFY EACH CLAIM
   RATHER THAN TRUSTING IT: a statement that something "does not exist"
   or "is not done" is disprovable in one command, and if it is wrong the
   next session discards the whole document. Record the corrections in an
   Amendments section. Add anything significant to DECISIONS.md with its
   reasoning. Still one page after.

5. Write CONTEXT.md as a phase-boundary handoff: what exists now, what is
   deferred, what the next phase starts from.

6. Tell me exactly what to back up.

7. Tell me what the next phase actually needs — and if its scope is stale,
   superseded, or was written from documentation rather than from code,
   say that it needs an intake pass BEFORE planning. Do not default to
   "run Prompt B next" if that is not true.
```

---

## What to expect, and where it goes wrong

**Saving to Project knowledge is the weak link.** Every artifact Claude produces has to be saved by you or it does not exist next session. If a session boots and its summary of where things stand feels wrong, that is almost always the cause.

**Plans run long. Budget for it.** The Vantage build planned eight sessions and ran eleven — three were added mid-phase from a review pass. That is normal, not a planning failure. What matters is that Prompt D measures it, so the next phase estimates from evidence.

**The review pass is part of the work.** No Vantage session finished without a follow-up fix found by a human actually using the thing. Plan for a second pass on every session rather than treating it as a defect.

**Documents go stale and sound confident while doing it.** Two separate claims in the Vantage standing files were false by the time they were read — one said a function did not exist when it did, another said work was uncommitted when it was already pushed. Both had been copied forward across sessions unchecked. That is why Prompt C says the code wins, and why Prompt D's drift audit says verify rather than trust.

**Scripted closing lines mislead.** A prompt that ends "next, run X" will say that even when X is wrong for your situation. Prompt D step 7 exists solely because that happened.

**One session, one conversation.** The rule looks bureaucratic and is the main thing keeping quality and cost sane.
