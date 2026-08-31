# Scope: Prospect Detail View — Phase 2B

> ## ✅ READY FOR PROMPT 3 — intake complete, 2026-08-30
>
> *Replaces the ⛔ stop banner of 2026-08-29, which is removed.*
>
> Step 0 of `ai/phases/phase-2-RUNSHEET.md` ran on 2026-08-30 against the real
> `app.js` / `index.html` / `style.css`. §5's three open items are settled and
> frozen as contracts in **§7**. Reversible calls are logged in **§8**.
>
> **Phase 2 split. This is 2B.** The intake grew three further compartments, and
> `ai/spec/app-shell-scope.md` (**Phase 2A**) now holds the app-wide shell work.
> **2A ships first and this document assumes it has** — the detail view is one
> screen tall with only its tab body scrolling, and it sits under 2A's header
> band. Numbered 2A/2B rather than renumbered, so Sequencing stays Phase 3 and
> Hosting stays Phase 4.
>
> **Read §7 before writing the plan.** Those contracts are what Prompt 3 should
> freeze; re-deriving them is how a phase ends up with two answers to the same
> question.

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
> > **Corrected 2026-08-30 by the intake.** That last record is insufficient. `BUILD_NOTES.md` and `app.js` 3892–3897 both show that reaching a Campaign Hub audience takes **three** assignments, not two — `switchView("campaigns")` **plus** `campaignViewSubState = "audiences"` **plus** `selectedAudienceListId` **plus** `renderCampaignsView()`. The frozen origin record in §7.1 carries `campaignSubState` for this reason.
>
> **Unsaved edits: save before navigating.** The user clicked a prospect *from inside* the editor; committing what they typed and then going to look is the natural reading, and it makes the return trivially correct — the reopened editor shows current data with no stashed form state to reconcile. Two rules that follow: if `saveTaskFromEditor()`'s validation fails (it alerts on a missing title, due date or prospect), **do not navigate** — surface the alert and stay put. And this applies only to an existing task; the create path has no prospect name to click.
>
> *(An earlier draft of this banner claimed the editor was necessarily lost and called it a cost of going full-screen. That was wrong — Michael caught it. Full-screen replaces what is on screen; it does not prevent the return path from restoring it. Corrected 2026-08-29 before anything was built.)*

**Status:** **Scoped and approved 2026-08-30.** Direction approved 2026-08-28; intake run 2026-08-30 against the code.
**Depends on:** Phase 1 (closed 2026-08-30) and **Phase 2A** (`ai/spec/app-shell-scope.md`).

---

## 1. What this builds

Two compartments:

**A. The prospect detail view** — a full-screen record view replacing the Prospect Hub's slide-out prospect inspector. One screen tall, under 2A's header band, with the back arrow in that band. An identity block carrying every editable field, and a tab strip below it whose body is the only thing that scrolls.

**B. The ProspectHub directory rework** — sticky, hub-coloured, resizable and reorderable column headers on both directory tables, and a modern replacement for the tag chooser.

> **Retired 2026-08-30.** §1 previously described a "top half / bottom half"
> split. There is no half. The identity block is content-height and the tab body
> takes the remainder — see §7.3.

### 1.1 The organising principle

Michael's rule, set 2026-08-30, and the answer to "where does this field go" for every future session:

- **A scalar field on the prospect record** — exactly one value, always — belongs in the **identity block**. Name, email, title, city, metro, conference name.
- **A one-to-many collection** belongs in a **tab**. Interactions, tasks, audiences, campaigns, sequences.

A tab holding four text boxes would be a tab pretending to be a form.

### 1.2 The identity block

All **17 editable fields**, in the field order of the existing Add New Prospect modal, laid out across the full canvas width:

| | Left | Right |
| --- | --- | --- |
| 1 | First Name | Last Name |
| 2 | Email Address | *(full width)* |
| 3 | Phone Number | LinkedIn URL |
| 4 | Job Title | Seniority |
| 5 | Company | *(full width)* |
| 6 | City | State |
| 7 | Metro | Associated Tags |
| 8 | Conference Name | Conference City / Venue |
| 9 | Conference Start Date | Conference End Date |
| 10 | Notes | *(full width)* |

**Five of these appear nowhere else in the app today** and this is why the block cannot be the current inspector's compact header. `seniority`, `conferenceName`, `conferenceStart`, `conferenceEnd` and `conferenceVenue` are written by `saveProspect()` and read back by `openProspectModal()` — and displayed by **no other surface**. The inspector shows none of them (verified: zero occurrences). Seniority is live data — both query surfaces filter on it and every prospect CSV export carries it — it simply has no display. The four conference fields are the merge fields the Phase 3 sequencing spec reserves.

**Had the detail view carried only what the inspector shows, a conference name would have become permanently unviewable and uneditable, silently.**

**The conference fields render always, blank or not** (Michael, 2026-08-30). No collapsing, no "+ add conference" affordance.

The modal is two columns at ~520px; the canvas gives roughly **1,590px** with the sidebar pinned. At three or four columns the same 17 fields occupy five or six rows, not ten — which is what makes §7.3's one-screen shape achievable.

### 1.3 Tabs

| Tab | Contents |
| --- | --- |
| **Interactions** | The prospect's full timeline — every entry in `p.history` — plus the "+ Log Interaction" control. |
| **Tasks** | All tasks for this prospect, completed included, due date descending. Migrated out of the interim Phase 1 inspector subsection. |
| **Audiences** | Audience list memberships, carrying over the existing quick add-to-audience control. |
| **Campaigns** | Campaign memberships. |
| **Company** | The company record's fields **plus every other prospect at that company**, each clickable. Already joined by `companyId`. This replaces an Advanced Query run constantly by hand — "who else do I have at Comcast." |
| *(Sequences)* | **Slot reserved, not built.** Rendered visible and disabled. Phase 3 fills it. |

> **"History / Reachouts" was renamed and its contents settled, 2026-08-30.**
> The tab was described as *"what `getLastReachoutDate()` reads, and where
> completed tasks land from Phase 1."* **Those are two different sets and the tab
> cannot be both** — `getLastReachoutDate()` filters through `isRealReachout()`
> (`app.js` 6229–6241), and `"Task Completed"` sits in `NON_REACHOUT_TYPES`
> precisely so it is excluded. §14 reversed §8 to make that true, after this
> scope was written.
>
> **There is only one array.** `p.history` holds every entry, written by three
> paths: `recordInteraction()` (manual), `logTaskCompletionHistory()`
> (automatic), and prospect creation. There is no separate interactions store —
> "interactions" and "history" are the same data, which is why the old name read
> as two things.
>
> Settled on the standing reasoning in `BUILD_NOTES.md`: *"the entry earns its
> place on the timeline; it just must not count."* **The tab is the timeline —
> all entries, unfiltered.** The reachout distinction stays where it already
> lives: in each row's type chip, and in the math, which the tab does not
> perform.

**Audiences and Campaigns stay separate tabs** (Michael, 2026-08-30). Campaign membership is *derived* from audience membership in the code, so merging them was defensible; the distinction is wanted.

### 1.4 Entry points

Four, across the three hubs the 2026-08-29 banner names:

| | Surface | Call site today |
| --- | --- | --- |
| 1 | ProspectHub directory row | `selectProspect()`, `app.js` 3529 |
| 2 | TaskHub — the task editor's prospect link | `app.js` 11136 |
| 3 | CampaignHub — audience contact row | `openProspectModal()`, `app.js` 8637 |
| 4 | CampaignHub — audience pop-out contact row | `openProspectModal()`, `app.js` 8955 |

3 and 4 are both "a prospect inside an audience list" — `openAudiencePopout()` is the audience list's own pop-out panel, not a query surface. Both re-point to the detail view.

### 1.5 The directory rework

Both ProspectHub tables — `#prospects-table` (7 columns) and `#companies-table` (5) — gain the full TaskHub treatment: **sticky headers, the hub's purple, drag-to-resize and drag-to-reorder.** And `#prospect-tag-chooser` is replaced.

**No table separation is needed.** Each already sits in its own `.table-scroll-container` at `max-height: 35vh` — two independent scrollports, so both headers stick without fighting.

**Neither table sorts today.** Their `<th>`s are static markup with no handlers. That removes three of the four hard-won gotchas from Sessions 1.10 and 1.11 — the one-shot suppress flag, the mouseup-must-not-re-render rule, and the swallowed-next-click failure all exist *because* a drag shares the `<th>` with a sort click. What remains is drag correctness itself, already solved in the code being generalised. *(The suppress machinery comes along with the generalisation and simply never fires here, so adding sortable headers later is cheap.)*

---

## 2. One editing surface

Prospect detail renders in **two** places against two parallel sets of element ids: the ProspectHub overlay (`renderInspector`, `app.js` 3566) and the Advanced Query results drawer (`renderAqInspectorDrawer`, 7053, with 16 `aq-insp-*` ids). Adding a third would make three, and three renderings drift — Phase 1 already proved it, shipping the Tasks subsection to one and not the other.

**Resolved:**

- **The detail view is the single place an existing prospect is viewed or edited.** It replaces the ProspectHub overlay's *prospect* card.
- **`#modal-prospect` is kept exactly as it is** and remains the **create** path (Michael, 2026-08-30: *"I may build it out as customizable"*). It is not vestigial and must not be deleted as cleanup — that reason is recorded so a future session does not propose it.
- **Both query surfaces are deferred** — see §3.

### 2.1 The Advanced Query drawer — deferred, with the analysis recorded

`DECISIONS.md` 2026-08-28 rules that the AQ drawer *"becomes a deliberate read-only quick preview — no editing, no quick-edit, no delete."* **That ruling stands. Its execution is deferred**, not reversed, at Michael's direction on 2026-08-30: he wants better working knowledge of both query surfaces before changing either.

Recorded now so the later phase does not re-derive it:

- **What it should become:** the identity card plus one button that opens the detail view. Michael, 2026-08-30, annotating a screenshot: *"This should not have a delete button. It should just be the ID card with a button that opens up the Prospect inspector."*
- **What is deleted when it happens:** `saveAqInspectorNotes` (7176), `editAqInspectorTags` (7192), `editAqInspectorFull` (7201), `deleteAqInspectorRecord` (7216), `btn-aq-insp-add-interaction`, the history table, the memberships block, and the matching markup — **on the company branch (7132–7173) as well**, which has its own full set and which the 2026-08-29 draft never mentioned.
- **One removal is required, not cosmetic.** `openAqInspectorDrawer()` writes `state.selectedProspectId` (7032) and `selectedCompanyId` (7034), *only* because `editAqInspectorTags` → `openChooseTagsModalForProspectInspector()` reads that global (12705). With editing gone the write has no consumer.
- **It is mostly deletion**, and it removes `#modal-prospect`'s last non-create caller, leaving that modal create-only.

**Two consequences of deferring, both accepted:**

1. **The AQ drawer falls further behind.** It already lacks the Tasks subsection and will also lack whatever the detail view gains. Fine as a decision, dangerous as a surprise — it goes into `BUILD_NOTES.md` as *known and accepted*, worded so a future session does not helpfully port things across.
2. **`state.selectedProspectId` stays contended**, which makes §7.1's separate `detailProspectId` a requirement rather than tidiness. See §4.

### 2.2 The Audience Query Engine

A **second, entirely separate** query surface — `#campaign-query-view` (`index.html` 862) in CampaignHub, results rendered by `runCampaignQuery()` (`app.js` 9249) into `#query-contacts-checkboxes`. It shares nothing with Advanced Query, and **it has no inspector at all** — `#query-contacts-checkboxes` appears six times in `app.js`, all six toggling checkboxes.

Michael described wanting an identity-card overlay there, sized to the Query Results card with an ✕ to dismiss, explicitly **not** inheriting whatever the detail view grows. **Deferred with §2.1.** Recorded because it is a *fifth* entry point, not covered by the three-hubs carry-in — the Audience Query Engine is where prospects are looked at *before* they are in a list.

*(Implementation note for that later phase: each row is `<label for="chk-query-pros-…">` wrapping the name, so clicking the name currently toggles the checkbox. Opening a preview from the name means the name cannot stay inside the label, or selecting and previewing fight over the same click.)*

---

## 3. Boundaries

- **No files or media attached to prospects.** The `VantagePRMFiles` IndexedDB store is not extended to prospect records, and there is no Files tab. Decided, not deferred.
- **Companies are out of scope.** This phase builds the *prospect* detail view. See §8.7.
- **Both query surfaces are out of scope.** §2.1, §2.2.
- **No routing.** All navigation happens inside the app — see §7.1 and the app-shell scope's §9.2.
- ~~No layout work on the Media or Campaign hubs — this phase touches the Prospect Hub only.~~ **Restated 2026-08-30; as written this was already false.** No **layout rework** of MediaHub or CampaignHub — 2A owns that. But the CampaignHub entry-point call sites (`app.js` 8637, 8955) are unavoidably in scope, as is the carried-in `--color-danger` fix, whose call sites include `renderDomainsView()` (8024), the email-accounts row (7775) and the audience trigger (8498). **Entry-point edits and the carried-in fixes are in. Rearranging those hubs is not.**

---

## 4. Risk

This rewrites **shipped UI used for real work between sessions.** DIRECTIVES requires every session to leave the app usable, not merely building — a half-migrated prospect inspector costs actual outreach. That constraint is stricter here than anywhere else in the roadmap: **no session ends with the old overlay removed and the new view incomplete.**

The ProspectHub overlay and the Audience view's grid-child inspector are deliberately different patterns (`BUILD_NOTES.md`). Removing the prospect card must not disturb the Audience view's inline `grid-template-columns` override — `index.html` 663, verified present 2026-08-30, on the same `.prospects-layout-container` class ProspectHub uses at 210.

> **The one thing to prove first.** The old and new surfaces coexist for most of the phase, and today they share one persisted cursor: `state.selectedProspectId` is written by the directory, the company inspector's contact rows, the create path, the task editor's link **and the deferred AQ drawer**, and is read at 13 sites. If the detail view keys off it, a click in the untouched AQ drawer silently retargets an open detail view.
>
> **Session 2B.1 introduces `detailProspectId` (§7.1) and little else.** From that point the surfaces are independent. This is a phase-order consequence, not a style note.

**The directory rework carries its own concentrated risk.** Generalising the column-layout machinery refactors code that shipped on 2026-08-30 — `taskHubLayoutRecord()` reads `state.columnLayouts.taskhub` literally, `setTaskHubColumnWidth()` writes it literally, `initTaskHubHeaderDrag()` binds `#taskhub-thead`. See §7.4.

---

## 5. Before planning this phase — ✅ RESOLVED 2026-08-30

- ~~Read the actual overlay and AQ drawer implementations out of `app.js` and `index.html`.~~ **Done.** Findings in §2, §4 and §6.
- ~~Decide the contract session's frozen interfaces.~~ **Done — frozen in §7.**
- ~~Confirm whether anything else opens the prospect inspector.~~ **Answered — see §6.**

---

## 6. Verified against the code — 2026-08-29, extended 2026-08-30

**`openProspectModal(pid)` is not the inspector.** It opens the prospect *edit modal*. The inspector is a separate surface: `selectProspect(id)` sets `state.selectedProspectId`, and `renderInspector()` draws it.

> **Line numbers restated 2026-08-30** — the 2026-08-29 reading was against a pre-Phase-1 `app.js`. Current call sites: **7204** (AQ drawer), **8637** (audience contact row), **8955** (audience pop-out). `renderInspector()` is at **3566**, not 2527.

**The consequence for §2:** those three call sites are a fourth editing surface §2 did not account for.

> **Decided 2026-08-30.** 8637 and 8955 route into the detail view. 7204 stays as
> it is with the deferred AQ drawer. `#modal-prospect` is kept for creation.

**There are two inspectors, and Phase 1 deliberately updated only one.** `renderAqInspectorDrawer()` duplicates `renderInspector()`'s history and memberships rendering against `aq-insp-p-*` ids. Phase 1's Tasks subsection went into the ProspectHub one only — plan Assumption 2, accepted because this phase replaces that surface anyway.

> **Still true, and now longer-lived** — the AQ drawer is deferred (§2.1), so the
> gap widens rather than closing. Accepted, and recorded in `BUILD_NOTES.md` so
> it is not "fixed" by porting the subsection across.

**Also relevant:** the ProspectHub inspector's memberships area carries a live "Add to audience…" select and + Add button.

> **Read `BUILD_NOTES.md` before moving it.** That control sits *outside* the
> three subsections, at the top of `#inspector-memberships`, on purpose — it is
> the one path in the panel that mutates another entity. In the detail view it
> belongs to the **Audiences tab**, and it is the one piece of the memberships
> area whose relocation is a decision rather than a re-parent.

### Found by the intake, 2026-08-30

**`renderInspector()` renders two record types, not one.** `#prospect-inspector-panel` (`index.html` 322) wraps both `#prospect-inspector` and `#company-inspector`, switched by `state.selectedProspectId` versus module-scope `selectedCompanyId`. Read literally, "replaces the overlay" would delete the company inspector, which no tab replaces. §8.7 settles it.

**The Tasks-subsection migration is cheaper than costed.** `renderProspectInspectorTasks(prospect)` already *returns an element* and has one caller (3905), as do the Campaigns and Audiences subsections. It is a re-parent, not a rewrite. `DECISIONS.md` 2026-08-28 costed it at *"roughly half a session"* — that holds or shrinks. **Do not inflate it.**

**There is no routing anywhere in the app.** Zero `location.hash` / `history.pushState` / `window.location` in `app.js`, and boot always ends `switchView("dashboard")`. The origin record is the only history mechanism there is.

**Five prospect fields exist only in `#modal-prospect`** — see §1.2. This is the finding that determined the identity block's shape.

**Nothing guards against duplicate emails.** See §7.5.

---

## 7. Frozen contracts

### 7.1 The data contract

```
openProspectDetail(prospectId, origin)     // one entry point, four callers
```

- **The subject id is a new module-scope `detailProspectId` — never `state.selectedProspectId`.** That field is persisted, drives the directory's row highlight (3508, 3526) and `wipeAllData()` (1745), is written by the deferred AQ drawer (7032), and is read at 13 sites. `selectedCompanyId` / `campaignViewSubState` / `selectedAudienceListId` are the precedent — `BUILD_NOTES.md`: *"module-scope variables, not state fields, so they do not survive a reload — that is fine for navigation and wrong for anything persisted."* This is navigation.
- **No copy of the record is held.** Every render does `state.prospects.find(p => p.id === detailProspectId)` fresh, as `renderInspector` already does (3586). Gate E.
- **The origin record is `{ view, taskId, audienceListId, campaignSubState }`**, module-scope, stamped on open and replayed by the back arrow. `campaignSubState` is not optional.
- **No new persisted field, no `ensureStateDefaults()` entry, no CSV column, no `wipeAllData()` line, no migration** for the detail view itself. **DIRECTIVES §4 Backup coverage does fire for the phase**, through the carried-in `state.taskSettings` gap. A session must not reason "no data work → Gate C inert."
- **Tab and scroll position are not persisted.** If a later phase wants them, they join `state.columnLayouts` under their own key — never a new store.
- **No prospect id enters a URL, hash or `document.title`.** Imported `prospectId` values are email addresses (`app.js` 2275, 10487), so a hash route would put live contact addresses into the address bar, browser history and any error trace capturing a URL. Gate A, and the pre-flight's §3.1 telemetry rule. **"Add a hash route so the back arrow works" is the obvious wrong turn.**
- **Any selector built from a prospect id uses `CSS.escape` or an attribute match.** The codebase already does this at 7023 and breaks without it.

### 7.2 The tab component contract

- A declarative `PROSPECT_DETAIL_TABS` table of `{ key, label, render(prospect) → Element, enabled }` driving one `renderProspectDetailTabs()` — the shape of `TASKHUB_FILTERS` / `TASKHUB_COLUMNS`, this codebase's own precedent.
- **Sequences is a row with `enabled: false`** — rendered, visible, disabled.
- Active tab is module-scope `detailTab`, defaults to `"interactions"`, reset on every open.
- **Only the active tab's body renders**, and switching re-renders that body alone, never the whole view. The `renderTaskHubTable()` lesson.
- **`createElement` / `appendChild` throughout.** `innerHTML +=` destroys listeners and has bitten this exact inspector; only whole-container resets are permitted.
- **Authoring habits** (DIRECTIVES §0, not Gate F): labelled inputs, keyboard-operable controls, visible focus. A tab strip of `<div>`s with click handlers is the default failure and is free to avoid while writing it.

### 7.3 The layout contract

- `#view-prospect-detail` is a **seventh `.view-panel`**, built exactly like the six hubs, inside `#main-canvas`. Never `position: fixed`, never a computed left offset, never `calc(100vh - <constant>)`.
- **One screen tall. Only the tab body scrolls.** The identity block is content-height; the tab body takes the remainder and owns its `overflow-y`. `#canvas-body` is untouched. This is 2A's contract S1, and it is why 2A ships first.
- **The back arrow lives in 2A's header band**, to the left of the hub name, which reads **ProspectHub in purple** per Michael's rule that a detail view carries its hub's colours. **The prospect's name goes in `#view-subtitle`** beneath it. The arrow never scrolls away, and the header stays consistent with every other hub.

### 7.4 The column-layout contract (directory rework)

- **Generalise before applying, and prove TaskHub first.** `taskHubLayoutRecord()` / `taskHubColumns()` / `taskHubColumnWidth()` / `setTaskHubColumnWidth()` / `setTaskHubColumnOrder()` / `initTaskHubHeaderDrag()` become table-id-parameterised. **That session's Done-when includes a full TaskHub regression — resize, reorder, persistence across a reload, and a ZIP round trip — before either ProspectHub table is touched.** Sessions 1.10 and 1.11 shipped on 2026-08-30; silently breaking them while building their successor is the outcome to engineer against.
- **Nothing reads `state.columnLayouts.<table>` directly.** The resolver is where the read-side migration rule lives — unknown keys ignored on read and never deleted, absent widths falling back to the code default.
- **Storage is free.** `state.columnLayouts` was built keyed by table id precisely so a second table adopts it — `BUILD_NOTES.md`: *"so a second table adopts it without a second implementation."* Its entire backup coverage is one settings row holding `JSON.stringify(state.columnLayouts)`, so new keys need **zero** export or restore work, and `wipeAllData()` already clears the whole object.
- **`table-layout: fixed` goes on `#prospects-table` and `#companies-table`, never on `.premium-table`** — that class is used 18 times across `index.html`, so putting it on the shared class changes every table in Vantage in one edit. TaskHub scopes it the same way. Under fixed layout **every column needs a real default width**, plus a width-less trailing spacer `<th>` and a `<td>` per row.
- **`.table-scroll-container` has `padding: 12px`, and a sticky header does not cover a scrollport's top padding.** Both tables need `padding-top: 0`, scoped by view id. `BUILD_NOTES.md` records this from Session 1.10, found by screenshot after every computed-style probe passed.
- **`#prospect-tag-chooser` is replaced with the Advanced Query picker pattern** — `renderAqPickerDropdown` / `renderAqPickerChips` / `setAqPickerSelection` / `toggleAqPickerMode` / `removeAqPickerSelection` / `initAqPickers` (`app.js` 6335–6468). Reuse, not invention. The current control is a native `<select multiple size="1">` with `onfocus`/`onblur`/`onchange` handlers written inline in the HTML and Ctrl/Cmd-click as the multi-select gesture.

### 7.5 Email uniqueness

**Email becomes a unique field. It does not become the key, and no id changes.**

Two id schemes are live today. Import (`app.js` 10487) and restore (2275) use `row.id || email.toLowerCase() || pros-…`, so those records are keyed by email. `saveProspect()` (9627) mints `pros-${Date.now()}`. **The database contains both**, and the likeliest duplicate path is exactly that seam: a contact added by hand, then later imported.

Nothing guards against it anywhere. Audience lists carry four name-uniqueness checks; prospects carry none.

- **`saveProspect()` gains a duplicate-email check on both branches** — on create, and on edit when an email is changed to one already held (excluding the record itself). On a hit: a warning naming the existing contact, with a link that opens their detail view. Following the link closes the modal and discards the typed data — correct, since the record already exists.
- **CSV import skips duplicates and reports them; it never fails the import.** Michael, 2026-08-30: *"I don't want one duplicate email block to nullify an entire import."* The precedent is already in the codebase — `pendingAudienceImport = { prospectIds, skipped, duplicateInAudience }` (9114) — and the restore summary's orphan-count line is the reporting model.
- **Ids are not normalised and email does not become the key.** `ai/spec/phase-4-firebase-preflight.md` §1.2 recommends against email-as-id on two correctness grounds that did not soften: it puts personal data into document paths that surface in logs and traces, and people change jobs — an id cannot be edited, and contract C1 makes `prospectId` the only link from a task to a person, so a changed email silently orphans every task pointing at it. Session 1.8 saw that at scale: 31 tasks orphaned in one step, no error. **Normalising the existing mixed ids would be a DIRECTIVES §4 destructive data change that orphans tasks by definition. Not this phase.**

---

## 8. Assumptions logged — reversible, decided at intake

1. `#view-prospect-detail` is a seventh `.view-panel`. `state.activeView = "prospect-detail"` persists but is harmless — boot always calls `switchView("dashboard")`.
2. The view takes ProspectHub purple, via `module-prospect-detail`, and `#nav-prospects` stays lit in the sidebar. Michael's rule: **a detail view always carries the colours of its hub.**
3. The identity block runs three or four columns at canvas width, not the modal's two.
4. Conference fields render always, blank or not. If four empty boxes prove annoying against real data, collapsing them when all four are blank is a five-minute change made with the screen in front of you — not decided in the abstract.
5. **`#modal-prospect` is untouched and remains the create path.** Its edit branch stays live for the deferred AQ drawer. Recorded with Michael's reason — possible future customisation — so it is not proposed for deletion as dead code.
6. Notes render at fixed height with internal scroll, as in the modal.
7. **The company inspector is untouched.** `selectCompany()` and the company card keep today's behaviour; `.prospect-inspector-panel` survives as the *company* host, with the prospect card removed. Its open/close logic narrows from "a prospect or a company is selected" to company-only. Michael: *"the company is subordinate to the contact but it's good to have access to that information."* A company panel sliding out beside a prospect one is additive and belongs to a later phase.
8. **Delete Prospect lives in the detail view**, not on directory rows — Michael: *"I don't want to delete from a directory with scant information."* This is not a move; `#btn-delete-prospect` is already in the inspector. Nothing gains a delete button. *(The deferred AQ drawer keeps its own delete, so two delete paths exist until §2.1 runs.)*
9. An unresolvable `detailProspectId` — deleted elsewhere, or restored over — **closes and replays the origin** rather than showing a placeholder, matching `renderInspector` (3587–3592).
10. Deleting the prospect you are viewing replays the origin on success.
11. Orphaned tasks never appear here — an orphan has no prospect by definition. No change, and no "fix" wanted.
12. **Import quarantine is a CSV, not a store.** Skipped duplicate rows are offered back as a downloadable CSV to fix and re-import. A stored quarantine would be a new top-level store, dragging in export, restore and `wipeAllData()` wiring and turning a UI phase into a data phase.
13. The export files gain no columns, and are re-proved at phase close regardless — `DECISIONS.md` 2026-08-30 §3.

---

## 9. To record

1. **`DECISIONS.md` — "Advanced Query narrowing: deferred, not reversed."** 2026-08-28's *"One editing surface for prospects"* stands unchanged; its AQ half is deferred at Michael's direction pending better working knowledge of both query surfaces. Record the accepted cost — the drawer falls further behind — and that §2.1 holds the analysis so the later phase does not re-derive it.
2. **`DECISIONS.md` — "Email is unique, not the key."** Record the mixed id schemes found at intake, the guard, the import skip-and-report, and that the pre-flight's recommendation against email-as-id was upheld rather than overturned.
3. **`BUILD_NOTES.md` — the AQ drawer's accepted divergence**, worded so no future session ports subsections across to close it.
4. **`BUILD_NOTES.md` — the five modal-only fields**, so nobody again assumes the inspector shows everything a prospect has.
5. **`DECLARATIONS.md`** — the seventh view, `prospect-detail`: a view panel but **not a hub**. No sidebar entry, no colour of its own. The "six hubs" line stays true and must not be edited to say seven.

---

## 10. Gates — walked 2026-08-30

- **A. Data protection** — **passes, conditional on §7.1**: no prospect id in a URL, hash or document title, because those ids are live email addresses. No new store, no telemetry, no export change.
- **B. No foreclosed scale** — **passes.** No data-model change; §7.5 explicitly declines to re-key anything.
- **C. Recoverability** — **passes for the detail view**, which creates no user-writable store. **Fires for the phase** via the carried-in `state.taskSettings` gap in `wipeAllData()`, which the run sheet requires be homed here. The column-layout keys need no new coverage (§7.4).
- **D. Observability** — **inert** until hosting.
- **E. Client/server boundary** — **passes**, and is strengthened: read-fresh-from-`state.prospects`, no cached copy.
- **F. Accessibility** — **inert** (§0 target `none`). The §0 authoring habits are in §7.2 as habits, not as this gate.
- **§3 conflict check** — no new collision. The AQ narrowing's UX cost was priced in `DECISIONS.md` 2026-08-28 and is deferred anyway. **No gap in the directives.**

---

## 11. Sizing

The run sheet estimated Phase 2 at **7–9 sessions**, before the intake. Phase 2 split; this document is 2B, and it holds two compartments:

| Compartment | Sessions |
| --- | --- |
| Prospect detail view | 5–7 |
| ProspectHub directory rework | 2–3 |
| | **7–10** |

Plus Phase 2A separately. **Say this out loud in the plan** rather than inheriting the run sheet's number: Phase 1 planned 8 and ran 11, and the calibration lesson was that session *count* is the unstable figure — every overrun came from one review pass on one session. This phase ships a great deal of new UI, which is precisely the condition the +35% contingency was written for.
