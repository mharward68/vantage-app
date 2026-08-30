# AI Context

**Updated:** 2026-08-30 09:22 (America/New_York)
**Last run:** Phase 1 / Session 1.11 — Drag-to-reorder columns  **Compartment(s):** UI
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two · console **character-identical** to the unmodified v79 tree (one line, the headless snapshot-folder message) · `CACHE_NAME` **v80** · deployed n/a
**Estimate vs actual:** planned **M** / ~10 min of Michael's time. Actual **M**, and ~**2 min** of his — one message to connect the repo folder, nothing else. No escalation, no three-strikes, no frozen contract modified.

## Done

- **C16 row 2 — the reorder branch, filled in where 1.10 left the comment.** `initTaskHubHeaderDrag()`'s zones-2-and-3 block is unchanged in shape: the 4px threshold test, the `passedThreshold` flag and the mouseup that sets `taskSuppressNextHeaderClick` are all still 1.10's. The branch past the threshold now begins a reorder. **The handler was extended, not rewritten** — which is what C16 exists to make possible.
- **Live shifting moves the REAL cells**, header `<th>` and every row's `<td>` in one function (`taskHubSwapAdjacentColumnCells`). Moving a node keeps its listeners, so the sort handler bound at render time survives the drag. Cells cannot drift out of sync with headers because one function moves both or neither — structural, not careful coding.
- **The swap rule is the neighbour's MIDPOINT, in a `while` loop.** The midpoint is what stops the gesture oscillating when the dragged column is narrower than the one it displaces; the loop is what lets a fast drag cross two columns between frames.
- **Drop indicator:** `#taskhub-drop-line`, created on demand, appended to `<body>`, `position: fixed`, tracking the dragged column's left edge and spanning the list. **Deliberately not a child of the table** — an absolutely positioned marker inside `#taskhub-table` needs a positioned ancestor, and `position: relative` on the table or its `th` is exactly what silently un-stuck the sticky header in 1.10.
- **`setTaskHubColumnOrder()`** written beside `setTaskHubColumnWidth()` and following it exactly: called **once, on drop**, never per mousemove. It launders the list through `TASKHUB_COLUMNS` on the way in, so what lands in state is always full, valid and duplicate-free.
- **Task 3 was already done by 1.10** and was verified rather than rebuilt: `renderTaskHubTable()` builds header and cells from `taskHubColumns()`. `TASKHUB_COLUMNS` is still the definition of what a column IS.
- `CACHE_NAME` bumped **v79 → v80**. `index.html` **not touched** this session.

### One defect found and fixed inside the session, by the harness

- **The drop handler must NOT re-render the table, and the first version did.** `renderTaskHubTable()` on mouseup replaces the `<th>` before the browser dispatches the trailing `click`. That click then has no live target, `taskSuppressNextHeaderClick` is never consumed, and **the user's next genuine header click silently fails to sort** — one gesture later, which is why a state check right after the drag looks fine. Removed: the live shift already left the DOM in exactly the state a re-render would rebuild.
- Belt-and-braces for the same class of failure: the thead `mousedown` handler now clears `taskSuppressNextHeaderClick` on entry. A click always precedes the next mousedown, so a flag still standing at that point never reached a sort listener at all. The difference between "one dead click after a drag", which is the intent, and "every header click dead from now on".

## Files changed

**Modified:** `app.js` (`setTaskHubColumnOrder` added after `setTaskHubColumnWidth`; `taskHubHeaderCells` / `taskHubSwapAdjacentColumnCells` / `taskHubDropLine` / `showTaskHubDropLine` / `hideTaskHubDropLine` added after `taskHubInResizeZone`; the zones-2-and-3 branch of `initTaskHubHeaderDrag` filled in, plus the flag-clear on mousedown entry), `style.css` (`#taskhub-thead th.taskhub-col-dragging` and `#taskhub-drop-line` appended to the `✅ TASKHUB LAYOUT` block), `sw.js` (`CACHE_NAME`).
**Untouched:** `index.html`, `renderTaskHubTable`, `TASKHUB_COLUMNS`, the C15 resolver, the resize branch, `setTaskHubColumnWidth`, `generateSettingsCSV` / `restoreSettingsFromCSV`, `wipeAllData`, `ensureStateDefaults`, every completion and history path, the other five hubs.

## Backup coverage (DIRECTIVES §4)

**No new store of user-writable data.** This session writes `order` into `state.columnLayouts.taskhub`, a store C15 created and C17 already covers, through the single `["Column Layouts", <json>]` row in `prm_settings.csv`. **Proved again for a reordered layout, not assumed:** a real export → `wipeAllData()` (layout → `{}`) → `processRestoreFile()` returned `order` and `widths` character-identical, and the restored table renders in the restored order. Nothing here is uncovered.

## Assumptions made

- **A reorder writes `order` and does not re-render** (see the defect above). Reversible, but reversing it re-opens the swallowed-click bug — if a re-render is ever needed here it must be deferred past the trailing click, not called inline.
- **The drop indicator marks the dragged column's LEFT edge**, not the boundary between neighbours. With the real cells shifting live, the dragged column is already sitting in its landing place, so the line reads as "this is where it goes" rather than as a separate preview. Cosmetic and reversible.
- **The dragged column's header fades to 0.55; its cells do not.** Fading whole columns of contact data during a drag is noise. Reversible.
- **Verification ran in headless Chromium via Playwright in the cloud sandbox, against a copy of the repo** seeded with 40 scripted contacts, 12 companies and 120 scripted tasks — **not** Michael's production database and not his browser profile. Nothing was written to his data. `index.html` was **not** modified for the harness: the pinned jszip 3.10.1 it requests from cdnjs was served from disk by a Playwright route, because the sandbox has no egress.

## Open items

- **Needs Michael's eyes — the 4px reorder threshold and the 5px resize hit zone.** Both are numbers only a real hand can judge. `TASKHUB_REORDER_THRESHOLD_PX` and `TASKHUB_RESIZE_EDGE_PX` in `app.js`; nothing else moves.
- **Needs Michael's eyes — the drop line and the faded header.** Screenshots in both themes look right; whether the gesture *feels* like a spreadsheet's is a real-hand question.
- **Carried, still open — the `dueDate: 0` / code-default-124 assumption and the five default widths** (from 1.10).
- **Carried, still open — the 20-row search cap (C14-frozen) and the results list's 220px max-height** (from 1.9).
- **Still open: the repo is PUBLIC**, and DIRECTIVES §0 compliance is still undecided. Git history is permanent; Phase 2's Firebase config and migration exports are the pressure point. Nothing real is exposed today.
- **Still open: the stale `E:` clone.** `E:\01_AppDevelopment\02_Vantage-Master-Folder\vantage-app` is six weeks behind and follows the retired pre-`ai/` protocol. Delete it or mark it clearly.
- **Not committed: 1.10 AND 1.11.** Four files from 1.10 plus three from 1.11 sit modified in the working tree on `C:`. Last commit is `25bd2ac`.
- **Deferred by Michael, 2026-08-30 — the orphan picker as a split pane.** Unchanged; needs a C8 and a §13.1 amendment if revived, and the honest implementation is making the ONE editor hostable in two places.
- **Carried forward from 1.2, unchanged:** three drill attachments in `snapshots/files/` (`file-drill12-1..3`), safe to delete once snapshot `2026-08-29_101616.json` ages out.
- **Still unverified from here:** whether the *production* profile has its own backup folder and a green chip. No session has checked it yet.
- **Backlog (found, not done — out of compartment):** `parseCSVRow()` (~8770) does not handle escaped `""` inside a quoted field — carried from 1.3. `var(--color-danger)` is used in `renderDomainsView()` and defined nowhere, so the expired-domain highlight is silently dead. Both for 1.8. **Nothing new was found this session.**
- Carried forward, untouched: compliance obligations (§0), telemetry deferred to Phase 2, sheet/CSV import at scale, `Start_Vantage.bat` retirement, the two-inspector duplication (BUILD_NOTES open risk 3).
- **Closed, do not re-raise:** §13.4 in full (resize 1.10, reorder 1.11); §15.1a's fade — **do not "tidy" it back to `display: none`**, that is the state Michael reported as broken; §15.1's reserved-vs-collapsed question; §15.3's tint and the orphan window sharing it; §15.4's picker branch; the history backfill; §14.4's bulk question; TaskHub's cyan and its row coloring; snapshot cadence; chip placement; §13.6's date picker; §13.8's hoisted inspector panel.

## Next step

**Phase 1 has one session left: 1.8 — realistic restore drill, `BUILD_NOTES` curation, phase close.** It is the phase close and always runs last; every build session it depends on (1.6, 1.7, 1.9, 1.10, 1.11) is now done. Run it from `ai/phases/phase-1-taskhub.md`, in a **new conversation**.

**What 1.11 leaves it:**

- **The restore drill must now exercise a REORDERED layout, not just a resized one.** C17's row carries `order` and `widths` together; 1.11 verified both survive a real ZIP round trip, but that ran on scripted data in a sandbox. 1.8's drill is the one that runs on real data.
- **Michael should commit before 1.8.** Seven modified files across 1.10 and 1.11 are uncommitted; a restore drill is a bad moment to have no clean point to return to.
- **The one-glance version tell for v80** is: drag a TaskHub column header sideways and see whether the column moves. If it does not, the service worker is still serving v79 — reload a second time (`sw.js` is cache-first, so the first reload after a bump still serves the OLD document).

**Carry into 1.8 and later:** `#canvas-body` is still the shared scroll owner and is still untouched. In `style.css`, **check source order before assuming a new rule wins** — the TaskHub block sits ~950 lines above `.table-scroll-container` and `.premium-table`. And a drag that shares an element with a click must never re-render that element inside its own mouseup.
