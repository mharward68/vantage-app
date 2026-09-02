# AI Context

**Updated:** 2026-09-01 07:46 (America/New_York)
**Last run:** Phase 2B / **Session 2B.5 — Audiences, Campaigns and Company tabs.** The three membership-and-relationship tab bodies are real, the "Add to audience…" control is relocated into the Audiences tab, and the Company tab's roster replaces a hand-run Advanced Query.
**State:** `node --check app.js` clean · `check_ids.py` at its standing baseline of two (`{'export-backup-btn', 'restore-backup-input'}`) · `CACHE_NAME` **v100 → v101, ONE bump** — CONFIRMED LIVE on Michael's Chrome, `caches.keys()` `['vantageprm-cache-v101']`, `controlled: true` · `app.js` 14,074 → **14,376** / `index.html` **3,428 (unchanged)** / `style.css` 4,128 → **4,271** · **console CLEAN on Michael's Chrome** — 7 lines, zero red · **git state UNKNOWN — this session had no shell** (see Open items) · deployed n/a
**Estimate vs actual:** sized **M / ~8 min / High**; ran **M**, **one bump**, confidence held. **Michael's time was ~2 minutes, well UNDER the 8 estimated** — the exact inverse of 2B.4, and for the same single reason: the Chrome extension was up, so every check ran automated and nothing became a paste-and-screenshot round trip. **2B.4's lesson is now measured in both directions: the automation browser being up or down is worth roughly 10× in Michael's time, and it dominates every other sizing factor in this phase.**
**One-glance version tell:** open a prospect and click **Audiences** — a bordered **"ADD THIS PROSPECT TO AN AUDIENCE"** block above the chips = v101. v100 showed the italic line *"Audience memberships arrive in Session 2B.5."* Second tell: the **Company** tab shows a Figma/Stripe card and a Name·Title·Email·Status roster instead of a stub sentence.

## What was done

All six tabs now render real content. **The old prospect inspector is untouched and is still the only prospect surface a user can reach** — nothing calls `openProspectDetail()` until 2B.6 — so the app is exactly as usable as it was before this session.

- **Three shared membership builders extracted**, next to `renderInspectorMemberships()`: `prospectAudienceLists()` / `prospectCampaignsFromLists()` (the derivation, together, because campaign membership derives FROM audience membership), `buildCampaignChipRow()` / `buildAudienceChipRow()` (the chips **and the three-assignment CampaignHub navigation**), and `buildAddToAudienceControl(prospect, afterAdd)` (the mutation). `renderInspectorMemberships()` shrank from ~85 lines to ~20 and now calls all five. **One implementation of the nav rule and one of the add path, two consumers.**
- **`renderDetailAudiences()`** — count head, then the **`.pd-add-block`** (bordered, own ground, its own label) and the chip row below it. `afterAdd` repaints the tab **body** only.
- **`renderDetailCampaigns()`** — count head, one italic `.pd-derived-note` explaining that membership is derived, then chips. **No add control, deliberately**: a prospect joins a campaign by joining an audience.
- **`renderDetailCompany()`** — a read-only `.pd-company-card` (name, industry, a 7-row definition grid, description) plus the roster of every other prospect on the same `companyId`, sorted by last name, each row calling `openProspectDetail(other.id, detailOrigin)` — **origin passed THROUGH, not rebuilt**. Three distinct empty states: no `companyId`, a dangling `companyId`, and a real company with no colleagues.
- **`buildDetailTabPending()` is GONE**, as 2B.4 instructed. No "arrives in Session 2B.5" string remains anywhere.
- **`index.html` was NOT modified.** Everything is built in JS into containers that already exist. Third session running where the plan listed it and it was not needed.

## Verified — real output, not a claim

Ran on **Michael's Chrome via the extension**, against his live `localhost:5000` database. Full detail is in the chat; the load-bearing results:

| Check | Result |
| --- | --- |
| Audiences count | chips **1** vs derived **1**, equal. Label `"1 audience"` |
| Add through the tab | Drove the real `+ Add`. `prospectIds` **`[]` → `["pros-sarah"]`**; chips 1 → 2; label → `"2 audiences"`; tag appended; **picker element gone entirely**, block reads "Already in all active audiences." |
| Campaigns count | chips **1** vs derived **1**, equal. `noAddControlHere true` |
| Company roster | `"3 other contacts here"`; rows **3** vs derived **3**, equal; sorted `Castillo · Lindqvist · Okafor`; **`inputsInCompanyCard: 0`** |
| Colleague click | `detailProspectId` `pros-sarah` → `pros-syn-3`; **`detailOrigin` byte-identical before and after**; `detailTab` reset to `interactions` |
| Back from the colleague | Landed **`tasks`** — the FIRST prospect's origin — with `#modal-task` open and `editingTaskId "task-1788018621038"` |
| Empty states | `companyId ""` → "not linked to a company", no error. Dangling id → "points at a company record that no longer exists." Real company, no colleagues → `"0 other contacts here"` |
| Chip navigation, **poisoned first** | From `campaignViewSubState="domains"`, `selectedAudienceListId=null`: audience chip → `"audiences"` + `"aud-1788023350145"` + `#audience-lists-view` visible + `#subtab-audiences` active. Campaign chip → `viewingCampaignDetailId "camp-syn-1"`, `#campaign-detail-title "SYNTHETIC Q4 Push"` |
| **PARITY with the old inspector** | Same campaign chip clicked in the old card and the new tab, both from a poisoned state: the six-key end-state object was **`IDENTICAL: true`**. Old card still renders its add row, all three chips, all three headings |
| Mid-edit, five switches | `#pd-first-name` held `"Sarah-TYPED-MIDEDIT-2B5"` through audiences → campaigns → company → audiences → company. Same input node, same identity node, body children **1** every time. Record's `firstName` still `"Sarah"` |
| Contract S1, at the 3-column width | identity **524px** content-height, body **124px** `overflow-y:auto` scrolling (Company `439 > 124`), **`#canvas-body` scrolls neither way**. `body.scrollTop = 200`: identity top `96 → 96`, strip top `632 → 632` |
| Cleanup | DB restored from a raw pre-session string, `identical: true`, 27,847 bytes. 4 prospects / 0 campaigns / 1 audience(4) / 31 tasks / Sarah's 3 original tags. Zero synthetics, zero probe nodes |

## Files changed

`app.js` (14,074 → **14,376**), `style.css` (4,128 → **4,271**), `sw.js` (**v101**), `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/archive/2026-09-01_0746_AIContext.md` (new).

**`index.html` NOT changed** (3,428). **No `DECLARATIONS.md` or `DECISIONS.md` change** — 2B.10 still owes the seventh-view-panel amendment; "six hubs" stays true and must not be edited to say seven.

## Assumptions logged this session

1. **The three panes use the Interactions `.pd-tab-head` idiom and do NOT re-parent `buildInspectorSubsection()`.** The plan says "re-parent the subsections", but that wrapper carries its own coloured heading, which inside a tab already named "Audiences" reproduces exactly the redundancy already on Michael's review list as open item (e). The re-use was taken one level lower — the chip rows, the empty notes and the add path — so the navigation rule and the mutation still exist once. DIRECTIVES §5: the gates were silent, and rung 2 (UX quality) separated them.
2. **The Company tab is READ-ONLY on the company's fields.** Scope §3 puts a company detail view out of this phase and Assumption 7 keeps the company inspector as-is; editable company fields here would be that view, built in the prospect's phase. Verified by assertion, not by intent: `inputsInCompanyCard: 0`.
3. **`renderDetailCompany()` distinguishes "no `companyId`" from "a `companyId` that resolves to nothing".** The plan asked only for the first. The second is a dangling reference and saying "not linked to a company" about it would be false. Two sentences, no branching cost.
4. **The roster sorts by last name, then first.** The plan does not specify an order. Alphabetical by surname is what a roster of colleagues is read as; insertion order is not an order.
5. **Michael's live database was mutated and restored from a raw string snapshot**, rather than tested against synthetic-only state. Forced: **`switchView()` calls `saveState()`**, so an in-memory injection persists on the next navigation and "never touch state" is not achievable for a test that must exercise the real derivation. The guard was the pre-session `localStorage` string, restored byte-identical and verified after a reload.

## Open items

- **⚠️ NEEDS YOUR EYES**
  **(a) The Company tab's shape** — the plan asks for this one specifically, because it is the tab that replaces a workflow. Screenshot is in the chat, against Figma with three colleagues. The question is whether the read-only company card earns the vertical space it takes at the top of the roster, or whether the roster should lead and the card collapse.
  **(b) The `.pd-add-block` label reads "ADD THIS PROSPECT TO AN AUDIENCE".** That is a full sentence where the old inspector had none — the separation the BUILD_NOTES warning requires is carried by the border and ground, and the label may be belt-and-braces. One line to drop.
  **(c) Carried, unanswered from 2B.4:** the tab strip's weight against the identity block; whether Interactions is the right default landing tab; the redundant "Tasks" heading inside the Tasks tab; the non-sticky interactions table header.
- **⚠️ THE IDENTITY BLOCK BREAKS CONTRACT S1 BELOW 1150px CANVAS WIDTH — PRE-EXISTING, NOT THIS SESSION, AND IT IS 2B.11's GROUND.** Measured at a 952px window: `.pd-grid` drops to its 2-column breakpoint, the identity block runs **731px against a 706px panel**, the tab body gets **0px**, and **`#canvas-body` scrolls the whole shell**. **It reads identically on all five tabs including 2B.4's two**, which is the proof it is the identity block and not this session's panes — and forcing 3 columns with an `!important` override restored every S1 number (identity 524 / body 124 / canvas-body not scrolling). Michael's 1269px window is above the breakpoint so he will not see it today. **This is the same `flex: 0 0 auto` fork 2B.11 already exists to settle**, now with a measured failure width attached to it: whatever 2B.11 decides must hold below 1150 as well as above.
- **⚠️ `resize_window` IS UNUSABLE ON THIS MACHINE.** Failed twice with *"Bounds must be at least 50% within visible screen space"* on a fresh window, with `outerWidth`/`outerHeight` both reporting **0** and `screenX/screenY` **0,0** — so it is NOT the minimized-window case BUILD_NOTES records (that one reports `-32000`). The window sat at **952×874** on a 1920×1080 screen and nothing moved it. Everything measured here was taken at 952 with a 3-column override where width mattered. **A future session cannot assume it can reach Michael's real window size.**
- **Found this session, not fixed — to the phase backlog:**
  **A ZERO-BYTE SNAPSHOT FILE WAS ON DISK AND THE PRUNER CAUGHT IT.** Boot logged `[Snapshot] Ignoring 1 zero-byte snapshot file(s) — truncated writes, not snapshots` and then `Pruned 1 file(s) — 1 zero-byte, 0 aged out. 13 kept.` The system detected and cleaned it, which is the behaviour DIRECTIVES §0 asks for — but **a truncated write happened**, and nothing records why. Worth one look at the write path before Phase 4, since Tier-1 snapshots are the sole protection today.
  `favicon.ico` 404, carried from 2B.4 and not seen on this session's boots.
- **Carried, unchanged:** `#companies-datalist` is dead markup. `pros-sarah` carries no `conference*` keys. The four always-on conference boxes read as grey ghosts. CampaignHub identifies itself twice. Dashboard/DataHub emptiness is `renderDashboardView()`'s `slice(0, 5)`. MediaHub's tag rail off the right edge. `.checkbox-scroller` inline `max-height: 350px`. `.tags-filter-scroller` `max-height: 400px`. The prospect inspector's squeezed history table (2B.6 removes it). `state.taskSettings` missing from `wipeAllData()` → **2B.7**. **`.gitignore` snapshot-glob gap — one line, `vantage_snapshot*`, still NOT fixed.**
- **2B.11 and 2B.7 queues are unchanged** — the identity redesign (Arrangement A, 2 columns, forced split, from the Identity Block Studio artifact) and the four new field-slots (`prospects.country`/`postal`, `companies.country`, `prospects.directPhone`). Nothing this session touched either.
- **GIT STATE IS UNKNOWN.** This session had **no `device_bash`** — the bridge could stage and commit files but could not execute anything on the machine. Per the standing rule from 2B.4 open item (b), that is reported as UNKNOWN rather than carried forward as a number. Nothing here claims how many sessions are uncommitted.
- **Unchanged from Phase 1:** two Vantage windows overwrite each other; `parseCSVRow()` `""` gap; repo is PUBLIC; DIRECTIVES §0 compliance undecided; stale `..\backups\`; `schema_update.sql` still deletable.

## Backup coverage — DIRECTIVES §4

**No store of user-writable data was created or modified.** Contract P9 holds exactly: no new field, no `ensureStateDefaults()` entry, no CSV column, no `wipeAllData()` line, no migration. The one write path this session exposes — adding a prospect to an audience — is the **shipped** mutation (`al.prospectIds` + `addAudienceTagToProspects()` + `saveState()`), moved into a shared builder and re-targeted, not written. `audienceLists` and `prospects.tags` already export, already restore, and are already covered by the ZIP bundle and by Tier-1 snapshots. **Covered.**

**The phase-level gate still fires**, through the carried-in `state.taskSettings` gap. **2B.7 must not reason "no data work → Gate C inert."**

Michael's live database WAS opened and mutated this session, and was restored byte-identical from a pre-session raw snapshot — see Assumption 5 and the verification table.

## Next step

**Session 2B.6 — the CUTOVER.** Size **L**, ~12 min, and **the highest-consequence session in the phase**: four entry points repointed (`selectProspect` at the directory row, the task editor's prospect link, and the two audience contact rows at 8637 / 8955), `#prospect-inspector` removed from `index.html`, `renderInspector()`'s selection logic narrowed from "a prospect or a company" to company-only, and the layout container's class toggling adjusted. Every destination now exists and has been verified in 2B.1–2B.5.

**⚠️ THIS IS A FLAGGED BACKUP POINT IN SPIRIT EVEN THOUGH THE PLAN'S NEXT ZIP IS BEFORE 2B.7.** 2B.6 removes the surface Michael has used for every prospect edit since the app existed. The plan's own risk note calls its fallback "a clean revert of this session alone" — which needs the tree committed first. **Given that git state is UNKNOWN, ask Michael to commit before 2B.6 starts.**

Do **not** split 2B.6. The plan is explicit: splitting it produces exactly the half-migrated state DIRECTIVES forbids, on the surface real outreach runs on.

**Carry forward:** the `🧱 HUB SHELL` block must stay LAST in `style.css`. `#canvas-body` is never edited. `state` is not `window.state`. One Vantage window at a time. `state.selectedProspectId` and `detailProspectId` are two cursors and **do not converge in this phase**. No routing, ever. `switchView()` calls `saveState()` — an in-memory injection persists on the next navigation. Inject the transition kill-switch after every reload and every theme toggle, and read `document.getAnimations().length === 0` before trusting a measurement. `resize_window` does not work on this machine.
