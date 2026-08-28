# Handoff — Vantage — 2026-08-27

> **Status: executed 2026-08-28.** The §0 close-out and the Phase 0 document retrofit described below are done. **The live handoff is `AIContext.md`** — read that, not this. This file is retained as the intake record: the review findings and the traps section are the reasoning behind the current standing files. The traps have been copied into `BUILD_NOTES.md`, which is read every session.

---

## Original start-here block *(consumed)*

> Read `ai/HANDOFF.md`, `ai/DECISIONS.md`, and `ai/DIRECTIVES.md` first — that's the current state. Phase order and the backup approach are decided; don't re-open them.
>
> **First** — close out the remaining §0 parameters one at a time: snapshot frequency and retention, UX tier, accessibility target. Telemetry is a Phase 2 question. Then update DIRECTIVES §0 and log the change in §6.
>
> **Second** — execute Phase 0, documents only: create `ai/phases/`, `ai/archive/`, `ai/BUILD_NOTES.md` with an empty MAP; consolidate `AI-CONTEXT.md`; write `CLAUDE.md`; add a status header to `schema_update.sql`. Then produce a keep/archive/delete list for the loose root files.
>
> After that: a fresh conversation, then Prompt 3 to plan Phase 1 (sequencing). **Automated local backup is a Phase 1 session and should land early, before real enrollments exist.**

---

Session of record: read-only review of Vantage, then intake on sequencing and hosting. Nothing was written to the project folder during that session — the outputs were drafts for review.

## What Vantage is

Single-user, offline-first PWA. Vanilla JS, no framework, no build step. 10,120 lines in one `app.js`. State in one `localStorage` key (`vantage_prm_database`), binaries in IndexedDB (`VantagePRMFiles`). Launched by `Start_Vantage.bat`, which starts `npx serve` on localhost:5000 and opens Chrome in app mode.

Positioned as a **Prospecting Relationship Manager** — prospects and customers are distinct relationships needing distinct messaging, which most CRMs collapse into one pipeline. Enterprise product is the eventual destination. Prospect → customer conversion is handled manually for now; a companion CRM is a someday-maybe, not a current design constraint.

## Phase order — decided

| Phase | Scope | Sessions |
| --- | --- | --- |
| Phase 0 | Retrofit scaffolding — documents only, no deploy | 1–2 |
| Phase 1 | Sequencing, local, against localStorage | 6–8 |
| Phase 2 | Hosting: persistence, auth, sync | 6–9 |

Total 13–19 sessions. Michael's attention across all of it: roughly 4–6 hours, concentrated in the sessions needing a real device or live data. Most individual sessions want under ten minutes from him.

Sequencing moved ahead of hosting deliberately — see `DECISIONS.md`. Development stays local throughout Phase 1; `Start_Vantage.bat` remains the run method.

Michael will be using the sequencer for real prospecting from the moment it works, throughout Phase 2. Two hard constraints follow:

- **Every Phase 1 and Phase 2 session must leave the app usable, not merely building.** He does real outreach in it between sessions; a half-migrated view or a broken modal costs him actual work, not just tidiness.
- **Enrollment data is live from Phase 1 onward.** Backup/restore for sequences (Gate 3, second in the spec's own build order) is what stands between him and losing in-flight sequences — treat it as load-bearing, not procedural. And Phase 2's import-and-verify step is migrating real prospects mid-sequence, not test records.

## Traps that must not be lost

*(Now also in `BUILD_NOTES.md` — that file is read every session, this one is not.)*

**The blob shortcut (Phase 2).** Storing whole state as one hosted document is fast and wrong — 1 MB ceiling, and concurrent device edits overwrite each other silently. Rejected with reasoning in `DECISIONS.md`. If a future session proposes it as a quick win, that's the file to read.

**The origin trap (Phase 2).** Current data lives on the localhost:5000 origin. A hosted app opens with an empty database; prospects do not follow. The ZIP/CSV backup is the bridge, and Phase 2 needs an explicit import-and-verify step.

**The `saveState()` risk (Phase 2).** Making saves granular sounds like it means touching every mutation site across 10,000 lines. It doesn't: keep a shadow copy of last-saved state, diff on save, write only what changed. One function, no call sites touched. This converts the riskiest session in the build into an ordinary one — make sure whoever plans Phase 2 knows it.

**The Gmail scope cliff (whenever email returns).** `gmail.send` is sensitive; reading mail is restricted and buys a recurring annual third-party security assessment. "Detect the reply and auto-advance the sequence" sounds small and is not.

**Spec amendments.** The sequencing spec document is superseded in three places and still says the old things: `currentStepIndex` → `currentStepId`, `currentStepBody` → a per-step array snapshotted at enrollment, and dates as `YYYY-MM-DD` strings.

## Structural findings

- `app.js` is 10,120 lines in one file. The existing note — "always search for the exact function before editing" — is a workaround for a structural issue. Sequencing alone touches the prospect modal, inspector, CSV export, CSV restore, `ensureStateDefaults()`, and two new views, all scattered through it.
- `schema_update.sql` describes Prospect and Company SQL tables that do not exist. A fossil from an abandoned direction, actively misleading — an agent reading it would believe there's a database. *(Status header added 2026-08-28.)*
- Cruft: `v59` (0 bytes), `test.js` (13 bytes), `search.js` (14 bytes), `patch_app.js` and `patch_app.py` (duplicates), `check_ids.py`.
- The workflow's DNA was already here — `AI-CONTEXT.md` with declarations at the top, `AI-CONTEXT-PROTOCOL.md`, `ai-context-archives/`, and a `.agents/skills/new-ai-context/` skill. The retrofit was consolidation, not construction.

## Open questions carried forward

- Sheet/CSV import path for prospects at scale — likely relevant once hosted.
- Whether `Start_Vantage.bat` / `Stop_Vantage.bat` retire at Phase 2 or stay as a local fallback. (Leaning stay — the local dev loop survives hosting.)
- `ai/APP_SCOPE.md` does not exist. The workflow expects it — one page: what it is, users, core flows, domain model, boundaries, non-negotiables, deferred. Worth writing before or during Phase 1 planning.
