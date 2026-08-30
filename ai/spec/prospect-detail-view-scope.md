# Scope: Prospect Detail View — Phase 2

> ## ⛔ NOT READY FOR PROMPT 3. Run **Prompt 1 (Spec Intake)** on this document first.
>
> *Banner added 2026-08-29.*
>
> Prompt 5's closing line is scripted — when Phase 1 closes it will say "take your backup, then Prompt 3 to plan Phase 2." **That is wrong for this phase.** This document captures approved *direction*, not a scoped feature: §5 lists three things that must be settled first, and the scope was written from documentation rather than from `app.js`.
>
> Correct order: **Prompt 1 → approve the revised scope → Prompt 3 → build.**

> ## ✅ INTAKE INPUT ADDED AND RESOLVED, 2026-08-29 — §1 stands, and gains three things
>
> Raised during Michael's review of Phase 1 Session 1.5 and settled in the same conversation. §1's full-screen detail view was briefly in conflict with a proposal to make the slide-out panel the central movable surface. **Michael chose the full-screen view.** The panel is not hoisted, not made movable, and not made resizable; Phase 1 invests nothing further in it.
>
> **Three additions to §1 that came out of that conversation and must be carried into the intake pass:**
>
> 1. **It is reachable from three hubs, not one.** Prospect Hub, **TaskHub** (from a task's prospect name), and **Campaign Hub — specifically from a prospect inside an audience list**, which is where prospects are looked at there. **Explicitly NOT Media Hub** — there is no prospect on a media record.
> 2. **It stops at the sidebar, in both sidebar states.** Filling the viewport and covering the sidebar is wrong. See the layout note below — this is free if built correctly and awkward if not.
> 3. **The back arrow returns to wherever it was opened from, in the state it was in** — not always to the Prospect Hub list. Opened from a task's editor, back reopens that editor. See the note below.
>
> **Layout note, verified against `style.css` on 2026-08-29 — this is the whole answer to "can we do that?":**
>
> `#app-layout` is `display: grid; grid-template-columns: auto 1fr`. The sidebar is the `auto` column; `#main-canvas` is the `1fr` column. The sidebar is 280px pinned and collapses to 76px via `#sidebar:not(.sidebar-pinned):not(:hover)`, with a 0.3s width transition.
>
> **So anything rendered inside `#main-canvas` already stops at the sidebar and already reflows — animated — when the sidebar expands or collapses. The grid does it. No JS, no width calculation, no listener on the pin.**
>
> The only way to get this wrong is to reach for `position: fixed; inset: 0`, which measures against the viewport and would cover the sidebar. **Build the detail view as a view panel inside `#main-canvas`, exactly like the six existing hubs.** Do not position it against the viewport, and do not compute a left offset from the sidebar's width — both are ways of re-implementing, badly, what the grid already does.
>
> **The back arrow restores the origin, not just the origin view.** Opened from an open task editor in TaskHub, back returns to TaskHub **with that task's editor open again** — not to a bare task list. `openTaskEditor(taskId)` rebuilds the modal from `state.tasks` on every call, so restoring it is one call against a remembered id, not saved DOM.
>
> Concretely, the origin is a small record — `{ view, taskId }` — stamped when the detail view is opened and replayed by the back arrow. Opened from the Prospect Hub list it is `{ view: "prospects" }` and back is just the list. Opened from a Campaign Hub audience it is `{ view: "campaigns", audienceListId }`.
>
> **Unsaved edits: save before navigating.** The user clicked a prospect *from inside* the editor; committing what they typed and then going to look is the natural reading, and it makes the return trivially correct — the reopened editor shows current data with no stashed form state to reconcile. Two rules that follow: if `saveTaskFromEditor()`'s validation fails (it alerts on a missing title, due date or prospect), **do not navigate** — surface the alert and stay put. And this applies only to an existing task; the create path has no prospect name to click.
>
> *(An earlier draft of this banner claimed the editor was necessarily lost and called it a cost of going full-screen. That was wrong — Michael caught it. Full-screen replaces what is on screen; it does not prevent the return path from restoring it. Corrected 2026-08-29 before anything was built.)*

**Status:** Direction approved 2026-08-28. Not fully scoped — this captures what is decided so far. Run a proper intake pass before planning the phase.
**Depends on:** Phase 1 (TaskHub) shipping first, so the Tasks tab has something to show.

---

## 1. What this builds

Replaces the Prospect Hub's slide-out overlay inspector with a **full-screen prospect detail view**: it fills the screen up to the sidebar, with a back arrow at the top to return to the list.

- **Top half** — the prospect's core information, including notes and tags. Glanceable, not browsable, so these stay in the top half rather than being buried behind a tab.
- **Bottom half** — a tab strip.

### Tabs

| Tab | Contents |
| --- | --- |
| **History / Reachouts** | Existing prospect history entries — what `getLastReachoutDate()` reads, and where completed tasks land from Phase 1. |
| **Tasks** | All tasks for this prospect, completed included, due date descending. Migrated out of the interim Phase 1 inspector subsection. |
| **Audiences** | Audience list memberships, carrying over the existing quick add-to-audience control. |
| **Campaigns** | Campaign memberships. |
| **Company** | The company record's fields **plus every other prospect at that company**, each clickable. The data is already joined by `companyId`. This replaces an Advanced Query run constantly by hand — "who else do I have at Comcast." |
| *(Sequences)* | **Slot reserved, not built.** Populated when sequencing lands in Phase 3. Designing the tab strip with the gap costs nothing now; adding a sixth tab to a finished layout costs a rework. |

---

## 2. One editing surface — the decision that makes this worth doing

Prospect detail currently renders in **two** places: the Prospect Hub overlay (`.prospect-inspector-panel`, absolutely positioned, animates in with `translateX`) and the Advanced Query results drawer, which has its own inline inspector carrying history, tags, notes, memberships, quick-edit and delete. A full-screen view would make three renderings of the same record, and three renderings drift.

**Resolved:**

- The full-screen detail view **replaces** the Prospect Hub overlay. It is the single place prospect information is entered or edited.
- **Advanced Query is for selecting prospects**, primarily to place them into an audience. Its result drawer becomes a deliberate **read-only quick preview** — click a contact, see who they are, keep working. No editing, no quick-edit, no delete.

This is a narrowing of shipped behavior, not just an addition: the AQ drawer's existing edit controls go away. Worth stating plainly in the phase plan so it isn't discovered as a regression.

---

## 3. Boundaries

- **No files or media attached to prospects.** The `VantagePRMFiles` IndexedDB store is not extended to prospect records, and there is no Files tab. Decided, not deferred.
- Notes and tags live in the top half, not as tabs.
- No layout work on the Media or Campaign hubs — this phase touches the Prospect Hub only.

---

## 4. Risk

This rewrites **shipped UI that is used for real work between sessions.** DIRECTIVES requires every session to leave the app usable, not merely building — and a half-migrated prospect inspector costs actual outreach, not just tidiness. That constraint is stricter here than anywhere else in the roadmap, and it should shape session boundaries: no session ends with the old overlay removed and the new view incomplete.

The Prospect Hub overlay and the Audience view's grid-child inspector are deliberately different patterns (see `BUILD_NOTES.md`). Removing the overlay must not disturb the Audience view's inline `grid-template-columns` override.

---

## 5. Before planning this phase

- Read the actual overlay and AQ drawer implementations out of `app.js` and `index.html`. The scope above is written from documentation, not from the code.
- Decide the contract session's frozen interfaces: the detail view's data contract, the tab component, and what the AQ preview is allowed to render.
- ~~Confirm whether anything else in the app opens the prospect inspector — the audience inspector and pop-out panel both call `openProspectModal(pid)`, which may or may not be the same surface.~~ **Answered 2026-08-29 during Phase 1 planning — see §6.**

---

## 6. Verified against `app.js` — 2026-08-29

Read out of the code during Phase 1 planning. This resolves §5's third bullet and narrows the intake pass; everything else in §5 still stands.

**`openProspectModal(pid)` is not the inspector.** It opens the prospect *edit modal*. The inspector is a separate surface: `selectProspect(id)` sets `state.selectedProspectId`, and `renderInspector()` (app.js ~2527) draws it. The three `openProspectModal(pid)` call sites — the AQ drawer (4358), the audience inspector row button (5791) and the pop-out contact list (6109) — therefore open the edit modal, not the panel this phase replaces.

**The consequence for §2:** replacing the Prospect Hub overlay does **not** touch those three call sites. They will keep opening the edit modal after the full-screen view lands, which is a fourth editing surface §2 does not account for. Decide during intake whether the edit modal survives, or whether those callers should route into the new detail view.

**There are two inspectors, and Phase 1 deliberately updated only one.** `renderAqInspectorDrawer()` (app.js 4207) duplicates `renderInspector()`'s history and memberships rendering against a parallel set of `aq-insp-p-*` element ids. Phase 1 added its Tasks subsection to the Prospect Hub inspector only — recorded as Assumption 2 in `ai/phases/phase-1-taskhub.md`, on the reasoning that this phase replaces that surface anyway. So the AQ drawer arrives at Phase 2 **one subsection behind**, which is consistent with §2 making it a read-only preview, but it means the two surfaces are not equivalent at the moment this phase starts.

**Also relevant:** the Prospect Hub inspector's memberships area carries a live "Add to audience…" select and + Add button, restructured in Phase 1 into three subsections. §1's Audiences tab says the quick add-to-audience control carries over — that control is what it means.
