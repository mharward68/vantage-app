# Phase 2A Run Sheet — App Shell

*Vantage — a Prospecting Relationship Manager*

> ## ✅ YOU ARE HERE — Step 0 is done. Start at Step 1.
>
> *Written 2026-08-30, after the Phase 2 intake.*
>
> **Intake ran on 2026-08-30 and Phase 2 split.** `ai/spec/app-shell-scope.md`
> is approved and carries no stop banner. **Do not run an intake for this
> phase — go straight to Step 1.**
>
> **This phase ships first.** Phase 2B's detail view is one screen tall and sits
> under this phase's header band, so building 2B first would mean building it
> twice. 2B's run sheet is `ai/phases/phase-2b-RUNSHEET.md`.
>
> **Numbered 2A, not renumbered.** Sequencing stays Phase 3, Hosting stays
> Phase 4.

> ### Source of truth
>
> The authoritative copy is **`ai/phases/phase-2a-RUNSHEET.md`** in the repo. Any
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
| ~~0~~ | ~~Intake~~ | ✅ **Done 2026-08-30** — `ai/spec/app-shell-scope.md` |
| **1** | **Plan** — turn the approved scope into sessions | `ai/phases/phase-2a-app-shell.md`, plus this sheet's session list |
| **2** | **Build** — one session per conversation | The shell |
| **3** | **Close** — verify, calibrate, curate, hand off | Phase 2B starting point |

Each step is a **new conversation**. Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` first. Attach nothing — every prompt reads the repo itself.

---

## What this phase builds

Three things, all app-wide, **none of them touching data**:

1. **No page scrolls.** Every hub becomes one screen tall, with only its own results scrolling — the shape TaskHub already has.
2. **A hub banner header.** `#canvas-header` becomes a band carrying the hub's icon and name, shaded in that hub's colour, aligned with the sidebar logo.
3. **One-word hub names**, and Data Management becomes **DataHub**.

> **Work order is fixed and causal, not preference.** The scroll conversion comes
> **before** the header band, and **CampaignHub comes first** among hubs. Three
> hardcoded `calc(100vh - N)` constants are live — `style.css` 1171, `style.css`
> 1797, and an inline one at `index.html` 663 — and all three break the moment
> the header's height changes. The scroll conversion deletes them. Do the header
> first and all three go stale at once, across two hubs, looking like three
> unrelated bugs.
>
> CampaignHub owns two of the three, shares the third, and has five sub-layouts
> under one panel. If the pattern survives CampaignHub, the rest are routine.

---

# Step 1 — Plan the phase

*One conversation. Produces a plan, no code.*

```
Plan Phase 2A: App Shell.

READ FIRST: ai/DIRECTIVES.md, ai/DECLARATIONS.md, ai/DECISIONS.md,
ai/BUILD_NOTES.md (MAP especially), ai/AIContext.md,
ai/spec/app-shell-scope.md (approved 2026-08-30 — if it carries a stop
banner, something is wrong; tell me), and the relevant code.
Report in 3 lines what you found that changes the plan.

Note: ai/APP_SCOPE.md does not exist in this repo. Do not look for it.

Then follow PROMPT 3 in ai/APP_BUILD_WORKFLOW.md exactly — compartments,
session sizing, contract-first ordering, and the three estimates per session
(SIZE, MY TIME, CONFIDENCE).

WORK ORDER IS FIXED by the scope's §2.3 and is not the planner's to
re-sequence: scroll conversion first, CampaignHub first among hubs, then
ProspectHub, MediaHub, Dashboard, DataHub, then the header band, names and
logo. The reason is causal — three hardcoded calc(100vh - N) constants break
the moment the header height changes, and the scroll conversion is what
removes them.

PHASE 1 CALIBRATION — measured at the close, 2026-08-30. Absorb all of it;
do not re-derive it.
- Per-session SIZES were right 10 times out of 11. Do not inflate them.
- The overrun was session COUNT: 8 planned, 11 run. All three additions came
  from ONE review pass over ONE session (1.5), on the day it shipped. Carry a
  +35% session-count contingency on a phase that ships new UI.
- NEVER size a phase-close session below M. Session 1.8 was sized S, ran L,
  and consumed 45 of the phase's 88 attention minutes.
- Attention time came in UNDER (105 predicted, 88 actual). The time estimates
  are working; leave that method alone.
- No Phase 1 session finished on one CACHE_NAME bump — v65 to v83 is 19 bumps
  across 11 sessions. Budget two per session.

THIS PHASE IS NOT A DATA PHASE. It creates and modifies no store of
user-writable data. Say so explicitly in each session's summary rather than
omitting it, so DIRECTIVES §4 backup coverage is visibly checked and not
assumed. If a session finds itself editing ensureStateDefaults(),
wipeAllData() or any export/restore function, it is out of compartment.

VERIFICATION — layout work passes state-based checks while looking wrong.
BUILD_NOTES records that lesson three times. Every session's Done-when checks
EVERY hub by screenshot, not only the hub it converted, and not by computed
style. The whole risk of this phase is that a shared rule changes six things
at once.

Write the plan to ai/phases/phase-2a-app-shell.md and print it.

THEN — also update ai/phases/phase-2a-RUNSHEET.md: fill in the "The sessions"
list in Step 2 with the real session numbers, titles, sizes and my-time
estimates from the plan you just wrote, and correct the session count in
Step 2's intro line. That file already exists and is otherwise complete;
change only that list and that number.

Stop after the plan and the run sheet update. Do not start Session 2A.1.
```

---

# Step 2 — Run the sessions

Phase 2A is **6** sessions as planned — forecast **8** once the +35% session-count contingency is applied. Those extra ones are not planned work; they are what reviewing Session 2A.4 is expected to produce, and they take numbers **2A.7 and up**. **2A.6 keeps its number and always runs last.**

For each session, four things:

| | |
| :---: | --- |
| 1 | Open a **new conversation** |
| 2 | Connect `C:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` |
| 3 | Paste the block below, with the session number on the first line |
| 4 | When it finishes, it tells you the next session number |

**Only line 1 ever changes.** Attach nothing.

```
Run Session 2A.1 from ai/phases/phase-2a-app-shell.md.

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
- NEVER modify #canvas-body. Taking its overflow away changes all six hubs in
  one edit. Each view panel fills it and owns its own scrolling instead.

VERIFY — run the checks in "Done when" and paste the real output. Not a summary,
not "tests pass." If you didn't run it, say you didn't run it. Check EVERY hub
by screenshot, not only the one this session touched.

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
| ☐ | **2A.1** | CampaignHub scroll conversion, and the idiom it proves — five sub-views, two of the three stale constants ⚠️ ZIP first | L | ~10 min |
| ☐ | **2A.2** | ProspectHub and MediaHub | M | ~8 min |
| ☐ | **2A.3** | Dashboard and DataHub — the scroll conversion completes here | M | ~6 min |
| ☐ | **2A.4** | **The header band, and the one-word names** — six hubs in one edit ← **review here** | M | ~10 min |
| ☐ | **2A.5** | Logo size and strip alignment — *you pick the number, from the screen* | S | ~6 min |
| ☐ | **2A.6** | **Phase close** — verify, calibrate, curate, declarations audit ⚠️ ZIP first. **This session is Step 3 below.** | M | ~20 min |

---

# Step 3 — Close the phase

*One final new conversation.*

```
Close Phase 2A.

1. Verify the phase goal is met. Run the checks, paste real output. Screenshot
   every hub. List anything incomplete or deferred.

2. ESTIMATE CALIBRATION — compare the phase plan's estimates against the actuals
   logged in the archived AIContext files. Report: predicted vs. actual session
   count, where sizes were wrong and in which direction, and my predicted vs.
   actual attention time. Then say what this implies for the remaining phases.
   Estimates that are never checked are decoration.

   Phase 1 ran 11 sessions against a planned 8. Say whether 2A repeated that
   pattern, and what it means for 2B, 3 and 4.

3. Curate ai/BUILD_NOTES.md — it's read every session, so it stays lean. Merge
   duplicates, delete what's no longer true, delete what turned out not to
   matter, regroup under clean topics, refresh MAP against the real file tree.
   Report what you cut.

4. Audit ai/DECLARATIONS.md. Two amendments are already owed and named in
   ai/spec/app-shell-scope.md §9 — the one-word hub display names with the
   DataHub-is-displayed-but-identified-as-data-management warning, and the
   in-app-navigation principle. Propose them; don't apply them. Add anything
   significant to ai/DECISIONS.md with its reasoning. Still one page after.

5. Write ai/AIContext.md as a phase-boundary handoff: what exists now, what's
   deferred, what the next phase starts from.

6. Tell me exactly what to back up, and the filename to use.

7. NEXT PHASE — Phase 2B, the Prospect Detail View. Its scope
   (ai/spec/prospect-detail-view-scope.md) is ALREADY APPROVED and its intake
   is done, so it goes straight to Step 1 of ai/phases/phase-2b-RUNSHEET.md.
   Do not tell me to run an intake for it.
```

---

# Standing reminders

## Before you start each session

- **The app should be running** — `Start_Vantage.bat` → `http://localhost:5000`. Most "Done when" checks are against the live app.
- **Close every other Vantage window.** Two windows share one `localStorage` but keep separate in-memory state, and whichever saves last silently overwrites the other. Found the hard way in Session 1.8 — it cost 55 tasks and a confusing half-hour. Also true of the installed PWA.
- **If the conversation has Claude in Chrome**, ask it to drive `localhost:5000` and read the console itself. That removes nearly all the copy-pasting.
- **Two dialogs freeze browser automation:** `wipeAllData()` uses `prompt()` and `alert()`. An agent driving Chrome must stub `window.prompt` / `window.alert` / `window.confirm` before calling anything that raises one, or the tab locks up and only you can clear it.
- **The first reload after a cache bump still serves the OLD document.** The second reload gets the new build. Ask for a one-glance version tell with every summary.

## Backup points

| When | What |
| --- | --- |
| Before **2A.1** | Manual ZIP export, stored outside the project folder |
| At **phase close** | Full ZIP, stored outside the project folder |

*No session in this phase touches the record shape — it is not a data phase — so the mid-phase backup trigger does not apply. Take the two above anyway.*

Backups live in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic snapshots are in its `snapshots\` subfolder.

## If something goes wrong

| Symptom | What it means |
| --- | --- |
| A session stops and says a **frozen contract** needs to change | Correct behaviour. It's a plan revision, not a session decision. Come back and amend the plan. |
| A session **grinds on the same error three times** | It's told to stop and report. Let it. |
| A session wants work **outside its compartment** | It's told to put it in the backlog. Let it. |
| A panel **grows instead of the list scrolling** | A missing `min-height: 0` somewhere in the flex chain — check *every* level, not the scroll container. The symptom always points at the wrong place. |
| A sticky header **doesn't stick** | Check `style.css` source order before suspecting the rule. A new rule near the top of the file loses to an older one further down at equal specificity. |
