# Scope: TaskHub

**Status:** Approved 2026-08-28. No code written.
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

1. The task editor's prospect field is an **editable picker**, not a read-only label. This also fixes the ordinary case of having filed a task under the wrong person.
2. TaskHub gets a **"Missing prospect"** filter chip that appears only when the orphan count is above zero, so they can be found rather than hunted.

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

**Filter strip.** All Open (default) · Past Due · Due Today · Upcoming · Date Range · Completed · *Missing Prospect (only when >0)*. Same tab-button component as audience status and campaign phases.

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
3. **Prospect inspector.** Three subsections, create task, task editor with prospect picker and delete.
4. **TaskHub table.** Nav, hub color, filters, sortable headers, pagination, color coding.
5. **Selection + bulk complete + history logging.** Verify the history entry shape against `app.js` first.
6. **Bulk due-date editor, business-day arithmetic, global setting.**
7. **Restore drill with realistic data, and the `CACHE_NAME` bump.**
