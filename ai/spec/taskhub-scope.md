# Scope: TaskHub

**Status:** Approved 2026-08-28. **Amended 2026-08-29 — see §12, §13 and §14. §12/§13 change §3 and §5; §14 REVERSES §8 and contract C5. Read §14 before touching completion, prospect history, or anything reading `getLastReachoutDate()`.**
**Supersedes:** the "task queue is derived, not stored" ruling in `sequence-feature-scope.md` §3.
**Relationship to sequencing:** TaskHub is the foundation. Sequencing is a *producer* of tasks, built around it, and is not scoped here.

---

## 1. What this builds

A sixth top-level hub. `state.tasks` becomes a first-class entity: every task belongs to exactly one prospect and carries a title, notes, a due date and an open/completed status. Tasks are created by hand from the Prospect Hub inspector or from TaskHub itself. TaskHub is the cross-prospect work queue — filterable, sortable, paginated, with multi-select and bulk due-date and completion editing.

A global setting governs whether date arithmetic counts business days or calendar days.

---

## 2. Data model

Two new top-level state entries, added through the existing defaults path exactly as `audienceLists` was.

```js
state.tasks = [
  {
    id,
    prospectId,      // required. The ONLY stored link to the prospect.
    title,           // required
    notes,           // free text, may be "". May hold a full multi-paragraph email body.
    dueDate,         // "YYYY-MM-DD", required
    status,          // "open" | "completed"
    completedDate,   // "YYYY-MM-DD" | null
    createdAt,       // "YYYY-MM-DD"
    source,          // "manual" — reserved; sequencing adds its own value later
    sourceRef        // null — reserved for the producing record's id
  }
];

state.taskSettings = {
  dateMode: "business" | "all"   // default "business"
};
```

**First name, last name and company are never stored on a task.** They are looked up from `prospectId` at render time. Denormalizing them would leave stale rows across TaskHub the first time a prospect is renamed.

**`source` / `sourceRef` exist from day one and are deliberately unused.** They are the difference between sequencing being additive later and being a migration over every task in the system by then. Gate B reversibility, one line each.

`state.taskSettings` is user-writable data, so DIRECTIVES §4 applies to it as much as to the tasks themselves — it needs backup coverage, not just the array.

### Merge fields are not a TaskHub concern

`Dear [First Name]` is a **sequencing** feature. Consistent with the 2026-08-27 enrollment-snapshot decision, the sequence resolves merge tokens at task-creation time and writes literal text into the task's `notes`. A task never stores an unresolved token, and TaskHub needs no merge-field awareness at all. A manual task is plain text.

The consequence for this phase: `notes` must comfortably hold a full multi-paragraph email body, which makes the multiline CSV round-trip test in §3 load-bearing rather than pedantic.

---

## 3. Backup and restore — Gate C and DIRECTIVES §4

Non-negotiable, and built **second**, before any UI.

- `exportTasksCSV()` added to the ZIP bundle, plus coverage for `taskSettings.dateMode`.
- Columns: `Task ID`, `Prospect ID`, `First Name`, `Last Name`, `Company`, `Task Title`, `Notes`, `Due Date`, `Status`, `Completed Date`, `Created At`, `Source`, `Source Ref`.
- **`First Name` / `Last Name` / `Company` are export-only.** They exist so the CSV is readable by a human. Restore ignores them entirely and keys on `Prospect ID`. State this in the restore function itself, or a future session will read them back in and reintroduce the staleness problem.
- `Notes` will contain commas and newlines as a matter of course once sequencing writes email bodies into it. The existing `convertToCSV` quoting should handle it — **verify with a deliberately multiline, comma-laden note in the restore test.** This is the most likely place for the round trip to break.
- `restoreTasksFromCSV()` wired into the `processSingleCSVContent()` router like every other entity.
- `ensureStateDefaults()` gains `if (!state.tasks) state.tasks = [];` and a `taskSettings` default.

### Orphan rule

If a restored task's `prospectId` doesn't resolve, the task is **kept**, rendered as "(missing prospect)", and the restore reports how many. Tasks are never silently discarded — that is the worst failure a backup system has, and Gate C exists to prevent exactly it.

Orphans must be **resolvable by hand**, which requires two things:

1. ~~The task editor's prospect field is an **editable picker**, not a read-only label. This also fixes the ordinary case of having filed a task under the wrong person.~~ **Superseded 2026-08-29 — see §12.** The prospect is wired to the task and the everyday editor cannot change it.
2. ~~TaskHub gets a **"Missing prospect"** filter chip that appears only when the orphan count is above zero, so they can be found rather than hunted.~~ **Refined 2026-08-29 — see §12.** Still a chip that appears only above zero, but it opens a resolution window rather than filtering the table.

---

## 4. Prospect Hub inspector

*Interim, for this phase only.* The full-screen prospect detail view is Phase 2; when it lands, this subsection becomes a tab. See `prospect-detail-view-scope.md`.

The memberships area gains three labeled, individually clickable subsections:

**Campaigns** · **Audiences** · **Tasks**

Clicking a campaign or audience row navigates to that record. Clicking a task row opens the task editor **inline in the inspector** — it does not jump to TaskHub, which would discard the context the prospect was opened for.

The Tasks subsection is a two-column table: **Due Date · Title**. It shows **all** tasks for the prospect, completed included, sorted **due date descending** — furthest-out first, oldest last. A **+ New Task** button sits in the subsection header; the prospect is implied, so the form asks only for title, due date and notes.

Built with `createElement` + `appendChild`. `innerHTML +=` destroys listeners in this inspector — established rule, already bit the audience panel.

---

## 5. TaskHub

**Navigation.** Sixth top-level hub alongside Dashboard, Prospect, Media, Campaign and Data Management. Needs its own color — see open questions.

**Default view.** All open tasks, sorted due date ascending, so past-due sits at the top. Overdue work is never hidden behind a filter click.

**Filter strip.** All Open (default) · Past Due · Due Today · Upcoming · Date Range · Completed. Same tab-button component as audience status and campaign phases. ~~*Missing Prospect (only when >0)*~~ — **moved out of the filter strip 2026-08-29; it is not a filter. See §12.**

**Table.**

| ☐ | Due Date | First Name | Last Name | Company | Task Title |

- **The row checkbox is pure selection.** It carries no state of its own and changes nothing about the task. It only marks which rows the next bulk action applies to. There is no per-row completion control anywhere in TaskHub.
- Every header sorts, ascending and descending. Default is Due Date ascending.
- Row color follows the existing convention: overdue red, due today green, everything else default.
- Pagination: 25 or 50 per page.
- Selection is tracked in a `Set` that survives page turns within one filter run, reusing the Advanced Query pattern rather than inventing a new one. Changing any filter clears the selection.
- A task completed while the active filter excludes completed tasks **stays visible, struck through and dimmed**, until the filter changes or the view reloads. Rows never vanish under the cursor mid-pass.

**Bulk action bar** — appears once ≥1 row is selected, showing the count:

- **Edit Due Date** (see §6)
- **Mark Complete** — confirms with the count, sets `status` and `completedDate`, and logs one history entry per task (see §8)

**Task editor.** Opens on row click, and is the same window used to create a task. Contains: due date (text entry and date picker), an editable **prospect picker**, title, notes, status — and **Delete**. Completing a single task happens here and nowhere else. There is no bulk delete: completed history is worth preserving, and a mistyped task is rare enough to delete one at a time.

---

## 6. Bulk due-date editor

One modal, two modes, applied to the checked tasks:

**Shift by N days.** `[− / +] [N]`. Counts business days when `dateMode` is `"business"`, calendar days when `"all"`. This is the out-of-office case: select everything due across the days you're gone, add 2, everything slides.

**Set to a specific date.** Text entry or date picker. Every selected task lands on that date.

Both confirm with the affected count before committing.

**Completed tasks in the selection are skipped, and the skip count is reported.** Retroactively moving the due date of finished work is never the intent.

---

## 7. Business-day rules

The setting governs **counting, and nothing else**.

- Step day by day from the task's current due date, counting only Mon–Fri, until N weekdays have been counted. The starting date is **not** normalized first.
  - Due **Saturday**, `+2` business days → **Tuesday** (Mon = 1, Tue = 2).
  - Due **Saturday**, `−2` business days → **Thursday** (Fri = 1, Thu = 2).
  - Due **Friday**, `+2` business days → **Tuesday**.
- When `dateMode` is `"all"`, the same arithmetic counts calendar days.
- A date typed or picked by hand is **always honored**, weekend or not. Nothing snaps, nothing warns, nothing fights the date picker.
- **Changing the setting is never retroactive.** It changes future arithmetic; it does not move existing tasks. A future session must not "helpfully" migrate them.
- **No holiday calendar.** Mon–Fri only. Thanksgiving is a working day as far as Vantage is concerned — the workaround is the bulk shift, which is cheaper than maintaining a calendar.

---

## 8. Completion writes prospect history

Completing a task appends an entry to that prospect's history, whether completed singly in the task window or in bulk from the action bar.

`getLastReachoutDate()` derives "last reachout" from history and feeds the Advanced Query date filters. Once TaskHub is where work actually happens, those filters go stale unless completions land there — and the failure is invisible, because the filters keep returning results, just wrong ones. Backfilling later is a migration over every completed task.

> **Verify before building.** The exact shape of a history entry, and how `state.reachoutTypes` is registered, has not been read out of `app.js`. Session 1 confirms the real shape first. Working assumption: a new reachout type — "Task Completed" — registered into `state.reachoutTypes`, with the task title carried in the entry's note. Do not implement against this assumption without checking it.

---

## 9. Out of scope

No recurring tasks. No task types or priority. No assignment or ownership — single user. No reminders or notifications. No bulk delete. No tasks against companies; prospect only. No holiday calendar. No sequencing. No prospect detail view — that is Phase 2.

---

## 10. Open questions

1. **Hub color.** Dashboard blue, Prospect purple, Media orange, Campaign green, Data red are taken. Teal is the obvious next.
2. **"Select all N matching" across pages,** or page-level select-all only? The out-of-office shift is exactly the case that wants the former.

---

## 11. Build order

Contract-first. Backup lands before UI, per DIRECTIVES §4.

1. **Contract session.** Freeze the task record shape, the `taskSettings` shape, and the CSV column contract. Nothing else.
2. **Data model + backup/restore.** Defaults migration, export, restore router, orphan handling. Ends with a real restore test including a multiline, comma-laden note.
3. **Prospect inspector.** Three subsections, create task, task editor with delete. (Prospect picker removed — see §12.1.)
4. **TaskHub table.** Nav, hub color, filters, sortable headers, pagination, color coding, **and the Missing Prospect chip + resolution window (§12.2).**
5. **Selection + bulk complete + history logging.** Verify the history entry shape against `app.js` first.
6. **Bulk due-date editor, business-day arithmetic, global setting.**
7. **Restore drill with realistic data, and the `CACHE_NAME` bump.**

---

## 12. Amendment 2026-08-29 — the prospect is wired; orphans get their own window

Decided mid-Session 1.4, after the everyday editor shipped with a prospect picker in it. Two changes.

### 12.1 The prospect is wired to the task (supersedes §3 item 1)

**Both halves of §3's orphan handling live in TaskHub. Neither belongs to the Prospect Hub inspector.**

The prospect renders as fixed text everywhere in the ordinary workflow. A task belongs to the person it was created under, and nothing in the everyday path can move it.

**The Prospect Hub inspector never shows a prospect picker, in any state.** Not on create — the prospect is the inspector you are standing in. Not on edit. There is no case where it should: an orphan resolves to no prospect, so it appears in no inspector's Tasks list and cannot be opened from one.

A picker appears only in TaskHub, and only in two places, neither of them a workflow choice:

1. **The orphan resolution window** (§12.2) — the restored-orphan case §3 exists for.
2. **TaskHub's "+ New Task"**, which has no inspector to inherit a prospect from.

As built in Session 1.4 the shared editor carries the test `isOrphan || (isNew && !prospectId)`, which produces exactly this behavior today. Once §12.2's window exists it is the orphan surface, and the editor's `isOrphan` branch is redundant — **1.5 should delete it rather than leave two ways to reassign a contact.** The `isNew && !prospectId` half stays; that is TaskHub's create path.

**Known cost, accepted:** a task filed under the wrong person cannot be corrected in place — delete and recreate. §3 item 1 bought that correction as a side effect of the picker, and it is what was traded away to make the common path safe. If it becomes painful the answer is an explicit **"Move task"** action, deliberately invoked; not putting the picker back in the editor.

### 12.2 Missing Prospect is a chip that opens a resolution window (refines §3 item 2, §5)

Not a filter. Filtering the table to orphans still means opening each row one at a time, and the expected action is deletion, so the list should do the work.

- **The chip lives in TaskHub only**, and renders **only when the orphan count is above zero** — no empty state, no permanently visible zero. Count on the face of it.
- **Clicking it opens a window listing every orphaned task**, one row each, showing enough to decide: due date, title, and the unresolved `prospectId` as stored.
- **Each row resolves two ways: assign a contact, or delete.** Per row, acted on in place, list updates without closing.
- Deletion is the expected common case — it should be one click plus a confirm, not a trip through the editor.
- When the last orphan is resolved the window closes and the chip disappears.

**This is load-bearing, not a nicety.** Orphans appear in no prospect inspector by definition, so without this window an orphaned task is unreachable and §3's "tasks are never silently discarded" guarantee quietly becomes silent loss. Do not descope it.

**Owner:** Session 1.5, with the TaskHub view.

---

## 13. Amendment 2026-08-29 (second) — orphan repair moves into the editor; the table becomes configurable

Michael's review pass on Session 1.5, the same day it shipped. Four changes. §13.1 partially reverses §12.2, decided a few hours earlier; the reasoning for the reversal is recorded here and in `ai/DECISIONS.md`.

### 13.1 The orphan window lists; the editor repairs (supersedes §12.2's per-row controls)

§12.2 put assign-and-delete controls on each row of the resolution window, on the reasoning that "the expected action is deletion, so the list should do the work." That is now overruled. **The window is a list and nothing more.**

- Each row shows enough to identify the task — due date, title, the stored `prospectId` verbatim — and **the whole row is a click target**. There are no per-row Assign, Delete, or select controls.
- Clicking a row **opens the ordinary task editor**, the same window the Prospect Hub inspector opens, with two differences: the contact field is an editable **search** (§13.2), and Delete is present.
- Saving or deleting from that editor refreshes the list behind it without closing it. When the last orphan is resolved the window closes and the chip disappears, as before.

**What this reverses, stated plainly.** §12.1 removed the prospect picker from the editor and told Session 1.5 to delete the `isOrphan` repair branch, which it did. That branch comes back. The distinction that made §12.1 right is **preserved and load-bearing**: the picker is revealed on `isOrphan` and on create-with-no-implied-prospect, and on nothing else. It is never revealed for an ordinary edit. A task filed under the wrong person still cannot be corrected in place — that cost, accepted in §12.1, is unchanged. Widening the test to "editing" remains forbidden.

**Why the reversal is right.** §12.2 optimized for the expected action being deletion. But an orphan is a task whose *content* is the only evidence of what it was for, and the list row cannot show notes. Deciding whether to reattach or discard means reading the task, which means opening it. The window was making the cheap case one click and the correct case impossible.

### 13.2 A contact search replaces every full-list prospect dropdown

`#task-prospect` is a `<select>` populated with every contact in the database. At four seed contacts that is fine; at hundreds or thousands it is unusable, and the orphan-repair path is the one where picking the right person matters most.

- Replaced by a **type-to-search field**: text query in, matching contacts out, one click or Enter to choose.
- **Applies everywhere a prospect is picked in a task path** — orphan repair *and* TaskHub's "+ New Task". Same defect, same component, built once.
- **An empty query shows nothing**, not the full list. That is the entire point.
- The Prospect Hub inspector is unaffected: it passes its prospect in and shows fixed text, per §12.1.

### 13.3 TaskHub's header block is stationary; only rows scroll

Everything above the task rows — view title, Missing Prospect chip, "+ New Task", the filter strip, the per-page and summary line, and the column header row — stays fixed. The rows scroll underneath it.

The Advanced Query results modal already does this (`flex-grow: 1; overflow-y: auto; min-height: 0` on its scroll wrapper). Reuse that, do not invent a second pattern.

### 13.4 Columns are resizable and reorderable, and the layout persists

Like a spreadsheet.

- **Resize** by dragging a column's right border in the header.
- **Reorder** by dragging a column header sideways; the columns to its right shift to make room, live, during the drag.
- **The layout survives a reload, a backup, and a restore.** This is a new store of user-writable data and it gets DIRECTIVES §4 coverage in the settings CSV — see the phase plan's contract C17.
- **Built generic, applied to TaskHub first.** The record is keyed by table id so Prospect Hub, Media Hub and the Advanced Query results can adopt it without a second implementation. Only TaskHub is wired up in Phase 1.
- The leftmost selection checkbox column is **neither resizable nor reorderable**. It is structural, not data.
- **Sorting must keep working.** A header click that does not become a drag still sorts. This is the interaction most likely to break.

### 13.5 The editor's Status dropdown becomes a "Mark complete" checkbox

A two-value `<select>` is a dropdown doing a checkbox's job, and it sits at the bottom of the modal where the act of finishing a task is the least prominent thing in it.

- Replaced by a single **"Mark complete"** checkbox, placed **at the top** of the editor.
- **The data model does not change.** Contract C1's `status` stays `"open" | "completed"` and `completedDate` behaves exactly as now — checked sets them, unchecked clears `completedDate` and returns the task to open. Only the control changes.
- Absent when creating: a task being created is not being completed. Same rule the Status field follows today.

### 13.6 Not changed — the due-date picker already exists

Raised in review and closed without work. `#task-due-date` is `<input type="date">`, which is keyboard-typable *and* carries Chrome's native calendar — the small glyph at the right edge of the field opens it. Recorded here so it is not re-raised. A richer custom calendar would mean a date-picker library, and DIRECTIVES §4 makes a new dependency a stop-and-ask; it has not been asked.

### 13.7 The prospect name in the task editor is a link to that contact

Clicking the fixed prospect text in the task editor closes the editor and opens that contact in the Prospect Hub inspector. A task exists because of a person, and reading the task is exactly when you want the rest of what you know about them.

- Applies to the **fixed-text** state only. In repair mode the field is a search box, not a name.

**Superseded before it was built — see §13.8.** Michael, same review pass: a hub switch is the wrong answer. The point is to glance at the contact and come back, not to leave.

### 13.8 The prospect name navigates; Phase 2 owns the destination (supersedes §13.7, then reduced to it)

**Resolved 2026-08-29, in the same conversation that raised it.** This section briefly proposed one hoisted, movable, resizable inspector panel across Prospect Hub, TaskHub and Campaign Hub, on the grounds that *"if there is one user interface central to the whole Vantage operation, it is the prospect inspector."* That reading held up; the **shape** did not.

**Michael chose Phase 2's full-screen detail view instead.** So Phase 1 builds none of it — no hoist, no movable panel, no resizable panel, and no third persisted store.

**What Phase 1 does build, in Session 1.9:** the fixed prospect text in the task editor becomes a link. Close the editor, `switchView("prospects")`, `selectProspect(id)`. That is three existing calls and no new surface. **Phase 2 changes what the destination looks like, not that there is one**, so the link survives the phase rather than being thrown away — which is precisely why the small version is the right one to build now and the large version was not.

**Carried into Phase 2's intake** (`prospect-detail-view-scope.md` now holds all of it): reachable from Prospect Hub, TaskHub, and **Campaign Hub's audience lists** — clicking a prospect inside an audience — and **not Media Hub**; bounded by the sidebar in both its states; and **the back arrow restores the origin, not just the origin view** — opened from a task's editor, back reopens that editor. `openTaskEditor(taskId)` rebuilds the modal from state on every call, so that is one call against a remembered id.

**Unsaved edits: save before navigating.** The prospect name is clicked from inside the editor, so committing what was typed and then going to look is the natural reading — and it means nothing has to be stashed and reconciled on the way back. If `saveTaskFromEditor()`'s validation fails, **do not navigate**; surface its alert and stay.

**The duplication problem does not go away, it moves.** `renderInspector()` (245 lines, 24 ids) and `renderAqInspectorDrawer()` (190 lines, 16 ids) still render the same records twice and have already drifted — Session 1.4's Tasks subsection exists in one and not the other. Phase 2 replacing the Prospect Hub inspector is the moment that gets fixed or gets permanent. `BUILD_NOTES.md` open risk 3 stays open until then.

**Owner:** Sessions 1.9 (§13.1, §13.2, §13.5, and §13.8's link), 1.10 (§13.3, resize + the store), 1.11 (reorder). §13.6 is closed, no owner. **There is no Session 1.12** — §13.8 reduced to a three-line link inside 1.9, and everything larger moved to Phase 2's intake.

---

## 14. Task completion is a timeline record, not a reachout (REVERSES §8)

**Decided 2026-08-29 by Michael, hours after Session 1.6 shipped §8 as written.** §8 is superseded. Read this before touching completion, history, or anything that reads `getLastReachoutDate()`.

### 14.1 What was wrong with §8

§8 argued that once TaskHub is where work happens, task completions must land in reachout or the Advanced Query date filters go stale. The argument is sound; **its premise is not.** A reachout is contact with a human — an email, a DM, a phone call. Most task completions are not contact. "Research Jane's company before the call" is internal preparation, and counting it as a reachout walks Jane's last-contact date forward without anyone having spoken to her.

That is the same invisible-failure class §8 was written to prevent, pointed the other way: the filters keep returning confident answers, and the answers are wrong. **A reachout number that counts your own prep work is not measuring contact.**

### 14.2 What is true now

- `"Task Completed"` **is in `NON_REACHOUT_TYPES`**, alongside `"Added to Vantage"` and `"Entered into Vantage"`. It is a timeline entry and nothing more.
- The entry is **still written** on every completion, single or bulk. It still appears on the prospect's history, so "what did I do for this person" remains answerable in one place. Only the reachout math changed.
- It does not move `getLastReachoutDate()`, does not feed the Advanced Query date filters, and is not counted in the dashboard's reachout total.
- `NON_REACHOUT_TYPES` and `isRealReachout()` are now **module-scope in `app.js`, defined immediately above `getLastReachoutDate()`** — one list, three readers (`getLastReachoutDate`, `renderDashboardView`, `openInteractionModal`). The duplicate local copy inside `renderDashboardView()` is gone. Adding a non-contact type is now one edit.
- The manual "log a reachout" dropdown offers **contact types only**. All three non-contact types are filtered out of it, which also removes the pre-existing oddity of being able to hand-log `"Added to Vantage"` as outreach.
- **`state.reachoutTypes` is unchanged and C6 still stands.** The type stays registered, in both the first-run literal and the `ensureStateDefaults()` push. Removing it would change what CSV restore does for no benefit — the exclusion belongs in the reachout math, not the registry.

### 14.3 What this closes

**The history backfill question is closed with no work, permanently.** It only mattered under §8's premise. Tasks completed in the editor between Sessions 1.4 and 1.6 have no history entry, and under §14 that is the correct state — those completions were never reachouts. Do not backfill them. Do not re-raise it.

### 14.4 Transposition — the part worth building (Session 1.9)

A task that **was** contact should log a real reachout of the right type. Completing "Email Jane about the RFP" should write an `Email` entry with the task title as its content — not a generic `"Task Completed"`, and not nothing.

**Session 1.9 owns it**, because 1.9 already has the task editor open for §13.2 and §13.5. The shape: a "log this as a reachout" checkbox plus a type `<select>` at the point of completion, defaulting to unchecked. When checked, `logTaskCompletionHistory()` writes the chosen contact type instead of `"Task Completed"` — one branch in the existing single writer, not a second history path. **Do not add a second function that writes history.**

Open at the time of writing, for 1.9 to settle: whether the bulk Mark Complete offers this too (one type applied to the whole selection), or whether transposition is single-completion only. The safe default is single-only — a selection of twelve tasks rarely shares one contact type, and getting it wrong writes twelve wrong reachouts at once.

---

## 15. Amendment 2026-08-30 — the bulk bar moves up; the hub is exactly one screen tall

**Michael, reviewing Session 1.9's shipped TaskHub.** Two changes, both **owned by Session 1.10**, both pure layout. No data model change, no new store, no frozen contract touched. §15.2 extends §13.3 rather than superseding it — §13.3's rule (everything above the rows is stationary; the rows scroll under it) is unchanged and still correct; §15.2 pins down *how tall* the thing is.

### 15.1 The bulk action bar moves to the top block

`#taskhub-bulk-actions` is currently the **last child** of `#view-tasks`, below the Prev/Next pagination row — so the controls for acting on a selection sit at the bottom of the screen while the rows you are selecting are above them.

- It moves to sit **directly beneath the filter strip** (`#taskhub-filter-tabs`, and beneath `#taskhub-range-group` when the Date Range filter has revealed it) and **directly above the Per Page / summary row**.
- **The bar itself does not change** — same id, same four controls (`23 selected` · Mark Complete · Edit Due Date · Clear Selection), same show/hide-at-zero-selected behavior, same handlers. This is a move in `index.html`, not a rebuild. `renderTaskHubBulkBar()` and `syncTaskHubSelectionUI()` are untouched.
- **Prev / Next stays exactly where it is**, below the table. Confirmed by Michael, 2026-08-30. Do not move it while moving the bar.

**The space it occupies is RESERVED, not collapsed.** This is the one real decision in §15.1 and it is not cosmetic. The bar is hidden at zero selected; if it simply appears when the first row is ticked, it pushes the table — and therefore every row — **down by its own height, under the cursor, at the exact moment the user is clicking down a list.** The next row they reach for is no longer where they aimed. That is the same class of failure as the checkbox-rerender trap already in `BUILD_NOTES` (a per-row control that moves the thing it is attached to), arriving from a different direction.

So the slot keeps its height whether or not anything is selected: the *contents* toggle, the *box* does not. In a fixed-height panel (§15.2) this costs one strip of height permanently and buys a table whose rows never move. DIRECTIVES ladder rung 1 (stability) and rung 2 (no layout shift) agree, so the call is made here rather than left to the session. Reversible if the reserved strip reads as dead space in practice.

### 15.2 TaskHub is exactly the screen height, and only the task list scrolls

> "I want the window containing the tasks to be the vertical height of the screen minus the header. The idea is you don't have to ever scroll the screen but instead you scroll tasks inside the task window."

- `#view-tasks` fills the available height exactly. **The page never scrolls while TaskHub is active** — the only scrollbar in the hub is the one inside the task list.
- Everything outside the list — the orphan chip / New Task row, the filter strip, the range inputs, the bulk bar slot, the Per Page / summary row, the table's own header row, and the Prev/Next row — is stationary. The rows scroll under all of it. That is §13.3, restated because §15.2 is what makes it achievable.

**Height is inherited, never computed.** `#main-canvas` is already `height: 100vh; display: flex; flex-direction: column; overflow: hidden`, and `#canvas-body` is its `flex-grow: 1` child. "Screen minus header" is therefore **`height: 100%` on the active panel**, not a `calc(100vh - 80px)` — the flex layout already knows the number, and a hard-coded header height is a second copy of it that goes stale the first time the header wraps on a narrow window. This is the same rule `BUILD_NOTES` records for the sidebar: never recompute an offset the layout has already solved.

**`#canvas-body` is shared by all six hubs and must not be changed.** It is the app's current scroll owner (`flex-grow: 1; overflow-y: auto`). Taking its overflow away, or giving it a fixed height, changes Dashboard, Prospect Hub, Media Hub, Campaign Hub and Data Management at the same time. The correct move is to leave it alone and make `#view-tasks` fill it and manage its own overflow, so that when TaskHub is active `#canvas-body` simply has nothing to scroll. **The other five hubs must be verified unchanged** — that is the cascade this amendment is most likely to cause.

**Owner:** Session 1.10, alongside §13.3 and §13.4's resize half.

### 15.3 The column header row gets TaskHub's color

The header row (`DUE DATE · FIRST NAME · LAST NAME · COMPANY · TASK TITLE ▲`) currently renders in the table's default grey and reads as another row of the table rather than as its header.

- It takes **TaskHub's cyan**, following the hub-color convention in DECLARATIONS — Dashboard blue, Prospect Hub purple, Media Hub orange, Campaign Hub green, Data Management red, TaskHub cyan. Not an arbitrary color: the hub already themes itself through `body.module-tasks` (`--color-primary: #06b6d4`, and `#0891b2` under `.light-theme`).
- **Tinted, not saturated.** This is a header above other people's contact details; it must separate itself from the data without competing with it. A low-alpha cyan fill with the label text in the hub color, not a solid cyan bar with white text.

**Chosen: an 18% cyan tint. Michael, 2026-08-30, from a rendered three-option comparison** at 10% / 18% / 28% in both themes. 10% was indistinguishable from the grey it replaces in the light theme — the work without the signal; 28% read as a UI element demanding attention rather than a label strip. **Ship these exact values:**

| | `th` background | `th` label text |
| --- | --- | --- |
| Dark (`body.module-tasks`) | `#0c2c31` | `#06b6d4` |
| Light (`body.module-tasks.light-theme`) | `#b0cad0` | `#0891b2` |

**Those backgrounds are the 18% tint ALREADY COMPOSITED over the panel, and that is the whole trick.** They are what `color-mix(in srgb, var(--color-primary) 18%, transparent)` resolves to once painted over the table wrapper's backdrop — sampled from the rendered pixel, not calculated by hand. So the header *looks* semi-opaque and *is* fully opaque, and §13.3's sticky header cannot show rows through it. **Do not "simplify" these back to an `rgba()` or a `color-mix()` with transparent** — that reintroduces exactly the bug the opaque requirement exists to prevent, and it only shows up once the list is long enough to scroll.

**The label text is a separate lever from the fill.** Most of what makes this read as TaskHub's header is the cyan text, not the background. If the fill is ever judged too heavy, mute the text before darkening or lightening the fill.

**The orphan resolution window's table gets the same header** (Michael, 2026-08-30, for consistency). `#modal-task-orphans` is reachable only from TaskHub and is the same kind of table, so its `DUE DATE · TASK TITLE · STORED PROSPECT ID` header should not read as a different component.

**One shared class serves both tables — measured, not assumed.** The orphan window's table sits on `.modal-card` over a blurred overlay rather than on the hub panel, so the same 18% tint composites to a *different* solid there: `#0d2d33` dark and `#b3ccd2` light, against the hub panel's `#0c2c31` and `#b0cad0`. Those differ by **at most 3/255 per channel**, which is invisible. So define **one** class with the hub-panel values and put it on both `<thead>`s. Two near-identical hard-coded values for the same visual element is how a palette drifts: someone retunes one and not the other, and nobody notices for months.

**The orphan window's header is not sticky and does not need opacity for its own sake** — it inherits the opaque value because it shares the class, which is the point. Do not "optimize" it back to a transparent tint on the grounds that this table does not scroll; that splits one look into two mechanisms and re-opens the question every time someone reads it.

**Two constraints, both non-optional, and §13.3 is why the first one exists:**

1. **The background must be fully OPAQUE.** The header row goes `position: sticky; top: 0` in the same session, and a sticky header with a transparent or semi-transparent background lets the rows scroll *visibly through* it. A tinted fill must therefore be composited over the panel's own background rather than expressed as a bare `rgba()` on a transparent element — otherwise the feature and the color break each other, and it only shows once there are enough rows to scroll.
2. **It needs a `.light-theme` override**, like every other TaskHub color class. The screenshot that prompted this is the light theme, which is exactly where a dark-theme-only value fails.

**Define real classes with literal values; do not invent a token.** `var(--color-danger)` is used in `renderDomainsView()` and defined nowhere, which is why the expired-domain highlight is silently dead — an undefined custom property makes the whole declaration invalid at computed-value time and the element just inherits, with no error. The file's convention for these states is a real class with a literal hex plus a `.light-theme` sibling, as `.taskhub-row-overdue` / `.taskhub-row-today` already do. Follow those.

**Verify it visually.** A computed-style probe is not sufficient evidence for "the header looks like a header" — and per the 1.9 review-pass finding, a passing class check is not evidence the user can see the thing. Screenshot both themes.

**Owner:** Session 1.10, with §13.3 — same element, same session, and the sticky change forces the opacity decision anyway.

### 15.4 TaskHub does not create tasks

**Michael, 2026-08-30.** Remove `#taskhub-new-btn` ("+ New Task") from the TaskHub header. **Tasks are created in the Prospect Hub inspector only** — by its own New Task control, or by a sequence. TaskHub is where tasks are worked, not where they are born.

The reasoning is the same one that wired the prospect to the task in §12.1: a task exists because of a person. Creating one from a list of everyone's tasks means choosing the person as a form field, which is the step most likely to be got wrong and the hardest to notice afterwards. Creating it from inside a contact's inspector makes the person structural instead of selectable.

- Remove the button from `index.html` **and its listener in `setupEventListeners()` in the same edit.** They must go together: `check_ids.py` cross-checks `getElementById()` calls in that function against ids present in `index.html`, so a listener left behind moves the standing baseline from its known pair and every later session inherits a false alarm.
- The `⚙️ Settings` button stays in that header row, as does the Missing Prospect chip slot.

**Consequence, and it is the interesting part: this retires the second half of the picker test.** `openTaskEditor()` reveals the contact search when `isOrphan || (isNew && !prospectId)`. TaskHub's "+ New Task" was the *only* caller that produced `isNew && !prospectId` — every inspector create passes a prospect in. So after this change **the C14 contact search serves orphan repair and nothing else**, and §13.2's "applies everywhere a prospect is picked in a task path" resolves to one path rather than two. That is a narrowing of §13.2's reach, not a repeal of it: the component and its contract are unchanged.

**DELETE the `isNew && !prospectId` branch. The picker test becomes `isOrphan` alone.**

This was argued the other way first — keep the branch as a safety net, on the reasoning that a future create-without-prospect surface would otherwise hit *"Pick a prospect for this task."* with no control to satisfy it. **Michael overruled it, 2026-08-30, and the override is the stronger position:** *"I never want to create a task without a prospect. In fact I want to prevent that on purpose."* The dead end is not a failure mode to be guarded against — it **is the guard**. A branch that would let a future surface create a prospect-less task is not a safety net; it is the hole.

So after §15.4:

- `openTaskEditor()` reveals the contact search **only** when `isOrphan`.
- `saveTaskFromEditor()`'s existing `if (!prospectId) { alert("Pick a prospect for this task."); return false; }` is **the enforcement, and it is deliberate.** Do not remove it, and do not "improve" it into something that invents or defaults a prospect.
- A create path that somehow arrives with no prospect refuses to save, on purpose. **That is intended behavior, not a bug — do not fix it.**

### The distinction that must not be lost

"A task cannot exist without a prospect" is **false as stated, and believing it would destroy data.** The true rule has two halves and they are not the same:

| | Rule |
| --- | --- |
| **At creation** | **Forbidden.** No path may create a task without a prospect. Enforced above. |
| **Afterwards** | **Possible, and preserved.** A task can *become* prospect-less — a backup restored from before that contact existed, or after they were deleted. These are orphans. |

Orphans are the entire reason §3, §12.2, §13.1 and contract C14 exist. Scope §3's guarantee is that **tasks are never silently discarded**, and the Missing Prospect chip plus the resolution window are what keep an orphan reachable — it appears in no prospect inspector by definition. A future session reading "prevent tasks without prospects" as license to blank an unresolved `prospectId`, drop orphans on restore, or delete them automatically would turn orphan preservation into **silent orphan loss**, which is the exact failure the design has been protecting against since §3. `BUILD_NOTES` already carries the related warning: an orphan's hidden `#task-prospect` value keeps the unresolved id precisely so saving preserves it — do not "fix" that to blank.

**What must NOT change:** the search is revealed on `isOrphan` **and on nothing else**. §15.4 narrows the test by removing a state; it never widens it. Never widen it to "editing" — that is still the surviving load-bearing half of §12.1.

**Owner:** Session 1.10, with §15.1–15.3 — same panel, same file, same session.
