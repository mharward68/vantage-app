# Scope: Prospect Detail View — Phase 2

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
- Confirm whether anything else in the app opens the prospect inspector — the audience inspector and pop-out panel both call `openProspectModal(pid)`, which may or may not be the same surface.
