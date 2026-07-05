# Project Declarations

**App**: Vantage PRM — standalone, offline-first Progressive Web App (PWA), personal CRM for managing prospects, companies, media content, and outreach campaigns.

**Stack**: Plain HTML + Vanilla JavaScript + CSS (no frameworks, no build step)
**Server**: `npx serve` (Node.js) or Python `http.server` fallback — `Start_Vantage.bat`
**Local URL**: `http://localhost:5000` — installable as PWA via Chrome

**File Structure**
```
vantage-app/
├── index.html         # Single-page app shell — all views, modals, sidebar markup
├── app.js             # All application logic (~5,800 lines)
├── style.css          # All styling (~45 KB)
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
- `app.js` is ~5,800 lines — always search for the exact function before editing
- `index.html` is ~95 KB — modal/section IDs must stay unique
- `wipeAllData()` must clear both `localStorage` and IndexedDB

---

# Recent History

* **Apollo.io Integration**: Integrated Excel (.xlsx/.xls) parsing via sheetjs; mapped Apollo export headers to Vantage fields on import; created template options modal; implemented styled Apollo.io Excel download template with highlighted red headers; auto-logs "Entered into Vantage" reachouts on import.
* **PWA Infrastructure**: Wired missing `<script src="app.js">` and service worker registration; fixed `sw.js` crash on redirect; updated `Start_Vantage.bat` with Python fallback
* **Backup Fixes**: Campaign phases now included in settings CSV export/restore; campaign CSV import mapper rewrote to preserve all fields (`tags`, `audienceListId`, `intendedAudience`, `goalSummary`); dashboard count changed to `state.campaigns.length`
* **Campaign Hub Redesign**: Standalone Audience Query Engine; Audience Lists Manager sub-tab (CRUD); card grid with phase/tag filters and inline dropdowns; Campaign Detail Modal
* **Query Engine**: `deriveSeniority()` helper; title/geo comma-separated matching; location parser for city/state derivation
* **ZIP Backup**: Now includes `prm_audience_lists.csv`; restore routing updated for audience lists

---

# Current Goals

All in Prospect Hub:

1. Ready for user feedback and next steps.

---

# Development Notes

### apollo-excel-import-and-template — 2026-07-05
- Added `xlsx-js-style` via CDN for browser-side Excel reading and styled Excel writes.
- Created modal selector for downloading Vantage CSV vs. styled Apollo.io Excel templates.
- Modified import code to dynamically map Apollo.io headers and fall back gracefully if Mobile column is omitted.
- Auto-records today's date and "Entered into Vantage" reachout type on contact import.

### fallback-company-domain-and-type — 2026-07-05
- Modified `importCSVContacts` to fallback on slugifying the company name when no domain or URL is found on import.
- Auto-added "No URL" tag to any fallback-created company.
- Added "Entered into Vantage" to the default `state.reachoutTypes` list and populated it on startup if missing.


