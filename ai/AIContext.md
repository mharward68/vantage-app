# AI Context

**Updated:** 2026-08-31 16:47 (America/New_York)
**Last run:** Phase 2A / **Session 2A.6 — PHASE CLOSE.** QA + documents. **Phase 2A is complete.**
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v95, unchanged — this session bumped nothing** · `app.js` 13,272 / `index.html` 3,254 / `style.css` 3,681 · console clean, 0 errors across three reloads · deployed n/a
**Estimate vs actual:** sized **M / ~20 min / High**; ran **M**, **zero `CACHE_NAME` bumps** (no code file was opened for edit), and roughly **4 min of Michael's time** — two blocking questions answered up front, nothing else. Phase totals below.
**One-glance version tell:** unchanged from 2A.5 — **in LIGHT theme, look where the sidebar meets the header.** One shade, no vertical join = v95. This session shipped no code, so no new reload is needed.

## Phase 2A is closed — all five goals verified, real output

| Goal | Check | Result |
| --- | --- | --- |
| 1. No hub scrolls the page | `getComputedStyle('#view-<name>').height` per hub | **All six `997.333px`** — a definite value, never `auto` — with `min-height: 0px`, each filling `#canvas-body`'s client height minus its 48px padding **exactly**. `#canvas-body.scrollHeight > clientHeight` **false** on all six. |
| 2. No `calc(100vh - <constant>)` | `grep -n "calc(100vh" style.css index.html` | **4 hits, all correct**: two comments (`style.css` 221, `index.html` 1044) and the two modal rules (`style.css` 2551, 2555). The three live constants are gone. |
| 3. `#canvas-header` is a hub band | `getBoundingClientRect().height` on `#sidebar-brand` and `#canvas-header` | **72 and 72, `equal: true`, both `top: 0`** — expanded and collapsed. Tokens resolve `--app-strip-height: 72px`, `--brand-logo-size: 68px`. |
| 4. Both `.welcome-banner` cards gone | `grep -n "welcome-banner" index.html` | **Zero hits.** The CSS rules survive by Assumption 7; `app.js` retains only a comment. |
| 5. Hub names are one word | sidebar labels + `titles` map + `data-view` values | **Dashboard / ProspectHub / MediaHub / CampaignHub / TaskHub / DataHub.** All six `data-view` values and all six `body.module-*` classes **unchanged** — contract S4 held. |

**Frozen contracts S1–S6 all intact at close.** S5's `🧱 HUB SHELL` block runs from `style.css` 3388 to 3681 — it **is** the last thing in the file. `#canvas-body` was never edited and still reports `overflow-y: auto`. `#sidebar` has `border-right: 0` with the rule redrawn as `#sidebar::after` at `top: 72px; width: 1px`.

**Screenshotted every hub**, light theme, plus CampaignHub in dark and the collapsed rail. Collapsed rail re-measured: logo `left: 4, right: 72` in a 76px rail, `clipped: false`.

## Estimate calibration — Phase 2A vs. the plan

| | Planned | Forecast (+35%) | **Actual** |
| --- | :---: | :---: | :---: |
| Sessions | 6 | 8 | **6** |
| Michael's attention | ~60 min | ~75 min | **~32 min** |
| `CACHE_NAME` bumps | ~12 (v84→v96) | — | **11 (v84→v95)** |

Per session: 2A.1 **L**/~10 → L/~4 · 2A.2 **M**/~8 → M/~6 · 2A.3 **M**/~6 → M/~0 (unattended) · 2A.4 **M**/~10 → M/~5 · 2A.5 **S**/~6 → **S for the edit, M for the session**/~13 · 2A.6 **M**/~20 → M/~4.

- **Sizes were right 5 times out of 6.** The miss was 2A.5, sized S because the *edit* was two token values — and it was, but the session around it (mockup artifact, a defect the verification pass found, a review-pass seam fix) ran M. **The lesson is narrower than "inflate S": a session whose deliverable is one number Michael picks by eye is never S, because the picking is the work.**
- **The session count did NOT overrun, and Phase 1's pattern did not repeat — but read why before trusting it.** The +35% contingency was budgeted against 2A.4 specifically, and 2A.4's review did produce three extra items. They were absorbed *inside* 2A.5 rather than spun out as 2A.7/2A.8, and one more (CampaignHub's double title) was deferred rather than run. **So the count held by absorption and deferral, not because review produced less work.** The honest figure for 2B is that review still generates roughly one session's worth of work per UI-shipping session; whether it shows up in the count depends on whether the next session swallows it.
- **Attention time came in at ~53% of plan** — the second phase running well under (Phase 1: 88 actual vs 105 predicted). Two phases in the same direction is a pattern, not noise. **The time estimates are systematically high by roughly a third on UI phases.** Do not "correct" them by inflating; the useful read is that a ~60 min phase plan costs Michael ~35.
- **The bump budget was exactly right.** Two per session predicted v96; actual v95. **Three of six sessions took a third bump, every one of them from the review pass, never from the build being wrong.** Keep the two-per-session budget and keep refusing to record a one-bump win before review.
- **For 2B, 3 and 4:** keep session sizes as planned, keep the +35% count contingency (it was needed in Phase 1 and only *looked* unnecessary here), and cut planned attention-time figures by about a third when telling Michael what a phase will cost him.

## Files changed this session

`ai/BUILD_NOTES.md` (curated — see below), `ai/DECLARATIONS.md` (line counts + amendment log), `ai/DECISIONS.md` (two new entries), `ai/AIContext.md` (this file), `ai/archive/2026-08-31_1647_AIContext.md` (new — verified present at 13,871 bytes, byte-identical to the AIContext it replaced).

**NOT deleted, though you approved it: `ai/phases/phase-2-RUNSHEET.md` and `ai/phases/Vantage-Phase-2-Run-Sheet.docx`.** This session had **no shell and no delete capability on the machine** — the device bridge can write a file but cannot remove one. Both are still in the tree carrying their DO-NOT-USE banners. **Delete them by hand alongside the git commit; `ai/phases/phase-2a-RUNSHEET.md` is also disposable now that this close has run.** Same root cause as open item (a): no session in this phase had a shell.

**No code file was opened for edit** — `app.js`, `index.html`, `style.css` and `sw.js` are byte-identical to what 2A.5 left.

## BUILD_NOTES curation — what was cut

Every cut was a line that had become **factually wrong**, which is this file's own stated failure mode ("a stale note is discarded wholesale the moment one grep disproves it, and the true half goes with it").

- **`style.css` 3,659 → 3,681** and **`app.js` "~13,100" → "~13,270"** (two sites) — MAP and the sizing note.
- **`CACHE_NAME` "last observed v94" → v95.**
- **"`getBoundingClientRect().height` is 88 on both" → 72.** The most dangerous line in the file: 88 came from the "logo plus 24px padding" derivation that 2A.5 explicitly killed, and the strip is now *shorter* than that padding allowed. Rewritten to say 72, to say 88 is stale, and to record the 72px ceiling on `--brand-logo-size`.
- **`--hub-tint-strong` (14%) / `--hub-tint-soft` (4%) → 30% / 0%**, with the three-stop sidebar ramp recorded and the note that the soft stop going to **0** is the load-bearing half.
- **"If `--hub-tint-strong` is ever raised much past 14%, check the active tab"** → rewritten as settled: it *was* raised to 30%, the tab survived, and the structural reason (the strong stop sits at the top where no nav tab does) is now written down instead of the warning.
- **`vh` grep count 23 → 22** (13 css + 9 html), re-counted.
- **Two duplicate pairs merged.** The two `Page.captureScreenshot`-times-out entries — the second literally said "this is the same note as the entry above" — became one with the known cause. The `getBoundingClientRect` vs `getComputedStyle` note became a corollary of the backgrounded-tab note it is a special case of, rather than a separate entry a session might read alone.
- **One entry added:** the whole-shell check as a reusable script (definite `#view-<name>` height is the real contract; `#canvas-body` not scrolling is the weak companion), so the next phase close does not re-derive it.
- **Plan task 2 needed nothing.** It asked for the three dead `calc(100vh - N)` constants to be recorded. Session 2A.1 already wrote that entry, thoroughly, including the "a fifth hit means someone reintroduced one" test and 2A.2's wider-net caveat. Writing a second copy is exactly what the curation rule forbids. **Verified present, left alone.**

## DECLARATIONS — one correction applied, two amendments PROPOSED not applied

**Applied:** the Stack line counts, re-measured rather than estimated. `style.css` is now larger than `index.html`, which changes how a session sizes a CSS change.

**Proposed, awaiting Michael — neither is in force:**

1. **One-word hub display names**, added to the Conventions block, **extending** the existing Routing warning rather than replacing it: the hubs display as Dashboard / ProspectHub / MediaHub / CampaignHub / TaskHub / DataHub, while `data-management` remains the identifier in all eight of its code sites. The old trap (trusting a declared name of `data`) and the new one (trusting the displayed name `DataHub`) are different mistakes with the same cure, so both notes are wanted.
2. **The in-app-navigation principle**: all navigation happens inside the app; the address bar and back/forward are not navigation surfaces. This permanently forecloses hash and path routing. **The reason is Gate A, not taste** — production `prospectId` values are email addresses, so a URL-addressable prospect view leaks a live address into the address bar, browser history, autocomplete, and (from Phase 4) server logs and referrer headers.

Reasoning for both is now in `ai/DECISIONS.md` with the rejected alternatives.

## Open items

- **⚠️ NEEDS YOUR EYES — (a) is the phase's largest carried risk and it did not improve.**
  **(a) `git status` is now SIX sessions deep** — 2A.2, 2A.3, 2A.4, 2A.5 and this close are all uncommitted; local `main` still `d282710`, `origin/main` still `ad7568d`, one commit unpushed. **No session in this entire phase had a shell on the machine**, this one included — every file was written through the device bridge, which cannot run git. `git checkout style.css` now discards five sessions of work and is no longer a fallback. **Commit and push before anything else.**
  **(b) CampaignHub identifies itself TWICE** — the in-page "Outreach Campaign Manager" heading and subtitle still sit directly under a band that already says CampaignHub. Visible in this session's CampaignHub screenshots, both themes. **You chose at this close to record it as deferred rather than run 2A.7.** It is cosmetic, in-compartment for a future UI session, and carried to the 2B backlog.
  **(c) The Dashboard/DataHub emptiness question from 2A.3 is still unanswered.** `renderDashboardView()`'s `slice(0, 5)` cap is the cause, not the layout.
  **(d) NOT an open item — resolved before this session ended, recorded because the diagnosis is reusable.** The snapshot chip read **"Not protected"** for most of this session and it looked alarming on the DataHub screenshot. Nothing was wrong: `state.snapshotHealth` read `lastError: null, failed: false` throughout, and `lastMutationAt` was simply newer than `lastConfirmedAt` because the session kept touching the app — every reload and the theme toggle is a mutation, and each one resets the ~2-minute debounce. **Left alone for four minutes it wrote and went green on its own:** `lastConfirmedAt` now leads `lastMutationAt`, chip reads **"Protected"**. **The reusable part: an automated session that reloads repeatedly will hold this chip red for its whole run, and that is the debounce, not a failure. Read `lastError`/`failed` before believing the chip** — and if `lastError` is ever non-null, *then* the File System Access permission needs re-granting.
- **Carried, unchanged:** MediaHub's tag rail off the right edge (pre-existing, min-content not scroll). `.checkbox-scroller`'s inline `max-height: 350px`. `.tags-filter-scroller`'s `max-height: 400px`. The prospect inspector's squeezed history table (2B replaces it). `state.taskSettings` missing from `wipeAllData()` → **2B.7**. `--color-danger` undefined, six call sites → **2B.3**.
- **Unchanged from Phase 1:** two Vantage windows overwrite each other (one window at a time); `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Backup coverage — DIRECTIVES §4

**Not a data session, and neither was any session in Phase 2A.** Stated once for the phase: Phase 2A created and modified **no** store of user-writable data — no field, no CSV column, no migration, no `ensureStateDefaults()` or `wipeAllData()` edit, no export or restore function entered. This session opened no code file at all. Record counts identical at start, after a six-hub sweep, and after three reloads: **4 prospects / 5 companies / 30 media / 31 tasks / 0 campaigns / 1 audience list.**

## What to back up, and the filename

Run **Run Backup / Export Options → full ZIP** from DataHub and store it **outside** the project folder, in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`:

**`vantage_backup_2026-08-31_phase-2a-close.zip`**

## Next step — Phase 2B, the Prospect Detail View

1. **Commit and push the six outstanding sessions.** Before anything else.
2. **Take the phase-close ZIP** under the filename above.
3. **Decide the two proposed `DECLARATIONS.md` amendments** — apply, amend or reject.
4. **Then Phase 2B.** Its scope `ai/spec/prospect-detail-view-scope.md` is **already approved and its intake is done** — do **not** run an intake for it. It goes straight to **Step 1 of `ai/phases/phase-2b-RUNSHEET.md`** (the planning conversation). Note that **Session 2B.2 has already been run** (2026-08-31, column-layout machinery generalised) ahead of the plan; the planner must account for it rather than re-plan it.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`. One Vantage window at a time. **The `titles` map's keys are view ids — "data-management" is DISPLAYED as "DataHub" and identified everywhere as `data-management`.** **`--brand-logo-size` cannot exceed 72px** — the 76px rail crops it. **Inject the transition kill-switch after every reload and every theme toggle**, and read `document.getAnimations().length === 0` before trusting any measurement.
