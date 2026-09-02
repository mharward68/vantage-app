# Phase 2B: Prospect Detail View

**Planned:** 2026-08-31 · Prompt 3
**Scope:** `ai/spec/prospect-detail-view-scope.md` (approved 2026-08-30 — no stop banner; §7 is frozen and is not re-derived here)
**Depends on:** Phase 1 (closed 2026-08-30) and **Phase 2A** (`ai/spec/app-shell-scope.md`)

> ## ⛔ HARD PREREQUISITE — Phase 2A has NOT shipped as of 2026-08-31
>
> Verified against the tree while writing this plan, not inferred:
>
> - `sw.js` is still `vantageprm-cache-v83` — the value `AIContext.md` recorded at the **Phase 1** close. No code has shipped since.
> - All three stale viewport constants 2A deletes are live: `style.css` 1171 (`calc(100vh - 120px)`), `style.css` 1797 (`calc(100vh - 200px)`), `index.html` 663 (inline `calc(100vh - 280px)`).
> - The hub labels are still `Prospect Hub` / `Media Hub` / `Campaign Hub` / `Data Management`, in both places (`index.html` 57–87 and the `titles` map at `app.js` 3016).
> - There is no `ai/phases/phase-2a-app-shell.md`, and `ai/archive/` holds no 2A handoff.
> - `ai/AIContext.md` is still the Phase 1 close handoff.
>
> **This plan is complete and correct; it may not start.** Session 2B.1 puts the
> back arrow in 2A's header band and takes 2A's one-screen-tall scroll shape as
> contract S1. Both arrive with 2A. **Run Phase 2A end to end — plan, sessions,
> close — then start 2B.1.** `ai/phases/phase-2a-RUNSHEET.md` is that phase's
> sheet; `ai/phases/phase-2b-RUNSHEET.md` already carries the same block.
>
> Nothing below changes when 2A lands. It is written against 2A's frozen
> contracts S1–S4, not against 2A's implementation.

---

## Goal — what's true after that isn't now

- **A prospect opens as a full-screen record view**, `#view-prospect-detail`, the seventh `.view-panel`, inside `#main-canvas` — so it stops at the sidebar and reflows with it, in both sidebar states, with no width calculation anywhere. It carries ProspectHub purple and leaves `#nav-prospects` lit.
- **Every one of a prospect's 17 editable fields is visible and editable on one screen**, including `seniority` and the four conference fields, which today are written by `saveProspect()` and displayed by no surface at all.
- **Six tabs below the identity block** — Interactions, Tasks, Audiences, Campaigns, Company, and a visible, disabled Sequences slot. Only the tab body scrolls. The Company tab answers "who else do I have at Comcast" without an Advanced Query run.
- **Four entry points reach it** — the ProspectHub directory row, the task editor's prospect link, the audience contact row, and the audience pop-out contact row — and **the back arrow returns to the origin in the state it was in**, including reopening the task editor it was launched from.
- **The ProspectHub slide-out prospect card is gone.** `.prospect-inspector-panel` survives as the *company* host only. There is one place an existing prospect is edited.
- **`state.selectedProspectId` no longer steers what the user is looking at.** The detail view keys off a module-scope `detailProspectId`, so a click in the untouched Advanced Query drawer cannot retarget an open detail view.
- **Both ProspectHub directory tables have sticky, purple, resizable, reorderable headers**, driven by the same table-id-parameterised machinery TaskHub uses — one implementation, two consumers, and TaskHub still works.
- **`#prospect-tag-chooser` is no longer a `<select multiple size="1">`** with Ctrl-click as its multi-select gesture. It is the Advanced Query picker.
- **Email is unique.** `saveProspect()` refuses a duplicate on create and on edit; CSV import skips duplicates, reports the count, and offers the skipped rows back as a CSV. No id changes and email does not become the key.
- **The two workarounds carried out of Phase 1 are gone.** `state.taskSettings` is cleared by `wipeAllData()` and the Task Date Mode restore leg has been re-run against a value that was genuinely cleared. `--color-danger` is defined once, and the five destructive controls and one expired-domain highlight that render without their red get it back.

## Out of scope

Everything in scope §3, restated so a session does not have to go looking:

- **No files or media on prospects.** Decided, not deferred (`DECISIONS.md` 2026-08-28). No Files tab; `VantagePRMFiles` is not extended.
- **A company detail view.** This phase builds the *prospect* one. The company inspector keeps today's behaviour — Assumption 7.
- **The Advanced Query results drawer** (`renderAqInspectorDrawer`, the `aq-insp-*` ids, `openAqInspectorDrawer`). Deferred at Michael's direction, **not reversed**; the analysis is banked in scope §2.1 so the later phase does not re-derive it. Do not touch it, and do not "fix" the fact that it has no Tasks subsection.
- **The Audience Query Engine** (`#campaign-query-view`, `runCampaignQuery`, `#query-contacts-checkboxes`). It is a fifth entry point and it is deferred with the AQ drawer — scope §2.2.
- **Layout rework of MediaHub or CampaignHub.** 2A owns that. The CampaignHub *entry-point call sites* (8637, 8955) and the `--color-danger` call sites in `renderDomainsView()` / the email-accounts row / the audience trigger **are** in scope. Rearranging those hubs is not.
- **Routing of any kind.** No `location.hash`, no `history.pushState`, no `document.title` carrying a prospect id — see P9.
- **Normalising the two live id schemes.** Scope §7.5. That is a DIRECTIVES §4 destructive data change that orphans tasks by definition.
- **Telemetry** (Gate D inert until hosting) and **accessibility conformance** (Gate F inert; the §0 habits apply to new markup and are not a gate).

## Assumptions

Scope §8 logged thirteen at intake and they stand unchanged. These are this plan's own, and every one is reversible.

1. **The contract session is this document.** Scope §7 froze the contracts at intake; this pass verified each against `app.js` / `index.html` / `style.css` and writes them literally below as **P1–P9**, with the call sites and function names the code actually has. Spending a session round-tripping contracts that are already frozen and already verified buys nothing. Contract-first is satisfied in substance: nothing is built until the interfaces are written down and immutable. **The Frozen contracts section is read-only from this point.** Changing one is a plan revision, not a session decision — the same shape as Phase 1 Assumption 1.

2. **2B.1 is the phase's structural first session anyway,** and it is the closest thing to a contract session the fixed ordering allows: it lands `detailProspectId`, the origin record, `openProspectDetail()` and an empty view panel, and nothing consumes them yet. The run sheet fixes it there and this plan does not move it.

3. **2B.1 repoints no entry point.** The panel is reachable from the console only — `openProspectDetail(id, { view: "prospects" })`. That is a real, checkable Done-when and it means the app is exactly as usable after 2B.1 as before it. The four entry points are repointed together in 2B.6, once there is a finished view to point them at. This is the §4 rule ("no session ends with the old overlay removed and the new view incomplete") applied to its own first session.

4. **The identity block edits in place, field by field.** Each control commits on `change` through one writer (P5) — there is no Save button and no dirty state. Reasoning: the modal already owns "fill in a form and press Save," this surface is a record you look at and adjust, and a second dirty-state machine on the app's most-used screen is where "the app lied about what it saved" comes from. Reversible: adding a Save button later is additive.

5. **`--color-danger` is defined in 2B.3, not in a fix-up session of its own.** 2B.3 is the session that puts a Delete Prospect button on the new screen, so it is the session that needs the token; defining it there repairs the other six call sites as a side effect of a genuine need. It is one declaration in `:root` plus its `.light-theme` override, and per `BUILD_NOTES.md` the file's literal-hex convention is what the token replaces at those six sites — nothing else is converted.

6. **`state.taskSettings` is homed in 2B.7,** the phase's one DATA session, alongside the email-uniqueness work that also touches write paths. It is two lines plus one leg of the restore drill, and it needs a session that is already thinking about `wipeAllData()` and the ZIP round trip.

7. **The column-layout generalisation runs at 2B.2 and is applied at 2B.8** — six sessions apart, deliberately. See "Session order" for the reasoning; the fixed constraint (prove TaskHub before either ProspectHub table is touched) is satisfied with room to spare, and the riskiest refactor in the phase gets six sessions of daily TaskHub use as its regression evidence.

8. **Review-driven sessions take numbers 2B.11 and up and run before 2B.10, which keeps its number and always runs last.** Phase 1's precedent exactly (1.9–1.11 appended, 1.8 kept its number and moved last), and for the same reason: `BUILD_NOTES.md` and `AIContext.md` will already point at "2B.10" as the close.

9. **Tab bodies render on demand and hold no cache.** Switching tabs re-renders that body only, from `state`, every time. No memoisation, no stashed elements — the `renderTaskHubTable()` lesson and Gate E.

10. **The Sequences tab is a row in `PROSPECT_DETAIL_TABS` with `enabled: false`.** It is rendered, visible and inert from 2B.4 onward. Phase 3 flips one boolean and writes one `render`.

---

## Frozen contracts — written literally; later sessions treat as read-only

### P1 — The subject cursor and the origin record

```js
// Module scope in app.js. NOT state fields. They must not survive a reload —
// this is navigation, and `selectedCompanyId` / `campaignViewSubState` /
// `selectedAudienceListId` are the precedent (BUILD_NOTES, "DOM and rendering").
let detailProspectId = null;
let detailOrigin     = null;   // see shape below
let detailTab        = "interactions";
```

```js
detailOrigin = {
  view,              // "prospects" | "tasks" | "campaigns"   — required
  taskId,            // task id | null   — replayed via openTaskEditor(taskId)
  audienceListId,    // audience list id | null
  campaignSubState   // "audiences" | "campaigns" | null      — NOT OPTIONAL
};
```

`campaignSubState` is not optional because reaching a CampaignHub audience takes
**three** assignments plus a render, not two — `switchView("campaigns")` +
`campaignViewSubState = "audiences"` + `selectedAudienceListId` +
`renderCampaignsView()` (`app.js` 3892–3897 and `BUILD_NOTES.md`). An origin
record that omits it lands the user on whichever sub-tab was last open.

**`state.selectedProspectId` is never read or written by any code added in this phase.** It stays exactly as it is for the deferred AQ drawer (7032), the create path (9648) and the directory highlight, and it is deleted from none of its 13 read sites.

### P2 — The one entry point and the one exit

```js
openProspectDetail(prospectId, origin)   // four callers, listed in P3
closeProspectDetail()                    // the back arrow. Replays detailOrigin.
```

- `openProspectDetail` sets `detailProspectId`, `detailOrigin`, `detailTab = "interactions"`, then `switchView("prospect-detail")`.
- **No copy of the record is held.** Every render does `state.prospects.find(p => p.id === detailProspectId)` fresh — `renderInspector` already does this at 3586. Gate E.
- **An unresolvable `detailProspectId` closes the view and replays the origin.** No placeholder, matching `renderInspector` 3587–3592. Same on deleting the prospect being viewed.
- `closeProspectDetail()` replays by origin:
  - `{ view: "prospects" }` → `switchView("prospects")`.
  - `{ view: "tasks", taskId }` → `switchView("tasks")` then `openTaskEditor(taskId)`. The editor is rebuilt from `state.tasks` on every call, so this is one call against a remembered id, never saved DOM.
  - `{ view: "campaigns", campaignSubState, audienceListId }` → all three assignments plus `renderCampaignsView()`.
- **Unsaved edits: save before navigating.** The task editor's prospect link calls `saveTaskFromEditor()` first; if it returns anything but `true` (it alerts on a missing title, due date or prospect) **do not navigate** — the alert stands and the user stays put. This is already the shipped behaviour at `app.js` 11130–11137; only the destination changes.

### P3 — View identity, and the four call sites

- `#view-prospect-detail` is a **seventh `.view-panel`**, a sibling of the six hubs inside `#main-canvas`. Never `position: fixed`, never a computed left offset, never `calc(100vh - <constant>)`.
- `state.activeView = "prospect-detail"` persists and is harmless — boot always ends `switchView("dashboard")`.
- `renderApp()` gains a `prospect-detail` branch calling `renderProspectDetail()`. It already shows `#view-${state.activeView}` generically, so the panel shows with no other change.
- `updateThemeColors()` already writes `body.module-${state.activeView}`, so **`body.module-prospect-detail` needs a `style.css` rule setting ProspectHub's purple `--color-primary: #8b5cf6`**, plus its `.light-theme` sibling, next to `body.module-prospects` at `style.css` 69–75.
- **`switchView()`'s nav-tab loop matches on `data-view` and would leave every tab unlit.** It gains one explicit line: while the active view is `prospect-detail`, `#nav-prospects` carries `active-tab`. Assumption 2 of the scope.
- **The back arrow lives in 2A's header band**, left of the hub name, which reads **ProspectHub in purple**. The prospect's name goes in `#view-subtitle` (2A Assumption 3 keeps that element). The arrow never scrolls away.
- **One screen tall; only the tab body scrolls.** The identity block is content-height, the tab body takes the remainder and owns its `overflow-y`, `min-height: 0` appears at every level of the flex chain, and `#canvas-body` is untouched. This is 2A's contract **S1** and it is why 2A ships first.

The four callers, verified 2026-08-31:

| | Surface | Today | Becomes |
| --- | --- | --- | --- |
| 1 | ProspectHub directory row | `selectProspect(p.id)` (`app.js` 3526–3531) | `openProspectDetail(p.id, { view: "prospects" })` |
| 2 | Task editor's prospect link | `switchView("prospects")` + `selectProspect(p.id)` (11130–11137) | `openProspectDetail(p.id, { view: "tasks", taskId })` |
| 3 | Audience contact row | `openProspectModal(p.id)` (8637) | `openProspectDetail(p.id, { view: "campaigns", campaignSubState: "audiences", audienceListId })` |
| 4 | Audience pop-out contact row | `openProspectModal(p.id)` (8955) | same as 3 |

`openAqInspectorDrawer`'s `openProspectModal` call at **7204 is not in this list and is not touched.**

### P4 — The tab component

```js
const PROSPECT_DETAIL_TABS = [
  { key: "interactions", label: "Interactions", enabled: true,  render: renderDetailInteractions },
  { key: "tasks",        label: "Tasks",        enabled: true,  render: renderDetailTasks },
  { key: "audiences",    label: "Audiences",    enabled: true,  render: renderDetailAudiences },
  { key: "campaigns",    label: "Campaigns",    enabled: true,  render: renderDetailCampaigns },
  { key: "company",      label: "Company",      enabled: true,  render: renderDetailCompany },
  { key: "sequences",    label: "Sequences",    enabled: false, render: null }
];
```

- Each `render(prospect)` **returns an Element**. One `renderProspectDetailTabs()` draws the strip; one `renderProspectDetailTabBody()` resets the body container and appends the active tab's element.
- The shape is `TASKHUB_FILTERS` / `TASKHUB_COLUMNS` — this codebase's own declarative-table precedent, not a new pattern.
- **Only the active tab's body renders.** Switching re-renders that body alone, never the whole view.
- `detailTab` resets to `"interactions"` on every open. **Tab and scroll position are not persisted.** If a later phase wants them, they join `state.columnLayouts` under their own key — never a new store.
- **`createElement` / `appendChild` throughout.** `innerHTML +=` destroys listeners and has bitten this exact inspector; only whole-container resets are permitted.
- Authoring habits (DIRECTIVES §0, **not** Gate F): the tab strip is buttons, not `<div>`s with click handlers; every input is labelled; focus is visible.

### P5 — The identity block, and the single field writer

All **17 editable fields**, in the field order of `#modal-prospect`, three or four columns at canvas width (~1,590px with the sidebar pinned). Row pairs from scope §1.2; the column count is Assumption 3 of the scope and is settled with the screen in front of you.

| # | Field | Record key | Modal control id it mirrors |
| --- | --- | --- | --- |
| 1 | First Name | `firstName` | `pros-first-name` |
| 2 | Last Name | `lastName` | `pros-last-name` |
| 3 | Email Address | `email` | `pros-email` |
| 4 | Phone Number | `phone` | `pros-phone` |
| 5 | LinkedIn URL | `linkedin` | `pros-linkedin` |
| 6 | Job Title | `title` | `pros-title` |
| 7 | Seniority | `seniority` | `pros-seniority` |
| 8 | Company | `companyId` (by name) | `pros-company` |
| 9 | City | `city` | `pros-city` |
| 10 | State | `state` | `pros-state` |
| 11 | Metro | `location` | `pros-location` |
| 12 | Associated Tags | `tags` | the tag picker |
| 13 | Conference Name | `conferenceName` | `pros-conference-name` |
| 14 | Conference City / Venue | `conferenceVenue` | `pros-conference-venue` |
| 15 | Conference Start Date | `conferenceStart` | `pros-conference-start` |
| 16 | Conference End Date | `conferenceEnd` | `pros-conference-end` |
| 17 | Notes | `notes` | `pros-notes` |

**The record key for Metro is `location`, not `metro`.** Anything that assumes otherwise writes a field nothing reads.

**The conference fields render always, blank or not.** No collapsing, no "+ add conference" affordance (Michael, 2026-08-30).

```js
commitProspectField(prospect, key, value)   // the ONLY writer for this surface
```

- One writer, per the single-writer rule that `completeTask` / `logTaskCompletionHistory` established in Session 1.6. It trims, assigns, calls `saveState()`, and repaints only what depends on the field — never the whole view, and never the tab body.
- **`companyId` is the one field that is not a straight assignment.** It resolves a typed company name to an existing `state.companies` record case-insensitively, and mints `comp-${Date.now()}` with the same seed object `saveProspect()` uses (9576–9600) when there is no match. That resolution is **extracted from `saveProspect()` into `resolveCompanyByName(name, email)` and called from both** — two copies of company creation is how two kinds of company record appear.
- **`email` routes through P6 before it commits.** A duplicate is refused; the field reverts to its stored value and the warning names the existing contact.
- **`tags` commits `["No Prospect Tag"]` when the selection is empty**, matching `saveProspect()` 9622 and 9643.
- Notes render at fixed height with internal scroll, as in the modal (scope Assumption 6).

```js
deleteProspectById(id)   // extracted from deleteProspect() (app.js 9657)
```

`deleteProspect()` today reads `state.selectedProspectId`. The body is extracted to take an explicit id; the existing zero-argument function becomes a one-line caller so the inspector's company-side and the AQ drawer are untouched. **The detail view's Delete passes `detailProspectId`, never the state field**, and on success replays the origin (scope Assumption 10). Delete Prospect exists in the detail view and **nowhere else gains one** — no directory row, no tab (scope Assumption 8). The deferred AQ drawer keeps its own until §2.1 runs; two delete paths until then is known and accepted.

### P6 — Email uniqueness: one resolver, three callers

```js
prospectByEmail(email, excludeId = null)   // → prospect | null. Case-insensitive, trimmed.
```

- **`saveProspect()` gains the check on both branches** — on create, and on edit when the email is changed to one already held, excluding the record itself. On a hit: a warning naming the existing contact, with a link that opens their detail view. Following the link closes the modal and discards the typed data — correct, because the record already exists.
- **`commitProspectField()` uses the same resolver** for the detail view's email field. One rule, one implementation.
- **CSV import skips duplicates and reports them; it never fails the import** (Michael, 2026-08-30: *"I don't want one duplicate email block to nullify an entire import."*). The reporting model is `pendingAudienceImport = { prospectIds, skipped, duplicateInAudience }` (9114) and the restore summary's orphan-count line.
- **Skipped rows are offered back as a downloadable CSV** to fix and re-import — a file, **not a store** (scope Assumption 12). A stored quarantine would be a new top-level store dragging in export, restore and `wipeAllData()` wiring, turning a UI phase into a data phase.
- **Ids are not normalised and email does not become the key.** Two id schemes are live: import (10487) and restore (2275) use `row.id || email.toLowerCase() || pros-…`; `saveProspect()` (9627) mints `pros-${Date.now()}`. The database holds both, and the likeliest duplicate path is exactly that seam. Re-keying would be a DIRECTIVES §4 destructive data change that orphans every task pointing at a changed id — Session 1.8 saw 31 orphaned in one step, with no error. **Not this phase.**

### P7 — The generalised column-layout machinery

A registry plus table-id-parameterised functions. The Phase 1 names on the left, the frozen names on the right:

```js
const COLUMN_TABLES = {
  taskhub:    { columns: TASKHUB_COLUMNS,    theadId: "taskhub-thead",    tableId: "taskhub-table",    rowSelector: "tr[data-task-id]" },
  prospects:  { columns: PROSPECTS_COLUMNS,  theadId: "prospects-thead",  tableId: "prospects-table",  rowSelector: "tr[data-prospect-id]" },
  companies:  { columns: COMPANIES_COLUMNS,  theadId: "companies-thead",  tableId: "companies-table",  rowSelector: "tr[data-company-id]" }
};

layoutRecord(tableId)                  // was taskHubLayoutRecord()
layoutColumns(tableId)                 // was taskHubColumns()
layoutColumnWidth(tableId, key)        // was taskHubColumnWidth(key)
setLayoutColumnWidth(tableId, key, px) // was setTaskHubColumnWidth(key, px)
setLayoutColumnOrder(tableId, keys)    // was setTaskHubColumnOrder(keys)
initHeaderDrag(tableId)                // was initTaskHubHeaderDrag()
```

- **Nothing reads `state.columnLayouts.<table>` directly.** The resolver is where the C15 read-side migration rule lives: unknown keys ignored on read and **never deleted** (deleting them destroys a newer build's data on a round trip), absent or `0` widths falling back to the code default. That rule is preserved verbatim, not re-derived.
- **`taskHubInResizeZone()` no longer exists** — Session 1.8's authorised C16 amendment replaced it with `taskHubResizeTarget` / `taskHubResizeHitCell`. Both generalise; do not resurrect the old one.
- **Storage is free.** `state.columnLayouts` was built keyed by table id precisely so a second table adopts it. Its entire backup coverage is one settings CSV row holding `JSON.stringify(state.columnLayouts)` (C17), so new keys need **zero** export or restore work, and `wipeAllData()` already clears the whole object. Verified character-identical through a real ZIP round trip in Session 1.10.
- **`table-layout: fixed` goes on `#prospects-table` and `#companies-table`, never on `.premium-table`** — that class is used 18 times across `index.html`. Under fixed layout **every column needs a real default width**, plus a width-less trailing spacer `<th>` and a `<td>` per row.
- **Both `<thead>`s need ids** — they have none today (`index.html` 272, 301). The drag delegates to a **static** ancestor because the header is rebuilt on render; `data-col-key` on each `<th>` doubles as the opt-in, so the spacer is excluded with no special case.
- **`.table-scroll-container` has `padding: 12px`, and a sticky header does not cover a scrollport's top padding.** Both tables need `padding-top: 0`, **scoped by view id** (`#view-prospects .foo`) because the base rule sits ~950 lines below the TaskHub block and wins on source order at equal specificity.
- The one-shot suppress flag (`taskSuppressNextHeaderClick`) generalises with the rest and simply never fires on these two tables — **neither sorts today**; their `<th>`s are static markup with no handlers. That removes three of Sessions 1.10/1.11's four gotchas here, and makes adding sortable headers later cheap.

### P8 — The tag chooser

`#prospect-tag-chooser` is replaced with the **Advanced Query picker pattern** — `renderAqPickerDropdown` / `renderAqPickerChips` / `setAqPickerSelection` / `toggleAqPickerMode` / `removeAqPickerSelection` / `initAqPickers`, driven by the `AQ_PICKERS` config at `app.js` 6148. **Reuse, not invention.**

Today's control is a native `<select multiple size="1">` with `onfocus` / `onblur` / `onchange` handlers written inline in the HTML (`index.html` 236–239) and Ctrl/Cmd-click as the multi-select gesture. **The id is the contract, the widget is not** — the same shape that made C14's `#task-prospect` select→hidden-input swap a zero-risk change to the save path. Whatever reads the chooser's selection reads it through one accessor, not through `.options` / `.selectedIndex`.

### P9 — What does not change

- **No new persisted field. No `ensureStateDefaults()` entry. No CSV column. No `wipeAllData()` line for the detail view itself. No migration.**
- **DIRECTIVES §4 Backup coverage still fires for the phase**, through the carried-in `state.taskSettings` gap. **A session must not reason "no data work → Gate C inert."**
- **No prospect id enters a URL, hash or `document.title`.** Imported `prospectId` values are email addresses (`app.js` 2275, 10487), so a hash route would put live contact addresses into the address bar, browser history and any error trace capturing a URL. Gate A, and the Phase 4 pre-flight's §3.1 telemetry rule. **"Add a hash route so the back arrow works" is the obvious wrong turn and it is forbidden.**
- **Any selector built from a prospect id uses `CSS.escape` or an attribute match.** The codebase already does this at 7023 and breaks without it.
- **`#modal-prospect` is untouched and remains the create path.** Michael, 2026-08-30: *"I may build it out as customizable."* It is not vestigial and must not be deleted as cleanup.
- **The Audience view's inline `grid-template-columns: 1.2fr 0.9fr` at `index.html` 663 is load-bearing** and is on the same `.prospects-layout-container` class ProspectHub uses at 210. `.prospects-layout-container` defaults to `1fr 0fr`, which collapses that inspector to zero width — the DOM updates and nothing appears to happen. Removing the prospect card must not disturb it.
- **The "Add to audience…" control at the top of `#inspector-memberships` is the one piece of the memberships area whose relocation is a decision rather than a re-parent.** It sits outside the three subsections on purpose — it is the one path in that panel that mutates another entity. In the detail view it belongs to the **Audiences tab**.

---

## Sessions

### Session 2B.1 — Navigation substrate: `detailProspectId`, the origin record, the empty panel

- **Compartment:** STATE · **Depends on:** Phase 2A (closed)
- **Goal:** P1, P2 and P3 exist in code. A prospect detail panel opens, carries ProspectHub purple under 2A's header band with a working back arrow, and returns to its origin in the state it was in — from all three origin shapes. Nothing in the app yet points at it.
- **Size: M** · My time: ~5 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html` (the empty `#view-prospect-detail` section, the header-band back arrow), `style.css` (`body.module-prospect-detail` + `.light-theme`), `sw.js`
- **Tasks:**
  1. `detailProspectId`, `detailOrigin`, `detailTab` at module scope per P1. **No state field, no `ensureStateDefaults()` entry, no `wipeAllData()` line.**
  2. `openProspectDetail(prospectId, origin)` and `closeProspectDetail()` per P2, including the unresolvable-id path (close and replay, no placeholder).
  3. `#view-prospect-detail` as a seventh `.view-panel` inside `#main-canvas` — empty but for the identity-block and tab-body containers, which stay empty this session. 2A's S1 shape: `height: 100%; min-height: 0`, `min-height: 0` at every level, the tab body owning `overflow-y`.
  4. `renderApp()` branch → `renderProspectDetail()`; `switchView()`'s nav-tab line keeping `#nav-prospects` lit; `body.module-prospect-detail` purple rule beside `body.module-prospects` (`style.css` 69).
  5. Back arrow in 2A's header band, left of the hub name; prospect name into `#view-subtitle`.
  6. Bump `CACHE_NAME`. **Budget two bumps.**
- **Inputs needed from me:** none.
- **Done when:**
  - Console: `openProspectDetail(<a real id>, { view: "prospects" })` → paste `state.activeView`, `document.querySelector(".view-panel.active-panel").id`, `getComputedStyle(document.body).getPropertyValue("--color-primary")` and `document.getElementById("nav-prospects").className`.
  - **Origin replay, all three shapes, pasted:** from `{view:"prospects"}` back lands on ProspectHub; from `{view:"tasks", taskId}` back lands on TaskHub **with that task's editor open** (paste `document.getElementById("modal-task").className` and `#task-title`'s value); from `{view:"campaigns", campaignSubState:"audiences", audienceListId}` back lands on the audience, not on whichever sub-tab was last open (paste `campaignViewSubState` and `selectedAudienceListId`).
  - Console: `openProspectDetail("pros-does-not-exist", {view:"prospects"})` → paste `state.activeView` showing `"prospects"`. No placeholder rendered.
  - Console: `state.selectedProspectId` is unchanged by every call above. Paste before and after.
  - Reload with `state.activeView === "prospect-detail"` persisted → boot lands on Dashboard, clean console. Paste it.
  - **Screenshot** the empty panel with the sidebar pinned and unpinned, proving it stops at the sidebar in both and reflows.
  - `python check_ids.py` — output is the standing baseline pair `{'export-backup-btn', 'restore-backup-input'}` and nothing more. Paste it.
  - App loads at `localhost:5000`, clean console, existing views render, state survives reload.
- **Needs my eyes:** the back arrow's placement and weight in 2A's band, and the purple reading as ProspectHub's rather than as a new hub colour.
- **Risk and fallback:** the only real unknown is how 2A's header band accommodates a leading control. If the arrow fights the band's alignment, fall back to placing it inline at the left edge of the identity block for this session and raise the band change as a 2A amendment — do **not** solve it by making the view scroll or by positioning against the viewport.

### Session 2B.2 — Column-layout machinery generalised, proven against TaskHub

- **Compartment:** UI · **Depends on:** nothing in this phase (independent of 2B.1)
- **Goal:** P7's registry and six table-id-parameterised functions exist, `taskhub` is their only consumer, and TaskHub behaves identically to the day 1.11 shipped — proved by resize, reorder, persistence across a reload, and a full ZIP round trip. **No ProspectHub table is touched.**
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html` (`data-col-key` unchanged; no new markup), `sw.js`
- **Tasks:**
  1. `COLUMN_TABLES` registry with the `taskhub` entry only. `PROSPECTS_COLUMNS` / `COMPANIES_COLUMNS` are **not** written this session.
  2. Rename and parameterise the six functions per P7. The C15 read rule — unknown keys ignored, never deleted; `0`/absent width → code default — moves **verbatim**, not rewritten.
  3. `initHeaderDrag(tableId)` reads its `thead` and row selector from the registry; `taskHubResizeTarget` / `taskHubResizeHitCell` / `taskHubSwapAdjacentColumnCells` / the drop line generalise with it. Keep the mouseup-must-not-re-render rule and the one-shot suppress flag, including its clear-at-next-mousedown line.
  4. Update the single `initTaskHubHeaderDrag()` call in `setupEventListeners()` and the `ensureStateDefaults()` default record.
  5. Grep for any surviving direct read of `state.columnLayouts.taskhub` and route it through the resolver. Paste the grep.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when — this is the regression gate and it is the point of the session:**
  - **Resize:** drag a TaskHub column edge; paste `state.columnLayouts.taskhub.widths` before and after, and a screenshot of the header at the new width.
  - **Reorder:** drag a column across two others in one fast gesture; paste `state.columnLayouts.taskhub.order` and a screenshot showing header labels still over their own data.
  - **Persistence:** reload; paste the same two objects unchanged and a screenshot of the restored layout.
  - **ZIP round trip:** export → `wipeAllData()` → restore, driven per `BUILD_NOTES.md` (stub `window.prompt` / `alert` / `confirm` into a capture array first, wrap `saveBackupFile` to stash the blob). Paste `JSON.stringify(state.columnLayouts)` before and after and show it character-identical.
  - **The click after a drag does nothing and the one after that behaves normally** — TaskHub headers sort; paste `taskSort` across three consecutive clicks.
  - **Hand-edited record still safe:** set `state.columnLayouts.taskhub.order` to a list carrying an unknown key and missing a known one, render, paste the rendered header order and `state` afterwards, showing the unknown key was ignored on read and **not deleted**.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** nothing new — but confirm TaskHub still feels the same, because that is the outcome this session exists to protect.
- **Risk and fallback:** this refactors code that shipped on 2026-08-30 and is the highest-risk item in the phase. **Three strikes applies hard here.** Fallback: keep the six `taskHub*` functions as one-line delegates to the generalised ones for one session, so a regression is a two-line revert rather than an unpick — and remove the delegates in 2B.8 once a second consumer exists.

### Session 2B.3 — Identity block: 17 fields, the single field writer, Delete, and `--color-danger`

- **Compartment:** UI, with LOGIC · **Depends on:** 2B.1
- **Two compartments justified:** `commitProspectField()` is the identity block's only reason to exist and the block is its only caller. Splitting them ships either a writer nothing calls or a form that cannot save.
- **Goal:** All 17 editable fields render on one screen and commit through one writer. Seniority and the four conference fields are visible and editable in the app for the first time. Delete Prospect lives here, in red.
- **Size: L** · My time: ~12 min · **Confidence: High**
- **Should this L be split?** **No.** The natural seam — fields now, commit later — is the one that violates §4: it would leave a screen that looks editable and silently discards typing, on the app's most-used surface, for a whole session. The other seam, splitting the 17 fields into two batches, produces two half-forms and no verifiable Done-when. What keeps it High at L is that every field's read, write and default already exists in `openProspectModal()` (9491) and `saveProspect()` (9553) and is being re-hosted, not designed — the one genuinely new piece is `resolveCompanyByName()`, which is an extraction.
- **Files:** modified `app.js`, `index.html` (the identity block markup inside `#view-prospect-detail`), `style.css` (the block's grid, `--color-danger`), `sw.js`
- **Tasks:**
  1. Identity block markup: all 17 fields in the P5 order, three or four columns at canvas width, labelled inputs, visible focus. Conference fields render always, blank or not.
  2. `commitProspectField(prospect, key, value)` per P5 — trim, assign, `saveState()`, repaint only what depends on the field. Never a whole-view render, never the tab body.
  3. Extract `resolveCompanyByName(name, email)` out of `saveProspect()` 9576–9600 and call it from **both**. One company-creation path.
  4. Notes at fixed height with internal scroll.
  5. Tags: reuse the existing chooser modal path for now — `openChooseTagsModalForProspectInspector()` (12704) is keyed on `state.selectedProspectId` and **must not be**; give it an explicit id parameter and pass `detailProspectId`. (Its existing callers keep today's behaviour by passing the state field.)
  6. Delete Prospect: `deleteProspectById(id)` extracted per P5, called with `detailProspectId`, replaying the origin on success.
  7. **Define `--color-danger` once** in `:root` plus its `.light-theme` override. Verify all six existing call sites now render red — `app.js` 7775, 8024, 8065, 8498 and `index.html` 1680, 2582, 2704. Convert nothing else to the token.
  8. Bump `CACHE_NAME`.
- **Inputs needed from me:** none. Three vs. four columns is decided in-session with the screen up (scope Assumption 3).
- **Done when:**
  - Console: for each of the 17 keys, set the control's value, dispatch `change`, and paste `state.prospects.find(p => p.id === detailProspectId)[key]` — all 17, including `seniority`, `conferenceName`, `conferenceStart`, `conferenceEnd`, `conferenceVenue`, and `location` for **Metro**.
  - Reload; paste the same 17 values surviving.
  - Console: type a company name that does not exist, dispatch `change`, paste the new `state.companies` entry and the prospect's `companyId`. Then type an existing name in different case and paste the resolved id, proving no second company was minted.
  - Console: clear all tags; paste `prospect.tags` showing `["No Prospect Tag"]`.
  - **Delete:** open the view from a task editor origin, delete the prospect, paste `state.prospects.length` before/after, `state.activeView`, and `#modal-task`'s class showing the origin replayed.
  - **`--color-danger`:** paste `getComputedStyle(document.documentElement).getPropertyValue("--color-danger")` non-empty, plus `getComputedStyle(el).color` for one `app.js` site and one `index.html` site in **both** themes. Screenshot two of them — the token was invalid at computed-value time before, so the elements were inheriting.
  - **Screenshot** the whole block at canvas width with the sidebar pinned and unpinned, on a prospect with every field populated and on one with all five modal-only fields blank.
  - Clean console; `check_ids.py` at baseline; state survives reload; existing views render.
- **Needs my eyes:** three columns vs. four; whether the four always-on conference boxes are annoying against real data (scope Assumption 4 says collapsing them when all four are blank is a five-minute change made with the screen in front of you, not a decision taken in the abstract); and the red.
- **Risk and fallback:** the field-level commit (Assumption 4) is the reversible call here. If commit-on-change proves twitchy against real typing, fall back to commit on `blur` for text inputs — same writer, one listener changed. Do **not** fall back to a Save button and a dirty state without amending Assumption 4.
- **⚠️ Backup point: take a manual ZIP before this session.** It is the first session in the phase to add a write path to every prospect field.

### Session 2B.4 — Tab strip, Interactions tab, Tasks tab

- **Compartment:** UI · **Depends on:** 2B.3
- **Goal:** P4 exists. Six tabs render, Sequences visible and disabled, and the two tabs that carry a prospect's own record — the full unfiltered timeline and every task including completed — work. Only the tab body scrolls.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. `PROSPECT_DETAIL_TABS`, `renderProspectDetailTabs()`, `renderProspectDetailTabBody()` per P4. Buttons, not `<div>`s.
  2. **Interactions** = the whole of `p.history`, **unfiltered**, plus "+ Log Interaction". Not what `getLastReachoutDate()` reads: `isRealReachout()` (6229–6241) excludes `"Task Completed"` from the *math*, and the reachout distinction stays where it already lives — in each row's type chip. There is one array; "interactions" and "history" are the same data.
  3. **Tasks** = re-parent `renderProspectInspectorTasks(prospect)`. It already **returns an element** and has one caller (3905). This is a re-parent, not a rewrite — `DECISIONS.md` 2026-08-28 costed it at *"roughly half a session"* and the intake found it cheaper. **Do not inflate it.**
  4. Rehost the interaction modal's prospect resolution: `openInteractionModal()` (9763) and its save path (9793) read `state.selectedProspectId`. Give both an explicit id, as with the tag modal in 2B.3.
  5. The tab body owns `overflow-y`; `min-height: 0` at every level; the identity block stays content-height.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste `p.history.length` and the rendered row count for a prospect holding at least one `"Task Completed"` entry — **equal**, proving the timeline is unfiltered — and paste `getLastReachoutDate(p)` showing it still ignores that entry.
  - Log an interaction through the tab; paste the new `p.history` entry and confirm the id is unique against every existing one.
  - Console: paste the Tasks tab's rendered row count against `state.tasks.filter(t => t.prospectId === p.id).length`, including a completed task, sorted due date descending.
  - Click a task row; paste `#modal-task`'s class and `editingTaskId`, proving the editor opens over the view.
  - Click the Sequences tab; paste its `disabled` attribute and `detailTab`, proving nothing happened.
  - Switch tabs five times; paste evidence that only the body container's children changed — take the identity block's first input's value, type into it, switch tabs, and show the value survived.
  - **Screenshot** a prospect with 40+ history entries: the page does not scroll, the tab body does, the identity block and tab strip stay put.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** the tab strip's weight against the identity block, and whether Interactions is the right default landing tab against real records.
- **Risk and fallback:** the scroll shape is 2A's contract S1 and if it misbehaves the symptom points at the wrong place — a flex chain missing one `min-height: 0` looks like a sticky-header failure. Check the whole chain before suspecting the tab body.

### Session 2B.5 — Audiences, Campaigns and Company tabs

- **Compartment:** UI · **Depends on:** 2B.4
- **Goal:** The three membership-and-relationship tabs work, including the Company tab's roster of every other prospect at the same company — which replaces an Advanced Query run made constantly by hand.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. **Audiences** — re-parent the audiences subsection from `renderInspectorMemberships()` (3810), **and relocate the "Add to audience…" control into this tab.** That control sits outside the three subsections on purpose, because it is the one path in the panel that mutates another entity; moving it is a decision, and this is where it is taken. It keeps its own identity inside the tab rather than being folded into the list.
  2. **Campaigns** — re-parent the campaigns subsection. Campaign membership stays *derived* from audience membership, and the two tabs stay separate (Michael, 2026-08-30).
  3. **Company** — the company record's fields, plus every other prospect at that company, joined on `companyId`, each row calling `openProspectDetail(otherId, detailOrigin)` so the back arrow still returns to where the *first* prospect was opened from. A prospect with no `companyId` gets an empty state, not a blank tab.
  4. Navigation out of a membership chip keeps the three-assignment CampaignHub rule (`BUILD_NOTES.md`) — `switchView` alone lands on the last sub-tab.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: paste the Audiences tab's row count against `state.audienceLists.filter(al => (al.prospectIds||[]).includes(p.id)).length`.
  - Add the prospect to an audience through the tab; paste that list's `prospectIds` before and after, and confirm the option disappears from the picker.
  - Console: paste the Campaigns tab's row count against the derived set (`state.campaigns` whose `audienceListId` is one of the matched lists).
  - Console: paste the Company tab's roster count against `state.prospects.filter(x => x.companyId === p.companyId && x.id !== p.id).length` for a company with at least three prospects.
  - Click a colleague; paste `detailProspectId` (changed) and `detailOrigin` (**unchanged**), then hit back and paste the landing view.
  - Open a prospect with `companyId === ""`; paste the empty state's text, and confirm no console error.
  - Click through to a campaign and to an audience from the chips; paste `campaignViewSubState` and `selectedAudienceListId` each time.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** the Company tab's shape — this is the tab that replaces a workflow, so it is the one worth looking at against a company with a lot of contacts.
- **Risk and fallback:** the "Add to audience…" relocation is the piece with a `BUILD_NOTES.md` warning attached. If it does not sit well inside the tab, keep it visually distinct at the top of the tab body — do **not** fold it into the memberships list, which is what the warning exists to prevent.

### Session 2B.6 — Cutover: four entry points, the prospect card retired, the company inspector narrowed

- **Compartment:** UI, with STATE · **Depends on:** 2B.5
- **Two compartments justified:** repointing the four call sites (UI) and narrowing `renderInspector()`'s selection logic from "a prospect or a company" to company-only (STATE) are the same edit seen from two sides. Doing one without the other leaves two live prospect surfaces, which is the drift this phase exists to end.
- **Goal:** Every path that used to open the ProspectHub prospect card now opens the detail view. `#prospect-inspector` is gone; `.prospect-inspector-panel` survives as the **company** host. There is one place an existing prospect is edited.
- **Size: L** · My time: ~12 min · **Confidence: High**
- **Should this L be split?** **No, and splitting it would be the dangerous choice.** The whole session is one cutover. Repointing two entry points and leaving two on the old card, or removing the card in a separate session from repointing, both produce exactly the half-migrated state §4 forbids — and it is the surface real outreach runs on. It is L because it touches four call sites, one render function's branching, the layout container's class toggling and a set of listeners; it is High because every destination already exists and was verified in 2B.1–2B.5.
- **Files:** modified `app.js`, `index.html` (remove `#prospect-inspector`), `style.css`, `sw.js`
- **Tasks:**
  1. Repoint all four call sites per P3's table: `app.js` 3526–3531 (directory row), 11130–11137 (task editor link), 8637 and 8955 (audience contact rows). **7204 is not touched.**
  2. `selectProspect()` (3540) loses its consumers for prospects. `selectCompany()` and `closeInspectorPanel()` stay. The directory's `active-row` highlight for prospects goes with the card — a row click now navigates.
  3. `renderInspector()`: the prospect branch and its ~20 `inspector-*` element reads are removed; `hasSelection` narrows to `selectedCompanyId` alone; the `inspector-open` toggle follows.
  4. Remove `#prospect-inspector` markup and its now-dead listeners — `btn-edit-prospect`, `btn-delete-prospect`, `btn-edit-inspector-tags`, `inspector-notes` / `btn-save-pros-notes`. Run `check_ids.py` **before and after** and diff against the standing baseline; that is precisely the failure class it catches.
  5. **Do not touch `index.html` 663's inline `grid-template-columns`.** Verify it is byte-identical after the session.
  6. Confirm `#modal-prospect` is untouched and still creates. Confirm the AQ drawer still opens, still edits and still deletes.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Each of the four entry points, exercised by dispatching a real click on the element the render function produced (never by calling the handler): paste `detailProspectId` and `detailOrigin` for each, then back, and paste the landing state.
  - Paste `document.getElementById("prospect-inspector")` → `null`.
  - Select a company in the directory; paste `selectedCompanyId`, the panel's classes and a **screenshot** showing the company card intact.
  - Paste `document.querySelector("#view-campaigns .prospects-layout-container").getAttribute("style")` and diff it against the pre-session value — identical.
  - **Screenshot** the CampaignHub audience view with its inspector open, proving the grid override survived.
  - Create a prospect through `#modal-prospect`; paste the new record and confirm the modal still closes and the directory refreshes.
  - Open the AQ drawer on a prospect; paste `state.selectedProspectId` and confirm `detailProspectId` is **unchanged** — the two cursors are independent, which is the thing 2B.1 exists to guarantee.
  - `check_ids.py` before and after, both at the standing baseline pair. Paste both.
  - Clean console; state survives reload; every hub renders.
- **Needs my eyes:** the ProspectHub directory at full width with no panel, and a full pass through a real day's work in the new view before the next session starts. **This is the review point** — Phase 1's three added sessions all came from one review of the session that first showed the new surface working, and this is that session.
- **Risk and fallback:** the highest-consequence session in the phase. Fallback is a clean revert of this session alone — 2B.1–2B.5 are purely additive and leave the old card working, which is exactly why the cutover is one session at the end rather than spread across five.

### Session 2B.7 — Email uniqueness, import skip-and-report, and `taskSettings` in `wipeAllData()`

- **Compartment:** DATA, with LOGIC · **Depends on:** 2B.6 (the detail view is the duplicate warning's destination)
- **Two compartments justified:** `prospectByEmail()` and its three call sites. The resolver has no observable behaviour without them and they cannot be verified without it.
- **Goal:** A duplicate email cannot be created by hand or by edit, an import reports what it skipped instead of failing, and the Phase 1 `wipeAllData()` gap is closed with the drill leg re-run against a value that was genuinely cleared.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html` (the import summary's skipped-rows control), `sw.js`
- **Tasks:**
  1. `prospectByEmail(email, excludeId)` per P6. One resolver.
  2. `saveProspect()` — the check on **both** branches. The warning names the existing contact and links to their detail view; following the link closes the modal and discards the typed data.
  3. `commitProspectField()`'s email path uses the same resolver; a duplicate reverts the field to its stored value.
  4. `importCSVContacts()` — skip duplicates, count them, report in the summary, never fail the import. Reporting model: `pendingAudienceImport` (9114) and the restore summary's orphan line.
  5. Skipped rows offered back as a downloadable CSV. **A file, not a store** — no new top-level store, no `ensureStateDefaults()` entry, no `wipeAllData()` line, no CSV column in the bundle.
  6. **`state.taskSettings = { dateMode: "business" };` added to `wipeAllData()`'s explicit list** (`app.js` 1721–1748), beside `state.columnLayouts`.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none, unless you want the duplicate warning worded a particular way.
- **Done when:**
  - Create a prospect with an email an existing record already holds; paste the warning text and `state.prospects.length` unchanged. Follow the link; paste `detailProspectId` resolving to the existing contact.
  - Edit a prospect's email to another record's; paste the refusal and the field reverted. Then edit it to a *new* value and paste it committed — the exclude-self branch.
  - Import a CSV holding two rows whose emails already exist plus two that do not; paste the summary showing 2 imported / 2 skipped, `state.prospects.length` up by exactly 2, and the skipped-rows CSV's contents.
  - **The Task Date Mode drill leg, re-run for real:** set `dateMode` to `"all"`, export the ZIP, `wipeAllData()`, paste `state.taskSettings` showing the value **cleared** — this is the assertion that could not fail before — then restore and paste `state.taskSettings.dateMode === "all"`.
  - Paste `state.columnLayouts` and `state.tasks` also cleared by the same wipe, confirming nothing else regressed in that list.
  - **DIRECTIVES §4 backup-coverage statement in the session summary**, in words: what stores this session created or modified, and whether each is covered.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** the duplicate warning's wording — it is the one place the app tells you it refused to do what you asked.
- **Risk and fallback:** the import path is the one with live consequences. If skip-and-report proves hard to thread through `importCSVContacts()`'s inner parse, the fallback is to report the count and skip the rows **without** the downloadable CSV, and take the CSV into a review-response session — never to fail the import, and never to import the duplicate.
- **⚠️ Backup point: manual ZIP before this session.** It calls `wipeAllData()` against real data in its own Done-when.

### Session 2B.8 — Both ProspectHub directory tables adopt the generalised layout

- **Compartment:** UI · **Depends on:** 2B.2 and 2B.6
- **Goal:** `#prospects-table` (7 columns) and `#companies-table` (5) have sticky, purple, resizable, reorderable headers on the same machinery TaskHub uses — and TaskHub is unchanged.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html` (thead ids, `data-col-key`, spacer `<th>`), `style.css`, `sw.js`
- **Tasks:**
  1. `PROSPECTS_COLUMNS` and `COMPANIES_COLUMNS` with a **real default width for every column** — Name / Title / Company / City / State / Metro / Tags, and Company Name / Industry / Location / Website / Tags.
  2. Registry entries per P7; ids on both `<thead>`s (`index.html` 272, 301); `data-col-key` on each `<th>`; a width-less trailing spacer `<th>` plus a `<td>` per row.
  3. `table-layout: fixed` on the two table ids — **never on `.premium-table`**, which is used 18 times.
  4. `padding-top: 0` on both scroll containers, **scoped by view id**, because `.table-scroll-container { padding: 12px }` sits ~950 lines below and wins on source order at equal specificity.
  5. Row rendering emits cells in `layoutColumns("prospects")` order, and rows carry `data-prospect-id` / `data-company-id` so the reorder's cell-mover skips the empty-state row. Fix the empty-state `colspan` at 3502, which says 5 for a 7-column table.
  6. Remove 2B.2's `taskHub*` delegates if they were kept.
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none. The five-plus-seven default widths are set from the screen.
- **Done when:**
  - Resize and reorder a column on **each** table; paste `state.columnLayouts.prospects` and `.companies` before and after, and screenshot each showing labels still over their own data.
  - Reload; paste both records unchanged and screenshot the restored layouts.
  - **TaskHub regression, again, in full:** resize, reorder, reload, and paste `state.columnLayouts.taskhub` — unchanged behaviour.
  - **ZIP round trip** carrying all three keys: paste `JSON.stringify(state.columnLayouts)` before and after, character-identical.
  - **Screenshot both tables scrolled**, proving each header is stuck and opaque with no sliver of a row above it — `getComputedStyle` reports clean on this failure and has already fooled a session once.
  - Both tables scroll independently at `max-height: 35vh` with both headers stuck simultaneously.
  - Narrow a column past its label; paste a screenshot showing truncation rather than the neighbours stretching.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** the twelve default widths, the purple, and the 6px resize zone against these two tables — the zone geometry is already on the carried list needing your eyes from 1.8.
- **Risk and fallback:** `table-layout: fixed` truncates rather than growing, so a width that was fine under auto layout renders `"COMPAN…"`. Fallback is widening a default, never removing `fixed` — without it per-column pixel widths do not stick at all.

### Session 2B.9 — `#prospect-tag-chooser` replaced with the Advanced Query picker

- **Compartment:** UI · **Depends on:** 2B.8
- **Goal:** ProspectHub's tag filter is the app's picker pattern — chips, include/exclude, no Ctrl-click — and the filter it feeds behaves identically.
- **Size: M** · My time: ~6 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. Add a picker entry to `AQ_PICKERS` (6148) for the ProspectHub tag filter, or a parallel config of the same shape if the AQ config is bound to AQ-only ids. **Reuse the six functions; write no seventh.**
  2. Replace the `<select multiple size="1">` at `index.html` 236–239, **including its three inline `onfocus` / `onblur` / `onchange` handlers**, which are the last inline handlers on this control.
  3. One accessor for the current selection; every reader goes through it. Nothing calls `.options` or `.selectedIndex` on it afterwards. P8 — the id is the contract, the widget is not.
  4. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Select two tags through the new picker; paste the accessor's value and the filtered `contacts-count`, and compare against the same two tags applied by editing state directly — identical sets.
  - Remove one chip; paste the recount.
  - If include/exclude is offered, paste a filtered count for an exclude selection and reconcile it by hand against `state.prospects`.
  - Paste a grep of `index.html` showing zero `onfocus=` / `onblur=` / `onchange=` left on `#prospect-tag-chooser`.
  - Keyboard: open, select and clear the picker without the mouse; paste the resulting selection. (Authoring habit, not Gate F.)
  - **Screenshot** the picker open and with three chips, in both themes.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** whether include/exclude belongs on a hub filter at all, or whether ProspectHub only wants include.
- **Risk and fallback:** if `AQ_PICKERS` turns out to be bound tightly to Advanced Query's own result-refresh path, the fallback is a second config entry of the same shape calling the same six functions — **not** a second implementation.

### Session 2B.10 — Phase close: drill, curation, declarations audit, export re-prove

- **Compartment:** QA · **Depends on:** everything, **including any review-response sessions.** Always last.
- **Goal:** The phase goal is verified against real data, the export path is re-proved whole, the standing files are true, and Phase 3 has a starting point.
- **Size: M** · My time: ~20 min · **Confidence: High**
- **Sized M deliberately.** Session 1.8 was sized S, ran L, and consumed 45 of Phase 1's 88 attention minutes. `DECISIONS.md` 2026-08-30: a phase close is not a small session and must not be sized as one. M is the floor, and the 20 minutes reflects what a close actually costs.
- **Files:** modified `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/DECISIONS.md`, `ai/DECLARATIONS.md` (proposals only), `ai/phases/phase-2b-RUNSHEET.md` (deleted at close)
- **Tasks:** run the Step 3 block in `ai/phases/phase-2b-RUNSHEET.md` verbatim. It already carries the five things this close owes beyond a normal one:
  1. **Re-prove the export path** — full export → wipe → restore on real data, counts pasted, even though this phase added no columns. `DECISIONS.md` 2026-08-30 §3 makes the ZIP bundle the most protected thing in the app.
  2. **Re-verify a snapshot restore** — `DECISIONS.md` 2026-08-30 makes Tier 1 the sole protection through Phase 3, so it is re-proved at every phase close, not only Phase 1's.
  3. **Estimate calibration**, and say whether 2A and 2B repeated Phase 1's 8→11 pattern.
  4. **The five amendments scope §9 already owes:** two `DECISIONS.md` entries (Advanced Query deferred-not-reversed; email is unique, not the key), two `BUILD_NOTES.md` entries (the AQ drawer's accepted divergence, worded so nobody ports subsections across; the five modal-only fields), and the `DECLARATIONS.md` seventh view — **a view panel, not a hub. The "six hubs" line stays true and must not be edited to say seven.** Propose; do not apply.
  5. **Phase 3 is Sequencing and its scope is SUPERSEDED.** It needs an intake, not a Prompt 3. Prompt 5's scripted closing line is wrong here — the run sheet says so explicitly.
- **Inputs needed from me:** the amendment approvals, and one click if the snapshot folder needs re-granting (`showDirectoryPicker()` cannot be driven by an agent).
- **Done when:** every check in the Step 3 block has real pasted output, `BUILD_NOTES.md` has been curated with what was cut reported, and `DECLARATIONS.md` is still one page.
- **Needs my eyes:** the amendments, and the calibration's conclusion for Phases 3 and 4.
- **⚠️ Backup point: manual ZIP and a confirmed green snapshot before this session.** It calls `wipeAllData()` against real data. Non-negotiable.

---

## Session order

```
2B.1  Nav substrate      (STATE, M)  — after Phase 2A closes.  BLOCKED until then.
2B.2  Layout generalised (UI,    M)  — independent of 2B.1. Highest-risk refactor: run early.
2B.3  Identity block     (UI,    L)  — after 2B.1            ⚠️ ZIP first
2B.4  Tabs + Inter/Tasks (UI,    M)  — after 2B.3
2B.5  Aud/Camp/Company   (UI,    M)  — after 2B.4
2B.6  CUTOVER            (UI,    L)  — after 2B.5            ← the review point
2B.7  Email + wipe gap   (DATA,  M)  — after 2B.6            ⚠️ ZIP first
2B.8  Directory tables   (UI,    M)  — after 2B.2 and 2B.6
2B.9  Tag chooser        (UI,    M)  — after 2B.8
2B.11 Filter column      (UI,    M)  — geography + widths     ✅ unblocked
2B.12 Resize cursor      (UI,    S)  — cursor + drag guard    ✅ unblocked
2B.13 Company dup guard  (DATA,  M)  — needs the exception    ⚠️ ZIP first
2B.14 Include semantics  (UI,    M)  — needs the exception
2B.15 Tag filter pop-out (UI,    M)  — after 2B.14. NEEDS P8 REVISION
2B.16 Company tab        (UI,    S)  — collapse + reorder     ✅ unblocked
2B.17 ID block redesign  (UI,    L)  — after 2B.13. BLOCKED on the design
2B.10 Close              (QA,    M)  — LAST. Always last.    ⚠️ ZIP + green snapshot first
```

**2B.2 is the deliberate re-sequencing, and it is worth stating plainly.** The two fixed constraints are honoured — 2B.1 lands `detailProspectId` first, and the generalisation is proved against TaskHub before either ProspectHub table is touched. What this plan chooses is the *distance* between generalising (2B.2) and applying (2B.8). Adjacent is cheaper in context; six sessions apart is stronger evidence. The run sheet calls the generalisation the riskiest thing in the phase, DIRECTIVES Ladder 1 is stability, and PROMPT 2's ordering rule says prove a risky premise early even when it is not foundational. Running it second means the refactor of code that shipped 2026-08-30 is exercised by real daily TaskHub use for six sessions before a second consumer arrives — which is regression evidence no Done-when can buy. The cost is that 2B.8 re-reads a resolver it did not write; P7 is frozen precisely so that costs one read.

**2B.2 is genuinely parallelizable with the 2B.1 → 2B.6 chain.** It touches TaskHub and the layout store; nothing else in the phase touches either until 2B.8. If the detail view matters more than the tables in a given week, 2B.2 can slide anywhere before 2B.8. It is placed second rather than eighth because of the risk argument above, not because anything depends on it.

**2B.1 → 2B.6 is strictly sequential and must not be reordered.** Each session builds on the previous one's surface, and DECLARATIONS requires the app be left usable — not merely building — between them, because real outreach happens in it. 2B.6 is the one session that removes something, and it removes it only once everything that replaces it exists.

**2B.6 is the review point, and this plan says so in advance.** Phase 1's entire session-count overrun came from one review pass over one session — 1.5, the session that first showed a new hub working — on the day it shipped. `DECISIONS.md` 2026-08-30 names the cause as a structural omission: *"the plan had no line item for what looking at it will produce."* 2B.6 is this phase's 1.5. **Review it before starting 2B.7**, and expect that review to produce sessions.

**The review pass ran and closed 2026-09-01** — findings in
`ai/phases/phase-2b-REVIEW-FINDINGS.md`, sessions in
`ai/phases/phase-2b-review-response-plan.md`. It produced **seven** sessions against the 3–4 the
contingency assumed.

**Review-driven sessions take 2B.11 and up.** 2B.10 keeps its number and moves to last, exactly as 1.8 did — `BUILD_NOTES.md` and `AIContext.md` will already point at "2B.10" as the close, and silently repointing them is how a backlog item gets lost.

## Phase estimate

| | |
| --- | --- |
| **Sessions planned** | **10** |
| **Sessions forecast** | **13–14**, applying the +35% contingency from `DECISIONS.md` 2026-08-30. The contingency is a *forecast*, not four extra planned sessions — it is what the 2B.6 review is expected to produce, and it takes numbers 2B.11+. |
| **Against the scope's 7–10** | **Inside it, at the top.** Detail-view compartment: 2B.1, 2B.3, 2B.4, 2B.5, 2B.6, 2B.7 = **6** (scope says 5–7). Directory compartment: 2B.2, 2B.8, 2B.9 = **3** (scope says 2–3). Plus the phase close, which the scope's table does not count. So the plan does not disagree with the scope; it lands at the pessimistic end of both sub-ranges and adds the close, and it forecasts an actual above the band for the reason the calibration already established. |
| **Mix** | 2 L · 8 M · 0 S. No S at all — every session in this phase touches `app.js`, `index.html`, `style.css` and `sw.js`, and `BUILD_NOTES.md` is explicit that a single feature here spans the modal, the inspector, export, restore and two views. Sizing anything S would be the 1.8 mistake. |
| **My total attention** | **~97 min planned**, no session over 12 except the close at 20. Add ~25–30 min for review-response sessions → **~125 min forecast.** The method is unchanged from Phase 1, per the calibration's instruction to leave it alone: Phase 1 predicted 105 and came in at 88. |
| **Most likely to overrun** | **2B.6, the cutover.** It removes shipped UI used for daily outreach, it is the session whose review historically generates more sessions, and it is where a §4 violation would actually cost work. Runner-up **2B.2**: it refactors code that shipped the day before this plan's inputs were written, and its failure mode is silent — a broken TaskHub drag reports clean under every state check. **2B.3** is the biggest single block of new markup but the least likely to surprise, because all 17 fields already have a working read, write and default in `#modal-prospect`. |
| **`CACHE_NAME` budget** | **Two bumps per session, ~20 for the phase.** v65 → v83 across Phase 1's eleven sessions; not one finished on a single bump. The first reload after a bump still serves the old document — hand over a one-glance version tell with every summary. |

## Backup points

- **Before 2B.1** — manual ZIP export, stored outside the project folder. Per the run sheet.
- **Before 2B.3** — manual ZIP. First session to add a write path to every prospect field.
- **Before 2B.7** — manual ZIP. Its Done-when calls `wipeAllData()` against real data.
- **Before 2B.10** — manual ZIP **and** a confirmed green snapshot. `wipeAllData()` against real data again. Non-negotiable.
- **At phase close** — full ZIP, retained outside the project folder per DECLARATIONS.

Backups live in `..\backups-production\`; automatic snapshots in its `snapshots\` subfolder. The stale sibling `..\backups\` is not in use.

## Open risks

1. **Phase 2A has not shipped.** The blocking risk, and the only one that is live today. This plan's 2B.1 depends on 2A's header band (the back arrow) and its S1 scroll shape. Retired when 2A closes; until then nothing in this phase may start. If 2A's header band lands in a materially different shape than scope §3 describes, 2B.1's back-arrow task is the one line of this plan that needs revisiting.

2. **The cutover is irreversible in the user's day, not in git.** 2B.6 removes the surface Michael has used for every prospect edit since the app existed. The mitigation is the ordering — 2B.1 through 2B.5 are purely additive and leave the old card working the whole time — plus a manual ZIP and a single-session revert path. The residual risk is a workflow the new view does not cover being discovered *after* the old one is gone, which is precisely what the 2B.6 review point is for.

3. **The column-layout generalisation refactors code one day old.** Sessions 1.10 and 1.11 shipped 2026-08-30 and their four hard-won gotchas — the one-shot suppress flag and its clear-at-next-mousedown line, the mouseup-must-not-re-render rule, the real-cell mover, the midpoint swap — live inside the functions being parameterised. Three of the four do not even fire on the ProspectHub tables, which do not sort. Contained by 2B.2's regression gate and by the delegate fallback; the failure mode is silent, which is why the gate is screenshots and pasted state rather than "TaskHub still works."

4. **Two prospect cursors coexist for the whole phase.** `state.selectedProspectId` stays contended — written by the directory, the create path, the company inspector's contact rows and the deferred AQ drawer, read at 13 sites — while `detailProspectId` drives the new view. That is by design and 2B.1 exists to make it safe. The risk is a later session "tidying" the two into one. **Do not.** They converge when scope §2.1 runs, in the phase that narrows the AQ drawer.

5. **The AQ drawer falls further behind.** It already lacks the Tasks subsection and will also lack the identity block, the tabs, the duplicate-email guard and the new tag picker. **Known and accepted** (scope §2.1), and going into `BUILD_NOTES.md` at close worded so no future session helpfully ports things across. Dangerous as a surprise, fine as a decision.

6. **Field-level commit on the app's busiest screen.** Assumption 4. There is no dirty state to reconcile, which is the point, but it means every keystroke's commit boundary is a design decision made once and lived with. The fallback is `blur` rather than `change`. What must not happen is a Save button appearing without Assumption 4 being amended, because half the app would then commit on change and half on Save.

7. **Duplicate emails already in the database.** P6 stops new ones; it does not clean up existing ones, and the mixed id schemes make some records keyed by email and others by `pros-<epoch>`. A cleanup is a DIRECTIVES §4 destructive data change that orphans tasks by definition — Session 1.8 saw 31 orphaned in one step with no error. Out of scope, and it should stay out until there is a reason and a rollback plan.

8. **Compliance (DIRECTIVES §0).** Still `NOT DECIDED`. This phase does not change the data held, but it does put every field of a third party's record — including private notes — onto one screen, and it adds a downloadable CSV of skipped import rows carrying live contact data. Not blocking; worth knowing the surface grew.

---

**Next: start a NEW conversation and run Prompt 4 for Session 2B.1 — *after Phase 2A has closed.***
