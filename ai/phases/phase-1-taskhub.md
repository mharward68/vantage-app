# Phase 1: TaskHub

**Planned:** 2026-08-29 · Prompt 3
**Scope:** `ai/spec/taskhub-scope.md` (approved 2026-08-28, not re-opened here)
**Also delivers:** Tier 1 local snapshot backup, per `DIRECTIVES.md` §0 ("the Phase 1 session that builds this") and `AIContext.md` Next step.

---

## Goal — what's true after that isn't now

- `state.tasks` and `state.taskSettings` exist as first-class state, defaulted through `ensureStateDefaults()`, exported in the ZIP bundle and restorable from it — including a task whose `notes` holds a multi-paragraph, comma-laden email body.
- A sixth hub, **TaskHub**, sits in the sidebar in cyan. It opens on all open tasks sorted due-date ascending, filters six ways, sorts on every header, paginates at 25/50, and colors overdue red and due-today green.
- Tasks are created and edited from two places: the Prospect Hub inspector's new **Tasks** subsection, and TaskHub itself. Both open the same editor, which carries an editable prospect picker and a Delete.
- Page-level multi-select drives two bulk actions: **Mark Complete** and **Edit Due Date** (shift by N days, or set to a date), with business-day or calendar-day arithmetic behind a global setting.
- Completing a task — singly or in bulk — appends a `"Task Completed"` entry to that prospect's `history`, so `getLastReachoutDate()` and the Advanced Query date filters stay truthful.
- Vantage writes automatic local snapshots to the chosen backup folder on a debounce, confirms each one by reading it back, prunes them on a retention schedule, and has been restored **from** one.
- Vantage tells the truth about whether it is protected: a sidebar chip driven by a staleness watchdog, red whenever the last confirmed snapshot is older than the last mutation — for any reason, including reasons nobody anticipated — and clickable to fix. A failed snapshot stays failed until a confirmed write clears it, and never degrades into a download.

## Out of scope

Everything in scope §9 — recurring tasks, task types, priority, assignment, reminders, bulk delete, company tasks, holiday calendar, sequencing, the full prospect detail view.

Plus three this plan adds:

- **The Advanced Query inspector drawer** (`renderAqInspectorDrawer`) does not get a Tasks subsection. See Assumptions.
- **Telemetry.** Gate D is inert until hosting (DIRECTIVES §0).
- **Accessibility conformance.** Gate F is inert; the three §0 authoring habits apply to new markup and are not a gate. No session is blocked on them.

## Assumptions

1. **The contract session is this document.** Scope §11 item 1 is a contract-only session. Its two named prerequisites — the history entry shape, and how `state.reachoutTypes` is registered — were read out of `app.js` during this planning pass and are frozen literally below, along with the CSV and router contracts, which also turned out to be knowable from the code. Freezing them here rather than spending a session round-trip satisfies contract-first in substance: nothing is built until the interfaces are written down and immutable. **The Frozen contracts section is read-only from this point.** Changing one is a plan revision.

2. **The AQ inspector drawer stays as it is.** `renderAqInspectorDrawer()` duplicates the Prospect Hub inspector's history and memberships rendering against `aq-insp-p-*` ids. Scope §4 names only the Prospect Hub inspector. Adding the Tasks subsection to both means writing it twice into a surface that Phase 2's full detail view replaces anyway. Accepted inconsistency, recorded in `BUILD_NOTES.md` at phase close so a future session doesn't read it as an oversight.

3. **Hub color is cyan/sky, not teal.** Decided 2026-08-29. Teal `#14b8a6` sits ~13° of hue from Campaign Hub's emerald `#10b981`, which is close enough that the two active sidebar tabs read as the same color, worst in light theme. Cyan holds ~29° from emerald and ~55° from Dashboard indigo. Reverses the scope §10 proposal on legibility grounds; nothing else about §10 changes.

4. **Page-level select-all only.** Decided 2026-08-29. TaskHub gets "Select page" and "Clear", not "Select all N matching" — even though `selectAdvancedQueryAll()` already exists as a four-line precedent. Reversible (Gate B: it adds a button, migrates nothing), so it is logged here rather than escalated.

5. **`state.taskSettings.dateMode` rides in the settings CSV**, not a file of its own — one `["Task Date Mode", value]` row alongside `Custom Sort Order`, which is the existing precedent for a scalar setting. This is what gives `taskSettings` the backup coverage DIRECTIVES §4 requires of it.

6. **Task completion history needs no new backup work.** `p.history` is already exported whole, as JSON, in the prospects CSV `History` column. Per `BUILD_NOTES.md` ("a feature that only mutates already-covered fields needs no new backup work"), Session 1.6 adds no export or restore code. Session 1.6's summary still states this explicitly, because DIRECTIVES §4 asks for the statement, not the code.

7. **Snapshots reuse the existing directory handle, but not the existing write path.** `saveBackupFile()` already owns a persisted `showDirectoryPicker()` handle and its re-permission check, and Session 1.1 reuses the handle rather than introducing a second one. It does **not** call `saveBackupFile()` itself — see C13 for why. Snapshots go in a `snapshots/` subfolder so the pruner can never touch a manual export.

8. **New tasks are `task-${Date.now()}`**, and restore falls back to `task-${Date.now()}-${i}` for a row with no id — matching `pros-`, `aud-`, `hist-` throughout `app.js`.

---

## Frozen contracts — written literally; later sessions treat as read-only

### C1 — Task record

```js
{
  id,              // "task-<epochMs>"
  prospectId,      // required. The ONLY stored link to the prospect.
  title,           // required, string
  notes,           // string, may be "". May hold a multi-paragraph email body.
  dueDate,         // "YYYY-MM-DD", required
  status,          // "open" | "completed"
  completedDate,   // "YYYY-MM-DD" | null
  createdAt,       // "YYYY-MM-DD"
  source,          // "manual"  — reserved; unused in Phase 1
  sourceRef        // null      — reserved; unused in Phase 1
}
```

First name, last name and company are **never stored**. They are looked up from `prospectId` at render time.

### C2 — Task settings

```js
state.taskSettings = { dateMode: "business" };   // "business" | "all"
```

### C3 — `prm_tasks.csv` column contract

```
Task ID, Prospect ID, First Name, Last Name, Company, Task Title, Notes,
Due Date, Status, Completed Date, Created At, Source, Source Ref
```

`First Name` / `Last Name` / `Company` are **export-only**, present so a human can read the file. `restoreTasksFromCSV()` ignores all three and keys on `Prospect ID`. That sentence goes in a comment inside the restore function itself.

### C4 — Settings CSV row for the date mode

```
"Task Date Mode","business"
```

Emitted by `generateSettingsCSV()` after the `Custom Sort Order` row. Read by `restoreSettingsFromCSV()` under `typeLower === "task date mode"`, guarded by a `sawTaskDateMode` flag exactly like every sibling.

### C5 — History entry, verified against `app.js`

`p.history` is an array on the prospect record. `recordInteraction()` (app.js 6932) pushes:

```js
{ id: `hist-${Date.now()}`, date, type, content }
```

A task completion appends:

```js
{ id: `hist-${Date.now()}`, date: completedDate, type: "Task Completed", content: task.title }
```

> ### ⚠️ C5 REVISED 2026-08-29 — the entry shape stands, the reachout semantics are reversed
>
> The paragraph below is **superseded** and kept only so the change is legible. Michael reversed it hours after Session 1.6 shipped it; **scope §14 is the authority.**
>
> **Now true:** `"Task Completed"` **IS** in `NON_REACHOUT_TYPES`, alongside `"Added to Vantage"` and `"Entered into Vantage"`. The entry is still written on every completion and still appears on the prospect's timeline — it simply is not contact, so it never moves `getLastReachoutDate()`, never feeds the Advanced Query date filters, and is not counted on the dashboard. A reachout is an email, a DM or a phone call; "Research Jane's company" is not one. `NON_REACHOUT_TYPES` / `isRealReachout()` are now module-scope in `app.js` above `getLastReachoutDate()`, read by three call sites.
>
> **Unchanged by this revision:** the four-field entry shape above, `date` from `completedDate`, `type` exactly `"Task Completed"`, `content` the task title, the single-writer rule, and **C6 in full** — the type stays registered in `state.reachoutTypes` in both required places.
>
> **Also closed by it:** the history backfill for tasks completed between 1.4 and 1.6. It only existed under §8's premise. Do not backfill; do not re-raise.
>
> ~~*Superseded:*~~ `"Task Completed"` is a real reachout type, so `getLastReachoutDate()` counts it — that is the whole point of §8. It is not added to the `NON_REACHOUT_TYPES` exclusion list in `renderDashboardView()`.

### C6 — Registering the reachout type

`ensureStateDefaults()` (app.js ~552) gains a third idempotent push in the existing `else` branch:

```js
if (!state.reachoutTypes.includes("Task Completed")) state.reachoutTypes.push("Task Completed");
```

It must also be added to the first-run array literal on line 553. **Both** are required: `restoreSettingsFromCSV()` replaces `state.reachoutTypes` wholesale when a settings CSV contains any `Reachout Type` row, so restoring a backup taken before this phase would otherwise silently drop the type. `ensureStateDefaults()` always runs after a restore, which is what makes the push the fix.

### C7 — Restore router hook points, verified against `app.js`

The scope names `processSingleCSVContent()`. **No such function exists.** The real names:

| Path | Function | Hook |
| --- | --- | --- |
| ZIP | `processRestoreFile()` (app.js 1727, ZIP branch) | `findFileInZip(zip, "tasks.csv")`, matched by `endsWith` |
| Single CSV | `processRestoreFile()` (app.js ~1818) | `else if (fileName.includes("task"))` |
| XLSX | `processRestoreFile()` (app.js ~1877) | same `includes("task")` branch |
| Export | `exportZIPBackup()` (app.js 1156) | `zip.file("prm_tasks.csv", tasksCSV)` |
| Defaults | `ensureStateDefaults()` (app.js 455) | `state.tasks`, `state.taskSettings` |

`includes("task")` collides with none of the eight existing branches. Add it before the `setting` branch for readability; order does not matter functionally.

### C8 — Function and identifier names

```js
exportTasksCSV()                      restoreTasksFromCSV(text)
renderTasksView()                     renderTaskHubTable()
openTaskEditor(taskId = null, prospectId = null)
saveTaskFromEditor()                  deleteTask(id)
completeTask(id)                      bulkCompleteTasks(ids)
openBulkDueDateModal()                applyBulkDueDate()
shiftTaskDate(dateStr, n, mode)       // mode: "business" | "all"
renderProspectInspectorTasks(prospect)
```

Module-scope selection and paging state, mirroring `aqSelectedIds` / `aqPage` / `aqPerPage`:

```js
let taskSelectedIds = new Set();
let taskPage = 1;
let taskPerPage = 25;
let taskFilter = "open";   // open | pastdue | today | upcoming | range | completed | orphan
let taskSort = { key: "dueDate", dir: "asc" };
```

### C9 — View registration

| Thing | Value |
| --- | --- |
| View name | `tasks` |
| Nav button | `id="nav-tasks" class="nav-tab" data-view="tasks"`, icon ✅, label `TaskHub` |
| Panel | `<section id="view-tasks" class="view-panel">` |
| Body class | `module-tasks`, applied by the existing `updateThemeColors()` |
| `switchView` title | `"TaskHub"` |
| `renderApp` branch | `else if (state.activeView === "tasks") renderTasksView();` |

### C10 — Hub color tokens

```css
/* 6. TaskHub Module (Cyan) */
body.module-tasks {
  --color-primary: #06b6d4;
  --color-primary-glow: rgba(6, 182, 212, 0.15);
  --color-secondary: #0ea5e9;
  --color-secondary-glow: rgba(14, 165, 233, 0.15);
}
body.module-tasks.light-theme {
  --color-primary: #0891b2;
  --color-secondary: #0284c7;
}
```

### C11 — Business-day arithmetic

`shiftTaskDate(dateStr, n, mode)` steps day by day from `dateStr`, **without normalizing the start**, counting only Mon–Fri when `mode === "business"` and every day when `mode === "all"`, until `|n|` days have been counted. Sign of `n` sets direction. Returns `"YYYY-MM-DD"`.

The three cases from scope §7 are the frozen test vectors, and Session 1.7's Done-when runs exactly them:

```
shiftTaskDate("2026-09-05", +2, "business") === "2026-09-08"   // Sat → Tue
shiftTaskDate("2026-09-05", -2, "business") === "2026-09-03"   // Sat → Thu
shiftTaskDate("2026-09-04", +2, "business") === "2026-09-08"   // Fri → Tue
```

A date typed or picked by hand is honored as-is. Changing `dateMode` is never retroactive.

### C12 — Snapshot file naming and retention

```
<backup folder>/snapshots/vantage_snapshot_<YYYY-MM-DD>_<HHmm><ss>.json
<backup folder>/snapshots/files/<blobId>
```

Retention, per DIRECTIVES §0: last 10 rolling, plus newest-of-day for 14 days, plus newest-of-week for 8 weeks. A file surviving any one of the three rules is kept. `snapshots/files/` is **never touched by the pruner** and is deduped by blob id.

### C13 — Snapshot health: confirmation, watchdog, and loud failure

Decided 2026-08-29. DIRECTIVES §0 requires that a failed snapshot surface visibly. An `alert()` at the point of failure cannot do that here: browsers suppress dialogs during `beforeunload`, nobody is looking during `visibilitychange`→hidden, and neither catches the failure mode where the snapshot simply never ran. The contract below replaces error-catching with a positive assertion of freshness.

**D — a write is confirmed by read-back, never by return.**

`writable.close()` resolving means the write call did not throw. It does not mean the file exists. A snapshot counts as confirmed only after the file is read back from the directory and its size is non-zero. `lastConfirmedAt` is stamped there and nowhere else.

On boot, the stored timestamp is **not trusted**. The snapshots directory is listed and the newest file's timestamp becomes truth. A directory that cannot be read is itself a red state. This makes the filesystem the source of truth and `lastConfirmedAt` a cache of it.

**Health state**

```js
state.snapshotHealth = {
  lastConfirmedAt: null,   // epoch ms of the last READ-BACK-CONFIRMED snapshot
  lastMutationAt: null,    // epoch ms, stamped by saveState()
  lastError: null,         // { at, kind, message } | null
  failed: false            // sticky; see below
};
```

Epoch **numbers**, not `YYYY-MM-DD` strings. DECLARATIONS' date convention exists to avoid the timezone off-by-one bug class in user-facing dates; a two-minute debounce cannot be tracked in whole days, and an epoch integer has no parsing ambiguity at all. A future session must not "correct" these to date strings.

**`snapshotHealth` is excluded from backup and restore, deliberately.** It describes this machine's filesystem, not the user's data. Restoring a stale `lastConfirmedAt` from a ZIP taken on a healthy day would make the app claim protection it does not have — the exact lie this contract exists to prevent. It is recomputed from the directory on every boot. This is the DIRECTIVES §4 backup-coverage statement for it: **not covered, by design.**

**C — the watchdog decides the state, not the error handler**

| State | Condition |
| --- | --- |
| **Red — unprotected** | `lastMutationAt > lastConfirmedAt` by more than **5 minutes** (2 min debounce + 3 min grace), OR `failed === true`, OR no snapshot exists, OR the directory cannot be read |
| **Amber — stale** | No confirmed snapshot in **24 hours**, even with no pending mutations. The mechanism may be dead and nothing has tested it. |
| **Green** | Otherwise |

Evaluated on boot and every 60 seconds. Because red is derived from *staleness* rather than from a caught exception, it fires for causes nobody anticipated — a cleared debounce, an exception upstream of the try block, a hook lost in a later refactor.

**B — the surface is persistent, and it is also the fix**

A small health chip in the sidebar, visible from every hub, rendering the state above. **Clicking it re-grants folder permission and forces an immediate snapshot** — FSA re-granting requires a user gesture, so the only thing that can report the problem is also the only thing that can resolve it. Plus a one-shot modal on the first user interaction after entering red, once per session, so a user who ignores chips is still told once.

**Fail loudly and stay failed**

- `failed` is **sticky**. Only a read-back-confirmed write clears it. Retrying on the next debounce cycle is fine; the red state persists until a retry actually succeeds.
- **No download fallback.** The snapshot path must not call `saveBackupFile()`, which degrades to `downloadBlob()` on failure. For a manual export that is correct behavior; for a snapshot firing every two minutes it produces hundreds of files in Downloads and an app that looks fine. A failed snapshot writes nothing and goes red.
- **The snapshot path must not read `backupFolderSessionDisabled`.** `saveBackupFile()` sets that flag after one failure and falls back to downloads for the rest of the session. Inheriting it means a single failed manual export silently disables snapshots until reload.
- Never `alert()` from the `beforeunload` or `visibilitychange` paths. Those write, stamp or fail into the health state, and the state is what speaks.

---

### C14 — Contact search field (Session 1.9)

Replaces the full-list `<select>` in every task path. Three elements, and the third is what keeps the save path unchanged:

```
#task-prospect-search    <input type="text">   the query
#task-prospect-results   <div>                 the matches, built at input time
#task-prospect           <input type="hidden">  carries the chosen id
```

`#task-prospect` keeps its id and keeps carrying the prospect id, so `saveTaskFromEditor()` still reads `document.getElementById("task-prospect").value` and needs no change. It changes from a `<select>` to a hidden input; nothing else about the save path moves.

- **Matching:** case-insensitive substring against `firstName`, `lastName`, the joined `"first last"`, and the resolved company name.
- **An empty query renders nothing.** Not the full list. This is the requirement, not an optimization.
- **Cap the rendered matches at 20**, with a "…N more — keep typing" line below. A query matching 400 people must not build 400 rows.
- Keyboard: ↑ / ↓ move, Enter selects, Esc clears. (Authoring habit, not Gate F.)
- On select, the field shows the chosen contact as text with a visible way back to searching, and the hidden input is stamped.

### C15 — Column layout record (Session 1.10)

```js
state.columnLayouts = {
  "taskhub": {
    order:  ["dueDate", "firstName", "lastName", "company", "title"],
    widths: { dueDate: 104, firstName: 0, lastName: 0, company: 0, title: 0 }
  }
};
```

- **Keyed by table id**, so a second table adopts it without a second implementation. Only `"taskhub"` is populated in Phase 1.
- `order` holds column keys, not labels and not indices. Labels change; indices lie after a reorder.
- `widths` is px integers. **`0` means "unset — use the code default."** Not `null`, not absent.
- **Unknown keys in a saved layout are ignored on read, and keys missing from it fall back to the code default.** This is the migration rule and it is not optional: it is what lets Session 1.6 or a later phase add a column without a saved layout breaking, and what makes restoring an older backup safe.
- The leftmost checkbox column is not in `order` and not in `widths`. It is structural and always first.
- **`state.columnLayouts` is the app's one persisted-UI-layout record and other layout state joins it rather than starting a sibling.** Any future persisted UI layout — panel sizes, pane splits — goes in here under its own key rather than a sibling store, and rides C17's single settings-CSV row. Two stores means two migrations, two backup rows and two chances to miss one in `wipeAllData()`. Rename the field to `state.uiLayouts` at that point if `columnLayouts` reads wrong — that is a rename with a defaults migration, not a new store.

### C16 — Header drag hit zones (Session 1.10, extended by 1.11)

One `mousedown` handler on the header row owns three outcomes, decided by where and how far:

| Condition | Outcome |
| --- | --- |
| `mousedown` within **5px of the `th`'s right edge** | **Resize** that column |
| `mousedown` elsewhere on the `th`, then movement ≥ **4px** horizontally | **Reorder** (Session 1.11) |
| `mousedown` elsewhere on the `th`, released with movement < **4px** | **Sort** — the existing behavior, unchanged |

**Session 1.10 must implement the 5px hit test even though it only builds resize**, so that 1.11 adds a branch rather than rewriting the handler. A 1.10 that grabs the whole `th` for resizing would have to be undone.

**The third row is the one that breaks.** Sorting is existing, verified behavior and a drag implementation that swallows the click kills it silently. It is in both sessions' Done-when.

### C17 — Column layout backup coverage (Session 1.10)

Rides in `prm_settings.csv` as one row, following the `Custom Sort Order` precedent:

```
"Column Layouts","<JSON.stringify(state.columnLayouts)>"
```

Emitted by `generateSettingsCSV()`, read by `restoreSettingsFromCSV()` under `typeLower === "column layouts"`, behind a `sawColumnLayouts` flag exactly like every sibling. Plus a default in `ensureStateDefaults()`.

That one row is the whole of its DIRECTIVES §4 coverage, and it reaches every path the settings CSV already reaches. **The JSON is full of `"` characters**, so the round trip depends on `convertToCSV()` quoting unconditionally and `parseCSV()` tracking quote state — which BUILD_NOTES records as verified in Session 1.3 for a note containing embedded quotes. It is verified again, for this row specifically, in 1.10's Done-when. If it fails, the fallback is a base64 payload in the same cell, not a new file.

---

## Sessions

### Session 1.1 — Snapshot writer, health state, and restore

- **Compartment:** DATA · **Depends on:** nothing
- **Goal:** Vantage writes an automatic local snapshot on a debounce, confirms every write by read-back, reports its own protection state honestly and visibly, and has been restored **from** a snapshot.
- **Size: L** · My time: ~15 min · **Confidence: High**
- **Should this L be split?** **Yes, and it was** — C13 turned one L into two sessions' worth. It is split here rather than at the seam that looks natural. Writer-then-restore would leave session one shipping snapshots nobody can restore, which fails Gate C on its own terms ("a backup nobody has restored from is not a backup"). So the cut is **protection vs. housekeeping**: everything needed for a snapshot to be trustworthy lands here, and retention plus attachments land in 1.2. What is left in this session is one debounce, one confirmation path and one restore path over a single naming scheme (C12), against an FSA layer that already exists (app.js 319) — which is why it stays High confidence at L.
- **Files:** modified `app.js`, `index.html` (sidebar health chip; Data Management: snapshot status + "Restore from snapshot"), `style.css`, `sw.js`
- **Tasks:**
  1. Debounced writer: ~2 min after last mutation, fired from `saveState()`; plus `visibilitychange`→hidden and `beforeunload`. `saveState()` also stamps `lastMutationAt`.
  2. Write state JSON to `snapshots/` per C12, reusing the stored directory handle and its re-permission check — but **not** `saveBackupFile()` itself, and **not** reading `backupFolderSessionDisabled`. See C13.
  3. **Read-back confirmation:** after `close()` resolves, read the file back and check non-zero size. Only then stamp `lastConfirmedAt`. Nothing else in the codebase may stamp it.
  4. `state.snapshotHealth` per C13, excluded from export and restore, recomputed on boot by listing the snapshots directory rather than trusting the stored value.
  5. Watchdog on boot and every 60s, resolving red / amber / green by the C13 table.
  6. Sidebar health chip rendering that state, visible from every hub. **Clicking it re-grants permission and forces an immediate snapshot.** One-shot modal on the first interaction after entering red, once per session.
  7. Sticky `failed`: cleared only by a read-back-confirmed write. No download fallback, ever.
  8. Data Management: last-snapshot timestamp, snapshot count, "Restore from snapshot" picker routed through the existing restore engine.
  9. Bump `CACHE_NAME` in `sw.js`.
- **Inputs needed from me:** none. The backup folder is already chosen and persisted.
- **Done when:**
  - `ls -la <backup folder>/snapshots/` shows a JSON file written within ~2 min of an edit, and a second after a tab-hide. Paste the listing.
  - Console: `JSON.parse(<newest snapshot>).prospects.length` equals `state.prospects.length`. Paste both.
  - **Restore drill:** add a throwaway prospect, snapshot, delete it, restore from that snapshot, confirm it returns. Paste before/after counts. *Gate C: writing a snapshot is not evidence.*
  - **Red on a real failure:** rename the backup folder from the OS, mutate state, wait out the debounce. Paste `state.snapshotHealth` showing `failed: true` and the chip red. Rename it back — paste `snapshotHealth` showing it is **still** red until a confirmed write lands, then green after clicking the chip.
  - **Red on silent non-execution:** with the app running, `clearTimeout` the debounce handle from the console so no write is even attempted, mutate state, wait 6 minutes. Paste `snapshotHealth` showing red. *This is the mode an error handler cannot catch, and the reason the watchdog exists.*
  - **Boot does not trust the cache:** set `lastConfirmedAt` to `Date.now()` by hand, delete every file in `snapshots/`, reload. Paste `snapshotHealth` showing red from the directory listing.
  - **No download fallback:** across every failure above, paste the Downloads folder listing showing zero stray snapshot files.
  - App loads at `localhost:5000` with a clean console.
- **Needs my eyes:** the chip's three states in light and dark theme, and the one-shot modal copy — it has to say what is unprotected and what clicking will do, without being a dialog I learn to dismiss.
- **Risk and fallback:** the chip is a new always-visible element in a sidebar that currently has none; if it fights the layout, fall back to placing it in the Data Management panel **plus** keeping the one-shot modal, which preserves loudness at the cost of ambient visibility. Never fall back to silence.

### Session 1.2 — Snapshot retention and binary mirror

- **Compartment:** DATA · **Depends on:** 1.1
- **Goal:** Snapshots stop growing without bound, and IndexedDB attachments are mirrored so a restored snapshot is complete rather than text-only.
- **Size: M** · My time: ~5 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `sw.js`
- **Tasks:**
  1. Pruner implementing all three C12 retention rules — last 10 rolling, newest-of-day ×14, newest-of-week ×8. A file surviving any one rule is kept.
  2. The pruner **never touches `snapshots/files/`**.
  3. Daily mirror of IndexedDB blobs into `snapshots/files/`, deduped by blob id.
  4. A pruner or mirror failure feeds the same C13 health state — it does not get its own quieter path.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Seed 30 dated dummy snapshots spanning 10 weeks, run the pruner, paste the surviving filenames and reconcile each against the rule that kept it.
  - Paste `snapshots/files/` before and after two mirror runs on the same day, showing the second run adds nothing (dedupe) and deletes nothing.
  - Run the pruner with `snapshots/files/` populated; paste the listing proving it is untouched.
  - Restore from a pruned snapshot that has attachments; paste the recovered blob count.
  - Clean console.
- **Risk and fallback:** three overlapping keep-rules over a directory listing is the one piece here with no precedent in `app.js`, and it is the likeliest thing in the phase to be subtly wrong. It is also the safest to get wrong — the failure mode is keeping too many files. Fallback: ship last-10-rolling only, and take the day/week tiers into 1.8.

### Session 1.3 — Task data model, defaults migration, backup and restore

- **Compartment:** DATA · **Depends on:** 1.1 (so live prospect data is protected before new write paths land)
- **Goal:** C1–C4, C6 and C7 exist in code, and a task with a multi-paragraph, comma-laden note survives a full ZIP export → wipe → restore round trip.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html` (Data Management: Tasks export button), `sw.js`
- **Tasks:**
  1. `ensureStateDefaults()`: `if (!state.tasks) state.tasks = [];`, `taskSettings` default, and the C6 reachout-type push in **both** the first-run literal and the `else` branch.
  2. `exportTasksCSV()` per C3; add `prm_tasks.csv` to `exportZIPBackup()`.
  3. `generateSettingsCSV()` + `restoreSettingsFromCSV()`: the C4 `Task Date Mode` row and its `sawTaskDateMode` guard.
  4. `restoreTasksFromCSV()`, with the export-only-columns comment from C3 written into the function.
  5. Orphan handling: a task whose `prospectId` doesn't resolve is **kept**, and the restore alert reports the count. Never discarded.
  6. Wire all three C7 router branches.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: create a task whose `notes` is `"Hi Bob,\n\nLine two, with a comma.\n\n\"Quoted\" line three.\n\nBest,\nMichael"`. Export the ZIP. Run `wipeAllData()`. Restore the ZIP. Paste `state.tasks[0].notes` and show it is character-identical, newlines and quotes included.
  - Console: restore a `prm_tasks.csv` with one row whose `Prospect ID` is `nope-123`. Paste the alert text showing the orphan count and `state.tasks.length` proving the row was kept.
  - Console: `state.reachoutTypes.includes("Task Completed")` is `true` after restoring a **pre-Phase-1** settings CSV. Paste it.
  - Console: `state.taskSettings.dateMode` survives the round trip. Paste it.
  - App loads with a clean console; existing views render; state survives reload.
- **Risk and fallback:** `parseCSV()` (app.js 7881) tracks quote state across newlines, so multiline fields should round-trip — but this is the single most likely break in the phase and the test above is why it is a Done-when and not a note. If it fails, fix `parseCSV`; do not work around it by stripping newlines from notes.

### Session 1.4 — Prospect Hub inspector: memberships subsections and the task editor

- **Compartment:** UI, with LOGIC · **Depends on:** 1.3
- **Two compartments justified:** the task editor and its only call site. The editor cannot be verified without a surface that opens it, and the inspector's Tasks subsection cannot be verified without an editor to open.
- **Goal:** `#inspector-memberships` becomes three labeled, individually clickable subsections — Campaigns, Audiences, Tasks — and the task editor exists, opens inline, and can create, edit and delete.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js` (`renderInspector` ~2624), `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. Restructure the memberships block into three labeled subsections. **Preserve the existing "Add to audience…" select and + Add button** — it lives at the top of this block today and must survive the restructure.
  2. Campaign and audience rows navigate to that record; task rows open the editor **inline in the inspector**, never jumping to TaskHub.
  3. Tasks subsection: two columns, Due Date · Title, **all** tasks including completed, sorted **due date descending**. `+ New Task` in the subsection header; prospect is implied, so the form asks only title, due date, notes.
  4. Task editor: due date (text entry + date picker), editable **prospect picker**, title, notes, status, Delete. Single-task completion happens here and nowhere else.
  5. Build with `createElement` + `appendChild` throughout. `innerHTML +=` destroys listeners in this inspector — established, already bit the audience panel.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `python check_ids.py` passes. Paste the output.
  - Console: create a task from the inspector, reload the page, `state.tasks.length` is unchanged and the row still renders. Paste both.
  - Console: reassign a task to a different prospect via the picker; it disappears from the first prospect's subsection and appears in the second's. Paste `state.tasks[0].prospectId` before and after.
  - Clicking an audience row still navigates, and the "Add to audience" control still adds. Paste the resulting `audienceLists[n].prospectIds`.
  - Clean console; existing views render.
- **Needs my eyes:** whether three subsections plus the add-to-audience control still fit the inspector's width without crowding.
- **Risk and fallback:** the restructure is the one place in this phase most likely to break the existing audience-add path. Fallback: keep the add row as its own element appended before the three subsections rather than inside one.

### Session 1.5 — TaskHub view: nav, color, filters, sortable table, pagination

- **Compartment:** UI · **Depends on:** 1.3 (data model), 1.4 (editor to open on row click)
- **Goal:** A sixth hub that opens on all open tasks, due-date ascending, with the six-plus-one filter strip, sortable headers, 25/50 pagination and row coloring.
- **Size: L** · My time: ~10 min · **Confidence: High**
- **Should this L be split?** It sits on the S/M line for each piece and only totals L because it spans `index.html`, `style.css` and `app.js` at once. Splitting on the natural seam — nav+color, then table — leaves session one with a hub that opens to an empty panel, which fails the "left usable" rule in DECLARATIONS. Keep whole; the pieces are individually trivial and the risk is breadth, not depth.
- **Files:** modified `index.html`, `style.css`, `app.js`, `sw.js`
- **Tasks:**
  1. C9 registration: nav button, panel, `switchView` title, `renderApp` branch.
  2. C10 cyan tokens in `style.css`, placed after the Data Management block.
  3. Filter strip using the same tab-button component as audience status (`#audience-status-tabs` is the model): All Open (default) · Past Due · Due Today · Upcoming · Date Range · Completed · **Missing Prospect, rendered only when the orphan count is > 0**.
  4. Table: ☐ · Due Date · First Name · Last Name · Company · Task Title. Names and company looked up from `prospectId` at render; an unresolved id renders `(missing prospect)`.
  5. Every header sorts ascending and descending; default due date ascending.
  6. Row color: overdue red, due today green, otherwise default — following the existing convention.
  7. Pagination at 25 or 50, mirroring the Advanced Query controls.
  8. Row click opens the 1.4 editor.
  9. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `python check_ids.py` passes. Paste the output.
  - Console: seed 60 tasks across past/today/future. Paste the first page's rendered order proving due-date ascending with past-due at the top.
  - Console: click each of the six filters; paste the row count each returns and reconcile against a `state.tasks.filter(...)` count computed independently.
  - The Missing Prospect chip is absent with zero orphans and present with one. Paste both states.
  - Sorting each of the five sortable headers both directions produces the expected first row. Paste them.
  - Clean console; the other five hubs still render and still show their own colors.
- **Needs my eyes:** cyan against the other five in the sidebar, in both light and dark theme — this is the check that the color decision was right.
- **Risk and fallback:** `updateThemeColors()` wipes `document.body.className` and re-adds `module-<view>`, so registration is mechanical. The likelier failure is an id collision in a 157 KB `index.html` — hence `check_ids.py` in the Done-when. Prefix every new id `task-` or `taskhub-`.

### Session 1.6 — Selection, bulk complete, and history logging

- **Compartment:** LOGIC, with STATE · **Depends on:** 1.5
- **Two compartments justified:** the selection `Set` and the actions that consume it are one feature; a selection nothing acts on cannot be verified.
- **Goal:** Page-level multi-select that survives page turns, a bulk action bar, and completion — single or bulk — that writes prospect history.
- **Size: M**, trimmed toward S by 1.5 landing three of its eight tasks · My time: ~5 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. ~~`taskSelectedIds` as a `Set`, surviving page turns within one filter run, cleared on any filter change.~~ **Landed in 1.5.** It exists, is maintained by the row checkboxes, survives page turns and clears on filter change — verified. Nothing to build; check it before assuming otherwise.
  2. **Select-all-on-page is a checkbox in the header's leftmost cell**, not a button. Michael, review pass 2026-08-29 — the AQ precedent is a row of buttons ("Select This Screen" / "Select All" / "Clear Selection") and TaskHub deliberately does not follow it here. Checked selects every row on the current page; unchecked clears them; it renders indeterminate when the page is partly selected. **No "select all N matching"** — Assumption 4 stands. A "Clear" control stays, for clearing a selection spanning pages.
  3. ~~The row checkbox is pure selection.~~ **Landed in 1.5**, including the rule that its handler repaints only the summary line and never the table — see BUILD_NOTES. The header checkbox's handler *does* re-render the table, because it changes every row; that asymmetry is deliberate.
  4. Bulk action bar appears at ≥1 selected, showing the count.
  5. **Mark Complete**: confirm with the count, set `status` and `completedDate`, and append one C5 history entry per task.
  6. Single completion in the editor writes the same C5 entry through the same function.
  7. ~~A task completed while the active filter excludes completed tasks stays visible, struck through and dimmed.~~ **Landed in 1.5** as `taskStickyCompletedIds` + `markTaskStickyCompleted(id)`, called from `saveTaskFromEditor()`. **`bulkCompleteTasks(ids)` must call `markTaskStickyCompleted()` per task** or bulk-completed rows vanish under the cursor — the exact thing scope §5 forbids. This is the one carry-in that is easy to miss.
  9. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: select 3 rows on page 1, turn to page 2 and back; `taskSelectedIds.size === 3`. Change the filter; `taskSelectedIds.size === 0`. Paste both.
  - Console: bulk-complete 3 tasks for one prospect. Paste `p.history.filter(h => h.type === "Task Completed").length` (3) and `getLastReachoutDate(p)` showing today's date. **⚠️ REVISED 2026-08-29 (scope §14): `getLastReachoutDate(p)` must NOT show today's date — a completion is not a reachout. It returns the prospect's newest real contact entry, or `""` if they have none. Verified both ways after the amendment.**
  - Console: `state.reachoutTypes.includes("Task Completed")` is `true`. Paste it.
  - Under the All Open filter, a row **bulk-completed** is still in the DOM, struck through, until the filter changes. Paste the row's class list. (Single completion already passes as of 1.5; this checks the bulk path calls the same hook.)
  - Header checkbox: paste `taskSelectedIds.size` after checking it on a 25-row page, after unchecking, and its indeterminate state with 3 of 25 selected.
  - Clean console; state survives reload.
  - **Summary states:** this session mutates `p.history` only, which the prospects CSV already covers — no new backup work. (DIRECTIVES §4.)
- **Risk and fallback:** the real risk is a completion path that skips history — the failure is invisible, because the Advanced Query date filters keep returning results, just wrong ones. Mitigation: exactly one function writes the history entry, and both call sites go through it.

### Session 1.7 — Bulk due-date editor, business-day arithmetic, global setting

- **Compartment:** LOGIC · **Depends on:** 1.6
- **Goal:** One modal, two modes, correct business-day arithmetic, and a global setting that governs counting and nothing else.
- **Size: M** · My time: ~5 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. `shiftTaskDate()` per C11.
  2. Modal mode A — **Shift by N days**: `[− / +] [N]`, using `dateMode`.
  3. Modal mode B — **Set to a specific date**: text entry or date picker, honored as typed, weekend or not. Nothing snaps, nothing warns.
  4. Both modes confirm with the affected count before committing.
  5. **Completed tasks in the selection are skipped, and the skip count is reported.**
  6. Global `dateMode` toggle in settings, writing `state.taskSettings.dateMode`. Changing it is **never retroactive** — no migration of existing tasks, now or in a future session.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste the three C11 vectors and their results. All three must match exactly.
  - Console: same three with `mode: "all"`, showing calendar counting.
  - Console: select 5 tasks of which 2 are completed, shift +2; paste the confirm text showing 3 affected and 2 skipped, and the 2 completed tasks' unchanged `dueDate`.
  - Console: set `dateMode` to `"all"` and paste `state.tasks.map(t => t.dueDate)` before and after, proving nothing moved.
  - Clean console; state survives reload.
- **Risk and fallback:** the Saturday cases are where day-stepping goes wrong. They are frozen vectors in C11 precisely so this is a pass/fail, not a judgment call.

### Session 1.8 — Realistic restore drill, `BUILD_NOTES` curation, phase close

- **Compartment:** QA · **Depends on:** 1.7, **and on 1.9 / 1.10 / 1.11** — this is the phase close and runs after every build session, whatever their numbers
- **Goal:** The whole phase's data survives a real backup-and-restore with realistic volume, and the standing files reflect what was built.
- **Size: S** · My time: ~10 min · **Confidence: High**
- **Files:** modified `sw.js`, `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/DECLARATIONS.md`
- **Tasks:**
  1. Full ZIP export with real prospect data plus ≥50 tasks, several with multiline comma-and-quote notes, several completed, at least one orphan.
  2. `wipeAllData()` → restore → verify counts, notes, completion state, orphan count, `dateMode`, `reachoutTypes`, **and `columnLayouts` (C15/C17 — a resized and reordered layout must come back identical; confirm `columnLayouts` is in `wipeAllData()`'s explicit clear list, which is the thing that gets missed)**.
  3. Restore from a **snapshot** as well as from the ZIP — the two paths are different code.
  4. Final `CACHE_NAME` bump; confirm the installed PWA picks up the new build.
  5. `DECLARATIONS.md`: add `tasks` and `taskSettings` to the state array list, add TaskHub cyan to the hub-colors line, correct `data` → `data-management` in the routing line.
  6. `BUILD_NOTES.md`: populate MAP; record the two-inspector duplication (Assumption 2), the wholesale `reachoutTypes` replacement on settings restore, and the real router function names — the scope's `processSingleCSVContent()` does not exist and the next agent will look for it.
  7. `AIContext.md`: rewrite for the phase close.
- **Inputs needed from me:** confirmation that live data is backed up before the drill runs. **Gathered before the session starts.**
- **Done when:**
  - Paste pre- and post-restore counts for prospects, companies, tasks, audiences, media.
  - Paste one multiline note pre- and post-restore, character-identical.
  - Paste the orphan count reported by the restore.
  - Paste `state.columnLayouts` pre- and post-restore, after having resized and reordered columns by hand.
  - Snapshot restore verified separately; paste its counts.
  - Clean console; every hub renders; state survives reload.
- **Risk and fallback:** this drill runs against real data. Take a manual ZIP **and** confirm a snapshot exists before `wipeAllData()`. If anything fails to round-trip, the phase does not close.

---

### Session 1.9 — Orphan window becomes a list; contact search replaces every prospect dropdown

- **Compartment:** UI, with LOGIC · **Depends on:** 1.5
- **Goal:** The Missing Prospect window lists orphans and nothing else; clicking a row opens the ordinary task editor with a type-to-search contact field and Delete. No full-list prospect `<select>` remains in any task path. The editor also loses its Status dropdown for a Mark-complete checkbox, and its prospect name becomes a link to that contact.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Scope:** §13.1, §13.2, §13.5, §13.8's link — all four are the same modal, which is why they are one session rather than four. **Read §12.1 first** — §13.1 partially reverses it and the part that survives is load-bearing.
- **Files:** modified `index.html`, `style.css`, `app.js`, `sw.js`
- **Tasks:**
  1. Strip the per-row `<select>`, Assign and Delete from `renderTaskOrphanWindow()`. Rows become whole-row click targets calling `openTaskEditor(taskId)`.
  2. Build the C14 search field. Replace `#task-prospect` in `index.html` from `<select>` to `<input type="hidden">`, keeping the id.
  3. Restore the `isOrphan` branch in `openTaskEditor()` — **keyed on `isOrphan` only, never widened to "editing"**, and restore an orphan warning banner. The comment block there already says what not to do; update it rather than deleting it.
  4. Refresh the orphan list behind the editor after a save or delete, without closing it. `refreshAfterTaskChange()` is the hook; it must not re-open a closed window.
  5. Delete the now-dead full-list population loop in `openTaskEditor()`.
  0. **§14.4 — transposition (added 2026-08-29, after 1.6).** A "log this as a reachout" checkbox plus a contact-type `<select>` at the point of completion, default unchecked. When checked, `logTaskCompletionHistory()` writes the chosen type (`Email` / `Call` / `LinkedIn` / …) with the task title as `content`, instead of `"Task Completed"`. **One branch inside the existing single writer — do not add a second function that writes history.** Read scope §14 first. Decide there whether bulk Mark Complete offers it at all; the safe default is single-completion only, because a selection of twelve rarely shares one contact type and getting it wrong writes twelve wrong reachouts in one click.
  6. **§13.5:** replace `#task-status` (a two-value `<select>`) with a **"Mark complete" checkbox at the top** of the modal. `saveTaskFromEditor()` reads `.checked` instead of `.value === "completed"`. **C1 does not change** — `status` stays `"open" | "completed"` and `completedDate` behaves as now. Hidden on create. Note for 1.6: the completion *transition* test (`!wasCompleted && status === "completed"`) is unaffected, so C5 history logging lands on top of this cleanly whichever session runs first.
  7. **§13.8:** the fixed prospect text becomes a link — close the editor, `switchView("prospects")`, `selectProspect(id)`. `selectProspect()` (app.js ~3470) already sets `state.selectedProspectId`, clears the company selection, saves and re-renders; this is three existing calls, not a new path. **Save before navigating** — call `saveTaskFromEditor()` first, and if its validation rejects (it alerts on a missing title, due date or prospect) **do not navigate**; let the alert stand and stay in the editor. Nothing is stashed, so the return path has nothing to reconcile. **Phase 2 changes what the destination looks like, not that there is one** — do not build anything larger here. The hoisted/movable/resizable panel that §13.8 briefly proposed was rejected in favor of Phase 2's full-screen detail view; see `taskhub-scope.md` §13.8.
  8. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `python check_ids.py` passes. Paste the output, read as a diff against the standing pair.
  - Console: seed ≥300 contacts. Paste the match count and render count for a query hitting >20, proving the cap and the "…N more" line.
  - Paste proof an empty query renders zero result rows.
  - Two orphans present: paste the window's rendered row content showing **no** select, Assign or Delete on the rows.
  - Repair one orphan through the editor's search field; paste `taskOrphanCount()` before and after, and the list refreshing without the window closing.
  - Delete the other from the editor; paste the same. Chip gone at zero.
  - Open an ordinary (non-orphan) task from TaskHub and from the Prospect Hub inspector: paste proof the search field is **hidden** and the prospect renders as fixed text in both.
  - Paste a task completed via the new checkbox and re-opened by unchecking it, showing `status` and `completedDate` both directions. Paste proof the checkbox is absent on create.
  - Click the prospect name in the editor: paste `state.activeView`, `state.selectedProspectId`, and proof the inspector rendered that contact.
  - Type into the title, then click the prospect name: paste the saved task showing the typed value committed before navigation.
  - Blank the title, then click the prospect name: paste proof it did **not** navigate and the editor is still open.
  - Clean console; the other five hubs still render.
- **Risk and fallback:** the save path is the risk — `saveTaskFromEditor()` reads `#task-prospect.value` and C14 keeps that contract precisely so it does not have to change. If the search proves fiddly, the fallback is a datalist-backed input, which is worse keyboard-wise but is native and cannot break the save path.

### Session 1.10 — Stationary header block, column layout store, and drag-to-resize

- **Compartment:** UI, with DATA · **Depends on:** 1.5 (1.9 not required)
- **Two compartments justified:** a column layout that does not survive a reload is not the feature Michael asked for, and the store is the smaller half. Splitting them ships a resize that forgets itself.
- **Goal:** TaskHub is exactly one screen tall with only the task list scrolling, its header block stays put while rows scroll under it, the bulk action bar sits at the top where the selection is, the column header carries the hub's cyan, columns resize by dragging their right border, and the resulting widths survive a reload, a ZIP backup and a restore.
- **Size: L** (unchanged — §15 is three layout changes to the same panel this session already rebuilds) · My time: ~15 min · **Confidence: Medium**
- **Scope:** §13.3 and §13.4 (resize half), plus **§15.1, §15.2 and §15.3** (added 2026-08-30 from Michael's review of the shipped hub). Contracts C15, C16, C17. **Read §15 before §13.3** — §15.2 is what makes §13.3 achievable, and §15.3's color decision is forced by §13.3's sticky header.
- **Files:** modified `index.html`, `style.css`, `app.js`, `sw.js`
- **Tasks:**
  1. **§13.3 + §15.2 layout — do this first and verify it before anything else in this session.** `#view-tasks` fills its parent exactly and becomes a fixed-height flex column; the table wrapper takes `flex: 1 1 auto; overflow-y: auto; min-height: 0`; the header row goes `position: sticky; top: 0` with an opaque background. **Copy the Advanced Query results modal's pattern**; do not invent a second one.
     - **The scroll owner today is `#canvas-body`** (`flex-grow: 1; overflow-y: auto`), shared by all six hubs — verified 2026-08-30, so this no longer needs discovering. **Do not change it.** Make `#view-tasks` fill it and own its overflow, so `#canvas-body` has nothing left to scroll while TaskHub is active and the other five hubs are untouched.
     - **`height: 100%`, never `calc(100vh - <header>)`.** `#main-canvas` is already `height: 100vh; flex-column; overflow: hidden`, so the layout has solved "screen minus header" already; a hard-coded header height is a stale second copy of it.
     - **`min-height: 0` is needed at EVERY level of the chain** — `#view-tasks` → `.dashboard-list-card` → `.table-scroll-container` — not just the wrapper. A flex child defaults to `min-height: auto` and refuses to shrink below its content, so one missing `min-height: 0` anywhere up the chain makes the panel overflow instead of the list scrolling, and the symptom looks like the sticky header failing rather than like a flex bug.
  2. **§15.1** — move `#taskhub-bulk-actions` in `index.html` from last child to directly beneath `#taskhub-filter-tabs` / `#taskhub-range-group` and directly above the Per Page / summary row. **The bar's markup, id, controls and handlers do not change** — a move, not a rebuild. **Prev/Next stays where it is** (confirmed by Michael, 2026-08-30). **Reserve the slot's height** so the table does not jump when the first row is selected or the last one cleared — §15.1 says why that is stability, not polish.
  3. **§15.3** — the column header row takes TaskHub's cyan at the **18% tint Michael chose from a rendered comparison on 2026-08-30**. Ship the exact values: dark `background: #0c2c31` / `color: #06b6d4`; light `background: #b0cad0` / `color: #0891b2`. **Those backgrounds are the tint already composited over the panel** — the header looks semi-opaque and is fully opaque, which is what task 1's sticky header requires. **Do not convert them back to `rgba()` or `color-mix(..., transparent)`**; that reintroduces the see-through bug and it only appears once the list scrolls. Real classes with literal values beside `.taskhub-row-overdue` / `.taskhub-row-today`; **do not invent a custom property** — `var(--color-danger)` is the cautionary tale. **One shared class goes on BOTH `<thead>`s** — TaskHub's and `#modal-task-orphans`' (Michael, 2026-08-30, for consistency). The orphan window's backdrop composites the same tint to `#0d2d33` / `#b3ccd2`, within 3/255 of the hub panel's values and invisible, so it takes the shared value rather than a second pair of magic numbers.
  4. **§15.4** — remove `#taskhub-new-btn` ("+ New Task") from the TaskHub header **and its listener in `setupEventListeners()` in the same edit** — a listener left behind moves `check_ids.py` off its standing baseline of two. `⚙️ Settings` and the orphan chip slot stay. **DELETE the `isNew && !prospectId` branch in `openTaskEditor()`; the picker test becomes `isOrphan` alone** (Michael, 2026-08-30: creating a task without a prospect is to be prevented on purpose, so the dead end IS the guard). `saveTaskFromEditor()`'s `if (!prospectId)` refusal stays and is the enforcement — intended behavior, not a bug to fix. **Read §15.4's two-row table before touching anything orphan-related:** create-time is forbidden, but a task can still *become* prospect-less via restore, and those orphans are preserved and repairable. Never blank an unresolved `prospectId`, never auto-drop orphans. Never widen the test to "editing".
  5. C15 `state.columnLayouts` + `ensureStateDefaults()` default + the read/fallback rule.
  6. C17 settings CSV row, both directions, behind `sawColumnLayouts`. Add `columnLayouts` to `wipeAllData()` — BUILD_NOTES records that it clears an explicit list and a new store gets missed.
  7. C16 hit test, **all three zones**, even though only resize is built. Cursor changes to `col-resize` in the 5px zone.
  8. Resize drag: live width update, min width floor, persist on mouseup (not on every mousemove).
  8. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `python check_ids.py` passes. Paste the output.
  - Paste proof the header block does not move: scroll position of the wrapper > 0 while the filter strip and header row keep their viewport coordinates.
  - **§15.2:** paste `#canvas-body`'s `scrollHeight` vs `clientHeight` with TaskHub active and a list long enough to scroll — equal means the page cannot scroll and only the list does. Paste the same two numbers for the other five hubs, unchanged from before the session.
  - **§15.1:** paste the rendered child order of `#view-tasks` showing the bulk bar between the filter strip and the Per Page row, and Prev/Next still after the table. Then paste the table wrapper's `getBoundingClientRect().top` with zero rows selected and with one selected — **identical**, proving the reserved slot does not shift the rows.
  - **§15.3:** screenshot the header row in **both** themes, and paste its computed `background-color` showing a fully opaque value (alpha 1) — a sticky header with alpha < 1 shows rows through it, and that only appears once the list scrolls.
  - **§15.3, orphan window:** paste the computed `background-color` of `#modal-task-orphans thead th` and of TaskHub's `thead th` side by side — **identical strings**, proving one shared class rather than two copies. Screenshot the orphan window in both themes.
  - Resize a column; paste the stored width, then reload and paste it again from `state.columnLayouts`.
  - **Round trip:** ZIP export → `wipeAllData()` → restore → paste `state.columnLayouts` character-identical to pre-export. This is the C17 check and the one most likely to fail.
  - Paste a header click with no drag still sorting, both directions — the C16 third row.
  - Paste an unknown key and a missing key in a hand-edited saved layout, both surviving a load without throwing (the C15 migration rule).
  - **§15.4:** paste `check_ids.py` still at its standing baseline of two (proving the listener went with the button), and proof no "+ New Task" control remains anywhere in `#view-tasks`. Then open the editor from the Prospect Hub inspector and paste proof it still creates a task normally.
  - **§15.4 orphan preservation — the one that would hurt to get wrong:** seed two orphans, paste `taskOrphanCount()`, the chip, and the resolution window listing both; then paste one repaired through the editor's search. Proof the search still reveals on `isOrphan` after the branch deletion, and proof an orphan's stored `prospectId` survives an open-and-save **unchanged** when nothing was picked.
  - Clean console; the other five hubs still render.
- **Needs my eyes:** the resize hit zone — 5px is a guess and it is the kind of number that is only right or wrong under a real hand.
- **Risk and fallback:** two risks. The layout change can fight whatever currently scrolls `.view-panel` in the main content area — check that before writing the drag code, because it is the part that could cascade into other hubs. And the C17 JSON-in-CSV round trip; if it fails, base64 the payload into the same cell rather than adding a file.

### Session 1.11 — Drag-to-reorder columns

- **Compartment:** UI · **Depends on:** 1.10
- **Goal:** A column header dragged sideways moves the column; the ones to its right shift live to make room; the new order persists through a reload and a restore.
- **Size: M** · My time: ~10 min · **Confidence: Medium**
- **Scope:** §13.4 (reorder half). Extends C16's second row; C15 and C17 already exist.
- **Files:** modified `style.css`, `app.js`, `sw.js`
- **Tasks:**
  1. Add the reorder branch to C16's existing handler — the 4px movement threshold is already there, this fills in what happens past it.
  2. Live shifting during the drag, and a drop indicator. Reordering writes `order` in C15's record.
  3. `renderTaskHubTable()` builds its header and cells from `order` rather than from `TASKHUB_COLUMNS`' literal sequence. **`TASKHUB_COLUMNS` stays the definition of what a column IS**; `order` is only the sequence.
  4. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `python check_ids.py` passes. Paste the output.
  - Move Task Title to position 2; paste the rendered header order and the first row's cell order, proving cells followed their headers and did not just relabel.
  - Reload; paste both again.
  - ZIP round trip on the reordered layout; paste `order` pre- and post-restore.
  - Paste sorting still working on a moved column — C16's third row, again, because this is the session that can break it.
  - Paste resize still working after a reorder, on a moved column.
  - Clean console; the other five hubs still render.
- **Risk and fallback:** the failure mode is headers and cells drifting out of sync, which looks like correct data under wrong labels — the worst kind of bug in a table holding other people's contact details. Hence the "cells followed their headers" Done-when rather than a header-only check. Fallback if live shifting proves expensive: shift on drop rather than during the drag. Less pleasant, same result, and reversible.


## Session order

```
1.1  Snapshot + health  (DATA,  L)  — independent, run first     ✅ done
1.2  Retention + blobs  (DATA,  M)  — after 1.1                  ✅ done
1.3  Task data + CSV    (DATA,  M)  — after 1.1                  ✅ done
1.4  Inspector+editor   (UI,    M)  — after 1.3                  ✅ done
1.5  TaskHub view       (UI,    L)  — after 1.4                  ✅ done
1.6  Selection + bulk   (LOGIC, M)  — after 1.5                  ← next
1.7  Due-date editor    (LOGIC, M)  — after 1.6
1.9  Orphan + search    (UI,    M)  — after 1.5
1.10 Header + resize    (UI,    L)  — after 1.5
1.11 Reorder columns    (UI,    M)  — after 1.10
1.8  Drill + close      (QA,    S)  — LAST. Always last.
```

**Run order is not numeric order, deliberately.** 1.9–1.11 were added on 2026-08-29 from Michael's review of 1.5, and 1.8 is the phase close — running it before them would close the phase on an unfinished hub and, worse, run the restore drill without exercising the column-layout store that 1.10 adds. **1.8 keeps its number and moves to last.** Renumbering it to 1.11 was the alternative and was rejected: `BUILD_NOTES.md` and `AIContext.md` already point backlog items at "1.8", and silently repointing them is how a backlog item gets lost.

**1.9 and 1.10 are genuinely independent of each other** — both depend only on 1.5, and they touch different halves of the TaskHub surface (the editor modal vs. the panel layout and header). Either order works. They are also independent of 1.6 and 1.7, so if the hub's usability matters more than bulk actions, they can run first. **1.11 is the only hard new dependency:** it extends 1.10's drag handler and cannot precede it.

**One seam parallelizes, and only in the sense that it can be reordered:** 1.2 depends on 1.1 but nothing depends on 1.2, so it can slide anywhere between 1.1 and 1.8 if TaskHub is wanted sooner. The cost of deferring it is snapshots accumulating unpruned and attachments unmirrored — survivable for a phase, which is exactly why it is the piece that was cut out of 1.1. Everything else is strictly sequential: each session builds on the previous one's surface, and DECLARATIONS requires the app be left usable — not merely building — between sessions, because real outreach happens in it.

**1.1 is the other movable piece**, and should not move. It is independent of the TaskHub chain and could become its own Phase 1A, but it is placed first because DIRECTIVES §0 makes local snapshots the *sole* protection during Phase 1, and sessions 1.3–1.7 add six new write paths to a database holding live prospect data. Deferring 1.1 means running all of them uncovered.

## Phase estimate

| | |
| --- | --- |
| **Sessions** | **11** (8 as planned 2026-08-29, plus 1.9 / 1.10 / 1.11 added the same day from Michael's review of 1.5). A 1.12 was drafted for a hoisted prospect-inspector panel and **deleted the same day** — Michael chose Phase 2's full-screen detail view instead, which reduced it to a three-line link inside 1.9. |
| **Mix** | 3 L · 7 M · 1 S |
| **My total attention** | ~105 min across the phase; no session over 15. The three added sessions are ~35 min of it. |
| **Why three added sessions, not the two discussed** | The review produced eight items. Six fit existing or new sessions cleanly; the column work did not fit one session. Resize and reorder share a store and a drag handler, which argues for one session — but they are an L and an M with two distinct drag interactions on the same element, and that is where a three-strikes loop lives. They split cleanly *provided* 1.10 freezes the hit-test zones up front, which is exactly what C16 does: 1.11 then adds a branch instead of rewriting a handler. Rule 2 asks for the largest chunk that can be finished **and verified** without asking; L-plus-M with two drag models is past that line. |
| **Most likely to overrun** | **1.1**. C13 is the largest single block of new design in the phase, and unlike the rest of it there is no precedent in `app.js` to copy — the health chip, the watchdog and the read-back confirmation are all new. Its four failure-mode Done-whens are deliberately expensive to satisfy, and that is the point: they are the only proof the thing is honest. Runner-up is **1.3** on the multiline CSV round trip — lower probability, higher blast radius, which is why it is a Done-when. **1.2**'s pruner is the likeliest to be subtly *wrong*, but its failure mode is keeping too many files, so it is not the one to worry about. |

## Backup points

- **Before 1.1** — manual ZIP export. There is no automatic protection until 1.1 lands, and 1.1 itself touches the write path.
- **Before 1.3** — first automatic snapshot confirmed present **and green on the chip**; this is the first session to add new persisted state.
- **Before 1.8** — manual ZIP **and** a confirmed snapshot. 1.8 calls `wipeAllData()` against real data. Non-negotiable.
- **At phase close** — full ZIP, retained outside the project folder per DECLARATIONS.

## Open risks

1. **Multiline CSV round trip.** `parseCSV()` tracks quote state across newlines, and `convertToCSV()` quotes and doubles every field, so this should hold — but it has never been exercised with a field containing both newlines and commas, and once sequencing writes email bodies into `notes` it becomes the normal case rather than the edge one. Retired by 1.3's Done-when.

2. **The snapshotter's silent-failure mode — resolved in C13, 2026-08-29.** DIRECTIVES §0 is explicit that a snapshotter which fails quietly is worse than none, because it manufactures false confidence. An `alert()` at the point of failure could not deliver that: browsers suppress dialogs during `beforeunload`, nobody is watching during a tab-hide, and no error handler catches a snapshot that never ran. C13 replaces it with read-back confirmation, a staleness watchdog, a persistent clickable chip, and a sticky failed state with no download fallback. **The residual risk is now inverted:** the health state is itself code that can break, and a green chip that is green because the watchdog stopped running is the same lie in a new place. Mitigations already in the contract are that boot reconciles against the directory rather than the cache, and that red is derived from staleness rather than from a caught exception — so most ways the mechanism can die produce red, not green. A future session must not make the chip green on any signal weaker than a read-back-confirmed write.

3. **Two inspectors, one of them not updated.** Assumption 2. Contained by Phase 2 replacing the interim inspector, and by the `BUILD_NOTES.md` entry in 1.8. The risk is a future session "fixing" the inconsistency unasked.

4. **`reachoutTypes` wholesale replacement.** C6 handles today's known case. The general shape — any settings CSV restore replaces the whole array, and only `ensureStateDefaults()` puts required values back — will bite again the next time a required option is added. Recorded in `BUILD_NOTES.md` at 1.8 as a class of failure, not a one-off.

5. **Scope-to-code drift.** The scope names `processSingleCSVContent()`, which does not exist. That one is resolved in C7, but it is evidence the scope was written from documentation rather than code, so 1.3 and 1.4 should each verify their touch points against `app.js` before editing rather than trusting the scope's function names. Per `BUILD_NOTES.md`: always search for the exact function before editing it.

6. **Compliance (DIRECTIVES §0).** Still undecided, and TaskHub's `notes` field will now hold outreach copy addressed to named third parties alongside their contact data. Not blocking this phase; the surface area it covers grows in it.

---

**Amended 2026-08-29** after Session 1.5, from Michael's review pass. Added §13 to `ai/spec/taskhub-scope.md`, contracts C14–C17, sessions 1.9 / 1.10 / 1.11, a non-numeric run order with 1.8 last, and revisions to 1.6 (three tasks landed early in 1.5; select-all becomes a header checkbox) and 1.8 (the drill now covers `columnLayouts`).

**Next: start a NEW conversation and run Prompt 4 for Session 1.6.**
