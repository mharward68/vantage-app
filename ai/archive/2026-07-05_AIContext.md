# AI Context — Vantage PRM

---

## 🗂 App Overview

**Vantage PRM** is a standalone, offline-first Progressive Web App (PWA) that runs as a local server. It is a personal CRM tool for managing prospects, companies, media content, and outreach campaigns.

- **Stack**: Plain HTML + Vanilla JavaScript + CSS (no frameworks, no build step)
- **Served via**: `npx serve` (Node.js) or Python `http.server` fallback — see `Start_Vantage.bat`
- **Local URL**: `http://localhost:5000`
- **Installable as PWA**: Chrome install prompt available at the above URL

---

## 🏗 Architecture Overview

```
vantage-app/
├── index.html         # Single-page app shell — all views, modals, and sidebar markup
├── app.js             # Entire application logic (~5,800 lines) — state, views, CRUD, import/export
├── style.css          # All styling (~45 KB) — dark theme, per-hub color schemes, animations
├── sw.js              # Service worker — caches static assets for offline/PWA use
├── manifest.json      # PWA manifest — name, icons, start_url, display: standalone
├── prm_data.json      # Seed data — loaded once on first run if no localStorage cache exists
├── assets/
│   ├── logo.svg       # Source logo
│   ├── icon-192.png   # PWA icon (Android/Chrome)
│   └── icon-512.png   # PWA icon (maskable, Android/iOS)
├── Start_Vantage.bat  # Launcher — starts local server, opens browser, shows console output
└── Stop_Vantage.bat   # Stops the server process
```

### State & Persistence
- All app state lives in a single `state` object in `app.js`
- **Persistence**: `localStorage` key `vantage_prm_database` (JSON-serialized full state)
- **Binary file storage** (media attachments, master files): **IndexedDB** (`VantagePRMFiles` database, `files` object store)
- **Seed data**: `prm_data.json` is fetched and loaded only once on first visit (no localStorage cache found)
- **Sandbox seed**: `vantage_prm_sandbox_seed` in localStorage supports dev/test seeding

### Key State Shape
```js
state = {
  companies: [],
  prospects: [],
  media: [],
  campaigns: [],
  audienceLists: [],        // Standalone audience lists (decoupled from campaigns)
  campaignPhases: [],       // Custom campaign phases (e.g. "Development", "Launch", "Archive")
  developmentPhases: [],    // Media pipeline phases (e.g. "Idea", "Draft", "Published")
  mediaTypes: [],           // e.g. "Article", "Video", "Newsletter"
  platforms: [],            // e.g. "YouTube", "Substack", "LinkedIn"
  media_tags: [],
  prospect_tags: [],
  campaign_tags: [],
  company_tags: [],
  reachoutTypes: [],
  customSortOrder: [],      // Persisted drag-and-drop order for Media Hub cards
  activeView: "dashboard",
  activeMediaFilterStatus, activeMediaFilterType, activeMediaFilterTags,
  activeCampaignFilterPhase, activeCampaignFilterTags,
  theme: "dark"
}
```

### Initialization Boot Sequence (`DOMContentLoaded`)
1. `loadDatabase()` — loads from localStorage or fetches `prm_data.json`
2. `initIndexedDB()` — opens IndexedDB for binary file storage
3. `initTheme()` + `updateThemeColors()` — applies dark mode + per-hub color variables
4. `setupEventListeners()` — wires all UI event handlers
5. `switchView("dashboard")` — renders the initial dashboard view

### View Routing
- `switchView(viewName)` is the single entry point for all navigation
- Views: `dashboard`, `prospects`, `media`, `campaigns`, `data`
- Each view has a dedicated render function (e.g. `renderDashboardView()`, `renderMediaView()`)

### Backup & Restore System
- **ZIP backup**: Packages CSV files for all entities + settings into a `.zip` download
- **CSV export/import**: Per-entity CSV files for media, prospects, companies, campaigns, audience lists, settings
- **Restore router**: `handleRestoreFile()` / `processSingleCSVContent()` detect file type by filename prefix and route accordingly
- **Post-restore**: `ensureStateDefaults()` is always called after any restore to validate and sync settings

### Per-Hub Color Theming
CSS variables `--color-primary` and `--color-secondary` are overridden per hub:

| Hub | Primary Color |
|---|---|
| Dashboard | Blue / Indigo |
| Prospect Hub | Purple |
| Media Hub | Orange |
| Campaign Hub | Green |
| Data Management | Red |

---

## ✅ Current State

- **App is fully functional** as a local PWA installable via Chrome at `http://localhost:5000`
- **All 5 main views work**: Dashboard, Prospect Hub, Media Hub, Campaign Hub, Data Management
- **Backup/restore is stable** after recent fixes to campaign phases, campaign CSV import, and audience list routing
- **Audience Lists** are fully decoupled from campaigns — managed via the Audience Lists sub-tab in Campaign Hub
- **Drag-and-drop card reordering** works in Media Hub with persistent custom sort
- **Settings** support 8 categories with overwrite-on-restore, rename propagation, and case-insensitive matching

---

## ⚠️ Known Issues / Watch-outs

- `app.js` is a single large file (~5,800 lines). Edits must be surgical — always search for the exact function before modifying.
- `index.html` is also large (~95 KB). Modal IDs and section IDs must be kept unique.
- IndexedDB binary storage is separate from `localStorage` — a full wipe via `wipeAllData()` should call both `localStorage.removeItem(...)` AND IndexedDB cleanup. Verify this if new data types store blobs.
- Campaign dashboard count now shows `state.campaigns.length` (total), not just "Active" status — keep this consistent if adding new status filters.

---

## 📋 Recent Changes

### PWA Setup & Backup Bug Fixes *(most recent)*

* **PWA Infrastructure (Mobile-First Groundwork)**:
  - Added `<script src="app.js"></script>` and service worker registration script to `index.html` — these were missing entirely, meaning no JavaScript was loading and the SW was never registered.
  - Completed truncated `index.html` which was missing closing modal tags, the missing `btn-export-settings-csv` button, and the `</body></html>` closing tags.
  - Generated `assets/icon-192.png` and `assets/icon-512.png` from `logo.svg` (iOS/Android require PNG icons, not SVG).
  - Updated `manifest.json` to use PNG icons, set `start_url` to `"/"`, and added iOS PWA meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`).
  - Fixed `sw.js` fetch handler to use `redirect: 'follow'` and skip caching `opaqueredirect` responses — the old handler crashed on the 301 redirect that `npx serve` issues for `/`.
  - Updated `Start_Vantage.bat` to show a visible terminal window with error output, and added a Python fallback if `npx` is not available.
  - App is now installable as a standalone PWA from `http://localhost:5000` via Chrome's install prompt.

* **Backup System Bug Fixes**:
  - **Campaign phases not backed up**: `state.campaignPhases` (e.g. "Development", "Launch", "Archive" and any custom phases) was never included in `generateSettingsCSV()` or `restoreSettingsFromCSV()`. Added `"Campaign Phase"` rows to both export and import so custom phases survive a full wipe/restore cycle.
  - **`importCSVContacts` campaign route stripped data**: The drag-drop/CSV import path for campaign files used a legacy mapper that dropped `tags`, `audienceListId`, `intendedAudience`, and `goalSummary`, and hardcoded `status: "Active"`. Rewrote the mapper to correctly read all campaign CSV column names.
  - **Dashboard campaign count misleading**: `renderDashboardView()` was filtering `state.campaigns` for `status === "Active"` only, showing 0 after a restore even when all campaigns came back (they default to "Development" phase). Changed to show `state.campaigns.length` (total count).


---

### Campaign Hub Redesign & Audience Decoupling

* **Decoupled Audience Lists**: Audience Query Engine moved to a standalone view in Campaign Hub; Query Builder can add to existing or create new Audience Lists
* **Audience Lists Manager** sub-tab: view, rename, delete lists; manage contacts; add new prospects
* **Redesigned Campaign Hub**: Sub-tab layout (Campaigns Dashboard + Audience Lists); card grid with phase filters, tag filter sidebar, inline status/phase dropdowns
* **Campaign Detail Modal**: Goals, tags, linked audience list name, and full contact table
* **Prospect Inspector**: Added "Audience Lists & Campaigns" panel showing all lists/campaigns a selected contact belongs to
* **CSV & ZIP Backup**: `exportAudienceListsCSV()`; `prm_audience_lists.csv` in ZIP backups; restore routing for audience lists in `handleRestoreFile()` / `processSingleCSVContent()`
* **Query Engine**: `deriveSeniority()` helper; title/geo comma-separated matching; location parser for city/state derivation
* **Bug Fixes**: Syntax error from dangling legacy code block; missing `return t;` in `normalizeTitle`; `wipeAllData()` now clears `state.audienceLists`

---

## 🗃 Archived Changes

<details>
<summary>Collapsible Sidebar, Color Schemes & Tag Bug Fixes</summary>

* **Collapsible Sidebar**: Hover expand/collapse (`280px` ↔ `76px`); "Keep Sidebar Open" toggle persisted to `localStorage`; centered icon layout in collapsed mode; neon glow toggle switch in `style.css`
* **Media Hub**: Search bar relocated top-left; action buttons grouped top-right
* **Color Theme Overhaul**: Per-hub CSS variable overrides (`--color-primary`, `--color-primary-glow`, `--color-secondary`, `--color-secondary-glow`) — Dashboard (Blue/Indigo), Prospect Hub (Purple), Media Hub (Orange), Campaign Hub (Green), Data Management (Red)
* **Campaign Tag Fix**: `openCreateCampaignModal()` resets tag buffer; `saveNewCampaign()` correctly copies tags from buffer to campaign record
* **Settings Overwrite & Propagation**:
  - Overwrite-on-restore in `restoreSettingsFromCSV()` via boolean category flags
  - Case-insensitive rename propagation across all entity types in `editSettingOption()`
  - Case-insensitive deletion + cleanup of both `m.media_tags` and legacy `m.tags` in `deleteSettingOption()`
  - `saveChosenTags()` deletes legacy `m.tags` field on save
  - `ensureStateDefaults()` normalizes record properties to match exact casing in settings
* **Drag-and-Drop**: HTML5 drag-and-drop card reordering in Media Hub; "Custom" sort + Save Custom button; custom sort persisted in settings CSV backup/restore; corrected settings CSV key from `'Managed Tag'` → `'Media Hub Tag'`
* **Sorts**: A-Z / Z-A alphabetical; optional Expiration Date field on publish events; "Publish Date (Newest)" sort pushes expired/empty cards behind active ones
* **Archive Phase**: "Archive" added as a standard development pipeline phase; "📦 Archive" quick-filter button in Media Hub

</details>

<details>
<summary>Media Hub Improvements & Status Normalization</summary>

* **Status Normalization**: Standardized to singular title case (`Priority`, `Idea`, `Draft`, `In Review`, `Finished`, `Published`); lossless migration in `ensureStateDefaults` for old plural/camelCase values; `prm_data.json` seed data normalized
* **Multi-Select Tag Filtering**: `activeMediaFilterTags` array; AND cross-filter logic across Type, Status, and Tags simultaneously
* **Backup/Restore**: Tag parsing splits on `;` and `,`; filename router handles timestamped backup files without falling back incorrectly
* **Settings Backup**: Expanded to all 8 categories; `settings.csv` parseable via Prospect Hub "Import CSV"; `ensureStateDefaults` called after all CSV/ZIP restores
* **Consolidated Content Dashboard**: Removed "Modify Content" modal; inline editing for Title, Type, Status, Outline, Content; `m.outline` (Summary) + `m.content` (Details) split; lossless migration from old `m.content` field
* **Dashboard Stat Card Shortcuts**: Clickable stat cards route to respective hub views; hover transitions + pointer cursor
* **Inline Status Dropdown**: `clickable-status-select` on Media Hub cards; updates state immediately; click propagation blocked to prevent modal open
* **Dynamic Media Type Filters**: Filter buttons auto-generated from `state.mediaTypes` in settings

</details>

