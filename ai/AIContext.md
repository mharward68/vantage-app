# AI Context — PHASE 3 / OUTREACH-LAUNCH COMPARTMENT CLOSED · THE PHASE IS STILL OPEN

**Updated:** 2026-09-04 12:16 (America/New_York). ⚠️ **Two Open-items lines amended 2026-09-04 ~16:30 by a Step 2R attempt that stopped at its gate — a two-line correction, NOT a session close.** This is still 3.5's handoff and 3.5 is still the last run; nothing below the Open items was touched and no archive rotation happened. See the first two Open items.

**Last run:** Phase 3 / **Session 3.5 — run as a COMPARTMENT close, not a phase close.** Compartment: **QA**. ✅ **COMPLETE.** No code was opened for edit; `app.js`, `index.html`, `style.css` and `sw.js` are byte-identical to what 3.4 shipped.

⛔ **READ THIS FIRST: 3.5 RAN EARLY AND OUT OF ORDER, ON MICHAEL'S EXPLICIT INSTRUCTION, AND IT DID NOT CLOSE PHASE 3.** The plan says 3.5 depends on "everything, including the enrollment compartment and any review-response sessions." Neither has happened: the enrollment half still has no scope and the 3.4 review has not run. He was asked at boot and chose a compartment close: **run every check, write the handoff as an Outreach-Launch compartment close, leave the phase open, leave `ai/phases/phase-3-RUNSHEET.md` in place.** ⛔ **THE REAL PHASE CLOSE IS `3.5b` AND IT STILL RUNS LAST** — what it still owes is listed at the bottom. The plan and the run sheet were both edited this session to say so, per BUILD_NOTES' *"a session that ships out of numeric order must update the plan, not only the handoff."*

**State:** `app.js` **18,793** · `index.html` **3,981** · `style.css` **5,192** — all unchanged. `CACHE_NAME` **v134, zero bumps**, correctly: a QA session that changes no code bumps nothing. **One-glance version tell unchanged:** `typeof linkedinSlug` is `"function"`, `typeof gmailSearchUrl` is `"undefined"`, `LINKEDIN_COMPOSE_ROUTE_LIVE` is `false`. **`app.js` md5 `408be778…` and `sw.js` md5 `a409ffbd…` — byte-identical to the pair 3.4 recorded**, which is the proof that this session changed no code rather than a claim that it didn't.

⛔ **`app.js` AND `sw.js` ARE COMMITTED AND PUSHED — 3.4's HANDOFF WAS STALE ON THIS AND IT IS CORRECTED HERE.** `.git/refs/heads/main` and `.git/refs/remotes/origin/main` both read **`0b4f4531a974178a18954a128856505cb00819ec`** (**IN SYNC: true**), and `.git/COMMIT_EDITMSG` is 3.4's own message, written **11:53** — after `app.js` (11:17) and `sw.js` (11:19) were last modified. Michael committed it himself between 3.4 and this session. **HEAD is `0b4f4531`, not `d7d103fb`.**

**Database: 1,562,438 bytes at boot → 1,562,422 at the end, and every one of the 16 bytes is accounted for below.** 652 prospects · 1,091 companies · 0 tasks · `taskSettings` 2 keys · 38 state keys · only `vantage_prm_database` and `vantage_sidebar_pinned` in `localStorage` · ended on `dashboard`, where it started.

---

## The four amendments, audited against the code — ALL FOUR ARE TRUE IN THE PRODUCT

This was task 6 and it is the one the plan said would find the next A3-shaped failure. **It found none: the code matches every amendment, and no contract paragraph the code follows is the stale one.**

| | Verdict | Evidence |
| --- | --- | --- |
| **A1** — no Bcc | ✅ **TRUE** | `grep -i bcc app.js` returns **17 hits and 16 are comments.** The one live line is `if ("emailBcc" in state.taskSettings) delete state.taskSettings.emailBcc;` — A1's own cleanup migration. `gmailComposeUrl()` output contains no `bcc` substring. **Zero Bcc text nodes in `#modal-task` on screen**, confirmed by count and by screenshot. `OUTREACH_BCC_DEFAULT` greps to comments only. |
| **A2** — HTML clipboard, LinkedIn never gets markup | ✅ **TRUE** | `outreachClipboardPayload()` **always** flattens, and returns `html: null` for `channel === "linkedin"`; `outreachCopy()` skips `clipboard.write` entirely when `html` is null, so **LinkedIn is offered no `text/html` flavour on any path.** Live on a body with a link, bold and italic: email payload carries `<a href=…>Tech RFP</a>` and `<strong>`; LinkedIn payload flattens to `Tech RFP (https://…)` with no `[`, no `**`. `outreachCountedLength` read **128 flattened against 135 stored.** Four-rung fallback ladder present and in order. |
| **A3** — `thread` opens nothing | ✅ **TRUE** | `typeof gmailSearchUrl === "undefined"` in the live app; the only two hits in `app.js` are the comments recording the cut. The `thread` branch of `renderTaskOutreachActions()` builds **no URL and calls no `window.open`** — one hint plus `1 · Copy address` and `2 · Copy message`, numbered and stacked, never a side-by-side pair. |
| **A4** — `?authuser=`, not the path | ✅ **TRUE** | `gmailBase()` returns `https://mail.google.com/mail/`. Decoded back from a built URL: host `mail.google.com`, path `/mail/`, **no `/mail/u/` segment anywhere in the string**, param order `authuser, to, su, body, tf`, `authuser` **round-trips character-identical to the stored 23-character work address**, `tf=cm` present, `view=cm`/`fs=1` absent. ⚠️ **`grep "/mail/u/"` DOES return one hit — `EMAIL_PROVIDER_DASHBOARD_URL_SEED["Gmail"]` at `app.js` 151.** That is CampaignHub's provider-dashboard link seed, pre-dates Phase 3 and is not a builder. **Do not "fix" it.** |

## Verification — all of it ran, on the production database

**Backup gate, both halves, before anything destructive (DIRECTIVES §4 destructive-data-change):**
```
ZIP       vantage_data_backup_9-4-26_1204.zip   wroteToFolder: true   blob 1,211,365 bytes
          on disk in ..\backups-production\ :   1,211,365 bytes      ← independent confirm
SNAPSHOT  writeSnapshotNow() -> true            vantage_snapshot_2026-09-04_120629.json
          on disk in ..\snapshots\ :            1,566,243 bytes
```

**Export → wipe → restore, on real data.** Export carried **18 columns** ending `…,Channel,Message Kind,Message To,Message Subject,Message Body`, **9 CSVs and no new file**, an `Outreach Work Gmail` row and **no `Outreach Bcc` row**. **The wipe was genuine** — prospects/companies/media/campaigns/audiences/tasks all `0`, `columnLayouts` `{}`, `taskSettings` back to `{"dateMode":"business"}` with `workGmailAddress` **cleared**, database down to **3,168 bytes** — so every assertion after it could actually fail. Restore returned **652 / 1,091 / 33 / 3 / 4 / 1 task** and `workGmailAddress` back at 23 characters.

⛔ **THE FIVE COLUMNS SURVIVED CHARACTER-IDENTICAL, FIRST DIFFERENCE `-1` ON BOTH FREE-TEXT FIELDS.** The drill task carried a `msgSubject` with a double quote (33 chars, `subjDiffAt: -1`) and a `msgBody` of 162 characters holding **4 newlines, 2 double quotes, commas, a markdown link and 2 trailing spaces** (`bodyDiffAt: -1`, `bodyTrailingWs: 2`, link intact). `channel`, `msgKind` and `msgTo` all exact; `notes`, `source`, `sourceRef` and the prospect link untouched.

⛔ **AND THE DECISIVE CHECK IS THE ONE THE PLAN DIDN'T ASK FOR: ALL NINE EXPORTED CSVs ARE md5-IDENTICAL BEFORE AND AFTER THE WHOLE DRILL.** A pre-drill export and a post-drill export were both read off disk and compared file by file — `prm_companies.csv b2283efb9d62`, `prm_prospects.csv 0f1c5f2f9756`, all nine equal, both ZIPs 1,211,365 bytes. **That is what proves no user data moved**, and it is stronger than a count.

**Snapshot restore re-verified (Tier 1, sole protection).** Wrote a fresh snapshot of the clean state, **broke state in memory on purpose** (prospects 652 → 3, companies and media → 0), then `restoreFromSnapshotFile()` → **652 / 1,091 / 33 / 3 / 4** back, `workGmailAddress` intact, and the database **byte-identical at 1,562,422**. It also restored Trisha's *cleared* LinkedIn field, which proves it read the new snapshot and not a stale one.

**Regressions clean.** All six views render — five at 997px, MediaHub 977px (its known scrollbar case). `#view-data-management` invariant `total − options` = **53** (69 − 16), exact against 3.3c and 3.4, measured on a fresh boot before the other five views. **`check_ids.py` at baseline `{export-backup-btn, restore-backup-input}`. `node --check app.js` parses.** Both run against bytes md5-matched to what the browser ran. **Console: zero errors and zero exceptions across the entire session, wipe and both restores included**, and the healthy boot line `[Database] Loaded from localStorage` every time — never the `Seeded successfully` five-alarm line.

**The feature still works after the drill, by screenshot** — task editor on channel Email / kind Compose, the toolbar, the live HTML preview rendering the link and the bold, `Open in Gmail` with its link-degrade hint, and **no Bcc line anywhere on the surface.**

## The 16-byte database delta, fully accounted — no residue, no mystery

```
selectedProspectId  "pros-1788534424443" -> null        -16   wipeAllData() nulls it, by design
companies           one record gains city/notes/postal/state  +44   ensureStateDefaults() on restore
prospects           one record: key ORDER changed only    0
Trisha Harward's `linkedin` test URL removed             -44   Michael approved at boot
                                                        ————
                                                          -16   1,562,438 -> 1,562,422
```
Method worth keeping: **two snapshot files diffed key by key in one pass** — pre-drill `120629` against post-drill `121206`, both written by the app's own serialiser, which is the only way the two sides are comparable.

## Findings this session — the durable ones are in BUILD_NOTES

1. ⛔ **A RECORD CREATED THROUGH THE APP'S OWN CREATE PATH DOES NOT CARRY THE FULL DEFAULT FIELD SET UNTIL A RESTORE RUNS.** The single company created during 3.4 was missing `city`, `notes`, `postal` and `state`; `ensureStateDefaults()` added all four on the restore. It is benign and it is the reason an export → wipe → restore is **not** byte-neutral even when nothing is wrong. It is the same family as the carried backlog item "`p.notes` / `p.location` shape defaults" and it means **the create literal and `ensureStateDefaults()` have drifted.**
2. **A snapshot file is NOT a copy of the `localStorage` string** and re-serialising it in another language does not reproduce the byte count — the two differ by ~800 bytes here. Diff **snapshot against snapshot**, never snapshot against a hand-computed total.
3. **`selectedProspectId` is a second `state.activeView`.** It is persisted, `wipeAllData()` nulls it, and it moves the byte count by up to 16. Add it to the list of keys a byte-exact claim must account for.
4. The extension's content filter blocked **`authuser`**, **a bare `.host` value** and a result key containing **`Session`** again. Bland key names and derived scalars, every time.

## Estimate vs actual

**Compartment planned 5 sessions / ~56 min of Michael's attention; it ran 7 sessions / ~23 min. Every session came in at the size it was given — zero re-sizes, the first compartment in this project with none — and BOTH extra sessions came from amendments Michael authorised mid-phase (A1 → 3.1b, A2 → 3.3c), not from underestimation.** 3.5 itself was sized **M / ~20 min / High**: it ran **M**, and **Michael's time was ~4 minutes** — one boot question block of four answered in one pass, one folder-access approval, and no interruption after that.

⛔ **THE PATTERN DID NOT REPEAT, AND THAT IS NOT GOOD NEWS YET.** Phase 1 ran 11 against 8 and Phase 2B ran 17 against 10, and **in both cases every extra session came from a review pass.** Here the count grew 5 → 7 from a completely different cause and **the review has not run at all** — so the +35% contingency is entirely unspent and still lands on 3.6+. **What Phase 4 should take from this is that session growth has TWO independent sources and only one of them has ever been budgeted.** Hosting is the phase most likely to produce amendments, because A2's own reversal condition — whether Gmail honours a `text/html` clipboard flavour from a hosted origin — re-opens there by design. **Budget amendments separately from review response.** And the attention estimates are now consistently ~2.5× the actual across three phases; that is no longer conservatism, it is a number that has stopped meaning anything.

## Amendments PROPOSED — not applied. Michael applies these.

**`DECISIONS.md`:**
1. **Why the Gmail API was declined, and what would reverse it.** Vantage stages, Michael sends (scope §13); OAuth, token storage and a draft-creation scope are a cost and a liability against one user. **Reversal condition: Phase 4 introduces Firebase Auth with Google as the provider, at which point the incremental cost of a `gmail.compose` scope is small — revisit then, and only then.**
2. **The 3.4 LinkedIn-route decision** — `?recipient=` is real but conditional on connection degree, so `LINKEDIN_COMPOSE_ROUTE_LIVE` ships `false`; both builders retained; one line reverses it. *(Owed since 3.4.)*
3. **A4** still owes its entry. *(Owed since 3.3.)*
4. **A2's live answer:** Gmail honoured the `text/html` flavour from `localhost:5000`; the hosted origin re-opens it.

**`DECLARATIONS.md` — one correction, and it is a fact, not a preference:** the Stack line reads `app.js` **~13,270 / `index.html` ~3,250 / `style.css` ~3,680**. Real, `wc -l` at 3.4: **18,793 / 3,981 / 5,192.** The declared numbers are 5,500 lines light on `app.js` and they are there so a session can size a change. **Still one page after.** The nine older owed amendments listed below are unchanged.

**`BUILD_NOTES.md`:** written and applied this session (they are discoveries, not decisions) — the `tf=cm`-versus-`view=cm&fs=1` entry the plan owed, the synchronous-`window.open` entry, the create-path defaults drift, and the snapshot-diff method. **Reported cuts: none. Nothing in the file was disproved this session**, and the curation rule says a stale note is discarded only when a grep disproves it.

## Files changed

**Code: none.** **Documents:** `ai/AIContext.md`, `ai/archive/2026-09-04_1216_AIContext.md` (new), `ai/BUILD_NOTES.md`, `ai/phases/phase-3-outreach-launch.md`, `ai/phases/phase-3-RUNSHEET.md`.

## Open items

- ✅ **THE DOCUMENT CHANGES ARE COMMITTED AND PUSHED — CLOSED, verified 2026-09-04 16:30 at the Step 2R boot.** Michael committed them at **12:22 local**, six minutes after this handoff was written. `.git/refs/heads/main` and `.git/refs/remotes/origin/main` both read **`f932fcebad9930cf0beea1ba49bde4289d7184b9`** (**IN SYNC: true**) and `.git/COMMIT_EDITMSG` is *"Phase 3 Session 3.5: outreach-launch compartment close"*. ⛔ **HEAD IS `f932fceb`, NOT `0b4f4531` — every `0b4f4531` above this line is the state at 3.5's boot, not the state now.** `ai/phases/phase-3-sequencing-RUNSHEET.md`'s banner already read `f932fceb` and was the correct document; **this file was the stale one.** Exactly the failure BUILD_NOTES *"Git, from a session with no shell"* already names — a handoff's commit line goes stale the moment Michael runs git in the gap, and **the next session verifies rather than repeats it.** Three staged ref files, one call.
- ⛔ **3.4 IS STILL THE REVIEW POINT AND IT IS STILL NOW.** Use the feature for real outreach, then run the review. It takes 3.6+.
  ⚠️ **STEP 2R WAS ATTEMPTED 2026-09-04 ~16:30 AND STOPPED AT ITS OWN GATE — no findings document was written, and none should be looked for.** Asked at boot how much real use was behind it, Michael answered **"only a walkthrough so far."** The run sheet's Step 2R block requires *a day of REAL outreach, not a walkthrough*, and says in its own words that a walkthrough finds cosmetic problems while a day of use finds the ones that cost clicks. **Interviewing against a walkthrough would have produced a findings document that reads like evidence and is not**, and it would then have sized real sessions — so the review was not run. **Nothing about 3.4 is disproved by this; the review simply has not happened.** Re-run Step 2R unchanged once there are real sends behind it.
- ⛔ **THE ENROLLMENT COMPARTMENT STILL HAS NO SCOPE.** Phase 3 needs a Prompt 1 intake before 3.6+ can exist. **Eighth close to say so.**
- ⛔ **`3.5b` — THE REAL PHASE CLOSE — STILL OWES:** the calibration across **both** compartments; a **re-run of the export→wipe→restore drill** if the enrollment compartment changes the task record shape (it writes Q1's five fields, so it may not); deletion of `ai/phases/phase-3-RUNSHEET.md`; the Phase 4 handoff; and a currency check on `ai/spec/phase-4-firebase-preflight.md`. **Everything else on 3.5's list is done and does not need redoing.**
- **Phase 4 is Hosting and, unlike Phase 3, it does NOT need an intake** — its pre-flight already exists at `ai/spec/phase-4-firebase-preflight.md`. **It has not been read for currency yet; that is 3.5b's job.**
- ⚠️ **THREE STRAY GMAIL DRAFTS REMAIN** — two personal (3.3), one work (3.4). Gmail's own autosave, not Vantage; Q8 holds. This session opened no compose window and added none.
- ✅ **TRISHA HARWARD'S `linkedin` FIELD IS CLEARED** — the 44-character test URL is gone, confirmed empty and re-confirmed after the snapshot restore. **Put her real profile there when you have it.**
- **Phase 2B is still not formally closed** — its snapshot re-verify has not run. *(This session re-verified the snapshot path itself, which is the same mechanism, but under Phase 3's close, not 2B's.)*
- **Phase 2C, scoped not built:** the sixteen-store `wipeAllData()` gap and the `ensureStateDefaults()` `length === 0` reseed defect. **The create-path defaults drift found today belongs with them.**
- **Still owed by Michael, a NINTH close carrying them:** the five `DECISIONS.md` DECLARATIONS amendments; the two from 2A.6; the domain-is-identity amendment; the 2B.16/2B.17 P4/P5 divergence amendments. `LA` = Louisiana or Los Angeles. Finding 10d's meaning. Three cosmetics from 2B.4 — **leaving them is a valid answer and saying so closes them.**
- **`ai/phases/phase-2b-RUNSHEET.md` is spent and marked for deletion. Michael deletes it.**
- **Phase backlog, carried:** the `"Note"` reachout-type reassignment gap; ProspectHub OR-s tags while Advanced Query AND-s them; `p.notes` / `p.location` shape defaults; company-edit uniqueness guard; the §4 back-fill of existing `"domain.com"` rows; the missing `<link rel="icon">`. **The repo is PUBLIC** and DIRECTIVES §0 compliance is undecided. Stale `..\backups\`.
- **Both query surfaces stay DEFERRED**; the `sequences` tab is still `enabled: false`, verified in `PROSPECT_DETAIL_TABS` this session. Neither was touched.

## ⛔ EXACT NEXT STEP

**Commit the five document files. Then REVIEW 3.4 — use the outreach feature for real outreach first.** After the review, run **Prompt 1** for the enrollment compartment, then **Prompt 3** to merge both compartments into `ai/phases/phase-3-sequencing.md`. Review-response and enrollment sessions take **3.6+**. **`3.5b` closes the phase and always runs last.**

**Run sheet:** ⛔ **`ai/phases/phase-3-sequencing-RUNSHEET.md` (new, 2026-09-04) IS THE ONE TO PASTE FROM.** It covers Step 2R through the `3.5b` close, with every prompt corrected for A1–A4 and for 3.5 having already run. `ai/phases/phase-3-RUNSHEET.md` is banner-marked superseded from Step 2R onward and kept only as the record of 3.1–3.4; **its Step 2R prompt still asks about the Bcc that A1 removed.** Both are deleted at the phase close.

**Carry forward:** ⛔ **A `device_commit_files` CALL CAN REPORT `written`, UPDATE THE mtime, AND WRITE THE PREVIOUS BYTES — AND THE SIZE CHECK CANNOT SEE IT WHEN THE TWO VERSIONS ARE THE SAME LENGTH.** Write each revision to a NEW staged path *and* re-stage and md5-compare. Used successfully five times this session. ⚠️ **`device_stage_files` WRITES BACK OVER YOUR WORKING COPY** — keep the authoritative copy under `/mnt/user-data/outputs/`, not where staging lands. ⛔ **THE `computer` CLICK COORDINATE IS `css × (screenshotWidth ÷ innerWidth)` AND IS NOT THE POSITION IN THE PICTURE.** Screenshots came back 1148×1054 with `innerWidth` 952 and `devicePixelRatio` **1** this session — *different from 3.4's 0.75* — which is the whole reason it must be re-derived live every time. **The extension's content filter blocked `authuser`, a `.host` value and a key containing `Session`** — bland key names, derived scalars. **`state` is not `window.state`.** **`switchView()` calls `saveState()`, and `activeView` and `selectedProspectId` both move the byte count.** **Stub `prompt`/`alert`/`confirm` before `wipeAllData()`, and make the prompt stub return `"YES"` or the wipe silently does nothing.** **THE APP RUNS PERFECTLY WITH THE SERVER DOWN.** **Do not open the app while Michael's window is up.** **TEST AGAINST REAL RECORDS, WRITE UP PLACEHOLDERS — the repo is public.**
