# AI Context

**Updated:** 2026-08-31 12:32 (America/New_York)
**Last run:** Phase 2A / **Session 2A.1** — CampaignHub scroll conversion, and the idiom it proves  **Compartment:** UI
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v85** · `app.js` 13,234 (untouched) / `index.html` 3,228 / `style.css` 3,219 · console clean on boot · deployed n/a
**Estimate vs actual:** sized **L / ~10 min / High**; ran **L**, ~**4 min** of Michael's time (one question up front — the pre-session ZIP, already taken — plus the review). **One** `CACHE_NAME` bump, not the budgeted two — do not record that as a win until the review pass.
**One-glance version tell:** in CampaignHub the **page itself never scrolls** — the "Outreach Campaign Manager" intro and the sub-tab bar stay pinned while the cards/table scroll under them. If the whole page still scrolls you are on the old cached document — **reload once more.** Console check: `document.querySelectorAll(".hub-subview").length` is **5**.

## What was done

The S5 scroll idiom exists as real CSS with five working consumers, and **all three** of the phase's stale viewport constants are gone — one session earlier than the plan expected, because ProspectHub, Dashboard and DataHub turned out to own none of their own.

- **`🧱 HUB SHELL` block appended at the very END of `style.css`** (S5, frozen here). `.hub-subview` (flex column, `flex: 1 1 auto`, `min-height: 0`) and `.hub-scroll` (`flex: 1 1 auto`, `min-height: 0`, `overflow-y: auto`), plus `#view-campaigns { height: 100%; min-height: 0; gap: 12px }`. The block's header comment states why it must stay last in the file and cross-references the `✅ TASKHUB LAYOUT` block rather than duplicating it.
- **`class="hub-subview"` on all five CampaignHub sub-views.** `.hidden`'s `display: none !important` still wins — verified live: exactly one reports `display: flex`, the other four `none`.
- **One `.hub-scroll` per visible region**, five in total: `#campaign-dashboard-view`'s `.media-hub-layout`; the Audience directory's `.table-scroll-container`; the email-accounts table; the domains table; the Audience Query Engine's left `.campaign-creator-card`.
- **The three constants removed.** `.prospects-layout-container` and `.campaigns-grid-container` → `height: 100%; min-height: 0`, each with a comment saying what was there and why it went. `index.html`'s inline one → **only** the `height:` was deleted; `grid-template-columns: 1.2fr 0.9fr; gap: 16px` is load-bearing and stayed, with a comment saying so.
- `#canvas-body` **was not touched** and still reports `overflow-y: auto`.

## Files changed

`style.css` (3,148 → 3,219), `index.html` (3,219 → 3,228), `sw.js` (v84 → **v85**), `ai/BUILD_NOTES.md`, `ai/AIContext.md`. **`app.js` was not touched.**

## Assumptions — all reversible, all logged

1. **Panel gap is 12px**, not 0 and not 24px (plan Assumption 8). The sub-tab bar already carries its own `padding-bottom: 12px` + `margin-bottom: 12px`, so `.view-panel`'s 24px put 36px of dead space above every sub-view; 0 would have jammed the intro into the sub-tab bar. The reasoning is written into the CSS beside the value.
2. **The AQ Engine's left card became the `.hub-scroll` for its column.** `.campaign-creator-card` is `overflow: hidden`, so before this the Query Parameters form was silently **clipped**, not scrolled. A small behaviour improvement inside the session's compartment, not a new feature. The right column already had `.checkbox-scroller`.
3. **My own comments avoid the literal string `calc(100vh`** so the phase-wide grep stays readable — they say "a hardcoded viewport constant (100vh minus Npx)" instead.
4. **Synthetic rows were injected into the DOM for the scroll screenshots.** The database has 0 campaigns, 0 email accounts and 0 domains, so those three sub-views cannot be made to scroll with real data. `state` was never touched and `saveState()` was never called; a reload confirmed zero survivors and identical counts (4 prospects / 5 companies / 31 tasks / 30 media / 1 audience list).
5. **The Audience directory's second scroll region — the inspector's contacts table — kept its existing inline `flex-grow: 1; overflow-y: auto`** rather than being given the class. It already works; the class would have changed nothing but the diff.

## Open items

- **`.checkbox-scroller`'s inline `max-height: 350px`** in the AQ Engine is now the only fixed height left in CampaignHub. Not viewport-relative, so outside this phase's stated target — but in a hub that is now exactly one screen tall it leaves dead space under the results on a tall window. **Noted, not done.**
- **Carried, unchanged:** `state.taskSettings` missing from `wipeAllData()` → **2B.7**. `--color-danger` undefined, six call sites → **2B.3**. Both untouched.
- Unchanged from Phase 1: two Vantage windows overwrite each other (one window at a time); `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.
- **2B.2's close-out is still owed.** Its AIContext listed a by-hand TaskHub review and a commit as next steps. TaskHub was verified unchanged here by screenshot and computed style, but **the commit was not made** — this session had no shell on the machine.
- **Needs Michael's eyes:** the 12px panel gap; whether the five sub-views *feel* right at one screen tall; the Audience inspector's width (measured 528.75px / 396.58px — the 1.2/0.9 ratio held). Unrelated to this session: the sidebar snapshot chip read **"Not protected"** after the reloads — the File System Access grant lapses on reload and wants re-granting.

## Backup coverage — DIRECTIVES §4

**Not a data session.** No new or modified store of user-writable data; no field, no CSV column, no migration, no `ensureStateDefaults()` or `wipeAllData()` edit. `app.js` was never opened for editing. Nothing here changes existing backup coverage. The pre-session manual ZIP was confirmed taken by Michael before the first edit.

## Next step

1. **Review CampaignHub by hand** — all four sub-tabs plus the Audience Query Engine button. That is the regression this session exists to protect and no computed-style check substitutes for it. Expect a second `CACHE_NAME` bump if the review turns anything up.
2. **Commit** — `style.css`, `index.html`, `sw.js`, `ai/BUILD_NOTES.md`, `ai/AIContext.md` and the archived context file. **2B.2's commit is still outstanding and should go with it.**
3. **Then Session 2A.2** (ProspectHub and MediaHub). **Read the 2A.2 note in `BUILD_NOTES.md` first** — plan Assumption 3 predicted ProspectHub would revert to page scrolling and it did not; task 1 of 2A.2 is smaller than written.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css` — that placement is the contract, not decoration. `#canvas-body` is never edited. `state` is not `window.state`. One Vantage window at a time.
