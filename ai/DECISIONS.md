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
