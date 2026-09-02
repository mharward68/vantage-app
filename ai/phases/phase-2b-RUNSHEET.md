# Phase 2B Run Sheet — Prospect Detail View

*Vantage — a Prospecting Relationship Manager*

> ## ▶ IN PROGRESS. Step 2R — the review-response sessions.
>
> *Banner updated 2026-09-02. Phase 2A closed 2026-08-31; the original
> "blocked on 2A" notice is spent and has been removed.*
>
> **Where things stand: 4 of 11 remaining sessions are done.**
> 2B.1–2B.9 shipped, the review pass closed 2026-09-01, and of the sessions it
> produced **2B.11, 2B.12, 2B.13 and 2B.16 are complete.** `CACHE_NAME` is at
> **v111**.
>
> **Four NEW sessions were added on 2026-09-02** — 2B.19, 2B.18 and 2B.20 — from
> Michael using 2B.13 the same afternoon it shipped. They are a coherent set
> about one thing: **a company's identity is its domain.** Their scope,
> decisions and traps are in `ai/phases/phase-2b-review-response-plan.md`.
>
> **Go to Step 2R.** Do not re-run intake or planning.

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
| **2R** | **Review** — a day of real outreach, then respond. **← YOU ARE HERE** | `ai/phases/phase-2b-REVIEW-PASS.md` → `…-REVIEW-FINDINGS.md` → `…-review-response-plan.md` |
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

## The sessions — all of them, current as of 2026-09-02

*Step 1 planned 2B.1–2B.10. The review pass added 2B.11–2B.17 on 2026-09-01, and
Michael added 2B.19, 2B.18 and 2B.20 on 2026-09-02. **2B.10 keeps its number and
always runs last.***

**Step 2 — the original ten**

| | Session | | Size |
| :---: | :---: | --- | :---: |
| ☑ | **2B.1** | Navigation substrate — `detailProspectId`, the origin record, the empty view panel | M |
| ☑ | **2B.2** | Column-layout machinery generalised, proven against TaskHub | M |
| ☑ | **2B.3** | Identity block — 17 fields, the single field writer, Delete, `--color-danger` | L |
| ☑ | **2B.4** | Tab strip, Interactions tab, Tasks tab | M |
| ☑ | **2B.5** | Audiences, Campaigns and Company tabs | M |
| ☑ | **2B.6** | **Cutover** — four entry points, prospect card retired, company inspector narrowed | L |
| ☑ | **2B.7** | Email uniqueness, import skip-and-report, `taskSettings` in `wipeAllData()` | M |
| ☑ | **2B.8** | Both ProspectHub directory tables adopt the generalised layout | M |
| ☑ | **2B.9** | `#prospect-tag-chooser` replaced with the Advanced Query picker | M |

**Step 2R — from the review pass, 2026-09-01**

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☑ | **2B.11** | ProspectHub filter column — geography matcher and field widths | M | ~8 min |
| ☑ | **2B.12** | Column resize cursor, and the mid-drag guard | S | ~5 min |
| ☑ | **2B.13** | Company dup guard — website seed + the autocomplete | M | ~2 min actual |
| ☑ | **2B.16** | Company tab — collapse by default, and the tab reorder | S | ~0 min actual |
| ☐ | **2B.14** | Include semantics — OR within a picker, AND across pickers | M | ~10 min |
| ☐ | **2B.15** | ProspectHub tag filter becomes the pop-out chooser ⚠️ needs the P8 revision | M | ~8 min |
| ☐ | **2B.17** | Identity block redesign ⛔ needs your layout design | L | ~15 min |

**Step 2R — added 2026-09-02, the company-identity set**

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☐ | **2B.19** | **Add Company** — the front door, and `normaliseDomain()` ⚠️ ZIP first ← **NEXT** | M | ~8 min |
| ☐ | **2B.18** | **Email → company** — domain matching, blocklist, arrow removal ⚠️ ZIP first | M | ~10 min |
| ☐ | **2B.20** | **Import identity** — repair on import + duplicate-domain report ⚠️ ZIP mandatory | M | ~8 min |

**Always last**

| | Session | | Size | My time |
| :---: | :---: | --- | :---: | :---: |
| ☐ | **2B.10** | **Phase close** — drill, curation, declarations audit, export re-prove ⚠️ ZIP + green snapshot | M | ~20 min |

**Remaining: 7 sessions. Your attention: roughly 80 minutes**, of which 20 is the
close. Four of the seven need nothing from you and can run back to back.

---

# Step 2R — Review, then the response sessions

*The review pass ran 2026-09-01 and is **closed**. This step is the sessions it
produced, plus three added on 2026-09-02.*

**Read first:** `ai/phases/phase-2b-review-response-plan.md`. It carries the
per-session compartment, tasks, Done-when and traps, and **every decision Michael
made on 2026-09-02.** This sheet only says how to launch them.

## Run order — updated 2026-09-02

```
DONE
  2B.11  Filter column       geography + widths           ✅ 2026-09-01
  2B.12  Resize cursor       cursor + drag guard          ✅ 2026-09-01
  2B.13  Company dup guard   website seed + datalist      ✅ 2026-09-02
  2B.16  Company tab         collapse + tab reorder       ✅ 2026-09-02

NEXT — nothing owed, run in this order
  2B.19  Add Company         front door + normaliser      ▶ NEXT
  2B.18  Email → company     domain match + arrow         after 2B.19
  2B.20  Import identity     repair + duplicate report    after 2B.18
  2B.14  Include semantics   OR within a picker           after 2B.20

BLOCKED ON YOU
  2B.15  Tag filter pop-out  after 2B.14                  ⚠️ needs the P8 revision
  2B.17  ID block redesign   after 2B.13 (done)           ⛔ needs your layout design

LAST, ALWAYS
  2B.10  Phase close                                      ⚠️ ZIP + green snapshot
```

**Why this order.** 2B.19 builds `normaliseDomain()` and the first real way to
create a company; 2B.18 consumes both; 2B.20 applies the same rules to the bulk
import path. Each one hands the next a finished piece. 2B.14 is unrelated and
sits after them because nothing depends on it.

## The one idea behind 2B.19, 2B.18 and 2B.20

**A company's identity is its `domain` — a normalised bare host, unique.
`website` is free-form display. There is no `url` field.**

Everything else follows: the email domain finds the company, the front door
enforces the identity at creation, and the import stops writing slugs into it.

⚠️ **This is a `DECLARATIONS.md` amendment that is PROPOSED and NOT APPLIED.** It
is in the batch 2B.10 owes. It is not in force until you write it into
`DECLARATIONS.md` yourself.

## The session prompt

*One conversation per session. Substitute the number.*

```
Run Session 2B.NN from ai/phases/phase-2b-review-response-plan.md.

BOOT — report in 5 lines or fewer:
1. ai/DIRECTIVES.md and ai/DECLARATIONS.md — what constrains this session, and
   which Hard Limits (§4) it's likely to touch
2. ai/AIContext.md — where the last session ended, open items
3. ai/BUILD_NOTES.md — MAP, plus any topic relevant here
4. The session's entry in the review-response plan, and the frozen contracts in
   ai/phases/phase-2b-prospect-detail-view.md it touches
5. Confirm compartment(s), goal, done-criteria, inputs needed from me

Ask only what genuinely blocks you, all at once, before starting. Anything
reversible: pick the simplest option, log it, keep moving.

EXECUTE
- Stay in this session's compartment(s). Work found elsewhere goes to the phase
  backlog — do not do it.
- Do not modify a frozen contract. If it must change, stop and tell me.
- Read the session's "Risk and fallback" before writing code. Several of these
  sessions have a trap that makes a half-fix look complete.
- THREE STRIKES: three failed attempts at the same error — stop and report.
- LEAVE THE APP USABLE. Real outreach happens in it between sessions.
- Both query surfaces stay DEFERRED: renderAqInspectorDrawer(), the aq-insp-*
  ids, and the Audience Query Engine are not touched.

VERIFY — run the checks in "Done when" and paste the real output. Not a summary.
If you didn't run it, say you didn't run it. A passing state check is not
evidence the user can see the right thing — screenshot it.

END OF SESSION — archive ai/AIContext.md to ai/archive/YYYY-MM-DD_HHMM_AIContext.md,
write a fresh one-page ai/AIContext.md, record estimate actuals, append only
durable findings to ai/BUILD_NOTES.md, summarise in chat, and ask whether to
continue.
```

## Still owed by Michael — down from four to two

| # | Decision | Gates |
| :---: | --- | --- |
| 1 | **The P8 revision** — the tag filter moves off the AQ picker onto the pop-out | 2B.15 |
| 2 | **The ID layout design** | 2B.17 |
| ~~3~~ | ~~The cross-compartment exception~~ | **GRANTED 2026-09-02, full scope** |
| ~~4~~ | ~~`LA` = Louisiana or Los Angeles~~ | ~~2B.11~~ — shipped |

Also open, but gating nothing: **Finding 10d's meaning** in one word, and a
handful of carried cosmetics from 2B.4–2B.12 that you have seen twice. **Leaving
those is a valid answer.**

## Decisions locked on 2026-09-02 — a session must not re-open these

| | Decision |
| --- | --- |
| **Identity** | `domain` is the company's identity. `website` is display. No `url` field |
| **Normalising** | **Conservative** — strip scheme, a leading `www.`, port, path, query, fragment, trailing dot; **then keep every remaining label.** ⛔ Never reduce to two labels: `bbc.co.uk` → `co.uk` collapses every UK company. Accepted cost: `mail.acme.com` ≠ `acme.com`, a miss you can see, never a silent merge |
| **Auto-linking** | Keys on the **domain only**. Name never auto-joins — name matching is what made the four SPLs. **A human picking from the autocomplete still resolves by name, and always wins** |
| **Placeholder** | **Import only.** `domain` = `no-website:<first word>`, leading articles skipped, `website` empty. **Companies sharing a first word share one bucket ON PURPOSE** — that is the cleanup grouping, not a defect. The imported company is a **real record** carrying the placeholder as its domain |
| **Hand entry** | **Never produces a placeholder.** No usable domain → `domain` stays empty |
| **Existing companies** | ⛔ **A prospect's email never edits the company it is attached to.** Seeding needs all three: company `domain` empty, this prospect its **only** contact, host not blocked |
| **Back-fill** | The bulk back-fill of existing companies' `website` from `domain` stays **DECLINED** |
| **Online lookup** | ⛔ **No.** CORS blocks it, an API key would be public in a public repo. **Phase 4**, on a Cloud Function |

## Traps that make a half-fix look finished

Each has already been reasoned out — the plan carries the detail. They are
repeated here because each **passes a spot-check while still broken.**

- **2B.19** — the company modal is **shared with edit**. A create branch that
  forgets one field leaks the last-edited company's value into the new record,
  and it will be a field nobody looks at, like `postal`. Blank all fourteen from
  an explicit list. Also: `saveCompany()` unconditionally writes into the
  **prospect** modal's Company box — harmless today, stomps that form from a new
  entry point.
- **2B.18** — the fill must fire on **email blur, not at Save.** A Save-time-only
  version passes every state check and is not the feature.
- **2B.20** — ⚠️ **do not change how `companyId` is derived.** It is the record id
  prospects point at; `domain` is the business identity. They hold the same
  string today and are not the same concept. Changing it silently orphans every
  link on the next import.
- **2B.14** — there are **two** include functions. Change one and **Title**
  silently keeps AND. Test Title explicitly.
- **2B.17** — must run **after** 2B.13 (done), or the company-URL field renders
  blank almost everywhere and reads as broken.

## Backup points for this step

| When | What |
| --- | --- |
| ~~Before 2B.13~~ | ✅ Taken 2026-09-02 — `vantage_data_backup_9-2-26_1214.zip` |
| Before **2B.19** | Manual ZIP — first session that can create companies directly |
| Before **2B.18** | Manual ZIP — it writes `companyId` on prospects |
| Before **2B.20** | Manual ZIP — **not optional.** The only session touching records in bulk |
| Before **2B.17** | Manual ZIP — every prospect field's markup is rebuilt |
| Before **2B.10** | Manual ZIP **and** a confirmed green snapshot. Non-negotiable |

⚠️ **The snapshot health chip is reading "Not protected" again as of 2026-09-02**,
while snapshots are demonstrably writing (`[Snapshot] Boot:` names a file from
today, and the ZIP wrote to the folder). 2B.16 recorded this as resolved; it is
not. **The green-snapshot gate on 2B.10 is currently NOT checkable.** Treat it as
the File System Access permission lapsing between sessions rather than as a bug.

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
- **The first reload after a cache bump still serves the OLD document.** The second reload gets the new build. Ask for a one-glance version tell with every summary. Confirmed again in 2B.13: `caches.keys()` reported v111 while the page was still running v110's code.
- **A native `<datalist>` dropdown freezes browser automation exactly like a dialog** — but unlike a dialog, **one `navigate` clears it** and no human is needed. Learned in 2B.13. It also swallows typed keystrokes, so a click-then-type into a company field looks like the click missed.
- **The dropdown itself cannot be screenshotted** — it is an OS-level widget. The evidence that works is the affordance arrow, proven by emptying the datalist and re-shooting the same field.

## Backup points — don't skip these

| When | What |
| --- | --- |
| Before any session touching the **prospect or company record shape** | The plan flags these — take a ZIP. **Every remaining session in Step 2R qualifies** |
| At **phase close** | Full ZIP, stored outside the project folder |

**How to take one:** Data Management → Export Backup. It writes into
`backups-production\` directly when the folder permission is live, and falls back
to a browser download when it is not — **check which happened**, because a file
in `Downloads\` is not where the restore drill will look for it.

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
| A session reports **"the renderer is frozen"** while driving a company field | An open native `<datalist>` popup. One `navigate` clears it. Not a dead session. |
| **`localStorage` byte count moved** but no data changed | `snapshotHealth` holds wall-clock timestamps that widen on their own. Measure user data with `snapshotHealth` deleted — 27,959 at the 2026-09-02 resting state. |
| A session proposes **reducing domains to two labels** | Stop. `bbc.co.uk` → `co.uk`. That failure mode was considered and rejected on 2026-09-02. |
| A session proposes a **more precise placeholder** from the full company name | Stop. The first-word collision is the cleanup grouping Michael asked for, not a defect. |
| A session wants to **back-fill existing companies' `website`** | Declined 2026-09-02. It is a §4 change to existing data and needs its own decision. |
