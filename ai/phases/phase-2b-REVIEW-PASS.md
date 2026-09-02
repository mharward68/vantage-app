# Phase 2B — Review Pass

**Written:** 2026-09-01 · at the top of Session 2B.10, which stopped because this pass is its precondition
**Runs:** before 2B.11+ are numbered. 2B.10 closes the phase after those.
**Owner:** Michael. This is not an agent task — the whole point is that a person looks at it.

---

## Why this document exists

`DECISIONS.md` 2026-08-30 names the cause of Phase 1's 8→11 overrun as a structural
omission: *"the plan had no line item for what looking at it will produce."* This
phase's plan fixed that by naming 2B.6 as the review point and forecasting +35%.
The forecast has not been spent because the pass has not happened. Two findings
arrived anyway, unprompted, on 2026-09-01 — which is evidence the surface has more
to say, not that it has been reviewed.

**A review pass is a day of real outreach, not a stare.** Findings that matter come
from the fourth prospect in a row, not the first one you open deliberately.

---

## Before you start

- **ONE Vantage window.** Close the PWA if it is installed. Two windows share one
  `localStorage`, keep separate in-memory state, and the last save wins silently.
  2B.9 lost real time to this.
- **Hard-reload twice.** The first reload after a cache bump still serves the old
  document. Current build is `vantageprm-cache-v107`. Confirm in the console:
  `caches.keys()`.
- **Have the snapshot chip green** before you start editing. If it is amber or red,
  re-grant the folder — you are about to make real edits.
- **Keep a scratch pad open.** Write findings down as you hit them, in your own
  words. Do not stop to fix or to reason about cost; that is what Part E is for.

---

## Part A — The walk

Do a genuine outreach session. Ten to fifteen prospects, real ones, real edits.
The prompts below are attached to the steps you would take anyway. **Do not go
looking for the prompts — do the work, and let them catch you.**

### A1. Open ProspectHub cold

You have not looked at it since 2B.9 shipped the tag picker.

- Is the **first thing your eye lands on** the thing you came for?
- The two directory tables now have resizable, reorderable headers. **Do the twelve
  default column widths fit your actual data**, or is every session going to start
  with you dragging? (Carried from 2B.8, still unjudged.)
- Grab a column edge. **Is the 6px resize zone findable without hunting?** Does the
  cursor change where you expect it to?
- Reorder a column, reload, confirm it stuck. Then ask whether you actually want it
  to stick — or whether a reset would be reassuring to have.

### A2. Filter down to today's list

- Row 3 of the filter column is the new tag picker. **Type a partial tag.** Does the
  narrowing feel right, or does it want a minimum character count?
- The option rows say **"+ Add"**. The Advanced Query modal says "+ Include".
  **Is "+ Add" the right verb here?** (Carried from 2B.9.)
- The chips are ProspectHub purple. **Judge the purple on screen, both themes.**
  Same purple as the header rail. Is that right, or does it need to differ so the
  filter reads as a control rather than as chrome? (Carried from 2B.8 and 2B.9.)
- **THE REAL ONE: do you ever want to exclude a tag here?** Right now the hub filter
  is include-only, deliberately. Answering *yes* is not a config change — the
  downstream filter in `renderProspectsView()` has no NOT semantics anywhere and
  needs a new branch. That branch is the work; the button is one word. Answer it
  from how you actually build a list, not from symmetry with the modal.

### A3. Open a prospect and work the record

Click a directory row. You are in `#view-prospect-detail`.

- **Where does your eye go first?** The identity block, the tab strip, or the name?
- **Is Interactions the right landing tab** for the way you actually use this
  screen — or do you land, look past it, and click something else every time?
  (Carried from 2B.4.)
- **The tab strip's visual weight against the identity block.** Does the strip read
  as navigation, or does it compete? (Carried from 2B.4.)
- **Edit three or four fields for real.** Commit is on `change`, there is no Save
  button. Does that ever feel unsafe? Did you at any point look for a Save button?
  A yes here is significant — it touches plan Assumption 4, and the fallback
  (commit on `blur`) is a real option.
- **The four conference fields render always, blank or not** — your call on
  2026-08-30. Living with them: do the empty ones read as fields, or as grey ghosts?
- **17 fields in 3–4 columns.** Is anything in the wrong place *for the order you
  fill them in*? The field order mirrors `#modal-prospect`. It does not have to.
- Type a duplicate email into the email field. **Read the warning out loud.** Is the
  wording right? Does it name the existing contact clearly enough to act on?
  (Carried from 2B.7, unanswered twice.)

### A4. Work the tabs

- **Interactions** — the table header is not sticky. Scroll a prospect with a long
  history. **Does that actually bother you, or was it a theoretical complaint?**
  (Carried from 2B.4.)
- **Tasks** — there is a "Tasks" heading inside the Tasks tab. Redundant, or does
  it help the pane read as a section? (Carried from 2B.4.)
- **Audiences** — the add block is labelled **"ADD THIS PROSPECT TO AN AUDIENCE"**.
  Too shouty? Too long? (Carried from 2B.4.)
- **Campaigns** — click a campaign chip and come back. Did it land where you meant?
- **Company** — Finding 1 already says this collapses by default. **While you are
  here: when it is expanded, is the colleague list the right shape?** Sorted how?
  Does it need the count in the header?
- **Sequences** is visible and disabled. Does an inert tab you cannot use annoy you
  every time you see it, or does it usefully advertise what is coming? Phase 3
  flips one boolean.

### A5. Navigate the way you actually navigate

- From TaskHub: open a task, click its prospect link, land on the detail view,
  **press the back arrow.** Did the task editor come back open, on the right task?
- From a CampaignHub audience: click a contact, land, back. Did you return to the
  same audience on the same sub-tab?
- From the Company tab: click a colleague. **Now press back.** You should land where
  the *first* prospect was opened from — not in ProspectHub. Confirm that is what
  you want; it is a deliberate design decision and it is reversible.
- **Finding 2a is already banked** (chip navigation leaves `detailProspectId` set).
  While walking: **count how many times you reach for the mouse's back button.**
  That number is the whole argument for 2b, which is a scope amendment. Bring back
  a number, not an impression.

### A6. Resize the window

- **Narrow it below ~1150px canvas width.** The identity block breaks contract S1
  there — pre-existing, known, already flagged as 2B.11's ground. **Look at it and
  decide how bad.** Does it need a real breakpoint, or is "don't do that" an
  acceptable answer for a single-user tool on a fixed monitor?
- Collapse and expand the sidebar with the detail view open. Anything jump?

---

## Part B — Things the walk will not surface

Five minutes each, deliberately.

- **Both themes.** Switch to dark, walk A3 again quickly. The tokens are set per hub
  on `body.module-*`, so most things are right by construction — but "right by
  construction" is not "looks right."
- **A prospect with nothing.** No company, no tags, no history, no tasks, no
  audiences. Every tab is an empty state. **Read all six.** Empty states are the
  cheapest thing to get wrong and the most expensive to notice late.
- **A prospect with a dangling company reference** — a `companyId` pointing at a
  record that no longer exists. `renderDetailCompany()` has a distinct message for
  this. Confirm it reads as *your data has a problem*, not as *the app is broken*.
- **The longest note you have.** Notes render at fixed height with internal scroll.
  Enough height?
- **Delete a prospect** — a real disposable one, and take a ZIP first. Does the
  confirmation carry enough information to stop you when it should?

---

## Part C — The four questions already on the list

You are answering these anyway. Grouping them so they do not get answered twice
and so a finding lands against the right one.

| # | Question | Cost of "change it" |
| --- | --- | --- |
| C1 | Exclude on the ProspectHub tag filter | **Not small.** One word in the config **plus** a new NOT branch in `renderProspectsView()`'s tag matcher. The branch is the session. |
| C2 | The twelve default column widths, the purple, the 6px resize zone | **XS each.** Constants and CSS. Batch them into one session with whatever else is cosmetic. |
| C3 | The duplicate-email warning wording | **XS.** One string. Has been carried unanswered since 2B.7 — kill it this pass. |
| C4 | Tab strip weight · default landing tab · "Tasks" heading · non-sticky interactions header · `.pd-add-block` label | **XS–S.** All four are CSS or one line. Batch. |

---

## Part D — Out of bounds. Do not spend attention here.

If you find yourself annoyed by something on this list, note it in the **phase
backlog** and move on. Reacting to these is how a review pass becomes a rewrite.

- **The Advanced Query results drawer** (`renderAqInspectorDrawer`, `aq-insp-*`) and
  the **Audience Query Engine** (`#campaign-query-view`). Both DEFERRED at your own
  direction, not reversed. The AQ drawer being a subsection behind the detail view
  is **known and accepted** — the analysis is banked in scope §2.1 so a later phase
  does not re-derive it. Do not ask for it to be caught up.
- **Frozen contracts P1–P9.** A finding that requires changing one is not a session,
  it is a plan revision. It is legitimate — say so explicitly and I will stop rather
  than quietly amend. The ones most likely to be hit:
  - **P9 bans routing of any kind.** Finding 2b (mouse back button) hits this. The
    sentinel `pushState` design answers P9's letter; the *scope ban* is the live
    obstacle and reversing it is your call, not a session's.
  - **P5's field list is the only enumeration of the 17.** An 18th field is a plan
    revision, not a tweak.
  - **P4's tab array is frozen at six.** A seventh tab is a revision.
- **A company detail view.** Out of scope, explicitly. The Company tab is the answer
  this phase gives.
- **Normalising the two prospect id schemes.** DIRECTIVES §4 destructive change that
  orphans tasks by definition. Session 1.8 orphaned 31 in one step with no error.
- **Cleaning up existing duplicate emails.** P6 stops new ones. Cleanup needs a
  reason and a rollback plan, and it is not this phase.
- **`#modal-prospect`.** Untouched by design, still the create path. Not vestigial.
- **The known cosmetic fossils**: `#companies-datalist` dead markup, MediaHub's tag
  rail off the right edge, CampaignHub identifying itself twice, the dashboard's
  `slice(0, 5)`. All already in the backlog. Do not re-report them.

---

## Part E — How a finding becomes a session

For each finding, write three things and nothing more:

1. **What you saw** — the surface and the behaviour, in your words.
2. **What you want instead.**
3. **Whether it blocks outreach** — yes/no. This is the only priority signal needed.

Then it sorts itself:

| Shape | Becomes |
| --- | --- |
| CSS, a constant, a string, a config key | **Batched.** All of them into one session. |
| One function's behaviour, no new state | **Its own session**, sized S–M. |
| New persisted state | **Stop.** P9 says no new store for this view. If it must be remembered it joins `state.columnLayouts` under its own key. Say so explicitly. |
| Requires changing P1–P9 or the scope | **Plan revision.** Not a session. Bring it back and we amend deliberately. |

**Numbering:** findings take **2B.11 and up**, in the order you rank them, and they
run **before 2B.10**. 2B.10 keeps its number and stays last — `BUILD_NOTES.md` and
`AIContext.md` already point at "2B.10" as the close, and silently repointing them
is how a backlog item gets lost. (Phase 1 precedent: 1.9–1.11 appended, 1.8 moved
last and kept its number.)

**Two findings are already banked and do not need re-finding:**

- **Finding 1** — Company tab collapses by default, expandable, disclosure arrow
  left of the company name. Scope is `renderDetailCompany()` and its
  `.pd-company-card` / `.pd-company-grid` styling only. Do not invent a store for
  the expanded state.
- **Finding 2** — carry-me-back. **2a** (chip navigation leaves `detailProspectId`
  set; one branch at nav-tab target `"prospects"`) is small and has no routing.
  **2b** (mouse back button) is a scope amendment.

---

## When you are done

Come back with the list. I will size each one, group the batchable ones, propose
the 2B.11+ numbering for your approval, and then those sessions run. 2B.10 closes
the phase after them, with its ZIP and green snapshot first.

**Expect this pass to produce 3–5 sessions.** The plan forecast +35% for exactly
this and none of it has been spent. If it produces one, that is a signal the pass
was too shallow, not that the surface is finished.
