# Decision Record — Vantage

Why the declarations say what they say. Read when a decision is questioned — and before proposing to reverse one. Created 2026-08-27 from the hosting + sequencing intake session.

---

## 2026-08-27 — Hosting: synced, single-user now; multi-user architecture

**Chose:** host Vantage so it opens without a local server and the data follows Michael across devices. One user today. The data model is built so a multi-user version later doesn't require migrating anyone's data.

**Rejected:** static hosting with data still in localStorage — different devices would hold entirely separate databases, which fails the actual reason for hosting.

**Positioning context:** Vantage is a Prospecting Relationship Manager. The premise is that prospects and customers are distinct relationships requiring distinct messaging, and most CRMs collapse them into one pipeline with a stage field. Enterprise product is the destination.

---

## 2026-08-27 — Persistence: decompose into collections, keep the array shape

**Chose:** `state.prospects` and every other state array stay in-memory arrays, exactly as they are. Every render function, filter and view is untouched. What changes is only where those arrays come from and go to — per-entity collections rather than one localStorage blob. `loadDatabase()` hydrates; `saveState()` becomes granular writes.

**Because:** the persistence surface is narrow — three functions — while the read surface is 10,000 lines. Changing only the narrow half is what makes this a contained migration rather than a rewrite.

**Rejected — storing the whole state blob in one hosted document.** Two failure modes, either fatal: it caps at the 1 MB document limit, and two devices editing concurrently overwrite each other wholesale — not a merge conflict, a total silent overwrite. It also fails the stated goal, since "sync across devices" and "one shared blob" are incompatible. This is the textbook Gate B case: it cannot be fixed later without migrating data.

**The actual work:** `saveState()` currently writes everything. Granular writes need to know what changed — dirty-tracking or write-through per operation. That is the fiddly part; everything else is mechanical.

---

## 2026-08-27 — Stack: Firebase

**Chose:** Firebase — Hosting, Firestore, Auth.

**Because:** the learning cost is already paid on Onyva. Same auth model, same offline behavior, and Onyva's build notes already hold the hard-won gotchas. Firestore's offline persistence preserves the offline-first quality that makes Vantage good, rather than accidentally destroying it.

**Rejected:** Supabase/Postgres — genuinely a better fit for relational data, and Vantage's model is relational-ish. But Vantage loads one user's entire dataset into memory and filters arrays, and metrics/reporting are explicitly out of scope, so the relational weakness barely bites. Familiarity wins.

**Cost:** effectively zero at this scale on any option.

**Revisit if:** cross-entity querying becomes central, or reporting comes back into scope.

---

## 2026-08-27 — Email: deferred, copy/paste only

**Chose:** sequencing renders merge-resolved copy for Michael to paste. Vantage does not send email.

**Because:** it keeps the feature scoped, and deferring costs nothing — see the scope cliff below.

**The Gmail scope cliff,** recorded so it isn't stumbled into:

- The Gmail API has no per-message charge. Quotas, not dollars — roughly 2,000 external recipients/day for a Workspace account. Deliverability is the real ceiling, not quota.
- `gmail.send` is a **sensitive** scope. Reading mail (`gmail.readonly`, `gmail.modify`, `mail.google.com`) is **restricted** — a different tier that requires an annual third-party security assessment (CASA). Google charges nothing and runs none of it; independent assessors set their own prices.
- Internal-only apps — used solely within one Workspace organization — are exempt from verification entirely. While Vantage is just Michael, sending would cost nothing and require no review.
- Therefore: send-only stays cheap; reading replies to auto-advance a sequence buys a permanent annual audit. That feature sounds small and is not.

---

## 2026-08-27 — Phase order: sequencing first, hosting deferred

**Chose:**

| Phase | Scope | Sessions |
| --- | --- | --- |
| Phase 0 | Retrofit scaffolding — documents only, no deploy | 1–2 |
| Phase 1 | Sequencing, built locally against localStorage | 6–8 |
| Phase 2 | Hosting: persistence migration, auth, sync | 6–9 |

**Because:** this reverses an earlier recommendation, and the reversal came from actually estimating the rework rather than assuming it.

The argument for hosting first was that sequencing's CSV backup wiring (Gate 3, step 2 of its own build order) would be written against localStorage and then redone under a hosted model. True — but the migration rewrites backup for every entity anyway, so the marginal waste is about half a session. Against that, hosting first delays the sequencer by roughly eight sessions.

Half a session of rework beats eight sessions of waiting. The estimate is what surfaced it; the original reasoning was directionally sensible and quantitatively wrong.

**The decisive reason, added after the fact:** Michael intends to use the sequencer for real prospecting while the rest of the build proceeds. That's production value during Phase 2 rather than after it, and it outweighs any argument about build cleanliness.

**Two consequences that constrain Phase 1 planning:**

1. Real enrollment data will exist before the hosting migration. It is not throwaway test data. Phase 2's import-and-verify step covers live sequences with prospects mid-flight, which raises its stakes considerably.
2. Every session must leave the app **usable**, not merely building. The normal rule is "ends with the app building and running." Here it's stronger: Michael is doing real work in it between sessions, so a session that leaves a view half-migrated or a modal broken costs him actual outreach.

This also validates the spec's own build order, which puts backup/restore second per Gate 3. With live data from the start, that isn't procedural compliance — it's the thing standing between him and losing in-flight sequences.

Also: development stays local — `Start_Vantage.bat` on localhost:5000 — so no deploy is needed to test a change. This was initially treated as a reason to defer hosting; on examination it isn't one (see below), but the local loop remains the faster way to work during feature development.

**Worth knowing for later:** hosting does not cost the local dev loop. Post-migration, development still runs against localhost:5000; the app simply talks to Firestore instead of localStorage. Deploying is only what makes it reachable from other devices. So "avoid deploying to test" is not a reason to defer hosting indefinitely.

**Trap recorded, still applies at Phase 2:** Vantage's data lives on the localhost:5000 origin. A hosted app is a different origin with a different localStorage — it opens empty. Existing prospects do not follow automatically. The ZIP/CSV backup is the bridge, and Phase 2 must include an explicit "import Michael's real data and verify it" step. Do not use a hosted copy for real work before that, or two divergent databases result.

---

## 2026-08-27 — Enrollments snapshot every step at enrollment

**Chose:** on enrollment, every step from the starting step onward is merge-resolved and copied into the enrollment. The enrollment holds its own `steps` array — `{ stepId, body, status, dueDate, completedDate }` per entry. Michael can edit any forthcoming step's body in advance.

Only the live step ever carries a `dueDate`.

**Because:** bodies and dates have different constraints and the original spec conflated them. Dates genuinely cannot be precomputed — step 4's due date depends on when step 3 is completed, which hasn't happened. Bodies have no such dependency: merge fields resolve from prospect data, fully known at enrollment. So the spec's "only the current step is scheduled" is right about dates and unnecessarily restrictive about copy.

**Supersedes:** the spec's single `currentStepBody` field.

**Consequence** — this dissolves the mid-flight edit problem entirely. Once an enrollment carries its own copy of every step, editing the master sequence cannot reach live enrollments at all. Not patched — gone. It is the spec's own principle ("the master template is never touched") applied in the opposite direction.

**Starting mid-sequence:** enrolling at step 4 snapshots steps 4 onward only. Skipped steps don't exist for that enrollment — consistent with the no-backfill rule.

---

## 2026-08-27 — Track `currentStepId`, not `currentStepIndex`

**Chose:** enrollments identify their live step by stable id rather than array position.

**Because:** an index is a position in `sequence.steps[]`. Insert a step and every live enrollment past that point silently shifts to a different email; delete one and an index can point past the end. No error, wrong message sent, discovered from a confused prospect. An id says which step, not which slot.

Also: it makes start-at-step cleaner — enrolling at step 4 sets `currentStepId` to step 4's id.

**Rejected:** versioning sequences — correct, but a lot of machinery for one user. Locking edits while anyone is enrolled — means you can't fix a typo.

**Supersedes:** the spec's §3 `currentStepIndex`.

---

## 2026-08-27 — Enrollments are frozen

**Chose:** adding a step to a sequence does not append it to enrollments already in flight.

**Because:** predictability. Editing a sequence should never have invisible effects on people already moving through it.

---

## 2026-08-27 — Three smaller rulings

**Archiving a sequence with live enrollments** → prompt showing the count, with a choice: let them finish, or unenroll them. Archiving means "no new enrollments" by default, matching the `audienceLists` precedent where archiving preserves rather than destroys.

**Deleting a prospect with an active enrollment** → cascade the delete, and add a defensive skip in the task queue render. Both, because each is two lines, and the codebase already has this pattern — `renderAudienceInspector()` got a null guard for exactly this class of failure.

**Date storage** → `YYYY-MM-DD` strings, not ISO timestamps. A timestamp inherits the off-by-one-day bug class that already bit the Onyva weather date filter. A date-only string compares cleanly and has no timezone to be wrong about.

---

## 2026-08-27 — Backup: automated local snapshots, plus Firebase later

**Chose:** two tiers. An automated local copy written by the app itself, and Firebase as the durable copy once Phase 2 lands. Manual ZIP export stays as a third, on-demand option.

**Mechanism:** the File System Access API — `showDirectoryPicker()` once, persist the handle, then write snapshots without re-prompting. Chrome and Edge support it; Vantage already runs in Chrome app mode. It does not work in Safari or Firefox, and the permission occasionally needs re-granting.

**Rejected:** relying on manual ZIP export. It only protects data on days Michael remembers, which is not a backup strategy for data he'd be upset to lose.

**Timing** — this is a Phase 1 deliverable, not Phase 2. From the moment sequencing works until Firebase lands, the local snapshot is the only protection, and that is precisely the window holding live enrollment data. Building it in Phase 2 would leave the riskiest period uncovered.

**Authority, once both exist:** Firebase is the source of truth from Phase 2 onward. The local copy is a disaster-recovery snapshot, not a second live database — it is never read back except during an explicit restore. Stating this now prevents it drifting into a two-way sync problem.

**Cadence and retention:** settled 2026-08-28, below.

---

## 2026-08-27 — Directives recalibrated

**Found:** `StatementOfDirective.md` was Onyva's, pasted verbatim — including "thousands of clients / hundreds of thousands of users," a reference to "the per-subdomain-OAuth model," and a requirement that business logic live in an API with native mobile wrappers.

Vantage has one user, no API, no tenants, and no wrappers. Gate 2 as written would require rejecting localStorage — the entire current architecture. An agent following it literally would have to reject the app it was working on.

**Chose:** recalibrate §0 to Vantage's actual parameters, keeping the gate and ladder structure. The scale gate stays, but calibrated to "one user today, multi-user without a data migration later" — which turns out to be a real and binding constraint for a completely different reason than the one written down.

---

## 2026-08-28 — Snapshot cadence and retention

**Chose:** debounced-on-change with bookends, and tiered retention.

- **Cadence:** write ~2 minutes after the last mutation, debounced, plus on tab-hide (`visibilitychange` → hidden) and on close.
- **Retention:** last 10 rolling + newest-of-day for 14 days + newest-of-week for 8 weeks. Roughly 32 files.
- **Scope:** state JSON on every snapshot. IndexedDB binaries mirrored to the same directory once daily, deduped by id, and never touched by the pruner.

**Because:** cadence and retention answer different failure modes, and treating them as one knob is how this normally gets set wrong.

| Failure mode | What actually saves you |
| --- | --- |
| Site data cleared, browser profile corrupted, disk failure — sudden and obvious | Cadence. Any recent snapshot. |
| A bug or bad migration silently corrupts state; noticed days later | Retention depth. Only an *old* snapshot. Pure rolling-N retention actively hurts here — it evicts the last good copy. |
| Wrong prospect deleted, wrong enrollment unenrolled; noticed next week | Mid-range history. |

Sizing makes the second and third nearly free: the state JSON is small — the seed file is 19 KB and a populated database is realistically 0.5–3 MB — so a two-month tail costs well under 150 MB on a PC. Retention depth is the cheapest protection available here and the one most often skipped. Debouncing on mutation rather than on a clock means write cost tracks actual activity, and the write is off the render path.

**Rejected — daily snapshot, keep 30.** Cheapest to build, but the worst case is losing a full day of outreach. From Phase 1 that is live enrollment data including step-completion history, which cannot be reconstructed from memory.

**Rejected — 15-minute interval with bookends.** A middle option, but 15 minutes is an arbitrary number that can still eat a working burst, and writing on a clock rather than on activity is strictly worse for the same cost.

**Rejected — binaries in every snapshot.** Simplest rule, but snapshot size becomes unpredictable and the debounced write stops being cheap. **Rejected — binaries left on the manual ZIP path only:** leaves a real Gate C hole through all of Phase 1.

**Two constraints for the session that builds this:** the File System Access API permission occasionally needs re-granting, and a snapshotter that fails silently is worse than none — a denied or failed write must surface visibly rather than log and continue. Per Gate C, the Done-when includes restoring *from* a snapshot, not merely writing one.

**Revisit if:** the state blob grows past ~10 MB, or a real restore is ever needed and the tail proves too short.

---

## 2026-08-28 — UX tier confirmed Polished

**Chose:** Polished, not Premium. Raise before external launch.

**Because:** Premium's actual commitments — sub-second response while a backend churns, optimistic UI, skeleton loading states, strict design-system adherence — buy nothing here. Vantage filters in-memory arrays; there is no latency to mask, and there is no design system to adhere to. Adopting it now would pay complexity in a 10,000-line single file, which cuts against Ladder 3, and Ladder 3 mostly serves Ladder 1.

**Rejected:** Premium now, and "Polished now, Premium from Phase 2." The clauses of Premium that actually matter — never lying about state, deliberate empty states, graceful failure — are already inside Polished as Ladder rung 2 is worded, so nothing is given up. And unlike accessibility, a UX-tier retrofit is local and cheap: it is a pass over specific views, not a structural property. There is no "cheapest moment" argument for pre-committing the escalation to a particular phase.

**Revisit if:** Vantage is shown to anyone outside, or enterprise positioning stops being hypothetical.

---

## 2026-08-28 — Accessibility target `none`, with authoring habits

**Chose:** §0 target stays `none` and Gate F stays inert. Add three authoring habits for *new* markup — labeled inputs, keyboard-operable controls, visible focus — as habits, not a gate. Move the WCAG 2.2 AA adoption anchor to "before external launch."

**Because:** the original proposal anchored AA to "the Phase 2 rebuild — the cheapest moment this will ever have." That rests on a premise this file contradicts. The persistence decision above states that Phase 2 leaves every render function, filter and view untouched, and that is the load-bearing claim — it is the entire reason Phase 2 is a contained migration rather than a rewrite. **Phase 2 is not a UI rebuild and buys no free retrofit.**

The genuinely cheap moment is Phase 1, which authors three new UI surfaces (Sequences, Tasks, Sequence Detail) from scratch. Labeling an input while writing it costs nothing; retrofitting the same markup later costs a pass over three views. Capturing that as habits rather than as an active gate keeps the cost at zero — no conformance check, no audit, nothing to verify in a Done-when, no session ever blocked.

**Rejected:** adopting AA now — Gate F would activate and every Phase 1 UI session would carry real verification cost for one user who is also the developer. **Rejected:** `none` with no guidance — same savings, larger retrofit later, for no gain.

**Revisit if:** external launch is scheduled, or anyone other than Michael is given an account.

---

## 2026-08-28 — TaskHub: tasks become a first-class entity

**Chose:** a sixth top-level hub, backed by `state.tasks` — a stored entity, one prospect per task, created manually from the Prospect Hub inspector or from TaskHub itself. Full scope in `ai/spec/taskhub-scope.md`.

**Supersedes:** `sequence-feature-scope.md` §3, "the task queue is derived, not stored." That ruling bought one real thing — an enrollment and its task could never disagree, because only one record existed. A stored task row can drift from whatever produced it, and most of the TaskHub scope's coupling rules exist to prevent that.

**Because:** the requirement changed shape. Tasks are wanted for their own sake — ad-hoc follow-ups with no sequence behind them, bulk due-date shifts across a week out of the office, a cross-prospect work queue. None of that is expressible as a projection of enrollments, and bulk-editing the due date of a derived row means writing back into the enrollment, which is the two-sources-of-truth problem arriving anyway with none of the benefits.

**Consequence for phase order:** sequencing is now built *around* TaskHub rather than the reverse. Proposed renumbering — Phase 1 TaskHub, Phase 2 Sequencing, Phase 3 Hosting. This is an improvement in shape, not just a reshuffle: manual tasks plus TaskHub is independently useful before a single sequence exists, so Phase 1 delivers working value much earlier than the previous plan did.

**Revisit if:** nothing foreseeable. This is the more general model; the derived version is a special case of it.

---

## 2026-08-28 — Completing a task writes prospect history

**Chose:** completing a task appends an entry to that prospect's history, individually and in bulk.

**Because:** `getLastReachoutDate()` derives "last reachout" from history entries and feeds the Advanced Query date filters. The moment TaskHub becomes where work actually happens, those filters silently stop reflecting reality unless completions land in history. The failure is invisible — the filters keep returning results, just wrong ones.

**Rejected:** keeping tasks and history separate. Simpler to build, and it quietly breaks a feature already shipped. **Rejected:** a per-task "log as reachout" checkbox — more faithful, since an internal to-do isn't contact, but it puts a decision on every task created and the accuracy gain does not pay for that friction at one user.

**Cost if wrong:** history gains entries for internal to-dos that weren't really outreach, slightly skewing "last reachout" early. Recoverable by filtering on reachout type later. The opposite error — discovering months of completed work never logged — is a migration.

---

## 2026-08-28 — Business-day setting governs arithmetic only

**Chose:** the global All Days / Business Days setting changes how `±N days` counts. It does not validate, snap, or warn on a date typed or picked by hand. Changing it is never retroactive.

**Because:** a deliberate weekend due date is a legitimate thing to want, and a control that silently rewrites what you entered is worse than one that trusts you. Snapping also fights the date picker, which has no idea about the setting.

**Rejected:** snapping manual picks forward to the next weekday, and warning-but-allowing. The first overrides intent silently; the second adds permanent UI to a control used constantly, to prevent something that isn't a mistake.

**Recorded so it isn't "fixed" later:** flipping the setting must not move existing tasks. It is a preference for future arithmetic, not a migration.

---

## 2026-08-28 — Three TaskHub rulings taken independently

**Task `source` / `sourceRef` fields exist from day one, defaulted `"manual"` and `null`.** Deliberately unused. Gate B: without them, adding sequence-produced tasks later migrates every task in the system; with them it is additive. Two lines.

**Orphaned tasks survive a restore.** A task whose `prospectId` doesn't resolve is kept and rendered "(missing prospect)", with a count reported after the restore. Silently discarding user data during a restore is the worst failure mode a backup system has, and Gate C exists to prevent exactly that class of thing.

**TaskHub defaults to all open tasks, overdue first.** Not "upcoming," despite that being the literal request — past-due work hidden behind a filter click is the one thing that can least afford to be hidden.

---

## 2026-08-28 — Phase order revised: TaskHub first, sequencing third

**Chose:**

| Phase | Scope |
| --- | --- |
| Phase 0 | Retrofit scaffolding — done |
| Phase 1 | **TaskHub** — task entity, hub, backup/restore, bulk editing |
| Phase 2 | **Prospect Detail View** — full-screen record view with tabs |
| Phase 3 | **Sequencing** — built as a producer of tasks |
| Phase 4 | **Hosting** — persistence migration, auth, sync |

**Supersedes:** the 2026-08-27 order (sequencing → hosting).

**Because:** tasks turned out to be the foundation and sequencing the thing built on top, not the reverse. Each phase now delivers something usable on its own — manual tasks are valuable before any sequence exists, and the detail view improves daily work whether or not sequencing has landed.

The detail view sits at Phase 2 rather than being folded into Phase 1 deliberately. It rewrites shipped Prospect Hub UI, and Phase 1 is already introducing a new entity and its backup wiring. Keeping those apart means TaskHub isn't blocked on an inspector rework, and the rework isn't rushed inside a data-layer phase. TaskHub ships against the existing inspector with Tasks as an interim subsection, which becomes a tab in Phase 2.

**Cost accepted:** the interim Tasks subsection is built once and then migrated into a tab. That is roughly half a session of rework, bought in exchange for not putting a rewrite of the surface used for daily outreach inside the phase that introduces the data model.

---

## 2026-08-28 — One editing surface for prospects

**Chose:** the Phase 2 full-screen detail view **replaces** the Prospect Hub overlay inspector and becomes the single place prospect information is entered or edited. The Advanced Query results drawer becomes a **read-only quick preview** — click a contact, see who they are, no editing.

**Because:** prospect detail already renders in two places, and adding a third guarantees drift — three implementations of the same record that diverge feature by feature until they disagree about what a prospect is. Advanced Query's purpose is *selecting* prospects, primarily to place them in an audience; editing there was convenience that now costs consistency.

**Note this is a narrowing of shipped behavior.** The AQ drawer currently carries quick-edit, notes editing, tag editing and delete. Those go away. Stated here so it is planned rather than discovered as a regression.

---

## 2026-08-28 — No files or media attached to prospects

**Chose:** the `VantagePRMFiles` IndexedDB store is not extended to prospect records. No Files tab in the detail view.

**Because:** decided outright rather than deferred, so a future session doesn't propose it as an obvious gap. Media lives in the Media Hub against media records; prospects carry notes and history, not attachments.

---

## 2026-08-30 — Estimating: session count is the unstable number, not attention time

**Chose:** from Phase 2 onward, size phases with a **+35% session-count contingency** where the phase ships new UI, and **never size a phase-close session below M**. Attention-time estimates are kept as they are — they are working.

**Because:** Phase 1 was measured at close, plan against archived actuals. Attention time was predicted at ~105 minutes and came in at ~88 — 16% **under**, with per-session sizes correct in 10 of 11 cases. Session *count* was predicted at 8 and ran 11: 37.5% over. The two errors are not the same error at different scales, and treating them as one would produce the wrong correction.

**What actually went wrong:** all three added sessions (1.9, 1.10, 1.11) came out of a single review pass over a single session (1.5), on the day it shipped. Nothing about their content was unforeseeable — they were UI refinements to a hub that had just been seen working for the first time. **The plan had no line item for "what looking at it will produce."** That is a structural omission in the estimate, not a series of surprises, which is why the fix is a contingency rather than more careful sizing.

**The one mis-sized session is the informative one.** 1.8 was sized **S** and ran **L** — the only miss in the phase, and it was the QA-and-close session. Its tasks genuinely are small; what made it L is that it was the first session to run against the real database, and verification against real data is where the surprises live. It absorbed a live defect, a mid-session frozen-contract amendment and two new documents. It also consumed 45 of the phase's 88 attention minutes — **more than the other ten sessions combined.** A phase close is not a small session and must not be sized as one.

**Rejected — inflating every session's size.** The sizes were right. Padding them would hide the fact that the real variance sits in two specific places (review-driven additions, and the close) behind uniform pessimism, and would make the next phase's estimate less informative rather than more.

**Rejected — treating the 8→11 overrun as a failure.** The three added sessions were the right call and the phase is better for them. What is being corrected is the *estimate*, not the decision to add them.

---

## 2026-08-30 — Local snapshots are the sole protection for three phases, not one

**Chose:** record explicitly that Tier 1 local snapshots carry disaster recovery through **Phases 1, 2 and 3**, and that any change to the snapshot system in that window is a Gate C matter rather than routine maintenance.

**Because:** this is an unrecorded consequence of the 2026-08-28 phase reorder. `DIRECTIVES.md` §0 says Tier 1 is the "sole protection during Phase 1" and Tier 2 (Firebase) arrives "from Phase 2" — written when hosting *was* Phase 2. Hosting moved to Phase 4 the same day. Nobody restated the recovery consequence, so the standing files still imply a one-phase exposure that is now three phases long, across a period in which real outreach data accumulates continuously.

**Because, second:** the exposure is not merely longer, it is qualitatively different. Phase 1's snapshot work was itself under active development and under a session's attention every day. Phases 2 and 3 touch UI and sequencing; nothing in them will exercise the snapshot path, and a silent regression in it would surface only when someone needs a restore. The staleness watchdog and the read-back confirmation are what make that survivable, and they are now load-bearing for months rather than weeks.

**Consequence adopted:** a snapshot restore is re-verified at each phase close, not only at Phase 1's. It is one drill against the newest snapshot and it is the only thing that distinguishes a backup from a folder of files.

**Note this supersedes nothing in `DIRECTIVES.md`** — the §0 phase numbers there are stale and their correction is proposed separately; this entry is the reasoning that correction will point at.

---

## 2026-08-30 — Commercial path: build for one user, rewrite to sell. Phase 4 is host-for-myself.

**Chose:** Vantage continues as a single-user tool built to be *used*, not as the foundation of a product. If it is ever sold, the enterprise version is a **deliberate rebuild from the standing documents**, not a migration of this codebase. Phase 4 is therefore "host it so Michael can use it from anywhere," not "lay the groundwork for multi-tenancy."

**Supersedes, in part:** the 2026-08-27 hosting entry's *"the data model is built so a multi-user version later doesn't require migrating anyone's data."* That clause is **relaxed, not deleted** — see Gate B below.

**Because:** the question "should this be multi-tenant on Firebase" was raised on 2026-08-30 and answered by working out what actually stands between here and a sellable product. The data model is the cheap part — one field or one path segment, written once while there is a single tenant. What is expensive is everything else: auth, billing, onboarding, support, a build step and test surface for a 13,124-line single file with neither, a read path that loads ~1,791 documents per boot and multiplies that per user, and a compliance position that changes category entirely. Paying the multi-tenancy tax now buys down the *cheapest* of those risks and none of the expensive ones.

**Because, second — the rewrite is unusually safe here, and that is not an accident.** The standard argument against rewriting is that years of hard-won knowledge live invisibly in the source and are lost. This project has spent since 2026-08-27 deliberately storing that knowledge *outside* the code. What survives a change of stack:

- `DECISIONS.md` — entirely. It is product reasoning, not implementation.
- `ai/spec/` — entirely. Behaviour, not code.
- `DECLARATIONS.md` — the Conventions survive; the Stack section does not.
- `BUILD_NOTES.md` — roughly half. "Data, migrations and backup" and "Dates" are portable (CSV round-trip behaviour, `hist-${Date.now()}` collisions, reachout semantics, UTC day-stepping). "Working inside `app.js`", "DOM and rendering" and "Service worker and caching" are findings about *this* implementation and expire with it.
- Specific code, because it was written pure on purpose: `shiftTaskDate()` with its C11 vectors, `planSnapshotRetention()`, the CSV contracts.

The codebase is months old, not years. There is no decade of edge cases to lose.

**Rejected — hardening this codebase into a multi-tenant SaaS.** It is a different product with different constraints, and building it before a second user exists is spending months on infrastructure nobody has asked for. Reversible: if the sellable version turns out to be *this product with logins* rather than a genuinely different one, hardening beats rebuilding and this entry should be revisited. **That is the open question, and a year of real use is what answers it.**

**Rejected — deciding the compliance position now.** It remains `NOT DECIDED` in `DIRECTIVES.md` §0 and that is correct for a single-operator tool. It becomes load-bearing at the point of selling, not before: hosting other people's prospect databases likely makes Michael a data *processor* rather than a controller, which is a different set of obligations. It is a question for a lawyer at the start of any commercialisation, and it is a go/no-go input, not a checkbox.

### Consequences adopted

1. **Gate B's multi-user clause is relaxed.** `DIRECTIVES.md` §1B currently reads "multi-user later without migrating anyone's data." The multi-user half is now insurance on a scenario handled by rebuilding; stop paying it. **The rest of Gate B stands unchanged** — nothing may foreclose scale in ways that lose or corrupt data, and the single-blob rejection remains correct on its own merits (state already exceeds Firestore's 1 MiB document limit).

2. **The Phase 4 pre-flight's §1 is downgraded from irreversible to ordinary.** The owner-field and document-ID decisions were ranked "cannot be deferred — Gate B" on the assumption that multi-user arrives by migration. Under this decision the eventual rebuild re-keys everything on import regardless. Pick whatever is simplest to ship. Recorded in that file directly, because a stale "cannot be deferred" heading would have a future session doing irreversible-decision work that no longer needs doing.

3. **The export path becomes the most protected thing in the app.** The ZIP/CSV bundle is the bridge to whatever is built next — it is how 651 prospects, 1,090 companies and 659 history entries survive a change of stack. Session 1.8 proved it carries real volume character-identically. **Every future phase keeps it whole and re-proves it at close.** This replaces multi-tenant readiness as the thing Gate B protects.

4. **Standard raised: no workarounds.** Michael's own framing, 2026-08-30: *"build this out and avoid workarounds, instead make it work."* This is the mitigation for the one real failure mode of a rewrite-later plan — that "I'll rebuild it properly later" becomes licence to make a mess now, which destroys the documented reasoning that makes the rebuild safe in the first place. **The code is disposable; the thinking is not, and the discipline of building it properly is how the thinking gets produced.**

   **This is not licence to abandon compartments.** A session still puts out-of-compartment work in the backlog rather than fixing it on sight — the standard governs *how* something is built when it is built, not *when*. Concretely, it converts the two known workarounds-in-place from "carried indefinitely" to "fixed properly in Phase 2": `state.taskSettings` missing from `wipeAllData()`, and `--color-danger` undefined across six call sites.

5. **The handoff mechanism is recorded so it is not reinvented.** When commercialisation is on the table, the standing documents and the code are handed to a fresh planning conversation, which produces a build plan for the enterprise version. The multi-user problems are solved there, with the benefit of a year of real use. **That is why the standing files are the asset and must stay true** — they are the input to that conversation, and a stale one silently degrades the plan it produces.

---

## 2026-08-31 — Hub display names are one word, and view ids are not display names

**Chose:** the six hubs display as **Dashboard, ProspectHub, MediaHub, CampaignHub, TaskHub, DataHub**, in the sidebar nav labels and in `switchView()`'s `titles` map. **View ids, `data-view` values, panel ids and `body.module-*` class names are untouched** — this was frozen as contract S4 of the Phase 2A plan and held through all six sessions.

**The consequence that needs writing down, because it is a trap rather than a preference:** `data-management` is **displayed as "DataHub" and identified everywhere in code as `data-management`**. The panel is `#view-data-management`, the class is `body.module-data-management`, the `titles` key is `"data-management"`. A session that trusts the displayed name and greps for `dataHub` or `#view-datahub` finds nothing and concludes the hub is missing. `DECLARATIONS.md`'s Routing line already carries a version of this warning about the older "Data Management" name; the amendment proposed at this close **extends** that note rather than replacing it, because the old failure mode (trusting a declared name of `data`) and the new one (trusting the displayed name `DataHub`) are different mistakes with the same cure.

**Rejected — renaming the ids to match.** Eight code sites for `data-management` alone, across three files, for a rename that buys consistency in exactly the place where a mismatch is already documented. It is a Gate B non-issue (nothing is foreclosed) and loses on Ladder 3, Simplicity: the rename is more edits than the note.

**Rejected — leaving the two-word names.** The names are the reason two of the six hubs carried a `.welcome-banner` card *and* a header title while the other four carried only the title. Absorbing the card into the band required the band to be able to say the hub's name in the space available, which two-word names did not survive.

---

## 2026-08-31 — All navigation happens inside the app; the address bar is not a navigation surface

**Chose:** Vantage navigates through `switchView()` and in-page controls only. **The browser's address bar, back button and forward button are not navigation surfaces**, and no view, record or sub-tab is addressable by URL. Set by Michael on 2026-08-30 during the Phase 2 intake; recorded here at the Phase 2A close.

**What it forecloses, permanently:** hash routing (`#/prospects/jane@example.com`), path routing, and any "deep link to this record" feature. This is the point of writing it down — each of those is a reasonable-sounding suggestion that a future session would otherwise cost a day of work before someone remembered why it was not done.

**Why, and the reason is Gate A rather than taste:** production `prospectId` values **are email addresses** (recorded in `BUILD_NOTES.md`, confirmed against real data 2026-08-30). Any URL-addressable prospect view puts a live prospect's email address into the address bar, into browser history, into the autocomplete dropdown, and — the moment Vantage is hosted in Phase 4 — into server access logs and any referrer header the page emits. `DIRECTIVES.md` §0 records that this app holds contact data on people who never opted in. **Routing would leak it through five channels that have nothing to do with the database, and no amount of care in the app closes any of them.**

**Rejected — hash routing with opaque ids.** It would work, and it costs an id-to-slug map, a migration for every existing record, and a second identity for every prospect to keep in sync forever. It solves a problem created by a feature nobody asked for. Ladder 3.

**Rejected — leaving this unstated.** It was a spoken preference for a day, and a spoken preference is not something a future session can read. The whole reason `DECLARATIONS.md` exists is that "Michael mentioned it once" does not survive a context rotation.

**Cost accepted, honestly:** refresh always lands on the Dashboard, and the back button leaves the app. Both are correct for a single-operator tool that runs as an installed PWA, where there is no address bar visible anyway. **If Vantage is ever commercialised this decision should be revisited under the rebuild** — a multi-tenant product with shareable views has different requirements and a different id scheme, which is exactly the kind of question the 2026-08-30 commercial-path entry hands to a fresh planning conversation.

---

## 2026-09-03 — Advanced Query narrowing: deferred, not reversed

*Owed by `ai/spec/prospect-detail-view-scope.md` §9.1 since intake. Written at the Phase 2B close.*

**Chose:** the 2026-08-28 ruling *"One editing surface for prospects"* **stands unchanged**. Its Advanced Query half — folding the AQ results drawer (`renderAqInspectorDrawer()`, the `aq-insp-*` ids) into that one surface — is **DEFERRED at Michael's direction**, pending better working knowledge of both query surfaces. Deferred is not reversed: the drawer is not a second sanctioned editing surface, it is an unconverted one.

**The accepted cost, stated plainly so nobody re-discovers it as a defect:** the drawer **falls further behind every phase**. It already shows no Tasks subsection (Phase 1 wrote that into the ProspectHub inspector only, logged as that phase plan's Assumption 2), and Phase 2B removed the ProspectHub inspector rather than syncing it — so the drawer is now the sole survivor of a pair, carrying the older of the two behaviours. `exportAqRecordsCSV()` is a second instance: 16 columns where the other four prospect CSV writers are 21 or 22. `runCampaignQuery()` is a third: it does not compare tags at all, it joins them to a string and substring-matches, so `["Meeting","Planner"]` is returned by a query for `meeting planner` though no such tag exists. **All three divergences are ACCEPTED, not pending.**

**`ai/spec/prospect-detail-view-scope.md` §2.1 holds the analysis. The later phase reads it rather than re-deriving it** — that is the whole reason this entry exists, because the cheapest way to lose a deferral is to leave no record that the thinking was already done.

**Rejected — closing the gap by porting subsections across.** Writing Phase 1's Tasks subsection into a surface that a later phase converts wholesale is work with a known expiry date, which is the reasoning Phase 1 already accepted. **Rejected — calling the divergence a bug.** It has been reported as one twice; both times the answer was this entry, and both times it cost a diagnosis pass.

**Rejected — un-deferring it inside Phase 2B.** The standing instruction through the whole phase was that both query surfaces stay DEFERRED, and twelve sessions honoured it. Un-deferring is a scope decision, and when it happens the tag semantics fix is a **correctness** fix rather than a tidy-up.

---

## 2026-09-03 — Email is unique, not the key

*Owed by `ai/spec/prospect-detail-view-scope.md` §9.2 since intake. Written at the Phase 2B close.*

**Chose:** a prospect's email is **enforced unique** and is **not** the record's identity. `id` remains the identity. Contract P6, shipped at Session 2B.7: **one resolver, `prospectByEmail()`, and three callers.**

**What intake found, and it is the reason this needed a ruling rather than an assumption.** The database holds **mixed id schemes**: sandbox records carry `pros-<epoch>` ids, and **production `prospectId` values are email addresses** — verified against real data 2026-08-30. So the app already had records whose id *was* their email, sitting beside records whose id was not, and both round-trip through CSV correctly. **Any reasoning that starts "ids look like `pros-…`" is wrong against production data.**

**The guard, and where it deliberately does not run.** `prospectByEmail()` normalises through `normalizedEmail()` (trim, lowercase) and backs the create/edit refusal in `#modal-prospect` and the detail view. **The CSV import does NOT call it**, for two reasons a later session will otherwise try to "fix": a scan of `state.prospects` cannot see two duplicate rows colliding *inside the same file*, and calling it per row is O(rows × prospects). The import keeps `mergeImportedRecords()`'s running `Set` and **skips and reports** — the count, and from 2B.7 the recoverable original rows. **What the two paths share is `normalizedEmail()`**, so they cannot drift into different definitions of "the same email" — which is the part that would actually hurt: a duplicate the import merges but the modal refuses, or the reverse.

**This UPHOLDS the Phase 4 pre-flight's recommendation against email-as-id rather than overturning it.** Uniqueness gives the practical benefit — no two people on one address — without making a mutable, personally-identifying string the primary key. Email changes; ids must not. And `ai/spec/phase-4-firebase-preflight.md` flags the consequence for Firestore document ids, which is where email-as-id would become expensive to undo.

**Rejected — making email the primary key.** It is mutable, it is personal data in a document path (Gate A), and the 2026-08-31 in-app-navigation ruling already forecloses the one thing it would have bought.

**Rejected — leaving email unguarded.** Two records for one person is the failure this whole phase's company work is a second instance of; the resolver is nine lines.

---

## 2026-09-03 — How a frozen contract is amended mid-phase

*Raised by Session 2B.15, which revised the first one, and by the Phase 2B close, which found two more that had been broken without a record.*

**Chose:** a frozen contract may be amended mid-phase, **only by Michael, only in advance of the session that needs it**, and the amendment is written into **three** places in that same session: the contract itself (revised text, with the original preserved in a block quote beneath it), the phase plan's **frozen-contract amendments table**, and the session's handoff. Three places because each answers a different question — *what does it say now*, *was this authorised or did it drift*, and *what happened that day*.

**Why the table, specifically.** P8 was revised correctly and recorded only in 2B.15's handoff. Two weeks later the contract reads as though it had always said this, and **nothing distinguishes an approved revision from a session quietly editing a frozen document** — which is precisely the thing "frozen" exists to make visible. The close found P5 and P9 had also been amended, twice, with no record at all.

**The wording rule that came out of it, and it is the durable half: freeze the invariant, not the forecast.** P8 was cheap to revise because its own text said what was frozen (*"the id is the contract, the widget is not"*). **P9 was broken twice because it froze a list of things that would not happen during the phase** — no new field, no CSV column, `#modal-prospect` untouched — and a contract phrased as a prediction about scope expires the moment the scope changes. For a phase with a review point in the middle, that is close to certain. Every clause of P9 that survived is an invariant; every clause that broke was a forecast.

**Rejected — forbidding mid-phase amendment.** It would have blocked 2B.15, 2B.17, 2B.21 and 2B.22, all four of which were Michael's own decisions, and the alternative is a session building to a contract everyone in the room knows is wrong.

**Rejected — letting a session amend on its own judgement.** The escalation is one message and the failure mode is silent.

---

## 2026-09-03 — PROPOSED amendments to `DECLARATIONS.md`, not applied

⛔ **NONE OF THESE ARE IN FORCE.** The Phase 2B close audited `DECLARATIONS.md` and found four lines that have become **factually wrong** rather than merely improvable, plus one addition the scope has owed since intake. Following the 2A.6 precedent, they are recorded here for Michael to apply by hand. **`DECLARATIONS.md` was not edited.**

1. **Stack — the line counts.** Declared *"`app.js` … ~13,270 lines (`index.html` ~3,250, `style.css` ~3,680)"*, re-measured at the 2A.6 close. Actual, `wc -l` at the 2B close: **`app.js` 17,346 · `index.html` 3,796 · `style.css` 4,926.** The declared purpose of the number is to let a session size a change, and it is now 4,000 lines light on the file every session edits.

2. **Conventions — the state list is missing EIGHT stores, and the count was measured, not estimated.** DECLARATIONS names 18 top-level stores. **The app has 26.** The eight it does not name are **`emailAccounts` · `domains` · `domainHosts` · `domainRegistrars` · `emailProviders` · `domainHostDefaultUrls` · `domainRegistrarDefaultUrls` · `emailProviderDefaultUrls`** — all CampaignHub's, all top-level, all exported by `generateSettingsCSV()` or as their own CSV, and all restored. **Backup coverage is fine; the declared list is not.** A session that enumerates stores from DECLARATIONS to make its DIRECTIVES §4 statement — which is what DECLARATIONS is for — gets an answer short by eight. *(Proposed wording: add the two entity stores to the array list, and add a second sentence naming the six CampaignHub reference lists as settings stores carried by `prm_settings.csv`.)*

3. **Routing — the seventh view.** *(This is scope §9.5, owed since intake.)* Declared views are `dashboard, prospects, media, campaigns, tasks, data-management`. **`prospect-detail` is a seventh `#view-<name>` panel**, shipped at 2B.1 and the phase's whole subject. ⛔ **It is a view panel and NOT a hub: no sidebar entry, no colour of its own — `body.module-prospect-detail` copies ProspectHub's four values verbatim and carries a KEEP IN SYNC comment. The "six hubs" line stays true and MUST NOT be edited to say seven.** That is the entire reason this needs wording rather than a list edit.

4. **Conventions — the default-value migration rule is aspirational, and saying so is the amendment.** It reads *"Every new field gets a default-value migration in the existing state-defaults path, so records predating it read `""` rather than `undefined`."* **It is not being kept, and `pros-sarah` is the proof** — the four `conference*` keys were added later and that record carries none of them, not even empty. Nothing is broken only because every reader guards with `|| ""`. **Two shapes in one array has already cost this project time** (the 2B.7 byte-count mis-read). Either the rule earns a back-fill — a DIRECTIVES §4 change to existing data, with its own decision and rollback plan, currently unowned — or the line should say that records predating a field may be **absent** rather than empty, and that every reader must guard. **Proposing the honest wording, not the back-fill.**

5. **⚠️ Still not applied from the 2A.6 close, and this is the second close to carry them.** The **one-word hub display names** and the **in-app-navigation principle** were proposed on 2026-08-31, are recorded above as full `DECISIONS.md` entries, and are **still not in `DECLARATIONS.md`**. The navigation one is the more expensive omission: it forecloses hash routing permanently on a Gate A argument (production `prospectId` values are email addresses), and a principle that lives only in `DECISIONS.md` is not what a session reads at boot.

---

## 2026-09-03 — Everything the user inputs as data must wipe AND back up. Tags included.

**Michael, at the Phase 2B close, answering the sixteen-store finding:** *"Everything a user inputs as data needs to wipe and be backup. That would include all tags."*

**Chose:** `wipeAllData()`'s coverage is defined by a **rule**, not by a list somebody maintains: **if a user can type it in, a wipe destroys it and a backup carries it.** The backup half already holds for all sixteen survivors. **The wipe half does not, and closing it is a session of its own** — see the scope below. **Not done at the close**, which was a QA-and-documents compartment; adding lines to a destructive control is a DATA change and a DIRECTIVES §4 destructive-data change, and it needs its own rollback plan.

### ⛔ THE THING THAT MAKES THIS NOT SIXTEEN EASY LINES, AND IT WAS FOUND BEFORE ANYONE WROTE THEM

**Thirteen of the sixteen CANNOT BE WIPED TO `[]`, because `ensureStateDefaults()` cannot tell "the user emptied this" from "this key is missing".** Every guard is the same shape:

```js
if (!state.media_tags || state.media_tags.length === 0) {
  state.media_tags = ["Frontend", "React", "Fintech", "Developer", "General"];
}
```

`[]` is truthy, so the `length === 0` half is what fires — **and it fires on the very next boot and on every restore, because `ensureStateDefaults()` always runs after both.** A wipe that sets `state.media_tags = []` therefore does not produce an empty tag list. **It produces the fictional sandbox seed list**, and the user is left looking at "Frontend, React, Fintech" after being told the database was completely wiped. **That is a worse outcome than today's**, where at least the tags standing are his own.

**⚠️ AND THE SAME GUARD IS A LIVE DEFECT TODAY, INDEPENDENT OF THE WIPE.** Every managed list has a ✕ (`deleteSettingOption()`), and nothing stops a user deleting the last entry. **Delete all four `company_tags`, reload, and four invented ones are back.** The same applies through restore: a genuine backup that legitimately contains an empty list has fictional values injected into it on the way in. **Reachable in thirty seconds from the Settings modal.**

### The two groups, because one rule does not fit all sixteen

**⚠️ THE SPLIT IS THE DECISION THIS NEEDS FROM MICHAEL AND IT IS NOT MINE TO MAKE.** The rule as stated — *what the user inputs* — is clear at both ends and genuinely ambiguous in the middle, because these lists ship with seeds AND accept his additions, so they hold both kinds of thing in one array.

- **Unambiguously his data → a wipe must leave them EMPTY:** `media_tags` · `prospect_tags` · `campaign_tags` · `company_tags` · `customSortOrder` · the three `*DefaultUrls` maps. **His answer names tags explicitly.**
- **Vocabulary the app needs to function → a wipe to empty BREAKS IT:** `reachoutTypes` · `mediaTypes` · `platforms` · `campaignPhases` · `developmentPhases`. **An app with zero reachout types cannot log a reachout**, which is the whole product. For these, "wipe" most likely means *back to factory seeds*, which is what the code already does by accident.
- **Genuinely unclear, and the ones to ask about:** `domainHosts` · `domainRegistrars` · `emailProviders`. Seeded vocabulary that he has probably customised.

### Scope for the session that does this — Phase 2C, DATA, sized M, ⚠️ ZIP first

1. **Decide the split above with Michael.** One question, three groups.
2. **Give `ensureStateDefaults()` a way to express "deliberately empty."** The `length === 0` guard must become `=== undefined` for every list in the empty-on-wipe group — which is *also* the fix for the live restore defect above, and is the reason those two pieces of work belong in one session rather than two.
3. **Follow the `taskSettings` precedent for the seeded group.** 2B.7 wrote the literal default into `wipeAllData()` rather than deleting the key and trusting the defaults path, and its code comment says why: *"a wipe leaves the store in the same shape a first run does."* **Copy that, do not invent a third pattern.**
4. **Re-run the drill and report the intersection.** The point of the whole exercise is that the drill currently proves ten stores out of twenty-six; when this lands it should prove twenty-six, and **the session must state the number rather than say "restore verified."**
5. **Rollback:** the change is additive lines in two functions and is revertible in one commit; the data risk is entirely in step 2, because loosening a defaults guard changes what every existing record reads on the next boot. **Take the ZIP first and prove a restore before and after.**

**Rejected — adding sixteen `= []` lines at the close.** It was the obvious move, it would have passed every check anyone would have written, and it would have shipped fictional tag data to a user who had just been told his database was wiped. **The guard was found by reading `ensureStateDefaults()` rather than by trusting that "wipe" and "default" were independent.**

**Rejected — leaving it because backup coverage already holds.** It does hold; that was never the gap. **The gap is that the drill cannot fail**, and a backup nobody has genuinely restored from is what Gate C exists to forbid.

---

## 2026-09-03 — Nothing a user inputs sits outside backup/restore. The coverage audit that unblocks "wipe everything".

**Michael, at the Phase 2B close:** *"Basically, I want wipeAllData to wipe everything. My biggest concern with that is what is NOT in backup/restore."* **It is the right question — a store that a wipe destroys and a backup does not carry is unrecoverable, and that is a Gate C failure rather than an inconvenience.**

**Answer, audited key by key across all 39 persisted keys: THERE IS NO SUCH STORE.**

```
USER DATA NOT EXPORTED       ->  NONE
EXPORTED BUT NOT RESTORED    ->  NONE
```

**All nine `restore*FromCSV()` functions exist and all nine are called by `processRestoreFile()`** — prospects, media, campaigns, audience lists, companies, email accounts, domains, tasks, settings. **`restoreSettingsFromCSV()` reads back every one of the eighteen things `generateSettingsCSV()` writes**, each behind its own `sawX` flag, including the three `*DefaultUrls` maps, `customSortOrder`, `taskSettings` and `columnLayouts`. There is no exported-but-not-restored asymmetry anywhere.

**⚠️ AND THE ATTACHMENTS ROUND-TRIP TOO, WHICH WAS THE ONE THAT COULD HAVE BEEN CATASTROPHIC.** `wipeIndexedDB()` destroys the `files` store, so if the ZIP did not carry the binaries a wipe would be permanent loss of every attachment. **It carries them:** `exportZIPBackup()` builds a `files/` folder and writes each blob into it, and `processRestoreFile()` reads that folder back through `saveFileBlob()`, reporting *"Binary Files 📎"*. **Checked in both directions, because an export-only or restore-only half is exactly the shape that hides.**

### The four things genuinely outside backup/restore, and why none of them is data

1. **Twelve view-state keys** — `theme`, `activeView`, `selectedProspectId`, `activeProspectFilterCompany`, four `activeMediaFilter*`, two `activeCampaignFilter*`, both `forceShowAll*`. **Not data; regenerated by using the app.** Losing them costs re-picking a filter.
2. **`snapshotHealth`** — machine state. `DECLARATIONS.md` already excludes it from backup and restore in as many words: it describes this machine's filesystem, not user data.
3. **Orphaned IndexedDB blobs.** `exportZIPBackup()` collects file ids from `state.media` only (`m.files`, `m.masterFiles`), so a blob no media record references is not exported. **Those are orphans by definition**, and DECLARATIONS' 2026-08-28 ruling — no files attached to prospects — means media is the only holder.
4. **⛔ THE INDEXEDDB `handles` STORE — the backup-folder directory handle.** A `FileSystemDirectoryHandle` is not serialisable, so it **cannot** be exported, and `wipeIndexedDB()` deliberately does not clear it. **This is the one place where "wipe everything" must stay literally false**, and the reason is operational rather than about data: `showDirectoryPicker()` opens a native OS dialog that **an agent cannot drive**, so a wipe that dropped the grant would leave every future automated drill needing Michael at the keyboard. **Keep it out. Say so in the code, or a later session will "complete" the wipe and break every drill after it.**

### What this changes about the scoped session

**The risk was coverage and coverage is fine. The two blockers are behavioural, and both were already found:** the `length === 0` guard in `ensureStateDefaults()` makes "deliberately empty" inexpressible for thirteen lists, and wiping the vocabulary lists to empty leaves an app that cannot log a reachout. **So the session is safe, fiddly, and still sized M** — its danger was never losing data, it was shipping a wipe that silently reseeds fictional values.

**⚠️ THE HONEST LIMIT OF THIS AUDIT: IT IS STATIC.** It proves the code paths exist and are wired; it does not prove they work. **The drill is what proves they work, and today the drill can only exercise ten of the twenty-six stores** — which is the whole reason the wipe gap matters. **When the wipe covers everything, the drill covers everything, and this audit stops being the evidence and becomes the prediction the drill tests.**

---

## 2026-09-03 — No fictional data, ever, on restore. Seed a genuine first run only.

**Michael, at the Phase 2B close:** *"I don't want to restore fictional data."* **Taken as a standing rule, not a preference about one list.**

**Chose:** **`ensureStateDefaults()` may seed a GENUINE FIRST RUN and must inject nothing into a restore, a wipe, or an ordinary boot.** Today it cannot tell those cases apart — it runs identically after all four — and that is the defect to fix, not the seed values themselves.

### ⛔ THE HAZARD THIS RULING EXPOSED, AND IT IS LIVE TODAY WITH NOTHING TO DO WITH TAGS

`loadDatabase()` reseeds whenever the database key is absent **or unparseable**:

```js
try { state = JSON.parse(cache); ensureStateDefaults(); }
catch (e) { console.error(...); await fetchFreshSeed(); }
```

**`fetchFreshSeed()` ends in `saveState()`.** So a single corrupt or truncated `localStorage` write does three things in one boot, with one line of console.error and no dialog: **his database is replaced by `prm_data.json`'s four fictional people — Jane Smith, Alex Rivera, Sarah Chen, Marcus Vance, all on 555 numbers — and the corrupt original is OVERWRITTEN before anyone can look at it.** ⚠️ **Partial writes are not hypothetical in this app**; the zero-byte snapshot race is the same class of failure at the file layer.

**Two fixes, and the second is the one that matters:** never let the catch branch reseed — an unparseable database is an incident, not a first run — and **preserve the unparseable string under a second key before doing anything else**, so the data is still there to recover. **Recoverability is Gate C, and today this path silently fails it.**

### The three groups, decided by what the CODE depends on rather than by taste

**⚠️ THE VOCABULARY LISTS ARE NOT SAFELY DROPPABLE, AND THIS IS THE FINDING THAT SHAPES THE WHOLE SESSION.** Grepping the literal values shows the app hardcodes them:

| Group | Members | Code dependency |
| --- | --- | --- |
| **Fictional demo content — REMOVE, never inject** | `media_tags` (Frontend, React, Fintech, Developer, General) · `prospect_tags` (Decision Maker, Executive, Manager, Hot Lead) · `campaign_tags` (Q1 Outreach, Enterprise, SMB, Newsletter) · `company_tags` (Enterprise, SMB, Agency, Startup) · **`prm_data.json`'s four people** | **NONE.** Zero references to any of these literals anywhere in `app.js`. Pure demo content. |
| **Structural — the app's own enum wearing a list's clothes** | `reachoutTypes`: **"Task Completed" (16 refs) · "Added to Vantage" (13) · "Entered into Vantage" (5) · "Email" (12)** · `developmentPhases`: **"Archive" (6) · "Published" (4) · "This Week" (3) · "Next Week" (3)** · `campaignPhases`: **"Development" (6) · "Launch" (8) · "Archive"** | **Hardcoded.** `NON_REACHOUT_TYPES` is a `const` naming three of them; MediaHub's status filter and CampaignHub's phase logic name the rest. **Remove them and features stop working — this is not fictional data, it is the schema.** |
| **Cosmetic defaults — Michael's call** | `mediaTypes` (Article, Video, Newsletter) · `platforms` (YouTube, Substack, Medium, LinkedIn, Twitter, General) · `emailProviders` · `domainRegistrars` · `domainHosts` | None found. Invented but harmless, and plausibly useful on a real first run. |

**So "no fictional data" resolves cleanly: group 1 goes, group 2 stays because it is not fictional, group 3 is one question.** ⛔ **A session that reads the ruling as "delete every seed" breaks reachout counting, the media status filter and campaign phases in one edit.**

### This merges with the wipe session; it is not a second one

Same functions, same guard, same ZIP. **The `length === 0` guard is the shared root cause:** it is why a wipe cannot express "empty" *and* why a restore reseeds a legitimately empty list. **One session, sized M, ⚠️ ZIP first:** teach `ensureStateDefaults()` the difference between first run and everything else, drop group 1, keep group 2, ask about group 3, fix the catch-branch reseed, then re-run the drill and **state how many of the twenty-six stores it now proves.**

**Rejected — deleting `prm_data.json`.** It is the legitimate first-run seed and DECLARATIONS records it as tracked on purpose. **The fix is that nothing but a first run may reach it.**

**Rejected — treating this as cosmetic.** It reached the top of the list because a corrupt write currently swaps a 651-prospect database for four fictional people and overwrites the evidence.


---

## 2026-09-03 — Vantage does not Bcc. The Workspace journaling rule replaces it, and frozen contracts Q3, Q4 and Q5 are amended to say so

**Michael, at the close of Session 3.1:** *"Google Workspace Bcc rule is in place. Vantage does not Bcc emails."*

**Chose:** Vantage emits no Bcc. The Google Workspace outbound content-compliance rule blind-copies every message sent from the work account, so the logging the Bcc existed to provide already happens — **and happens in more cases than Vantage could ever cover**, including replies typed straight into Gmail with Vantage nowhere in sight. **The app must not do a worse version of something the mail system already does completely.**

**What is amended, and each of the three was frozen:**

- **Q3** — `state.taskSettings.emailBcc` is removed: the seed in `ensureStateDefaults()`, the `OUTREACH_BCC_DEFAULT` constant, the `["Outreach Bcc", …]` row in `generateSettingsCSV()` and its `restoreSettingsFromCSV()` leg. **`workGmailAddress` is NOT affected** — it targets the right inbox and is unrelated.
- **Q4** — `gmailComposeUrl()` loses the `(bcc ? \`&bcc=…\` : \`\`)` term entirely. It is not made conditional on a blank setting; the parameter does not exist.
- **Q5** — email `thread` no longer toasts *"Body copied — remember Bcc."* The copy-on-open behaviour itself stands; only the Bcc half of the message goes.
- **Phase-plan Open Risk 6** (*"the Bcc does not reach follow-ups or LinkedIn"*) is **retired, not mitigated.** It was the risk this rule removes.

**Because:** a setting nothing reads is not neutral. It is an invitation — the next session that greps `emailBcc`, finds a seeded, exported, restored key that no code path consumes, reads it as an unfinished wiring job and reconnects it. **Removing it is cheaper than the comment that would have to stop that**, and this file plus the phase plan's amendments section carry the reasoning if the question ever reopens.

**Rejected — leaving the key in place and simply not reading it.** The zero-rework option, and the one that ships the trap above. Also rejected because Session 3.1 gave the key genuine backup coverage: leaving it means a CSV row and a restore leg maintained forever for a value with no consumer.

**Rejected — keeping the Bcc as a deliberate second copy.** Belt and braces has a real cost here: every staged email lands in the archive twice, and a recipient who reads headers sees a Bcc that the journaling rule does not expose. Michael trusts the rule; the second copy buys noise.

**What would reverse this:** the Workspace rule being turned off, narrowed, or found not to cover a channel that matters — or Vantage one day sending from an account outside that Workspace. **Any of those is a scope question, not a session's call**, and the reversal is small: one seed line, one CSV row, one restore leg, one URL term.

⚠️ **THE AMENDMENT COSTS A FOLLOW-UP TO A SESSION THAT HAS ALREADY SHIPPED. IT IS OWED AS SESSION 3.1b** — Session 3.1 built the Q3 half in good faith hours before this ruling, so the removal is real code plus a `CACHE_NAME` bump, not a documentation edit. Sized **S**. Following the 2B.19 / 2B.19b precedent for a repair pass on a shipped session, and it must run **before 3.3**, which is the session that would otherwise build `&bcc=`.

⚠️ **AND THE SPELLING QUESTION THAT DOMINATED THE SCOPE IS NOW MOOT — RECORD THAT PLAINLY SO NOBODY RE-OPENS IT.** Scope §9.7 spent a full section, three typings and an on-screen verification settling `michaelh@youravdept.com`; Michael confirmed it correct at 3.1's close, and it was retired as a value the same hour. **The section stays as the record of how a silent-failure value should be settled** — render it from live state and have the human read it, rather than asking a fourth time — which is the durable half and is worth more than the address was.
