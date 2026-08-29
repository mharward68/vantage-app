# AI Context

**Updated:** 2026-08-28 15:41
**Last run:** Phase 0 / Session 0.1 — §0 close-out and documentation retrofit  **Compartment(s):** none — documents only
**State:** builds ✅ (no code touched)  tests n/a  deployed n/a
**Estimate vs actual:** Phase 0 planned at 1–2 sessions; the document half took 1. Loose-file cleanup is pending approval and is minutes, not a session.

## Done

- Closed the three open §0 parameters in `DIRECTIVES.md` and logged the change in §6.
  - **Recovery objectives** — local snapshots debounced ~2 min after last mutation, plus tab-hide and close. Retention: last 10 rolling + newest-of-day ×14 + newest-of-week ×8. State JSON every snapshot; IndexedDB binaries mirrored daily, deduped by id, never pruned. Gate C moved from blocked to active.
  - **UX tier** — Polished, confirmed. Raise before external launch.
  - **Accessibility** — `none`, Gate F stays inert. Three authoring habits added for new markup (labeled inputs, keyboard-operable controls, visible focus). AA anchor moved from "the Phase 2 rebuild" to "before external launch."
  - **Telemetry** — restated as deferred to Phase 2 by decision rather than left open.
- Retrofitted the `ai/` workflow structure. `AI-CONTEXT.md` split three ways: standing sections → `DECLARATIONS.md`, watch-outs → `BUILD_NOTES.md` organized by topic, log → here.
- Wrote `CLAUDE.md` at the repo root as a pointer, not a copy.
- Marked `schema_update.sql` as a fossil with a status header. No other code file touched.

## Files changed

**Created:** `ai/DECLARATIONS.md`, `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/phases/`, `ai/archive/`, `ai/archive/2026-08-28_1541_AI-CONTEXT-pre-retrofit.md`, `CLAUDE.md`
**Created from the dated drafts:** `ai/DIRECTIVES.md`, `ai/DECISIONS.md`, `ai/HANDOFF.md`
**Modified:** `schema_update.sql` (comment header only)
**Untouched, as instructed:** `app.js`, `index.html`, `style.css`, `sw.js`

## Assumptions made

- Normalized the dated draft filenames (`8.27.26_*.md.txt`) to `DIRECTIVES.md` / `DECISIONS.md` / `HANDOFF.md`. Content preserved; formatting cleaned from the Google Doc export. **The dated originals still sit in `ai/` — they could not be deleted from this session.**
- `DECLARATIONS.md` §Hard limits points to DIRECTIVES §4 rather than restating it, to avoid maintaining one list in two places.
- Added the 2026-08-28 reasoning to `DECISIONS.md` as well as the §6 amendment row, per DIRECTIVES §5.4. Revert if the §6 entry alone was intended.
- MAP in `BUILD_NOTES.md` left deliberately empty, as instructed.

## Open items

- **Loose root files** — keep/archive/delete list produced for approval, not executed. Includes the superseded `AI-CONTEXT.md` and the dated `.txt` drafts.
- **Compliance obligations** (§0) — still undecided. Not blocking; settle before Vantage is sold or shown to anyone.
- **Telemetry tool** (§0) — deferred to Phase 2 by decision.
- **Contradiction resolved, worth knowing:** §0's original accessibility note assumed Phase 2 rebuilds the UI. `DECISIONS.md` (persistence) says it explicitly does not. Anything else resting on "the Phase 2 rebuild touches everything anyway" should be re-checked against that.
- Sheet/CSV import path for prospects at scale — carried forward, likely relevant once hosted.
- Whether `Start_Vantage.bat` / `Stop_Vantage.bat` retire at Phase 2 or stay as a local fallback. Leaning stay.

## Recent history before this retrofit

Feature work through July 2026, condensed from the superseded log (full copy in `ai/archive/`):

- **Advanced Query** (Prospect Hub) — full query modal with prospect/company toggle, field and date filters, AND/OR parsing, pagination, multi-select, bulk tag / add-to-audience, plus a floating results window with an inspector drawer.
- **Company fields overhaul** — `industry` and `employees` replaced `employeeRange`, with migration and CSV coverage; employee-range bucketing added to Campaign Hub query.
- **Audience list active/archive status** — `status` field with migration, tab toggle, status-dependent action buttons, full CSV coverage. This is the precedent Sequences follows.
- **Audience view fixes** — inspector layout override and a null guard in `renderAudienceInspector()`. Both recorded in `BUILD_NOTES.md`.
- **Audience quality-of-life** — notes field, import tag assignment with duplicate detection, bulk tagging, pop-out contact list, clickable prospect/company popups.

## Direction change, same day — TaskHub

After Phase 0 closed, the roadmap changed shape. Tasks became a first-class entity rather than a projection of sequence enrollments, and sequencing demoted to something built on top of them. Full reasoning in `DECISIONS.md` (four entries dated 2026-08-28); scopes in `ai/spec/`.

**Revised phase order:** Phase 1 TaskHub · Phase 2 Prospect Detail View · Phase 3 Sequencing · Phase 4 Hosting. Each delivers something usable on its own.

- `ai/spec/taskhub-scope.md` — approved, ready to plan.
- `ai/spec/prospect-detail-view-scope.md` — direction approved, needs its own intake pass before planning.
- `claude/sequence-feature-scope.md` and `claude/sequence-build-plan.md` in the Claude project are now **partly superseded** — the derived-task-queue ruling is reversed, sequencing has moved to Phase 3, and their ready-to-paste session prompts still tell agents to read `AI-CONTEXT.md` and `StatementOfDirective.md`, both of which are gone.

**Two things a Phase 1 session must verify against `app.js` before building**, because they were scoped from documentation rather than code: the exact shape of a prospect history entry and how `state.reachoutTypes` is registered; and whether anything besides the Prospect Hub opens the prospect inspector (`openProspectModal(pid)` is called from the audience inspector and pop-out).

**Still open in the TaskHub scope:** hub color (teal proposed), and whether bulk selection needs "select all N matching" across pages or only page-level select-all.

## Next step

Start a **new conversation** and run Prompt 3 from the workflow to plan **Phase 1 — TaskHub**, against `ai/spec/taskhub-scope.md`.

Carry into that planning session: backup/restore for `state.tasks` and `state.taskSettings` is session 2, before any UI, per DIRECTIVES §4. The automated local snapshot backup is also a Phase 1 deliverable and must land early. Both have Done-whens that include an actual restore, not just a successful write.
