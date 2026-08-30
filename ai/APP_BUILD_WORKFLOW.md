<!-- Canonical copy. Added to the repo 2026-08-28 so sessions no longer depend on
     this document being attached by hand. Content unmodified apart from collapsing the
     doubled blank lines left by the original Google Docs export. -->

﻿App Build Workflow — Prompt Pack v3
Write your idea in plain English. Hand it over. Answer a short list of hard questions. Get a plan, an effort estimate, and a kickoff checklist. Then run sessions.

Six prompts, nine files, five rules. Portable — works anywhere the AI can read and write your project files.

Every prompt ends by telling you which prompt comes next. You never have to remember where you are.

________________

The Five Rules
Why the workflow is shaped this way. If you change nothing else, keep these.

1. One session = one fresh conversation. Cost per turn rises with everything already in the conversation. A long session gets more expensive per unit of work as it goes. AIContext.md is the handoff that makes ending one cheap.

2. A session is the largest chunk that can be finished and verified without asking you anything. Not the smallest. Every session pays a startup cost re-reading the standing files. Thin slices pay it repeatedly.

3. Done means evidence, not a claim. Machine-checkable criteria, and the agent pastes real command output. An agent asked to confirm its own work will confirm it without running anything.

4. Three strikes, then stop. Three failed attempts at the same error — stop and report. Runaway debug loops are the largest single source of wasted credits.

5. Standing files stay short. They're re-read every session, so their length is a tax you pay forever. DIRECTIVES.md ≤ 1 page. DECLARATIONS.md ≤ 1 page. AIContext.md ≤ 1 page. BUILD_NOTES.md topic-organized, curated every phase.

________________

The Files
They live inside the project folder, alongside the code, in an ai/ subfolder — so they're version-controlled with the code they describe, they travel when the repo is cloned, and any backup of the project captures them automatically.

your-project/

├── CLAUDE.md                 Short pointer at root. Claude Code reads this automatically.

├── ai/

│   ├── DIRECTIVES.md         HOW to decide. Gates, ladder, hard limits. Universal, calibrated per project.

│   ├── APP_SCOPE.md          WHAT the app is. One page. Distilled from your spec.

│   ├── DECLARATIONS.md       WHAT was decided. Standard of truth. One page.

│   ├── DECISIONS.md          WHY each declaration was made, and what was rejected.

│   ├── BUILD_NOTES.md        Durable findings. Organized by topic.

│   ├── AIContext.md          Handoff from the last session.

│   ├── spec/                 Your original plain-English doc. Archived, not read during builds.

│   ├── phases/               phase-N-<slug>.md — sessions, contracts, estimates, order.

│   └── archive/              Retired AIContext files, date-stamped.

├── src/  (your code)

└── .gitignore

../backups/                   OUTSIDE the project folder. See below.

CLAUDE.md at root is a five-line pointer, not a copy:

Before any build work, read ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/AIContext.md, and ai/BUILD_NOTES.md. Hard limits in DIRECTIVES §4 are absolute.

That way even an off-script conversation starts oriented, and you don't maintain the same content in two places.

Backups go outside the project folder. If backups/ sits inside the folder you zip, every backup contains all previous backups and they grow on themselves. Put them in a sibling folder, or keep them inside and add backups/ to .gitignore and exclude it from the zip. The sibling folder is harder to get wrong.

Four files that sound similar and aren't:

* DIRECTIVES — how to decide, before you know what you're deciding. Gates, ladder, hard limits. Written once, reused across projects, calibrated at intake. "Reject anything that forecloses the scale horizon."
* DECLARATIONS — decisions you made. "Postgres, snake_case, no ORM." Read every session. One line each.
* DECISIONS — why, and what was rejected. "Postgres over Firestore because reporting needs relational queries; rejected Firestore despite easier auth." Read only when a decision is questioned. Keeps DECLARATIONS short while preserving the reasoning, so settled arguments stay settled.
* BUILD_NOTES — what you discovered. "Netlify Functions strip custom headers on redirect." Appended as found.

(Paths below are written as ai/FILE.md. If you keep them at the project root instead, drop the ai/ prefix everywhere — nothing else changes.)

________________

PROMPT 1 — Spec Intake
Drop in your idea. Any format: a Google Doc, a pasted brain-dump, a markdown file, bullet notes. Plain English is fine and preferred — no template required.

This prompt does not build anything and does not write a plan. It reads your idea, compresses it, and finds everything that must be settled before planning is safe.

First project only: ai/DIRECTIVES.md doesn't exist yet. Attach DIRECTIVES_TEMPLATE.md and add: "Use the attached template as the skeleton — it hasn't been instantiated for this project yet." Every project after this, you copy your filled ai/DIRECTIVES.md in and the prompt works as written.

You are a senior architect doing intake on a product idea. You are NOT writing

a plan or any code in this conversation. Output is analysis only.

THE IDEA:

<<< PASTE, ATTACH, OR LINK YOUR DOC HERE >>>

STEP 0 — LOCATION

Before anything else, ask me for the project folder — the full path to where

this project lives or will live. Then:

- Confirm you can read and write there. If you can't, say so now and tell me

  what to fix. Everything downstream assumes file access.

- Report whether it's empty (new project) or has existing code (established).

- Check for an existing ai/ folder. If the standing files are already there,

  read them and tell me what you found — we may be amending rather than

  starting fresh.

- If it's a new project, confirm the layout you'll create: ai/ for the standing

  files, CLAUDE.md at root as a pointer, and backups OUTSIDE this folder.

Do not create anything yet. Prompt 2 writes the files.

Then read ai/DIRECTIVES.md, plus ai/DECLARATIONS.md and the existing code if

this is an established project.

STEP 1 — CALIBRATE THE DIRECTIVES

ai/DIRECTIVES.md is a universal skeleton with unfilled [BRACKETS] in §0. Those

parameters calibrate every gate. Propose a value for each, drawn from what the

idea implies, with one line of reasoning each. Flag any you're guessing at

rather than inferring.

Two matter more than the rest, so argue them explicitly:

  - SCALE HORIZON — the entire Gate B reversibility test hangs off this number.

    Too high and we over-build at zero users; too low and we design a ceiling

    into the data model.

  - DATA SENSITIVITY — the worst thing that ends up in this database. It sets

    what Gate A costs us and where the observability/privacy line falls.

Name any gate that goes inert (parameter set to `none`) so I can object.

Wait for my approval before continuing. Everything downstream inherits these.

STEP 2 — TRIAGE

Sort every part of the source into one of four destinations. Show me the table:

  APP_SCOPE      what the app is: purpose, users, flows, domain model, boundaries

  DECLARATIONS   technical decisions: stack, architecture, conventions, limits

  PHASE PLANS    implementation detail — deferred, written just before it's built

  DISCARD        served its purpose, no role in the build (market research,

                 competitor analysis, brainstorming, superseded drafts)

Be willing to discard a lot. Anything kept is re-read and re-paid for later.

Report the source's total size and what fraction survives triage.

STEP 3 — INTERROGATE

Find every issue in these seven categories. Quote the source for each.

  A. EXPENSIVE TO REVERSE — the priority. A decision qualifies if undoing it

     later would require any of:

       - migrating existing user data

       - touching every record (an identifier embedded everywhere)

       - changing how users authenticate or are identified

       - breaking a public contract: URLs, API shapes, integrations

       - reworking what features are possible at all

       - legal, privacy, or security exposure

     For each: the decision, why it's costly to undo, what it forecloses.

  B. CONTRADICTIONS — where the source says two incompatible things, including

     across sections written at different times.

  C. UNDECIDED, DRESSED AS DECIDED — "Cloudflare / Vercel / Netlify" is three

     options wearing a decision's clothes. Flag every one.

  D. GAPS — what the source doesn't mention but will certainly come up. Check at

     minimum: multi-user or sharing, account deletion, data export, error and

     empty states, onboarding, offline behavior, external dependency failure,

     and what happens when a paying relationship lapses.

  E. RISKY ASSUMPTIONS — external dependencies or unproven premises whose failure

     would invalidate the design. These drive phase order: prove them early.

  F. SCOPE TENSION — where stated goals and stated features don't match.

  G. GATE VIOLATIONS — walk ai/DIRECTIVES.md §1 gate by gate, with the §0

     parameters now filled in, and check the idea as written against each.

     Quote the gate, quote the failing part of the spec, say what must change.

     A gate is binary — never soften a violation into a "consideration." Where a

     gate passes, say so in one line: I want to see each was checked, not assumed.

     Then check §3: does this idea create any pre-decided conflict? If it creates

     a collision §3 doesn't cover, that's a gap in my directives — tell me.

STEP 4 — THE DECISION QUEUE

Split every finding into two lists:

  MUST RESOLVE NOW  — gate violations, expensive to reverse, or blocks planning

  CAN DEFER         — reversible; log as an assumption and move on

Every gate violation is MUST RESOLVE by definition. Never defer one.

Show me both lists as headlines first, so I see the shape before we start.

Then walk the MUST RESOLVE items ONE AT A TIME. For each:

  - The decision, in plain English

  - Why it's expensive to reverse

  - 2–3 real options with honest tradeoffs

  - Your recommendation, and your reasoning

  - What it costs me later if the recommendation turns out wrong

Then stop and wait. Do not batch these. Do not assume my answer. If I pick

something you think is wrong, say so once, clearly, then do what I decide.

Do not proceed to the blueprint. When the queue is empty, say so, then tell me:

"Next: Prompt 2 — Blueprint & Kickoff."

Why this step gets your attention and later ones don't: it is the only place in the workflow where an independent judgment enters. Everywhere else, the AI plans the work, does the work, and checks the work. Ask why not the alternative. Ask what breaks at ten times the scale. Ask what's hard to undo.

________________

PROMPT 2 — Blueprint & Kickoff
Run after the decision queue is empty. Same conversation — it has the context.

The decision queue is resolved. Build the blueprint.

WRITE THESE FILES:

ai/DIRECTIVES.md — the skeleton with §0 filled in as approved, the instruction

block and italic guidance stripped, any amendment we agreed logged in §6.

One page when done.

ai/spec/ — archive my original source doc, unmodified.

ai/APP_SCOPE.md — ONE PAGE. Shallow and durable. Detail for later phases would be

wrong by the time we build it.

  ## What it is           3–5 sentences, plain language

  ## Users                who, and what they're trying to do

  ## Core flows           the handful of paths users actually take

  ## Domain model         the nouns and their relationships — the most durable

                          thing here; get it right and everything gets cheaper

  ## Boundaries           what this is not, and will never be

  ## Non-negotiables      constraints binding every downstream decision

  ## Deferred             what we consciously postponed, and to when

ai/DECLARATIONS.md — ONE PAGE. Decisions only, one line each.

  ## Stack ## Conventions ## Environment

  ## Hard limits — never without asking me

  ## Done means — the objective checks every session must pass

  ## Amendments — dated log

ai/DECISIONS.md — for every resolved queue item: the decision, the reasoning, the

options rejected and why, and what would make us revisit it. This is what stops

settled arguments from being re-litigated in month four.

ai/BUILD_NOTES.md — with an empty MAP section.

ai/AIContext.md, ai/archive/, ai/phases/ — scaffolding.

Do NOT create a backups folder inside the project. Tell me to make one as a

sibling folder, so zipping the project never nests old backups inside new ones.

THEN THE ROADMAP — append to ai/APP_SCOPE.md:

Order phases by COST OF BEING WRONG and by RISK, highest first:

- Schema, identity, and contracts early — mistakes there propagate and require

  migrations. UI late — mistakes there are local and cheap.

- Any risky assumption from intake gets proven EARLY, even if it isn't

  foundational. A dead external dependency found in week two is survivable; in

  month three it isn't.

- A feature the source leads with is not automatically an early phase. If it's

  cheap to add later AND the data model reserves room for it now, build it late

  and validate the core first.

- Phase 0 is always scaffolding plus a thin vertical slice deployed to the real

  target. Prove the pipeline end to end before building anything into it.

One line per phase: goal, why it sits there, what it de-risks.

THEN THE PROJECT ESTIMATE — print in chat and append to ai/APP_SCOPE.md:

Estimate at PHASE level only. Session-level estimates come in Prompt 3, where

there's enough detail to mean anything.

For each phase: expected session count (a range), the mix of S/M/L sessions

(sized per Prompt 3), and MY total attention time — the minutes I actually spend

answering, reviewing, and doing checklist items. Not how long you run.

Then totals:

  - Total sessions, as a range

  - My total attention time

  - The three phases most likely to overrun, and why

  - Calendar projection: ask me how many sessions per week I realistically

    expect to run, then do the arithmetic. Do not invent a pace.

State plainly what these estimates assume, and that phase-level estimates

routinely miss by 50% or more in either direction — they exist for sequencing

and comparison, not for promising a date. Estimates get calibrated against

actuals at every phase close.

THEN THE KICKOFF CHECKLIST — print in chat, don't file it:

## You do these (needs your credentials, billing, or a human)

Numbered, in order. Accounts, services, domains, payment setup, API credentials.

For each: exactly where to go, what to name it, which setting matters, what to

copy down.

## I do these

What I handle once yours are done.

## Secrets I'll need, and where to put them

Name each, where it comes from, which file it goes in. Never paste one in chat.

## How we'll know Phase 0 worked

The specific observable result — a URL that loads, a command that succeeds.

Stop there. Do not plan Phase 1. End by telling me:

"Next: work the kickoff checklist, then Prompt 3 to plan Phase 0."

________________

PROMPT 3 — Plan a Phase
Start of each phase. Also the prompt for an update to a shipped app — paste the change instead of a phase number.

Plan Phase <N>: <name>.

   — or —

Plan a phase for this change:

<<< PASTE THE UPDATE SCOPE — plain English is fine >>>

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/APP_SCOPE.md, ai/BUILD_NOTES.md

(MAP especially), ai/AIContext.md, and the relevant code. Report in 3 lines what

you found that changes the plan.

If this is an update scope rather than a planned phase, first run a fast version

of Prompt 1's interrogation on it — same seven categories, but report only what

qualifies as MUST RESOLVE. Small changes hide expensive decisions too.

QUESTIONS: only what changes the plan's structure. One batch, max 7. Nothing

determinable from the files or the code. Anything reversible — decide it, log it

under Assumptions. If nothing blocks, skip and plan.

COMPARTMENTS — every task gets exactly one:

  DATA schema, migrations, models, queries      API endpoints, functions, integrations

  AUTH identity, sessions, permissions          LOGIC business rules, validation

  STATE client state, stores, data flow         UI components, layout, styling

  INFRA build, env, DNS, deploy                 QA tests, error handling, logging

A task spanning two compartments is two tasks. Drop compartments unused here.

SESSION SIZING:

The largest chunk you can complete and objectively verify without asking me

anything mid-run. Not the smallest — sessions carry a fixed startup cost.

- Prefer one compartment per session; contract-first ordering usually delivers it

- Two when splitting makes the work meaningless (an endpoint and its only call

  site). Justify in one sentence. Three or more: split instead.

- If a session needs my input mid-run, it's mis-scoped. Move the input to the

  session's Inputs list, or split there.

- Every session ends with the app building and running.

CONTRACT-FIRST:

The phase's first session defines and FREEZES the interfaces — types, schema,

signatures, prop shapes, event names — and does nothing else. Later sessions

build against frozen contracts independently. Changing one later is a plan

revision, not a silent edit.

ESTIMATES — every session gets three, and they are relative, not clairvoyant:

  SIZE

    S — one focused change, few files, obvious verification

    M — several files, some new structure, real verification

    L — a new subsystem, an external integration, or a data migration

  Any session you size L: say explicitly whether it should be split, and why

  you decided as you did. L sessions are where plans go wrong.

  MY TIME — minutes I actually spend: inputs, review, "needs my eyes" checks.

  Most sessions should be under 10. If many aren't, the plan is mis-scoped.

  CONFIDENCE — High or Low. Low means real unknowns remain. Name them.

  A Low-confidence L session is the single most dangerous item in any plan —

  call it out and propose a spike session to convert it to High before building.

Write to ai/phases/phase-<N>-<slug>.md and print it:

# Phase <N>: <name>

## Goal — what's true after that isn't now

## Out of scope

## Assumptions

## Frozen contracts — written literally; later sessions treat as read-only

## Sessions

   ### Session <N.n> — <title>

   - Compartment(s) / Depends on / Goal

   - Size: S|M|L   My time: ~N min   Confidence: High|Low

   - Files: created, modified

   - Tasks: ordered checklist

   - Inputs needed from me: gathered BEFORE the session, never mid-run.

     "none" whenever possible.

   - Done when: objectively checkable, with the exact command to run

   - Needs my eyes: only what can't be verified programmatically. Omit if none.

   - Risk and fallback

## Session order — mark anything parallelizable

## Phase estimate — session count, S/M/L mix, my total attention time,

   and which session most likely overruns

## Backup points — always the phase close; flag risky sessions

## Open risks

Stop after the plan. End by telling me:

"Next: start a NEW conversation and run Prompt 4 for Session <N>.1."

________________

PROMPT 4 — Run a Session
Start a new conversation. This is Rule 1 and it dominates your credit cost.

Run Session <N.n> from ai/phases/phase-<N>-<slug>.md.

BOOT — report in 5 lines or fewer:

1. ai/DIRECTIVES.md and ai/DECLARATIONS.md — what constrains this session, and which

   Hard Limits (§4) it's likely to touch

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

1. ARCHIVE — move ai/AIContext.md to ai/archive/YYYY-MM-DD_HHMM_AIContext.md using

   the real current date and time. Confirm it moved.

2. NEW CONTEXT — fresh ai/AIContext.md from the template. ONE PAGE. Timestamp,

   session run, what was done, files changed, assumptions, open items, exact

   next step.

3. ESTIMATE ACTUALS — record in ai/AIContext.md: the estimated size vs. what it

   actually was, and roughly how much of my time it really took. One line. This

   is what makes later estimates worth anything — without actuals they never

   improve.

4. BUILD NOTES — append only what a FUTURE session would waste time

   rediscovering: gotchas, config quirks, API behavior, dead ends. File under

   the right topic heading. Update MAP if files moved or were added. Durable

   findings only, not a diary. Nothing qualifies? Write nothing and say so.

5. SUMMARY — short, in chat. What got done, what I should know, what's next.

   Include anything from "Needs my eyes."

6. ASK — continue or stop? If continue, tell me:

   "Next: start a NEW conversation and run Prompt 4 for Session <N.n+1>."

   If this was the phase's last session, tell me:

   "Next: Prompt 5 — Close Phase <N>."

   Either way, do not run the next session in this conversation.

________________

PROMPT 5 — Close a Phase
Each phase boundary, before your backup.

Close Phase <N>.

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

   "Next: take your backup, then Prompt 3 to plan Phase <N+1>."

________________

PROMPT 6 — Amend a Declaration or Directive
When reality argues with the standard of truth.

I want to change a declaration: <what, and why>.

   — or —

I want to change a directive: <what, and why>.

If it's a directive, first tell me whether this is a calibration change (a §0

parameter for this project) or a change to the universal skeleton itself. The

second kind affects every future project — say so, and say what it would have

changed on this one.

Check what depends on it — code, frozen contracts, phase plans, other

declarations. Tell me the blast radius before changing anything.

If I confirm: make the change, add the dated entry to Amendments, record the

reasoning and what changed your mind in ai/DECISIONS.md, and list every phase plan

or contract that now needs revision. Then tell me which of those to re-plan

first.

________________

Templates
ai/AIContext.md
# AI Context

**Updated:** YYYY-MM-DD HH:MM

**Last run:** Phase N / Session N.n — <title>   **Compartment(s):** <...>

**State:** builds ✅  tests ✅  deployed ✅

**Estimate vs actual:** planned M / actual L — <one line on why>

## Done

## Files changed

## Assumptions made

## Open items

## Next step

<the exact next action>
ai/BUILD_NOTES.md
# Build Notes

Durable findings only — what a future session would waste time rediscovering.

Not a session log. Curated at every phase close.

## MAP — where things live

- auth: ...

- data layer: ...

(keeps the agent from re-exploring the tree every session)

## <Topic>

- YYYY-MM-DD — the finding, and what to do about it
ai/DECLARATIONS.md
# Declarations

Standard of truth. Decisions, not discoveries. One page. Amended deliberately.

Reasoning lives in DECISIONS.md. How to decide lives in DIRECTIVES.md.

## Stack

## Conventions

## Environment

## Hard limits — never without asking

## Done means

## Amendments

- YYYY-MM-DD — what changed, why
ai/DECISIONS.md
# Decision Record

Why the declarations say what they say. Read when a decision is questioned.

## YYYY-MM-DD — <decision>

**Chose:** ...

**Because:** ...

**Rejected:** ... because ...

**Revisit if:** ...

________________

The Loop
once      Prompt 1  ──►  calibrate directives, then answer the decision queue

per app   Prompt 2  ──►  blueprint + project estimate + kickoff checklist

          │              you work the checklist

per       Prompt 3  ──►  phase plan with per-session estimates

phase     │

          ├─ NEW conversation → Prompt 4 → continue or stop?

          ├─ NEW conversation → Prompt 4

          ├─ NEW conversation → Prompt 4

          │

          Prompt 5  ──►  estimate calibration + your backup

          │

          next phase

anytime   Prompt 6  ──►  amend a declaration or directive

Updates to a shipped app: Prompt 3 with the change pasted in, then the session loop. Often a one-session phase — the structure still earns its keep, because the handoff and the notes stay consistent.

A big new direction on an existing app: back to Prompt 1. New expensive decisions deserve the same interrogation the original idea got.

________________

On the Estimates
They are for sequencing and comparison, not for promising a date.

Relative sizing is reasonably reliable — an L session really is bigger than an S session, and that's what you need to spot a mis-scoped plan or a phase carrying too much risk. Absolute time is not reliable, and anyone who tells you otherwise is selling something. This is true of software estimation generally and more so with an AI in the loop, where a session either takes twenty minutes or discovers something and takes four hours.

What makes them improve is step 3 of Prompt 4 and step 2 of Prompt 5: log the actual, compare at the boundary, re-estimate what's left. By phase three the numbers start meaning something, because they're calibrated to this project and this stack rather than to a guess. Estimates that are never checked against reality don't converge — they just accumulate.

The number to actually watch is your attention time. It's the one you can control, it's the one that tells you whether the plan is mis-scoped, and it's the one that reflects your stated goal: prompt, walk away, come back to finished work.
