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
