# Phase 2A: App Shell

*Planned 2026-08-31 from `ai/spec/app-shell-scope.md` (approved 2026-08-30, no stop banner) via PROMPT 3 of `ai/APP_BUILD_WORKFLOW.md`.*

**Run sheet:** `ai/phases/phase-2a-RUNSHEET.md` · **Scope:** `ai/spec/app-shell-scope.md` · **Next phase:** 2B (`ai/phases/phase-2b-prospect-detail-view.md`), blocked on this one closing.

> **Work order is fixed by scope §2.3 and was not re-sequenced here.** Scroll conversion before the header band; CampaignHub first among hubs. The reason is causal, not preference: three hardcoded `calc(100vh - N)` constants break the moment the header height changes, and the scroll conversion is what deletes them.

---

## Goal — what's true after that isn't now

1. **No hub scrolls the page.** All six `#view-<name>` panels are exactly one screen tall and each owns its own inner scrolling, the shape `#view-tasks` has had since Session 1.10. `#canvas-body` is unmodified and still has `overflow-y: auto`; while any hub is active it simply has nothing left to scroll.
2. **No `calc(100vh - <constant>)` remains outside the two modal rules.** The three live ones — `style.css` 1171, `style.css` 1797, `index.html` 663 — are gone, replaced by inherited `height: 100%`. No new constant replaces them.
3. **`#canvas-header` is a hub banner band** carrying the hub's icon and one-word name, coloured from `--color-primary`, vertically aligned with the sidebar logo, with the strip height defined once as a token that both `#sidebar-brand` and `#canvas-header` read.
4. **Both hardcoded `.welcome-banner` cards are gone** from `#view-dashboard` and `#view-data-management`, absorbed into the band. Six hubs identify themselves one way instead of two out of six doing it inconsistently.
5. **Hub names are one word** — ProspectHub, MediaHub, CampaignHub, DataHub — in the sidebar labels and the `switchView()` titles map. View ids, `data-view` values and `body.module-*` classes are untouched.

## Out of scope

- **All data work.** No store, field, migration, CSV column, `ensureStateDefaults()` entry or `wipeAllData()` line. A session that finds itself in an export or restore function is out of compartment; that goes to the backlog below.
- **`#canvas-body`.** Never modified, in any session, for any reason.
- **New features.** Sorting, filtering, and every hub's behaviour are untouched. No hub gains or loses a sub-view, sub-tab or control.
- **TaskHub.** Already in the target shape. It is the reference implementation and a regression target, never a conversion target.
- **The two Phase 1 carry-ins.** `state.taskSettings` in `wipeAllData()` is data work (2B.7); `--color-danger` belongs beside the ProspectHub work that exercises it (2B.3). Neither is done here.
- **View id renaming.** `data-management` stays `data-management` in all eight of its code sites. Labels change; ids do not.

## Assumptions

*All reversible, all decided here rather than asked, per PROMPT 3.*

1. **The scroll idiom is two shared class names, not five per-hub rule blocks.** TaskHub used a view-id-prefixed bespoke block because it was the only converted hub. Five more bespoke blocks would be five dialects of one rule. Frozen as **S5**. Reversible: the classes can be inlined per hub later at the cost of the edit that created them.
2. **The idiom block is declared at the END of `style.css`.** `BUILD_NOTES.md` records two rules lost to source order at equal specificity in one sitting (Session 1.10). Declaring the idiom after every pre-existing layout rule removes that failure mode by construction rather than by vigilance.
3. **Session 2A.1 leaves ProspectHub in a benign interim state.** `.prospects-layout-container` is shared by ProspectHub and CampaignHub's Audience view, so deleting its `calc(100vh - 120px)` in 2A.1 changes ProspectHub before its own session. `height: 100%` against a still-auto-height `#view-prospects` resolves to `auto`, so ProspectHub reverts to ordinary page scrolling — visibly the same as today, not broken. **This is why ProspectHub is 2A.2 and not later.** It is also why 2A.1's every-hub screenshot check is load-bearing rather than ceremony.
4. **The Dashboard `.welcome-banner`'s sentence survives as a subtitle.** "Welcome back to Vantage PRM" is content, not chrome. `#view-subtitle` stays — it is already used by MediaHub and DataHub, and 2B needs it for the prospect's name.
5. **The band shades with a low-alpha tint of `--color-primary`**, in the manner of the existing `.welcome-banner`, not a saturated fill. A full-strength band under a coloured title would fight it.
6. **The sidebar nav icons are reused verbatim** as the band's icons: 📊 👥 📁 🎯 ✅ 🗄️. They already identify each hub.
7. **The `.welcome-banner` CSS rules are left in `style.css`** after both call sites are removed. 2B may want the card shape, and deleting a rule nothing references is not this phase's job.
8. **Panel gap is a per-hub judgement, logged not asked.** `.view-panel` carries `gap: 24px`. TaskHub set `gap: 0` because its single card owns its internal gaps. Each converting session picks the value that looks right for that hub and logs it. CampaignHub in particular already has a sub-tab bar carrying its own `padding-bottom: 12px` **and** `margin-bottom: 12px`, so 24px on top of that is likely too much.

---

## Frozen contracts — written literally; later sessions treat as read-only

**S1–S4 are carried verbatim from `ai/spec/app-shell-scope.md` §6** and were frozen at intake on 2026-08-30. **S5 and S6 are added by this plan** because without them sessions 2A.2–2A.4 would each have to invent a name that 2A.1 already chose, and a half-named idiom is what makes the next phase expensive.

### S1 — The scroll shape

`#canvas-body` keeps `overflow-y: auto` and is never edited. Each `#view-<name>` takes `height: 100%; min-height: 0`; `min-height: 0` appears at every level of its flex chain; the innermost results region owns `overflow-y: auto`. **No hub expresses height as `calc(100vh - <constant>)`.**

### S2 — One height token

The header strip's height is defined once and read by both `#sidebar-brand` and `#canvas-header`. Neither hardcodes the other's value, and no view panel references it at all.

### S3 — Hub colour comes from the token

The header band's text and shading derive from `--color-primary`, which `updateThemeColors()` already sets per hub via `body.module-<view>`. No per-hub colour is written into the header's own rules, and no hub colour is hardcoded inline anywhere this phase touches.

### S4 — Labels are not ids

Display names change; `data-view` values, panel ids, and `body.module-*` class names do not.

### S5 — The scroll idiom, named once *(added by this plan)*

Written literally by Session 2A.1, in one block, at the **end** of `style.css`, under a comment header that cross-references the TaskHub block at `style.css` 543 rather than duplicating it:

```css
/* Fills the panel and owns nothing else. One per hub. */
#view-<name> { height: 100%; min-height: 0; }

/* A mutually-exclusive sub-view inside a hub panel.
   .hidden's `display: none !important` still wins over this display:flex. */
.hub-subview { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }

/* The ONE region in a hub (or in a sub-view) that scrolls. */
.hub-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
```

Rules for every later session:

- **No hub invents a variant.** A hub needing something extra prefixes with its view id — `#view-campaigns .hub-scroll { … }` — and that override lives in the same end-of-file block.
- **Exactly one `.hub-scroll` per visible region.** Two scrolling ancestors in one chain is the bug this idiom exists to prevent.
- **The block stays last in the file.** Nothing is appended to `style.css` after it except further entries in the same block.

### S6 — Token names *(added by this plan)*

`--app-strip-height` is the S2 strip height. `--brand-logo-size` is the sidebar logo's edge length. Both are defined once, in the same `:root` block as the app's other tokens. `#canvas-header`'s inline `min-height: 80px` at `index.html` 138 is **deleted** when the token lands — an inline value beats the token and would silently reinstate the 4px offset the token exists to remove.

---

## Sessions

### Session 2A.1 — CampaignHub scroll conversion, and the idiom it proves

- **Compartment:** UI · **Depends on:** nothing · **Goal:** the S5 idiom exists as real CSS with five working consumers, and two of the three stale constants are gone.
- **Size: L** · **My time: ~10 min** · **Confidence: High**

> **Sized L, and deliberately not split.** The obvious split — "invent the idiom" then "apply it to the five sub-views" — fails on both halves. An idiom with no consumer cannot be verified by screenshot, and screenshots are this phase's only real check. More decisively, **CampaignHub must convert atomically**: the moment `#view-campaigns` takes `height: 100%`, `#canvas-body` stops scrolling it, and any sub-view not yet given its own `.hub-scroll` has its overflow clipped and becomes unreachable. A split would hand back a hub with two of five sub-views amputated, which violates DECLARATIONS' "the app is left usable" rule. Confidence is High despite the L because the scope pre-decided the design and the TaskHub block at `style.css` 543 is a worked precedent.

- **Files modified:** `style.css`, `index.html`, `sw.js`
- **Tasks:**
  1. Add the S5 block at the end of `style.css`, with a comment header pointing at `style.css` 543 as the precedent and stating why the block is last in the file.
  2. `#view-campaigns { height: 100%; min-height: 0 }`, with the panel gap set per Assumption 8 and the value logged.
  3. Add `class="hub-subview"` to all five sub-views: `#campaign-dashboard-view` (663 → the div at 626), `#audience-lists-view` (662), `#email-accounts-view` (741), `#domain-management-view` (801), `#campaign-query-view` (862). Confirm `.hidden` still wins.
  4. Give each of the five exactly one `.hub-scroll` region. The two table sub-views already have `.table-scroll-container`; the three grid sub-views (`.media-hub-layout`, `.prospects-layout-container`, `.campaigns-grid-container`) need the chain walked level by level.
  5. Delete `height: calc(100vh - 120px)` from `.prospects-layout-container` (`style.css` 1171) and `height: calc(100vh - 200px)` from `.campaigns-grid-container` (`style.css` 1797). Replace with `height: 100%; min-height: 0`.
  6. At `index.html` 663, delete **only** the `height: calc(100vh - 280px);` from the inline style. **`grid-template-columns: 1.2fr 0.9fr; gap: 16px` is load-bearing and stays** — `.prospects-layout-container` defaults to `1fr 0fr`, which collapses the audience inspector to zero width while the DOM updates correctly and nothing appears to happen (`BUILD_NOTES.md`, DOM and rendering).
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `node --check app.js` → clean (app.js untouched, but the standing check runs).
  - `python check_ids.py` → the standing baseline of two: `{'export-backup-btn', 'restore-backup-input'}`.
  - `grep -n "calc(100vh" style.css index.html` → `style.css` 1171 and 1797 and the `height:` at `index.html` 663 are **absent**. Surviving hits are `style.css` 174 (comment), 2314 and 2318 (modal, correct — leave them) and `index.html` 1009 (comment).
  - `grep -c "hub-subview" index.html` → **5**.
  - Screenshot **all five CampaignHub sub-views** — Campaigns Dashboard, Audience Lists, Email Accounts, Domain Management, Audience Query Engine — each with enough rows to force its scroll, showing the page itself not scrolling.
  - Screenshot **all six hubs**. ProspectHub is expected to look unchanged (Assumption 3); TaskHub must be pixel-unchanged.
  - Reload twice (cache-first serves the old document on the first) and confirm state survives.
- **Needs my eyes:** the Audience view's inspector still opens at its proper width; the five sub-views still *feel* right at one screen tall; the panel-gap value 2A.1 chose.
- **Risk and fallback:** the grid sub-views are three separate flex chains and `min-height: 0` is needed at every level (`BUILD_NOTES.md`). If one resists after three attempts, THREE STRIKES applies — stop and report. Fallback is `git checkout style.css index.html`; nothing here is stateful.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data. Not a data session.

### Session 2A.2 — ProspectHub and MediaHub

- **Compartment:** UI · **Depends on:** 2A.1 (S5 must exist) · **Goal:** both hubs one screen tall on the frozen idiom.
- **Size: M** · **My time: ~8 min** · **Confidence: High**
- **Files modified:** `style.css`, `index.html` (if class attributes are needed), `sw.js`
- **Two hubs in one session** because they share one idiom, neither is individually large, and Phase 1's calibration says the unstable number is session count, not session size.
- **Tasks:**
  1. `#view-prospects { height: 100%; min-height: 0 }`. Its `.prospects-layout-container` already became `height: 100%` in 2A.1; walk the chain through `.prospects-directory-card` (already `display: flex; height: 100%`) to the scroll region.
  2. Decide and log what happens to the two `.table-scroll-container` inline `max-height: 35vh` at `index.html` 270 and 299. They are viewport-relative, which is the family of constant this phase removes — but scope §2.4 says the two directory tables "do not need splitting, tabbing or restructuring." Keep the two-table split; replace `35vh` with a flex share only if the chain makes it free. **Log the call either way.**
  3. `#view-media { height: 100%; min-height: 0 }`. `.media-hub-layout` is a grid with `align-items: start`; the left column (`.media-hub-left`) is the scrolling side. `.media-hub-right` is `position: sticky` — confirm it still sticks against the new scrollport, not the old one.
  4. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `node --check app.js` clean · `check_ids.py` at baseline of two.
  - `grep -n "calc(100vh" style.css index.html` → unchanged from 2A.1's expected output.
  - Screenshot both hubs with enough rows to force scrolling, plus a screenshot of ProspectHub with the inspector open (it is an absolutely-positioned overlay anchored to `.prospects-layout-container`, whose height just changed).
  - Screenshot **all six hubs**.
  - Reload twice; state survives.
- **Needs my eyes:** whether the two 35vh directory tables still feel right at their new height; whether MediaHub's right rail behaves.
- **Risk and fallback:** the ProspectHub inspector overlay is positioned against a container this session resizes — the failure would be a clipped or mispositioned panel, invisible to computed style and obvious in a screenshot. `git checkout` reverts.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data. Not a data session.

### Session 2A.3 — Dashboard and DataHub

- **Compartment:** UI · **Depends on:** 2A.1 · **Goal:** the last two hubs converted; the scroll conversion complete.
- **Size: M** · **My time: ~6 min** · **Confidence: High**
- **Files modified:** `style.css`, `index.html` (if class attributes are needed), `sw.js`
- **Two hubs in one session** because they are structurally the same shape — a `.welcome-banner` above a `.dashboard-split-grid` of `.dashboard-list-card`s — and the conversion is one decision applied twice.
- **Tasks:**
  1. `#view-dashboard { height: 100%; min-height: 0 }`. `.stats-grid` is fixed-height and stays; `.dashboard-split-grid` fills and its two list cards each scroll.
  2. `#view-data-management { height: 100%; min-height: 0 }`, same treatment on its `grid-template-columns: 1fr 1fr` split.
  3. **`.dashboard-split-grid` is shared by both hubs.** Change it once or prefix per view; do not write it twice.
  4. **The two `.welcome-banner` cards stay for now** — they are removed in 2A.4, and removing them here would make this session's screenshots un-comparable with 2A.4's.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - `node --check app.js` clean · `check_ids.py` at baseline of two.
  - `grep -n "calc(100vh" style.css index.html` → **exactly four hits, all of them correct**: `style.css` 174 (comment), `style.css` 2314 and 2318 (modal, viewport-relative on purpose), `index.html` 1009 (comment). **This is the phase's goal-2 check and it is met here.**
  - Screenshot both hubs; screenshot **all six hubs**.
  - Reload twice; state survives.
- **Needs my eyes:** **a real question, not a checkbox** — Dashboard and DataHub have the least content of the six. Is one-screen-tall actually better for them, or do they read better scrolling? If the answer is "scrolling," say so at this review and the plan gets revised rather than the shape being forced.
- **Risk and fallback:** low. Both hubs are short and their grids are simple. `git checkout` reverts.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data. Not a data session.

### Session 2A.4 — The header band, and the one-word names

- **Compartment:** UI · **Depends on:** 2A.1, 2A.2, 2A.3 — **all three.** The header's height changes here, which is what the three deleted constants could not survive.
- **Size: M** · **My time: ~10 min** · **Confidence: High**
- **Files modified:** `index.html`, `style.css`, `app.js`, `sw.js`
- **Tasks:**
  1. Define `--app-strip-height` and `--brand-logo-size` (S6) in the app's existing `:root` token block. `--brand-logo-size` starts at its current **40px** — the number is picked in 2A.5, from the screen.
  2. `#sidebar-brand` and `#canvas-header` both read `--app-strip-height`. **Delete the inline `min-height: 80px` and `padding: 12px 24px` at `index.html` 138** — an inline value beats the token.
  3. Restructure `#canvas-header`'s left side into the band: hub icon + one-word name in `var(--font-display)` at `#brand-name`'s size, `color: var(--color-primary)`, on a low-alpha tint of the same token (S3, Assumption 5). The sidebar toggle button and `#view-subtitle` keep their places.
  4. Drive the icon from `switchView()` alongside the existing `titles` map — one map, six entries, the same six emoji the nav already uses.
  5. **One-word names, two places:** the six `.tab-label` spans at `index.html` 57–87, and the `titles` map at `app.js` ~3021. `Prospect Hub`→`ProspectHub`, `Media Hub`→`MediaHub`, `Campaign Hub`→`CampaignHub`, `Data Management`→`DataHub`. Dashboard and TaskHub unchanged.
  6. **Remove both `.welcome-banner` cards** — `index.html` 159 (Dashboard) and 1093 (DataHub, whose inline gradient is indigo→cyan on a red hub, copy-pasted and wrong). Move Dashboard's sentence into `subtitles.dashboard` in `switchView()`. **Leave the `.welcome-banner` CSS rules in place** (Assumption 7).
  7. Bump `CACHE_NAME`.
- **Inputs needed from me:** none — the design is settled by scope §3.
- **Done when:**
  - `node --check app.js` clean · `check_ids.py` at baseline of two.
  - `grep -n "welcome-banner" index.html` → **no hits.** `grep -n "welcome-banner" style.css` → the three rules still there.
  - `grep -n "tab-label" index.html` → six labels reading `Dashboard / ProspectHub / MediaHub / CampaignHub / TaskHub / DataHub`.
  - `grep -n "data-view=\|id=\"view-\|module-data-management" index.html app.js style.css` → **`data-management` still present at all its existing sites.** S4's check: nothing renamed.
  - `grep -n "min-height: 80px" index.html` → no hits.
  - Screenshot **all six hubs in BOTH themes** — twelve screenshots. This is the session that touches every hub in one edit, and `--color-primary` has a separate `.light-theme` value for all six.
  - Screenshot the sidebar **collapsed** (76px, unpinned and unhovered) and expanded.
  - Reload twice; state survives.
- **Needs my eyes:** the tint strength in both themes; whether the band's name and the sidebar logo actually read as aligned; the one-word names in place.
- **Risk and fallback:** this is the session that changes six hubs in one edit, which is the phase's stated central risk — hence twelve screenshots rather than a computed-style check. `updateThemeColors()` wipes `document.body.className` and re-adds `module-<view>` on every switch; anything the band depends on must survive that. `git checkout` reverts all four files.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data. Not a data session.

### Session 2A.5 — Logo size and strip alignment

- **Compartment:** UI · **Depends on:** 2A.4 · **Goal:** the one number in this phase that has to be chosen by eye is chosen, and the 4px offset is provably gone.
- **Size: S** · **My time: ~6 min** · **Confidence: High**
- **Files modified:** `style.css`, `sw.js`
- **Its own session on purpose.** Scope §8.1 leaves logo size to Michael, and PROMPT 3 forbids a session that needs input mid-run. Folding it into 2A.4 would have made 2A.4 mis-scoped; making it a session of its own moves the input to the top, where it is gathered from the finished screen instead of from a description.
- **Tasks:**
  1. With 2A.4 on screen, pick `--brand-logo-size` and the matching `--app-strip-height`.
  2. Apply both; nothing else changes.
  3. Bump `CACHE_NAME`.
- **Inputs needed from me:** **the logo size** — chosen at the start of the session, looking at the app. Binding constraint: the sidebar collapses to **76px** when unpinned and unhovered, so ~56px is safe and past roughly 64px it gets tight.
- **Done when:**
  - `getBoundingClientRect().height` on `#sidebar-brand` and on `#canvas-header` → **equal**, pasted as real output. This is the one place in the phase where a computed check is the right instrument, because the contract is literally "these two numbers match."
  - Screenshot the sidebar/header junction, expanded and collapsed, both themes.
  - Screenshot **all six hubs**.
- **Needs my eyes:** the whole session.
- **Risk and fallback:** none material. Two token values; revert is one edit.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data. Not a data session.

### Session 2A.6 — Phase close

- **Compartment:** QA + documents · **Depends on:** all of the above · **Goal:** the phase is verified, calibrated, curated, and 2B has a starting point.
- **Size: M** · **My time: ~20 min** · **Confidence: High**

> **Sized M, never below.** Phase 1's close (Session 1.8) was sized S, ran L, and consumed 45 of that phase's 88 attention minutes. That calibration is absorbed, not re-derived.

- **This session IS Step 3 of `ai/phases/phase-2a-RUNSHEET.md`.** Run that prompt; it is authoritative for the close and this entry does not restate it.
- **Files modified:** `ai/BUILD_NOTES.md`, `ai/DECLARATIONS.md` (proposals only), `ai/DECISIONS.md`, `ai/AIContext.md`
- **Additional tasks specific to this phase:**
  1. **Refresh the line counts in `DECLARATIONS.md` Stack.** This phase changes `index.html` and `style.css` materially; the declared 3,219 / 3,148 will be wrong. `app.js` is 13,234 at plan time.
  2. **Record the three stale constants in `BUILD_NOTES.md`** — that they existed, what they were, and that they were removed — so the standing "never `calc(100vh - <header>)`" note gains its worked example (scope §9.3).
  3. **Propose the two owed `DECLARATIONS.md` amendments** named in scope §9: the one-word hub display names with the **DataHub-is-displayed-but-identified-as-`data-management`** warning extended from the existing note rather than replacing it; and the in-app-navigation principle Michael set on 2026-08-30 — all navigation happens inside the app, the address bar and back/forward are not navigation surfaces, which permanently forecloses hash routing and keeps prospect ids (many of them email addresses) out of URLs and browser history. **Propose; do not apply.**
  4. **Delete the superseded Phase 2 sheets** if Michael agrees: `ai/phases/phase-2-RUNSHEET.md` and `ai/phases/Vantage-Phase-2-Run-Sheet.docx` both carry a DO-NOT-USE banner and say they are safe to delete. `ai/phases/phase-2a-RUNSHEET.md` is also disposable at close.
  5. **Estimate calibration** against this plan: predicted 6 sessions / ~60 min versus actual, and whether the +35% UI contingency was needed.
- **Inputs needed from me:** none until the declarations proposals, which are presented for approval.
- **Done when:** the run sheet's Step 3 checklist is satisfied with real pasted output, including a screenshot of every hub.
- **Backup coverage — DIRECTIVES §4:** no new or modified store of user-writable data anywhere in this phase. Stated once here for the phase and once in each session's own summary.

---

## Session order — parallelizable marked

```
2A.1  CampaignHub + the idiom          ← everything blocks on this
  ├── 2A.2  ProspectHub + MediaHub     ┐ genuinely parallel with each other;
  └── 2A.3  Dashboard + DataHub        ┘ sequential in practice, one conversation at a time
        └── 2A.4  Header band + names  ← needs ALL THREE scroll sessions done
              └── 2A.5  Logo size
                    └── 2A.6  Phase close   ← always runs last, keeps its number
```

**2A.2 and 2A.3 are independent of each other** — different hubs, different rules, both building against the frozen S5. If they are ever run out of order it costs nothing. Everything else is a hard chain, and **2A.4's dependency on all three scroll sessions is the causal one this phase is sequenced around.**

Contingency sessions produced by reviewing 2A.4 take numbers **2A.7 and up**. **2A.6 keeps its number and always runs last.**

## Phase estimate

| | |
| --- | --- |
| **Planned sessions** | **6** — 1×L, 4×M, 1×S |
| **Forecast with contingency** | **8** (+35%, per the Phase 1 calibration, on a phase that ships new UI) |
| **My attention time, planned** | **~60 min** (10 + 8 + 6 + 10 + 6 + 20) |
| **My attention time, forecast** | **~75 min** with two contingency sessions |
| **`CACHE_NAME` budget** | **two bumps per session**, v84 → roughly **v96**. No Phase 1 session finished on one. |

**Most likely to overrun: 2A.4.** Not because it is hard — the design is pre-decided — but because it is the session that ships visible new UI across all six hubs, and Phase 1's entire count overrun came from one review pass over one session that did exactly that. The contingency is budgeted against 2A.4 specifically, not spread evenly.

**Second most likely: 2A.1**, on size rather than count. Five flex chains, and `min-height: 0` fails at whichever level you did not check.

## Backup points

| When | What |
| --- | --- |
| **Before 2A.1** | Manual ZIP export, stored outside the project folder. Not because this phase touches data — it does not — but because it is the phase's first session and the standing rule says so. |
| **At phase close (2A.6)** | Full ZIP, stored outside the project folder. |

Backups live in `C:\01_AppDevelopment\02_Vantage-Master-Folder\backups-production\`; automatic snapshots in its `snapshots\` subfolder. **No mid-phase backup trigger fires** — no session here touches the record shape.

## Open risks

1. **A shared rule changes six hubs in one edit.** This is the phase's defining risk and the reason every session's Done-when screenshots every hub. `.prospects-layout-container` (ProspectHub + CampaignHub), `.dashboard-split-grid` (Dashboard + DataHub), `.table-scroll-container` (four hubs) and `#canvas-header` (all six) are all shared.
2. **Layout work passes state-based checks while looking wrong.** `BUILD_NOTES.md` records this three separate times, most sharply as *"a passing state check is not evidence the user can see the right thing."* Screenshots are the instrument in this phase; `getComputedStyle` is not.
3. **Source order at equal specificity.** Session 1.10 lost two rules to it in one sitting. S5's end-of-file placement removes the failure mode for the idiom, but any session adding a rule elsewhere in `style.css` still owes itself a grep further down the file first.
4. **The cache-first service worker serves the OLD document on the first reload after a bump.** Every session hands over a one-glance version tell.
5. **Two Vantage windows silently overwrite each other.** Live Phase 1 defect, unfixed. One window at a time, including the installed PWA.
6. **`wipeAllData()` raises `prompt()` and `alert()`**, which freeze browser automation. Nothing in this phase should go near it — but a session driving Chrome should stub `window.prompt` / `window.alert` / `window.confirm` before touching DataHub at all.
7. **2A.3's "needs my eyes" may return a real no.** If Dashboard and DataHub read better scrolling, that is a plan revision, not a session decision.

## Phase backlog — found here, done elsewhere

*Anything a session turns up outside the UI compartment lands here and is not done in this phase.*

- `--color-danger` undefined, six live call sites → **2B.3**
- `state.taskSettings` missing from `wipeAllData()` → **2B.7**
- `parseCSVRow()` does not handle escaped `""` (not on the restore path)
- Two Vantage windows overwrite each other — real fix is the shadow-copy diff in `saveState()`
- `#modal-media-settings` id is a fossil; the modal is titled "Application Settings"
- `schema_update.sql` still in the tree, still safe to delete
- The AQ inspector drawer duplicates the prospect inspector — 2B removes the duplication properly; do not "fix" it here
