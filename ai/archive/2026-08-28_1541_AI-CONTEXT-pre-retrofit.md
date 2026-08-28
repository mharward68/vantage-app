# Project Declarations

**App**: Vantage PRM — standalone, offline-first Progressive Web App (PWA), personal CRM for managing prospects, companies, media content, and outreach campaigns.

**Stack**: Plain HTML + Vanilla JavaScript + CSS (no frameworks, no build step)
**Server**: `npx serve` (Node.js) or Python `http.server` fallback — `Start_Vantage.bat`
**Local URL**: `http://localhost:5000` — installable as PWA via Chrome

**File Structure**
```
vantage-app/
├── index.html         # Single-page app shell — all views, modals, sidebar markup
├── app.js             # All application logic (~8,000 lines)
├── style.css          # All styling (~58 KB)
├── sw.js              # Service worker
├── manifest.json      # PWA manifest
├── prm_data.json      # Seed data (loaded once on first run)
├── assets/            # logo.svg, icon-192.png, icon-512.png
├── Start_Vantage.bat / Stop_Vantage.bat
├── AI-CONTEXT-PROTOCOL.md   # Context rotation protocol (permanent reference)
└── ai-context-archives/     # Archived AI-CONTEXT snapshots
```

**Persistence**: `localStorage` key `vantage_prm_database` (full JSON state) + IndexedDB (`VantagePRMFiles`) for binary file blobs

**Key State Arrays**: `companies`, `prospects`, `media`, `campaigns`, `audienceLists`, `campaignPhases`, `developmentPhases`, `mediaTypes`, `platforms`, `media_tags`, `prospect_tags`, `campaign_tags`, `company_tags`, `reachoutTypes`, `customSortOrder`

**Boot Sequence**: `loadDatabase()` → `initIndexedDB()` → `initTheme()` + `updateThemeColors()` → `setupEventListeners()` → `switchView("dashboard")`

**View Routing**: `switchView(viewName)` — views: `dashboard`, `prospects`, `media`, `campaigns`, `data`

**Backup System**: ZIP + per-entity CSVs; restore router in `handleRestoreFile()` / `processSingleCSVContent()`; `ensureStateDefaults()` always called post-restore

**Per-Hub Colors**: Dashboard=Blue, Prospect Hub=Purple, Media Hub=Orange, Campaign Hub=Green, Data Management=Red

**Known Watch-outs**:
- `app.js` is ~8,000 lines — always search for the exact function before editing
- `index.html` is ~130 KB — modal/section IDs must stay unique
- `wipeAllData()` must clear both `localStorage` and IndexedDB
- **SW cache rule**: bump `CACHE_NAME` in `sw.js` any time `index.html`, `app.js`, or `style.css` changes so the PWA picks up the new assets without a manual cache wipe. Current version: `vantageprm-cache-v42`.
- **Audience view layout pattern**: The Campaign Hub Audience view reuses `.prospects-layout-container` but does NOT use the absolutely-positioned overlay panel pattern the Prospect Hub uses — `#audience-inspector` is a direct grid child. Its container has an inline `grid-template-columns: 1.2fr 0.9fr; gap: 16px` override. Do NOT remove that inline style or "fix" it to match the Prospect Hub overlay pattern.

---

# Recent History

* **Advanced Query (Prospect Hub)**: Full-featured query modal (`modal-advanced-query`) with Prospect/Company target toggle, field filters (name, title, seniority, company, city/state/location, LinkedIn, phone, tags, company tags), date filters (Added to Vantage / Last Reachout — before/after/on), AND/OR boolean text parsing, paginated results (25/50 per page), multi-select with "Select Screen" / "Select All", and bulk actions (Add Tag, Add to Audience, Create Audience). Results open in a draggable/resizable/maximizable floating window (`modal-aq-results`) with a slide-out inspector drawer.
* **AQ Inspector Drawer**: Clicking any result row opens an inline record inspector with full history, tags, notes, memberships (audience lists + campaigns), quick-edit (tags, notes, full edit modal), and delete. Row highlight toggling is done in-place so 50-row pages don't flicker or rebuild.
* **AQ Boolean Search & State Filter**: `matchesTextFilter()` supports `AND`/`OR` keywords. `matchesStateFilter()` resolves 2-letter US state abbreviations bidirectionally via `US_STATE_ABBREVIATIONS` / `US_STATE_NAME_TO_ABBR` lookup maps.
* **Campaign Hub Audience View — Layout Bug Fix (2026-07-19)**: `#audience-inspector` was invisible because `.prospects-layout-container` defaults to `grid-template-columns: 1fr 0fr`. Fixed by adding `grid-template-columns: 1.2fr 0.9fr; gap: 16px` as an inline override in `index.html`. View buttons now correctly populate the right-side inspector panel.
* **Campaign Hub Audience View — Null Guard (2026-07-19)**: Added defensive early-return in `renderAudienceInspector()` so a missing DOM element produces a silent no-op instead of a `TypeError` that kills the render.
* **Company Fields Overhaul (2026-07-19)**: Added `industry` (text) and `employees` (raw number) to company records. Removed `employeeRange` text field from the company modal, company inspector, and all display. Data migration in `initializeDefaultState()` moves plain-number values from `employeeRange` → `employees` on load. Both fields included in CSV/ZIP backup/restore.
* **Campaign Hub Query — Employee Range Filter (2026-07-19)**: Added `# of Employees` checkbox group (values: `1-10`, `11-50`, `51-200`, `201-500`, `>500`) to the Campaign Hub Query Parameters panel. `runCampaignQuery()` buckets `parseInt(comp.employees)` against thresholds and filters by selected ranges. `clearCampaignQueryFilters()` unchecks all `.query-employee-range` boxes.
* **Audience List Active/Archive Status (2026-07-19)**: Added `status` field (`"active"` | `"archived"`) to all audience list records with data migration. `renderAudienceListsView()` fully rewritten: Active/Archived tab toggle (`audienceListStatusFilter` state variable), active rows show Archive button, archived rows show Restore/Copy/Delete buttons. Inspector action buttons are now dynamically injected into `#aud-inspect-actions` div (not static HTML) so the button set differs by status. New functions: `archiveAudienceList()`, `restoreAudienceList()`, `copyAudienceToNewList()`. Removed static `btn-rename-audience`, `btn-delete-audience`, `btn-add-contact-to-aud` event listeners.
* **ProspectHub Inspector — Add to Audience (2026-07-19)**: Added a quick "Add to Audience" row in the prospect inspector memberships section. Renders a dropdown of active audiences the prospect isn't already in, with an Add button. Built using `createElement` + `appendChild` (not `innerHTML +=`) to preserve event listener on the Add button. Calls `addAudienceTagToProspects()` + `saveState()` + `renderProspectsView()` on click.
* **MediaHub Publish Event — Campaign Field (2026-07-19)**: Added `pub-campaign` select (populated with Launch-status campaigns) side-by-side with `pub-platform` in a `form-row` in the Add Publish Event modal. Selecting a campaign auto-sets Platform to "Campaign"; switching Platform away from "Campaign" clears the campaign. Bidirectional sync via `addEventListener("change")` listeners in `openPublishEventModal()`. `savePublishEvent()` saves `campaignId` on the event object. Publish events table shows a campaign name badge in a new Campaign column.
* **Start_Vantage.bat Rewrite (2026-07-19)**: Fully rewrote to use `powershell -WindowStyle Hidden` so the CMD window closes immediately after launching the browser. Kills any existing process on port 5000 before starting. Checks `PATH`, `%ProgramFiles%\nodejs`, `%APPDATA%\npm` for npx; `%LOCALAPPDATA%\Programs\Python` for Python fallback.
* **Audience Notes Field (2026-07-28)**: Added `notes` textarea (`#aud-inspect-notes`) to the audience inspector header. Auto-saves on `input`. Migration adds `notes: ""` to existing records. Included in CSV/ZIP export (new "Notes" column) and restore.
* **Audience Import — Tag Assignment + Duplicate Check (2026-07-28)**: Import review step now shows a tag selector (existing prospect tags) + new tag text field. On save, the tag is registered globally and applied to all imported prospect records. `processAudienceImportRows()` now builds a `duplicateInAudience` Set of prospects already in any existing audience list; the review table marks those with an "already in audience" badge and shows a yellow notice with the count.
* **Bulk Tag Audience Prospects (2026-07-28)**: Added "🏷️ Tag All" button to active audience inspector actions. `bulkTagAudienceProspects(audId)` prompts for a tag (shows existing tags as hint), registers it globally, and applies it to all prospect records in the audience.
* **Pop-Out Audience Contact List (2026-07-28)**: Added "⤢ Pop Out" button to active audience inspector. `openAudiencePopout(audId)` populates `#aud-popout-panel` (fixed-position floating div) with the audience contact table. Panel is draggable via its header. X button closes it. Contact names and company names in the popout are clickable (open prospect/company modals).
* **Prospect + Company Popups from Audience Inspector (2026-07-28)**: Prospect names in the audience inspector contacts table are now `<button>` elements that call `openProspectModal(pid)`. Company names call `openCompanyModal(companyId)`. Same pattern applied in the pop-out panel.

---

# Current Goals

Build an **Advanced Query** page/popup, launched from the Prospect Hub via a new "Advanced Query" button:

- Launches as a pop-up/modal from Prospect Hub.
- A selector at the top to choose **Prospect** or **Company** as the query target.
- Ability to query on any field in the table — first name, last name, city, state, company, etc.
- Ability to search by "Added to Vantage" date: before, after, or a specific date.
- Ability to search by interaction/reachout date: before, after, or a specific date.
- Results support selecting specific people (or companies) individually, with pagination options of 25–50 per screen, plus "select this screen" or "select all" options.
- For the selected set, bulk edit actions — e.g. add a tag to all of them, or add all of them to an existing audience.

> ✅ **Status**: Fully implemented as of 2026-07-06. See Development Notes below for full detail.

---

# Development Notes

### prospect-hub-advanced-query — 2026-07-06
- Added "🔎 Advanced Query" button in the Prospect Hub header (next to Settings), opening `modal-advanced-query`.
- Prospect/Company target toggle (`aq-target-prospects`/`aq-target-companies`) swaps between two field groups (`#aq-fields-prospect`, `#aq-fields-company`); switching target resets the current result set and selection.
- `runAdvancedQuery()` filters `state.prospects` or `state.companies` by every relevant field (name, title, seniority, company, city/state/location, LinkedIn, phone, tags — with company-tag lookthrough for prospects) using `matchesTextFilter()` (case-insensitive contains) and `matchesTagsFilter()` (comma-separated, AND logic, matches existing Query Engine convention).
- Date filters use `matchesDateFilter(dateStr, mode, filterDate)` (before/after/on, ISO strings compare safely as text) against two new helpers: `getAddedToVantageDate(p)` (earliest history entry typed "Added to Vantage"/"Entered into Vantage") and `getLastReachoutDate(p)` (latest history entry of any other type — i.e. a genuine reachout, not the auto-logged import event).
- Results are paginated (25/50 per page via `aqPerPage`) with a `Set` (`aqSelectedIds`) tracking selection across page turns within the same query run; "Select This Screen" / "Select All" / "Clear Selection" all operate on that Set. Changing filters or re-running the query resets selection.
- Bulk actions bar appears once ≥1 row is selected: "Add Tag to Selected" is additive (pushes onto each record's `tags` without clearing existing ones) and registers brand-new tags into `state.prospect_tags`/`state.company_tags` so they show up in Settings/filters elsewhere. "Add to Existing Audience" / "Create & Add" (prospect target only, since audiences are prospect-based) reuse `addAudienceTagToProspects()` from the audience↔tag-sync invariant, so bulk-added contacts get the audience tag immediately.
- No new backup/restore work needed — this feature only mutates `prospects[].tags`, `companies[].tags`, `prospect_tags`, `company_tags`, and `audienceLists`, all of which are already covered by the existing ZIP/CSV backup system.

### sw-cache-version-bump — 2026-07-06
- User reported Prospect Hub still showing the old layout (no Advanced Query button) until a manual refresh. Root cause: `sw.js` is a cache-first service worker — it serves `index.html`/`app.js`/`style.css` straight from cache and never diffs against network.
- Fix: bumped `CACHE_NAME` to `vantageprm-cache-v16`. Changing the string in `sw.js` forces install → activate → old cache deleted → fresh fetch of all assets.
- **Rule going forward**: bump `CACHE_NAME` in `sw.js` any time `index.html`, `app.js`, or `style.css` changes and the user needs to see it without manually clearing site data.

### campaign-hub-audience-view-bugs — 2026-07-19
- **Bug 1 — Inspector invisible (layout)**: The Audience Lists view uses `.prospects-layout-container` but places `#audience-inspector` directly as the second grid child. The CSS default `grid-template-columns: 1fr 0fr` (designed for the Prospect Hub's slide-out overlay) compressed the inspector to zero width — View button clicks updated the DOM correctly but the panel was invisible, so "nothing appeared to happen." Fix: added `grid-template-columns: 1.2fr 0.9fr; gap: 16px` as an inline override on the container div in `index.html`. Pure HTML change — no JS touched.
- **Bug 2 — Null guard in `renderAudienceInspector()`**: Added early-return guard (`if (!inspectName || !inspectSize || !tbody) return;`) so a missing DOM element produces a silent no-op instead of a `TypeError` that kills the render.
- Cache bumped to `vantageprm-cache-v33` to force browsers to pick up both changes.
- **Architecture note**: The Prospect Hub inspector uses `.prospect-inspector-panel` (absolutely positioned overlay, animates in with `translateX`). The Audience view uses a simpler side-by-side grid layout with the inspector as a true grid column. These are intentionally different patterns.

### company-fields-overhaul — 2026-07-19
- Company modal (`openCompanyModal` / `saveCompany`): replaced `comp-employee-range` text input with `comp-industry` text input; kept `comp-employees` as a number input. Both rendered side-by-side in a `form-row`.
- Company inspector: removed `inspector-comp-employee-range` span; `inspector-comp-employees` now shows raw number.
- Data migration in `initializeDefaultState()`: `state.companies.forEach(c => { if (!c.employees && c.employeeRange && /^\d+$/.test(c.employeeRange.trim())) { c.employees = c.employeeRange.trim(); c.employeeRange = ""; }})`.
- CSV/ZIP backup: `exportCompaniesCSV` and ZIP version both include `Industry` and `Employees` columns; `restoreCompaniesFromCSV` reads both fields.
- Campaign Hub Query: added `.query-employee-range` checkbox group; `runCampaignQuery()` buckets `parseInt(comp.employees)` with thresholds (≤10 → "1-10", ≤50 → "11-50", ≤200 → "51-200", ≤500 → "201-500", else → ">500").

### audience-list-status — 2026-07-19
- New `status` field on all `audienceLists` entries, defaulting to `"active"`. Migration in `initializeDefaultState()`: `state.audienceLists.forEach(al => { if (!al.status) al.status = "active"; })`.
- All `audienceLists.push()` calls now include `status: "active"`.
- `exportAudienceListsCSV` / ZIP version: headers include `"Status"`, mapper appends `al.status || "active"`. `restoreAudienceListsFromCSV` reads `obj["Status"] || obj["status"] || "active"`.
- `renderAudienceListsView()` fully rewritten: reads `audienceListStatusFilter` ("active" | "archived"), renders tab strip (`#audience-status-tabs`), filters list, active rows get Archive button, archived rows get Restore/Copy/Delete buttons.
- `renderAudienceInspector()`: removed datalist population; action buttons dynamically injected into `#aud-inspect-actions` div — active: Rename + Archive; archived: Restore + Copy to New + Delete.
- Removed static event listeners for `btn-rename-audience`, `btn-delete-audience`, `btn-add-contact-to-aud` (these elements no longer exist in static HTML).
- **Watch-out**: `innerHTML +=` destroys event listeners — always use `createElement` + `appendChild` when adding elements with listeners to the inspector.

### prospect-inspector-add-to-audience — 2026-07-19
- Prospect inspector memberships section: added "Add to Audience" row built entirely with `createElement`/`appendChild`.
- Dropdown (`<select>`) populated with active audience lists the prospect is not already a member of.
- Add button calls `addAudienceTagToProspects([prospectId], audId)` then `saveState()` + `renderProspectsView()`.

### mediahub-publish-event-campaign — 2026-07-19
- `index.html`: `pub-platform` and new `pub-campaign` `<select>` placed in a `form-row`. "Campaign" option added to the platform options list. New "Campaign" column header added to the publish events table.
- `openPublishEventModal()`: populates `#pub-campaign` with all campaigns where `c.phase === "Launch"`; on edit loads `ev.campaignId`. Change listener on `#pub-campaign`: selecting a campaign sets `#pub-platform` to "Campaign". Change listener on `#pub-platform`: selecting anything other than "Campaign" resets `#pub-campaign` to "".
- `savePublishEvent()`: reads `document.getElementById("pub-campaign").value` as `campaignId` and saves it on the event object.
- Publish events table row: looks up campaign by `ev.campaignId`, shows name badge or "—" in Campaign column.
- Cache bumped to `vantageprm-cache-v36`.
