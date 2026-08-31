# Scope: App Shell — Phase 2A

> ## ✅ READY FOR PROMPT 3 — scoped 2026-08-30
>
> Written during the Phase 2 Step 0 intake (`ai/phases/phase-2-RUNSHEET.md`), from
> Michael's direction in that conversation and from the real `app.js` /
> `index.html` / `style.css`.
>
> **This document exists because Phase 2 split.** The intake was scoped as
> "Prospect Detail View" and grew three further compartments. Splitting keeps
> each phase to something a person can review in one pass, and — more
> importantly — **the detail view now depends on this work.** It must be one
> screen tall with only its tab body scrolling, and it must sit under the new
> header band. Building it first would mean building it twice.
>
> **Numbered 2A, not renumbered.** Sequencing stays Phase 3 and Hosting stays
> Phase 4. This project has already been bitten once by phase numbers drifting
> across standing files, when hosting moved from Phase 2 to Phase 4 and three
> documents kept the stale number — see the banner on
> `ai/spec/phase-4-firebase-preflight.md`. A/B costs nothing and touches nothing.

**Status:** Scoped and approved 2026-08-30. Ready for Prompt 3.
**Phase 2B:** `ai/spec/prospect-detail-view-scope.md` — built on top of this.
**Depends on:** Phase 1 (closed 2026-08-30).

---

## 1. What this builds

Three things, all app-wide, none of them touching data:

1. **No page scrolls.** Every hub becomes exactly one screen tall, with only its own inner results scrolling — the shape TaskHub already has.
2. **A hub banner header.** `#canvas-header` becomes a band carrying the hub's icon and name, shaded in that hub's colour, matching and aligned with the sidebar logo.
3. **One-word hub names**, and Data Management becomes **DataHub**.

**Nothing here writes, reads or migrates user data.** No new store, no new field, no CSV column, no `ensureStateDefaults()` entry, no `wipeAllData()` line. That is the defining property of this phase and it should be stated in the plan, because it determines how a session reasons about DIRECTIVES §4.

---

## 2. The scroll conversion

### 2.1 The pattern, already proven

TaskHub solved this in Session 1.10 (`taskhub-scope.md` §15) and the comment block at `style.css` 543 is the specification:

> `#canvas-body` is the app's scroll owner and is **shared by all six hubs**. It is deliberately untouched. Instead `#view-tasks` fills it exactly and owns its own overflow, so while TaskHub is active `#canvas-body` simply has nothing left to scroll and the other five hubs are unaffected.

**Every hub adopts that shape. `#canvas-body` is never modified** — taking its `overflow` away would change all six hubs in one edit, which is the failure the TaskHub note exists to prevent.

Per hub:

- The `#view-<name>` panel gets `height: 100%; min-height: 0`.
- **`min-height: 0` appears at every level of the flex chain** — panel, card, wrapper. A flex child defaults to `min-height: auto` and refuses to shrink below its content, so one missing declaration anywhere makes the panel grow instead of the list scrolling. `BUILD_NOTES.md` is explicit that the symptom points at the wrong place — it looks like a sticky-header failure or a missing scrollbar, not like a flex bug.
- The inner results region takes `flex: 1 1 auto; min-height: 0; overflow-y: auto`.

### 2.2 The three stale constants — the real reason for the work order

Three hardcoded viewport calculations are live, using three different constants for the same idea:

| Where | Rule | Applies to |
| --- | --- | --- |
| `style.css` 1171 | `.prospects-layout-container { height: calc(100vh - 120px) }` | ProspectHub **and** CampaignHub's audience view |
| `style.css` 1797 | `.campaigns-grid-container { height: calc(100vh - 200px) }` | CampaignHub |
| `index.html` 663 | inline `height: calc(100vh - 280px)` | CampaignHub's audience view — overrides the 120px above it |

120, 200 and 280 cannot all be right, and two of them apply to the same element. **Every one of them breaks the moment the header's height changes** — which is exactly what §3 does.

`BUILD_NOTES.md` already names this trap, learned in Session 1.10: *"express 'screen minus header' as `height: 100%`, never `calc(100vh - <header height>)`: the flex column already solved it, and a hard-coded header height is a second copy that goes stale the first time the header wraps."* These three call sites predate that lesson.

**All three are deleted and replaced with inherited `height: 100%`.** No new constant is introduced anywhere.

*(Two further `calc(100vh - …)` values exist at `style.css` 2314 and 2318. They size a modal against the viewport, which is correct — a modal genuinely is positioned against the viewport, not against the canvas. Leave them.)*

### 2.3 Order of work — CampaignHub first

**The scroll conversion comes before the header band, and CampaignHub comes before the other hubs.** This ordering is causal, not preference:

- Convert first and the three constants are gone, after which the header can be any height and nothing depends on it.
- Build the header first and all three go stale simultaneously, across two hubs, producing what look like three unrelated layout bugs.

CampaignHub is first among hubs because it owns two of the three constants, shares the third, and carries **five distinct sub-layouts under one panel** — Campaigns, Audiences, Email Accounts, Domains, and the Audience Query Engine (`#campaign-dashboard-view`, `#campaign-query-view`, and the sub-tab states in between). If the pattern survives CampaignHub, the remaining four are routine. This is the risky-premise-first rule: prove it in session one, not session five.

Remaining order: **CampaignHub → ProspectHub → MediaHub → Dashboard → DataHub → then §3.**

### 2.4 What already works and must not be disturbed

- **TaskHub is already converted.** It is the reference implementation, not a target. Any session touching shared layout CSS re-verifies it.
- **ProspectHub's two directory tables already have their own scroll containers** — `.table-scroll-container` at `max-height: 35vh` each. They do not need splitting, tabbing or restructuring.
- **The Audience view's inline `grid-template-columns` override at `index.html` 663 is load-bearing** and separate from the `height` on the same element. `.prospects-layout-container` defaults to `1fr 0fr`, which collapses that inspector to zero width — the DOM updates and nothing appears to happen. `BUILD_NOTES.md`: do not remove it or "fix" it to match the Prospect Hub pattern. **Only the `height` half of that inline style is being replaced.**

---

## 3. The hub banner header

### 3.1 What it replaces

`#canvas-header` today holds a plain `#view-title` in the default text colour, plus a `#view-subtitle` used by two hubs. Separately, **two hardcoded `.welcome-banner` cards** exist inside view panels — Dashboard (`index.html` 159) and Data Management (1093). The other four hubs have none, so it was never a pattern.

The DataHub one is already wrong:

```html
style="background: linear-gradient(135deg, rgba(79,70,229,0.1), rgba(6,182,212,0.1))"
```

That is indigo→cyan — **Dashboard's** colours — inline, on a hub whose colour is red. Copy-pasted and never noticed.

**Both `.welcome-banner` cards are absorbed into the header band and removed from their panels.** The app ends up with one place a hub identifies itself instead of an inconsistent two-out-of-six.

### 3.2 What it becomes

A band carrying the hub's **icon** (the same emoji the sidebar nav uses) and its **one-word name**, in the same font and size as the sidebar's `#brand-name`, shaded in the hub's colour, and vertically aligned with the sidebar logo.

**The colour is one declaration.** Every hub already defines its own token:

```css
body.module-prospects       { --color-primary: #8b5cf6; }
body.module-tasks           { --color-primary: #06b6d4; }
body.module-data-management { --color-primary: #ef4444; }
```

`#view-title` currently sets no `color` at all and inherits grey. Adding `color: var(--color-primary)` gives **every hub its own colour automatically, in both themes, with no per-hub code** — and any future hub inherits it free. The band's shading derives from the same token.

### 3.3 Alignment and the logo

There is a real 4px offset today:

```
#sidebar-brand   padding: 24px  +  40px logo  =  88px tall
#canvas-header   min-height: 80px
```

Both centre their contents, so "Vantage PRM" sits 4px below the hub title. **Making the logo bigger widens the gap**, so the two are fixed together.

**Define the strip height once, as a token, read by both `#sidebar-brand` and `#canvas-header`.** Neither computes the other's height. This is the same principle as §2.2 — never keep a second copy of a number the layout already knows — and it means a later change to the logo size moves both automatically.

**Logo size is Michael's to pick** (§8.1). The binding constraint: the sidebar collapses to **76px wide** when unpinned (`#sidebar:not(.sidebar-pinned):not(:hover)`), so the logo must still sit comfortably in that width. Around 56px is safe; past roughly 64px it gets tight.

---

## 4. Naming

| Now | Becomes |
| --- | --- |
| Prospect Hub | **ProspectHub** |
| Media Hub | **MediaHub** |
| Campaign Hub | **CampaignHub** |
| TaskHub | *(unchanged)* |
| Data Management | **DataHub** |
| Dashboard | *(unchanged)* |

Two places each: the `.tab-label` spans in `index.html` (lines 55–90) and the `titles` map in `switchView()` (`app.js` 3016).

**Labels change. View ids do not.** The view is identified in code as `data-management`, and that string appears eight times across three files — the panel id, the nav button, `data-view`, two branch statements and the `body.module-data-management` colour class (twice). Renaming it buys nothing visible and touches a lot. `DECLARATIONS.md` already carries a warning about this exact label-versus-id gap; it gets one line updated rather than a new trap created. See §9.

---

## 5. Boundaries

- **No data work of any kind.** No store, field, migration, CSV column or backup change. If a session finds itself editing `ensureStateDefaults()`, `wipeAllData()` or any export/restore function, it is out of compartment — that goes to the backlog.
- **`#canvas-body` is not modified.** Ever. See §2.1.
- **No new feature.** This phase changes how the app is shaped and labelled, not what it does. Sorting, filtering, and every hub's behaviour are untouched.
- **TaskHub is a reference, not a target.** It is already in the target shape.
- **The two carried-in Phase 1 fixes belong to Phase 2B**, not here — `state.taskSettings` in `wipeAllData()` is data work, and `--color-danger` is a token definition better made alongside the ProspectHub work that exercises it.

---

## 6. Frozen contracts

*Prompt 3 should carry these into the plan as frozen contracts rather than re-deriving them.*

**S1 — The scroll shape.** `#canvas-body` keeps `overflow-y: auto` and is never edited. Each `#view-<name>` takes `height: 100%; min-height: 0`; `min-height: 0` appears at every level of its flex chain; the innermost results region owns `overflow-y: auto`. No hub expresses height as `calc(100vh - <constant>)`.

**S2 — One height token.** The header strip's height is defined once and read by both `#sidebar-brand` and `#canvas-header`. Neither hardcodes the other's value, and no view panel references it at all.

**S3 — Hub colour comes from the token.** The header band's text and shading derive from `--color-primary`, which `updateThemeColors()` already sets per hub via `body.module-<view>`. No per-hub colour is written into the header's own rules, and no hub colour is hardcoded inline anywhere this phase touches.

**S4 — Labels are not ids.** Display names change; `data-view` values, panel ids, and `body.module-*` class names do not.

---

## 7. Verification

Layout work of this kind passes state-based checks while looking wrong — `BUILD_NOTES.md` records that lesson three separate times, most sharply as *"a passing state check is not evidence the user can see the right thing."* Two rules for this phase's Done-when:

- **Every hub is checked by screenshot, not by computed style.** A sticky header that "doesn't stick" and a panel that grows instead of scrolling both report clean under `getComputedStyle`.
- **Every hub is checked, every session** — not only the one being converted. The whole risk of this phase is that a shared rule changes six things at once.

And per `BUILD_NOTES.md`: budget **two `CACHE_NAME` bumps per session.** Across Phase 1's eleven sessions, v65 → v83 is nineteen bumps, and not one session finished on a single bump. A cache-first service worker also serves the *old* document on the first reload after a bump — the second reload gets the new build. Hand over a one-glance version tell with each summary.

---

## 8. Assumptions logged — reversible, decided at intake

1. **Logo size is left for Michael to pick by eye** during the session that does §3, within the 76px collapsed-sidebar constraint. Choosing it from a description rather than from the screen is how you get a number nobody likes.
2. The header band shades with a low-alpha tint of `--color-primary`, in the manner of the existing `.welcome-banner`, rather than a saturated fill — a full-strength band under a coloured title would fight it.
3. `#view-subtitle` stays. Two hubs use it, and Phase 2B needs it for the prospect's name.
4. The sidebar's nav icons are reused verbatim as the band's icons. They already identify each hub and are already the thing Michael's eye associates with it.
5. Dashboard keeps its `.welcome-banner`'s *sentence* somewhere — it says "Welcome back to Vantage PRM," which is content, not chrome. It moves to the subtitle line rather than being deleted.
6. No hub gains or loses a sub-view, sub-tab or control in this phase.

---

## 9. To record

1. **`DECLARATIONS.md` — hub names.** The Conventions list of six hub colours gains the one-word display names, with the standing warning restated: **DataHub is displayed; the view is identified as `data-management`.** The existing note about a declared name of `data` not matching the real id is the model — extend it rather than replacing it.
2. **`DECLARATIONS.md` — navigation.** Add the principle Michael set on 2026-08-30: **all navigation in Vantage happens inside the app.** The browser's address bar, back and forward buttons are not navigation surfaces. This pre-answers a question every future phase raises and permanently forecloses hash routing — which is what keeps prospect ids, many of which are email addresses, out of URLs and browser history. Gate A.
3. **`BUILD_NOTES.md` — the three stale constants.** Record that they existed and were removed, so the "never `calc(100vh - <header>)`" note gains its worked example.

---

## 10. Gates — walked 2026-08-30

*DIRECTIVES §1, gate by gate. Binary; where one passes it is said in one line so it is visible as checked rather than assumed.*

- **A. Data protection** — **passes.** No data touched, no telemetry, no export change. §9.2's navigation principle actively strengthens it.
- **B. No foreclosed scale** — **passes.** No data model, no identity, no record shape.
- **C. Recoverability** — **passes, and is genuinely vacuous here.** This phase creates and modifies no store of user-writable data, which is the §4 Backup-coverage trigger. Each session states that explicitly rather than omitting it.
- **D. Observability** — **inert** until hosting.
- **E. Client/server boundary** — **passes.** Presentation only; the in-memory state shape is untouched.
- **F. Accessibility** — **inert** (§0 target `none`). The §0 authoring habits apply to any new markup: labelled inputs, keyboard-operable controls, visible focus.
- **§3 conflict check** — no new collision. The one live tension is UX quality versus stability: this phase touches all six hubs, and DIRECTIVES §3 resolves that in favour of **stability**, which is what §7's every-hub-every-session rule enforces. **No gap in the directives.**
