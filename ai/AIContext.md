# AI Context — PHASE 2B BOUNDARY

**Updated:** 2026-09-03 15:51 (America/New_York).

**Last run:** Phase 2B / **Session 2B.10 — PHASE CLOSE.** Compartment: QA + documents. **⛔ PARTIAL: the document half is complete and written back; the DRILL AND THE SNAPSHOT RE-VERIFY DID NOT RUN.** They are gated on Michael and he did not come back during the session. **Nothing in `app.js`, `index.html`, `style.css` or `sw.js` was opened for edit; no record was written; `CACHE_NAME` stays at v126.**

**State:** `app.js` **17,346** · `index.html` **3,796** · `style.css` **4,926** · `CACHE_NAME` **v126** — all four unchanged, all four re-measured against the real files. Git **UNCOMMITTED and now THREE sessions deep** (2B.14, 2B.15 and this session's documents) against `50253cc`. ⛔ Git is always Michael-runs-it — BUILD_NOTES § *Git, from a session with no shell*.

**Estimate vs actual:** sized **M / ~20 min / High**. **It ran M for the half that ran.** Michael's time: **~2 minutes** — one boot question block of two, answered in one pass, then silence. **The 20 minutes was budgeted almost entirely for the drill and the amendment approvals, and neither happened**, so this actual is not a calibration data point for a phase close; the next close should still budget 20.

**One-glance version tell:** unchanged from 2B.15 — ProspectHub Row 3 is a **button reading "🏷️ Filter by Tag…"**. If you can type into it you are on v125.

---

## ⛔ THE FIRST THING THIS SESSION FOUND, AND IT IS WHY THE BOOT TOOK A DETOUR

**Michael asked for Session 2B.19. 2B.19 shipped on 2026-09-02, with a second repair pass (2B.19b) on top of it.** Three planning documents still said it was NEXT — `AIContext.md`'s Next step, the review-response plan's session-order block, and the run sheet's Step 2R table. The code settled it in one grep (`normaliseDomain`, `saveNewCompany`, `companyModalMode`, `#comp-domain`, `#btn-add-company` all present). **Every session in Phase 2B had in fact run.** All three documents are now corrected, and the lesson is filed in BUILD_NOTES under its own heading.

**The real run order was not numeric:** 2B.11 → 2B.12 → 2B.16 → 2B.13 → **2B.19** → 2B.18 → 2B.20 → 2B.21 → 2B.17 → 2B.22 → 2B.14 → 2B.15 → 2B.10.

---

## What was done — documents only

| Piece | What happened |
| --- | --- |
| **Estimate calibration** | All 21 archived handoffs read. Table below. |
| **`BUILD_NOTES.md` curated** | **12,286 characters of stale text CUT** across five passages, three new findings added. On disk **294,586 → 295,059 bytes (+473 net)** — the file is the same size and materially more true, which is the point. |
| **`DECISIONS.md`** | **Three new entries** (AQ deferred-not-reversed; email unique-not-key; how a frozen contract is amended mid-phase) **plus the DECLARATIONS proposals, recorded and NOT applied.** |
| **`phase-2b-prospect-detail-view.md`** | **New § Frozen-contract amendments** — the record P8/P5/P9 never got. |
| **`phase-2b-review-response-plan.md`** | Session order marked done; a banner on why three documents went stale. |
| **`phase-2b-RUNSHEET.md`** | Marked spent, with the actual run order. **Due for deletion — a remote session cannot delete files here.** |

### What was cut from BUILD_NOTES, and why each one had to go

Every cut was a line that **contradicted another line in the same file** — this file's own named failure mode.

1. **The MAP's line-count history (−7,240 chars).** Thirteen nested *"previously 2B.N read X/Y/Z"* clauses in one 7,000-character paragraph, growing by one every session. Replaced by the three current numbers plus the two durable observations it was actually carrying. **A note saying "do not start it again" is now in its place.**
2. **`#companies-datalist` is dead markup (−823).** The Fossils section said, in as many words, *"delete any note that calls it dead markup."* **That note was still sitting 325 lines above it.**
3. **"THERE IS NO WAY TO CREATE A COMPANY IN VANTAGE" + "the modal has fourteen inputs and NO domain field" (−670).** Both false since 2B.19, which is described as built 200 lines earlier.
4. **The four paragraphs describing ProspectHub's removed tag-filter widget (−2,355).** They sat under a banner saying they described a control that no longer exists. Rewritten as one accurate note.
5. **The superseded original `taskSettings` finding (−1,198).** It described the defect in the present tense one line beneath the note closing it.
6. **Stale carried figures:** `vantageprm-cache-v104` → **v126**; *"`app.js` ~14,660 lines"* → **17,346**; the MAP's 2A.6 counts sitting four lines from 2B.15's; *"case (3) is still live until 2B.20"* when 2B.20 had run; the import's slug path, closed by 2B.20 forty-five lines below.

---

## ⛔⛔ THE BIGGEST FINDING OF THE CLOSE — ANSWERED, SCOPED, NOT BUILT

**`wipeAllData()` clears TEN stores. The app has TWENTY-SIX. Sixteen survive the wipe:** `media_tags` · `prospect_tags` · `campaign_tags` · `company_tags` · `reachoutTypes` · `mediaTypes` · `platforms` · `campaignPhases` · `developmentPhases` · `customSortOrder` · `domainHosts` · `domainRegistrars` · `emailProviders` · and the three `*DefaultUrls` maps. All sixteen ARE exported and ARE restored, so **backup coverage was never the gap — the gap is that the drill cannot fail.**

✅ **MICHAEL ANSWERED IT, 2026-09-03:** *"Everything a user inputs as data needs to wipe and be backup. That would include all tags."* **That is the standard now.** `DECISIONS.md` carries the ruling and a full scope.

⛔⛔ **AND IT IS NOT SIXTEEN `= []` LINES. THIRTEEN OF THE SIXTEEN CANNOT EXPRESS "EMPTY" AT ALL.** Every `ensureStateDefaults()` guard reads `if (!state.X || state.X.length === 0) state.X = [seed…]`. **`[]` is truthy, so the `length === 0` half fires** — on the next boot and on every restore. `state.media_tags = []` in the wipe yields **`["Frontend", "React", "Fintech", "Developer", "General"]`**: the fictional sandbox seeds, shown to a user who was just told his database was completely wiped. **Worse than doing nothing.**

⚠️ **THE SAME GUARD IS A LIVE DEFECT TODAY, WITH NOTHING TO DO WITH THE WIPE.** Every managed-list row has a ✕ (`deleteSettingOption()`) and nothing stops deleting the last entry. **Delete all four `company_tags`, reload, and four invented ones are back**; a genuine backup holding an empty list gets fictional values injected on restore. **Thirty seconds to reproduce from the Settings modal.** The guard fix and the wipe lines are **ONE session, not two**.

✅ **AND HIS FOLLOW-UP CONCERN IS ANSWERED: NOTHING A USER INPUTS SITS OUTSIDE BACKUP/RESTORE.** Audited across all 39 persisted keys — **user data not exported: NONE. Exported but not restored: NONE.** All nine `restore*FromCSV()` functions exist and are called; `restoreSettingsFromCSV()` reads back all eighteen things `generateSettingsCSV()` writes. **Attachments round-trip too** — `exportZIPBackup()` writes a `files/` folder of blobs and `processRestoreFile()` reads it back, which is the one that could have made a full wipe catastrophic. Outside backup/restore: twelve view-state keys, `snapshotHealth` (machine state, excluded by DECLARATIONS), orphaned blobs, and **the IndexedDB `handles` store — which must STAY out of the wipe**, because `showDirectoryPicker()` cannot be driven by an agent and dropping the grant breaks every future automated drill. ⚠️ **This audit is STATIC — it proves the paths are wired, not that they work. The drill proves that, and today it reaches ten stores of twenty-six.**

**⛔ NOT BUILT HERE, and the reason is the compartment:** this close is QA + documents. Adding lines to a destructive control is a DATA change and a DIRECTIVES §4 destructive-data change; it needs its own session, its own ZIP and its own rollback plan. **The one open question in the scope is the split** — the tags, `customSortOrder` and the `*DefaultUrls` maps should end up genuinely empty; `reachoutTypes` / `mediaTypes` / `platforms` / `campaignPhases` / `developmentPhases` are vocabulary the app needs to function and almost certainly mean *back to factory seeds*; **`domainHosts` / `domainRegistrars` / `emailProviders` are the unclear middle and are Michael's call.**

---

## ⛔⛔ SECOND RULING, AND IT FOUND A LIVE RECOVERABILITY HOLE

**Michael, same conversation:** *"I don't want to restore fictional data."* **Standing rule: `ensureStateDefaults()` may seed a GENUINE FIRST RUN and must inject nothing into a restore, a wipe, or an ordinary boot.** It cannot currently tell those apart.

⛔ **`loadDatabase()`'s catch branch reseeds from `prm_data.json`, and `fetchFreshSeed()` ends in `saveState()`.** One corrupt or truncated `localStorage` write therefore replaces the database with **four fictional people (Jane Smith, Alex Rivera, Sarah Chen, Marcus Vance, 555 numbers)** and **overwrites the unparseable original**, announced by one `console.error`. **Partial writes are not hypothetical here.** Fix is two parts: the catch branch must not reseed, and the bad string must be parked under a second `localStorage` key first — it is usually recoverable by hand and is destroyed today. **Gate C, failing silently.** Filed in BUILD_NOTES under its own heading, with the boot-console tell.

⚠️ **AND THE SEEDS ARE THREE DIFFERENT KINDS OF THING.** The four tag lists have **zero** code references and are pure demo content. **`reachoutTypes` and the two phase lists are the app's own enum** — `"Task Completed"` 16 refs, `"Added to Vantage"` 13, `"Email"` 12, `"Launch"` 8, `"Archive"` 6, and `NON_REACHOUT_TYPES` is a `const` naming three. **Deleting those as "fictional" breaks reachout counting, MediaHub's status filter and CampaignHub's phases in one edit.** `mediaTypes` / `platforms` / `emailProviders` / `domainRegistrars` / `domainHosts` are the cosmetic middle and are Michael's call. **This merges into the wipe session — same functions, same `length === 0` guard, same ZIP. One session, M.**

---

## Estimate calibration — Phase 2B, and the three-phase pattern

| | Planned | Forecast (+35%) | **Actual** |
| --- | :---: | :---: | :---: |
| Sessions | 10 | 13–14 | **22** |
| Michael's attention | ~97 min | ~125 min | **~71 min** |
| `CACHE_NAME` bumps | ~20 | — | **31** (v95 → v126) |

- **The session count overran by 120% and the attention estimate came in 43% UNDER. Both numbers moved, in opposite directions, for the third phase running.** Phase 1: 8 planned / 11 actual, 105 predicted / 88 actual. Phase 2A: 6 / 6, 60 / 32. Phase 2B: 10 / 22, 97 / 71. **`DECISIONS.md` 2026-08-30 already called session count the unstable number; this phase is the proof at scale.**
- **The +35% contingency is not big enough and never was.** It was set against a review producing 3–4 sessions. **The 2B.6 review produced 7, and then Michael's own field work on 2026-09-02 produced 5 more** (2B.19, 2B.18, 2B.20, 2B.21, 2B.22) — those five are not review overrun at all, they are **new scope arriving from real use of what shipped mid-phase**, and no contingency percentage models that. **For Phases 3 and 4: keep sizing sessions as planned, keep cutting the attention figure by a third, and stop quoting a session count as a forecast. Quote a range and name the review point as the thing that decides it.**
- **Sizes were right 19 times out of 21.** Both misses were UNDER and neither was the code: **2B.9** (M code, L session — verification against a freezing renderer) and **2B.22** (sized S, ran M — the modal's own height was a fifth task nobody had scoped). **2B.19's size was right and its CONFIDENCE was wrong** — High, should have been Medium; every check in its Done-when touched the Domain field and the defect lived in the path that does not.
- **The one factor that dominates everything: the automation browser.** 2B.4 cost ~20 minutes of Michael's time with the Chrome extension down; 2B.5, the very next session, cost ~2 with it up. **Worth roughly 10× and it outweighs every other sizing input in this phase.**
- **The bump budget finally held.** 31 bumps over the 21 sessions that shipped code is **1.5 per session — the first phase to come in under the two-per-session budget**, and it ran 55% over the ~20 the plan budgeted only because it ran twice as many sessions. **Per session the estimate was right.** Keep the budget; keep refusing to record a one-bump win before review.

---

## ⛔ EXACT NEXT STEP

**Finish 2B.10. It is one conversation and it needs you present for the first two minutes.**

1. **Michael:** commit (three sessions outstanding against `50253cc`), take a **manual ZIP** via Data Management → Export Backup, and **close every Vantage window**.
2. ⚠️ **THE PLAN'S "confirmed green snapshot" GATE IS UNSATISFIABLE AS WRITTEN AND MUST NOT BE WAITED ON.** The chip is a known display defect — it read "Protected" at 15:34 and "Not protected" at 16:25 on 2026-09-02 with nothing changed, and at the red reading the writer returned `wroteToFolder: true` in the same second. **The real gate is `saveBackupFile`'s `wroteToFolder`,** read by wrapping it and running the real `exportZIPBackup()`. BUILD_NOTES § Data records this and says the gate should be restated; the run sheet now carries the restatement.
3. **Then run:** export → `wipeAllData()` → restore, on real data, counts pasted. **Report it as proving TEN stores, not twenty-six** (see above). Stub `window.alert` / `window.prompt` / `window.confirm` first — `wipeAllData()` raises a `prompt()` that must be answered **`"YES"`** exactly, and an unstubbed dialog freezes the automated browser. `wipeIndexedDB()` clears only the `files` store, **not `handles`**, so the backup-folder grant survives the wipe and the drill can read its own ZIP back with no file picker.
4. **Then re-verify a snapshot restore** — Tier 1 is the sole protection through Phase 3, so it is re-proved at every close.
5. **Then Phase 3.** ⛔ **DO NOT RUN PROMPT 3.** Phase 3 is Sequencing and its scope (`claude/sequence-feature-scope.md`, in the Claude project) is **SUPERSEDED** and carries a banner saying so. **It needs a fresh intake — Prompt 1 — not a plan written off it.** Prompt 5's scripted closing line is wrong here and the run sheet says so explicitly.

**Backup filename to use at the close:** `vantage_2B_phase_close_2026-09-03.zip`, stored in `..\backups-production\` — **outside the project folder**, per DECLARATIONS.

---

## Assumptions logged this session

1. **The session ran as 2B.10 rather than 2B.19, on Michael's explicit choice** after being shown the code proving 2B.19 had shipped. Nothing was re-run.
2. **The document half was completed and written back before the gated half was attempted**, deliberately — the drill could be refused or deferred, and losing the calibration and the curation with it would have been the expensive outcome.
3. **`DECLARATIONS.md` was NOT edited.** Five amendments are proposed in `DECISIONS.md` and none is in force. This follows the 2A.6 precedent exactly.
4. **The run sheet was marked spent rather than deleted.** The plan says delete it at the close; a remote session cannot delete files on this machine (BUILD_NOTES § Git). **Michael deletes it.**
5. **BUILD_NOTES was curated by removing contradictions, not by shortening.** The file's own curation rule says the expensive failure is a note that contradicts another note, not length — so five contradiction pairs went and three new findings arrived, leaving the file the same size and more true.

## Backup coverage — DIRECTIVES §4

**NO NEW STORE, NO NEW FIELD, NO NEW KEY, NO MIGRATION, NO RECORD WRITTEN, NO CODE FILE OPENED FOR EDIT.** This session changed six markdown files in `ai/` and nothing else. **The finding above about `wipeAllData()` is reported, not acted on.**

## Open items

- **⛔ THE DRILL AND THE SNAPSHOT RE-VERIFY HAVE NOT RUN.** Phase 2B is not formally closed until they do. Everything else the close owed is done.
- **✅ THE SIXTEEN-STORE WIPE QUESTION IS ANSWERED** and scoped in `DECISIONS.md` — **a Phase 2C DATA session, sized M, ⚠️ ZIP first.** It carries a live restore defect with it (the `length === 0` guard) and one open question for Michael (the three-way split).
- **⚠️ GIT IS THREE SESSIONS DEEP** against `50253cc` — 2B.14, 2B.15 and this session's six documents.
- **Still owed by Michael:** the five **DECLARATIONS amendments** proposed in `DECISIONS.md`; **`LA` = Louisiana or Los Angeles**; **Finding 10d's meaning** in one word; three carried cosmetics from 2B.4, raised three times now — **leaving them is a valid answer, and saying so closes them.**
- **⚠️ Two amendments proposed at the 2A.6 close on 2026-08-31 are STILL not applied** — the one-word hub display names and the in-app-navigation principle. **This is the second close to carry them**, and the navigation one forecloses hash routing permanently on a Gate A argument that lives only in `DECISIONS.md`, which is not what a session reads at boot.
- **✅ THE `7-7-26` / `7-7-28` CORRECTION IS DONE** — three prints fixed (one in the review-response plan, two in `phase-2b-REVIEW-FINDINGS.md`). **The run sheet was named as a third carrier and never held it.**
- **The snapshot chip display defect** — unowned; belongs to whoever next opens `renderSnapshotHealthChip()` / `computeSnapshotState()`.
- **The intermittent zero-byte-snapshot warning** — did not fire at 2B.15's boot after appearing for three sessions. Intermittent, not resolved.
- **Phase backlog, carried:** ProspectHub OR-s tags while Advanced Query AND-s them (**a scoping gap, not a defect** — needs a decision); the `p.notes` shape default; a `p.location` shape default; the company-edit uniqueness guard; ZIP restore reports 1 orphaned task on a round trip; the §4 back-fill of existing `"domain.com"` and slug rows; the missing `<link rel="icon">`.
- **Phase 2C, deferred and needing its own intake:** Finding 9 (task reachout type); Findings 10b + 15 (company uniqueness, host-only, collision report **before** enforcement); Finding 10d; Finding 12 (reachout modal overflow); MediaHub/CampaignHub tag semantics; **the Audience Query Engine** — its tag choosers and its joined-string matcher, which produces silent false positives across tag boundaries. **Correctness, not tidy-up.**
- **Carried, unchanged:** `#btn-see-all-contacts` does not exist (it is `btn-show-all-contacts`). Both `forceShowAll*` true blanks the directory. CampaignHub identifies itself twice. MediaHub's tag rail off the right edge. `state.columnLayouts.taskhub.widths` carries `firstName: 0` and `lastName: 0`. `parseCSVRow()` `""` gap. **The repo is PUBLIC.** DIRECTIVES §0 compliance undecided. Stale `..\backups\`. `schema_update.sql` still deletable.

## Files changed

**Code:** none. **Documents:** `ai/BUILD_NOTES.md`, `ai/DECISIONS.md`, `ai/AIContext.md`, `ai/archive/2026-09-03_1551_AIContext.md` (new), `ai/phases/phase-2b-prospect-detail-view.md`, `ai/phases/phase-2b-review-response-plan.md`, `ai/phases/phase-2b-RUNSHEET.md`.

**Carry forward:** the `🧱 HUB SHELL` block stays LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`. `state.selectedProspectId` and `detailProspectId` are two cursors. **No routing, ever.** `switchView()` calls `saveState()` — **do not navigate inside a byte-comparison window, and do not open the app at all while Michael's window is up.** Inject the transition kill-switch after every reload and every theme toggle. The theme button is **`#theme-toggle-btn`**; put the theme back the way you found it. `resize_window` does not work on this machine. **Measure the screenshot↔CSS scale every session — it is a property of the window, not the machine.** `setAdvancedQueryTarget()` takes `"prospect"` / `"company"` — **SINGULAR**. **Both query surfaces stay DEFERRED.** A bare domain string returned from the browser comes back `[BLOCKED: JWT token]` — **return `domain.split(".")`**. **A new top-level function name is the cheapest honest version probe there is** — and it is also how you check whether a session has already run.
