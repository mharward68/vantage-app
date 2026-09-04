# AI Context — PHASE 3 IN FLIGHT, SESSION 3.1b SHIPPED

**Updated:** 2026-09-04 09:00 (America/New_York).

**Last run:** Phase 3 / **Session 3.1b — remove the Bcc (amendment A1).** Compartment: **DATA**. ✅ **COMPLETE.** A1 is now true in the code: `state.taskSettings.emailBcc` does not exist, nothing seeds it, exports it or restores it, and `OUTREACH_BCC_DEFAULT` is gone. **`workGmailAddress` is untouched.**

**State:** `app.js` **17,873** (+24 net — five deletions plus one `delete` line, against comment that explains why none of it comes back) · `index.html` **3,876** and `style.css` **4,991**, both unchanged. `CACHE_NAME` **v128 → v129**, ONE bump, and it landed on the first reload. **One-glance version tell:** console `typeof OUTREACH_BCC_DEFAULT` → `"undefined"` is v129, `"string"` is v128. `typeof TASK_CHANNEL_KINDS` still reads `"object"` — 3.2's block is intact.

**Git: ⛔ NOT COMMITTED. Two files are dirty on `C:` — `app.js` and `sw.js`** — on top of `7a853f1`, plus the three document files this close writes. Git is always Michael-runs-it. Nothing else is outstanding.

**Database: 1,561,677 → 1,561,640 bytes, and the −37 is fully accounted for.** It is exactly `,"emailBcc":"<23-char address>"`, predicted before it was measured. 651 prospects · 1,090 companies · 33 media · 3 campaigns · 4 audience lists · **0 tasks** · taskSettings now **2 keys** (`dateMode`, `workGmailAddress`) · columnLayouts 442 chars. `state.activeView` returned to `dashboard`, the view the session opened on.

---

## What was done — five deletions and one addition, all in `app.js`

| # | Edit |
| --- | --- |
| 1 | `OUTREACH_BCC_DEFAULT` and its 17-line comment **deleted**, replaced by an A1 block that says what was removed, why, and that `workGmailAddress` is not part of it. |
| 2 | The `emailBcc` seed line **deleted**; the surrounding `=== undefined` comment rewritten so it no longer describes two keys. |
| 3 | The `["Outreach Bcc", …]` row **deleted** from `generateSettingsCSV()`. |
| 4 | `restoreSettingsFromCSV()`: `sawEmailBcc` / `emailBcc` declarations, the `"outreach bcc"` branch and the apply block all **deleted**. |
| 5 | **Added:** `if ("emailBcc" in state.taskSettings) delete state.taskSettings.emailBcc;` in `ensureStateDefaults()` — the field removal on the live record. |
| 6 | `CACHE_NAME` v128 → v129. |

**The address literal `michaelh@youravdept.com` is now absent from the codebase entirely.** The five remaining `youravdept` hits in `app.js` are pre-existing comments about domain search and the free-email blocklist, unrelated to the Bcc and untouched.

## Verification — all of it ran, against the production database

- **`typeof OUTREACH_BCC_DEFAULT`** → **`"undefined"`** after reload. (A bare identifier lookup, not a `toString()` probe — it cannot be fooled by the comments that still name the constant.)
- **`state.taskSettings`** after reload → `{"dateMode":"business","workGmailAddress":""}`. In-memory **and** persisted: `hasEmailBcc=false`, `hasWorkGmailAddress=true`.
- **`generateSettingsCSV()` filtered to `/Outreach/`** → **one row**: `"Outreach Work Gmail",""`.
- **⛔ THE OLD ROW IS INERT, NOT FATAL — AND IT WAS PROVED WITH A SENTINEL, NOT ASSUMED.** A real 3.1-era `prm_settings.csv` (99 rows, extracted from this session's own pre-change ZIP, carrying a live 23-character `Outreach Bcc` cell) was fed to `restoreSettingsFromCSV()`: **did not throw, zero console errors or warnings**, and `state.taskSettings.emailBcc` read back **`"PROBE-SENTINEL-42"` — the sentinel, untouched.** Nothing in the CSV reached the key. `ensureStateDefaults()` then stripped it. **Positive signal in the same call:** `workGmailAddress` was set to a probe string first and the restore returned it to `""`, so the Work Gmail branch is demonstrably still live rather than "nothing happened". Sibling lists unchanged: reachoutTypes 8→8, prospect_tags 9→9, mediaTypes 6→6, columnLayouts 442→442.
- **Clean console, four boots, identical five lines each** — Database / IndexedDB / Service Worker / Snapshot boot / Snapshot mirror. Zero warnings, zero errors, no favicon 404.
- **All six views render:** dashboard 89 · prospects 6,684 · media 1,148 · campaigns 272 · tasks **49** · data-management **68**. Tasks reads 49 against 3.2's 66 because 3.2 had two fixture tasks and there are now **zero** — different data, not a regression. **data-management read 54 inside the sweep and 68 measured alone on a fresh boot**, exactly as `BUILD_NOTES` predicts.
- **`check_ids.py` at baseline** — `{'restore-backup-input', 'export-backup-btn'}` — and `node --check app.js` parses, both run against the files **as they sit on the mini-PC**, md5-matched (`f5f39d67…` / `d301cec6…`) to the bytes the browser verified.
- **Screenshot:** the task editor open in create mode, Channel **Email**, Kind **Compose — new email**, Subject + counter + Message all rendering — and **no Bcc line anywhere**; `modal.innerText` match count for `/bcc/i` is **0**, and 0 across the whole document. Nothing was saved (`tasks` 0, byte count unmoved) — Cancel still means Cancel.

## Backup coverage — DIRECTIVES §4

**COVERAGE IS REDUCED BY EXACTLY ONE KEY, DELIBERATELY, AND THAT IS THE WHOLE SESSION.** `emailBcc` no longer exists, so there is nothing left to cover; `workGmailAddress` keeps its `["Outreach Work Gmail", …]` row and its restore leg untouched, and the five task outreach columns are unchanged (`TASKS_CSV_HEADERS.length` still **18**). **No new store, no new CSV file, and `wipeAllData()` was NOT edited.** A pre-3.1b backup still contains the retired row and now restores with it ignored — verified above.

**The field removal on a live record, stated rather than left unremarked** (the plan's task 4). It is **not** a DIRECTIVES §4 destructive data change: the only value it can destroy is a seeded default no user typed, no user-entered content passes through the key, and the delete is idempotent. **Rollback:** restore the seed line and the constant — both are in this session's diff — or restore `vantage_data_backup_9-4-26_0851.zip` (**1,211,003 bytes, `wroteToFolder: true`**), written to `..\backups-production\` **before** any edit was made.

## Assumptions logged this session

1. **The 3.1-era fixture is this session's own pre-change ZIP, not the 2B.10 one AIContext nominated.** Taking the rollback point first produced a genuine pre-amendment `prm_settings.csv` for free, and it came from *this* database rather than yesterday's. Reversible; the nominated ZIP is still on disk.
2. **The old CSV was fed to `restoreSettingsFromCSV()` directly rather than through `processRestoreFile()`.** That is the same function the ZIP router calls with the same argument (raw text), and `ensureStateDefaults()` was run after it exactly as the real path does — so the leg under test is the shipped one. A full ZIP restore would have replaced 651 prospects to test a settings branch.
3. **The fixture was parked in its own `localStorage` key** (`vantage_3_1b_fixture`) so it survived four reloads. **Deleted at the close and proved gone** — only `vantage_prm_database` and `vantage_sidebar_pinned` remain.
4. **The screenshot was taken from the editor in CREATE mode**, so no fixture task existed and there was nothing to roll back. 3.1b renders nothing of its own; what needed evidence was that the shipped surface still works and carries no Bcc.

## Open items

- ⛔ **COMMIT `app.js` AND `sw.js`** plus `ai/AIContext.md`, `ai/archive/2026-09-04_0900_AIContext.md` and `ai/BUILD_NOTES.md`. One commit. **Michael runs git.**
- ⛔ **3.3 NEEDS THE WORK GMAIL ADDRESS.** `state.taskSettings.workGmailAddress` is still `""`, and blank disables every email button by design. **This is the one input 3.3 cannot start without** — there is no Settings field for it yet (3.3 builds it), so it either gets typed into the console or 3.3's first task is the field.
- **Next is 3.3 — email launch (UI + LOGIC, M, ~10 min, Confidence Medium).** `gmailBase()` / `gmailComposeUrl()` with `tf=cm` (**never `view=cm&fs=1`**), the clipboard helper with **three** fallbacks, the A2 converter (three forms: link, `**bold**`, `*italic*` — the list is closed), and every guard. ⛔ **No `&bcc=` — A1, now enforced in code as well as on paper. No `gmailSearchUrl()` — A3: `thread` opens nothing and gets two explicit copy buttons in SEQUENCE, address then message. LinkedIn is flattened, never HTML — A2.** Then **3.3c** (authoring surface), **3.4**, **3.5**.
- **Phase 2B is still not formally closed** — its snapshot re-verify has not run.
- **Phase 2C, scoped not built:** the sixteen-store `wipeAllData()` gap and the `ensureStateDefaults()` `length === 0` reseed defect.
- **The snapshot system is demonstrably alive** — every boot this session read `vantage_snapshot_2026-09-04_085238.json` off disk. The chip's display defect was not re-observed (nothing rendered was inspected); the permission-lapse reading still stands.
- **Still owed by Michael, now a SIXTH close carrying them:** the five `DECISIONS.md` DECLARATIONS amendments; the two from 2A.6; the domain-is-identity amendment; the 2B.16/2B.17 P4/P5 divergence amendments. `LA` = Louisiana or Los Angeles. Finding 10d's meaning. Three cosmetics from 2B.4 — **leaving them is a valid answer and saying so closes them.**
- **`ai/phases/phase-2b-RUNSHEET.md` is spent and marked for deletion. Michael deletes it** — a remote session cannot delete files here.
- **`DECLARATIONS.md` Stack line counts are stale** — says `app.js` ~13,270; real is **17,873**. Propose at the 3.5 close; do not edit mid-phase.
- **Phase backlog, carried:** the `"Note"` reachout-type reassignment gap; ProspectHub OR-s tags while Advanced Query AND-s them; `p.notes` / `p.location` shape defaults; company-edit uniqueness guard; the §4 back-fill of existing `"domain.com"` rows; the missing `<link rel="icon">`. **The repo is PUBLIC** and DIRECTIVES §0 compliance is undecided. Stale `..\backups\`.
- **Both query surfaces stay DEFERRED**; the `sequences` tab stays `enabled: false`. Neither was touched.
- **The enrollment compartment still has no scope.** Phase 3 needs a Prompt 1 intake before 3.6+ can exist. Fourth close to say so.

## Estimate vs actual

Sized **S / ~2 min / High**, and **it was genuinely an S** — six mechanical edits, one pass, no rework, **one** `CACHE_NAME` bump against a budget of two, and the plan's four tasks were the four tasks. **Michael's time was ~1 minute**: a single boot question (server up, no window open) answered in one pass, with no second interruption — the first session of the phase to cost only one round trip. Wall-clock ran longer than S implies, and all of the excess was verification rather than building: the sentinel proof, the four-boot console sweep and the md5 match.

## Files changed

**Code:** `app.js`, `sw.js`. **Documents:** `ai/AIContext.md`, `ai/archive/2026-09-04_0900_AIContext.md` (new), `ai/BUILD_NOTES.md`.

## ⛔ EXACT NEXT STEP — **SESSION 3.3**

Give me the work Gmail address (or say "3.3 builds the Settings field first"), commit the five files, then run **3.3 — email launch** from `ai/phases/phase-3-outreach-launch.md`. **Read A1, A2 and A3 before trusting Q1–Q7; six of the eight contracts are amended and the plan paragraph is the stale one.**

**Carry forward:** ⚠️ **`javascript_tool` RETURNS `[BLOCKED: Cookie/query string data]` INSTEAD OF YOUR RESULT** for some payloads — the call still runs, only the return value is replaced, and retrying reproduces it exactly. Shrink what you return (filter `caches.keys()`, return lengths and row names, never raw CSV/URL/file text); **now in `BUILD_NOTES § Driving this app from an automated browser`, and it cost four dead calls here.** **THE APP RUNS PERFECTLY WITH THE SERVER DOWN** — run the three-probe (`/manifest.json`, a missing file, `/sw.js`) before diagnosing any bump; it read `200 / 404 / 200` this session, so the server was genuinely up. **`state.activeView` is PERSISTED and moves the byte count** — return to the opening view before any byte-exact claim. **Measure `data-management` on a fresh boot, not as the sixth view of a sweep** — 54 vs 68, confirmed twice, and a double `requestAnimationFrame` does not fix it. `state` is not `window.state`. **Do not open the app while Michael's window is up.** **TEST AGAINST REAL RECORDS, WRITE UP PLACEHOLDERS — the repo is public.**
