# Phase 4 pre-flight — Hosting on Firebase

**Written:** 2026-08-30, during Session 1.8 (Phase 1 close)
**Status:** planning input, not an approved scope. Phase 4 still needs its own intake and plan.
**Authority:** `DECISIONS.md` (2026-08-27 persistence, stack; 2026-08-28 phase order) and `DIRECTIVES.md` §0/§1 remain the standard of truth. Where this file adds anything new, it is marked **[new 1.8]**.

> **Phase number.** Hosting is **Phase 4**, per `DECISIONS.md` 2026-08-28, which superseded the 2026-08-27 order. `DIRECTIVES.md` §0, `DECLARATIONS.md` and `BUILD_NOTES.md` still say "Phase 2" in several places — corrected in the 1.8 drift audit. If a standing file says Firebase arrives in Phase 2, it is stale, not a competing decision.

---

## Why this file exists

Everything below is cheaper to decide before the migration than after. Two items are genuinely irreversible once real documents exist; the rest are ordinary work that gets much harder if it is discovered late.

Measured against the real database on 2026-08-30:

| | Count | Notes |
| --- | --- | --- |
| Prospects | 651 | `prm_prospects.csv` 253,933 bytes |
| Companies | 1,090 | `prm_companies.csv` 895,398 bytes — the big one |
| Media | 33 | |
| Audience lists | 4 | |
| Campaigns | 3 | |
| Domains | 5 | |
| Email accounts | 5 | |
| Tasks | 0 | production has none yet |
| History entries | 659 | across all prospects |
| **Total documents** | **~1,791** | if every entity is its own document |
| Whole state as JSON | ~1,466 KB | **already over Firestore's 1 MiB document limit** |
| Attachments | 0 | `snapshots/files/` is empty |

---

## 1. Cannot be deferred — Gate B

### 1.1 Every record gets an owner field during the migration

`DIRECTIVES.md` Gate B: multi-user later must not require migrating anyone's data. Adding an owner field to ~1,791 existing documents afterwards **is** that migration, so it fails the gate by definition.

Write `ownerId` (or equivalent) on every document as part of the initial import, while there is one user and the value is a constant. Cost now: one field. Cost later: a data migration plus a window where old and new records disagree.

The same applies to security rules: write them as "a user reads only documents they own" from the first deploy, even though today that is a tautology. Rules written permissively "because it's just me" are the thing nobody remembers to tighten.

### 1.2 Decide the document ID scheme before 1,791 documents exist

**[new 1.8]** Production `prospectId` values are **email addresses** — `first.last@example-org.org` (redacted — real values are live prospect addresses), not `pros-1788…`. Discovered during the 1.8 restore drill; they round-trip through CSV correctly, so nothing is broken today.

On Firestore this deserves a decision rather than a default:

- Email addresses are legal document IDs, but they put personal data into document **paths**, which surface in logs, URLs and error traces. That interacts badly with Gate A and with §3 (telemetry must never carry prospect data).
- They change. People move jobs. A Firestore document ID cannot be edited — only copied to a new document and the old one deleted.
- Contract **C1** makes `prospectId` the *only* stored link from a task to a person. Every task pointing at a changed ID becomes an orphan, silently. Session 1.8 saw exactly this shape: restoring prospects whose IDs differed from the tasks' references orphaned all 31 tasks at once, with no error.

Recommended: a stable synthetic document ID with email as an ordinary indexed field. Reversing this after import is a full re-key of every prospect, task and audience-list membership.

---

## 2. Do before hosting, not during

### 2.1 Granular writes — build them on localStorage first

`DECISIONS.md` (2026-08-27, persistence) already names this as the real work: `saveState()` writes everything; Firestore needs it to write only what changed. `BUILD_NOTES.md` records the shape — keep a shadow copy of last-saved state, diff on save, write the difference. One function, no call sites touched.

**[new 1.8] Two additions.**

**Build and verify it while still on localStorage.** A bug there costs nothing and is observable. Landing granular writes and the Firestore swap in the same session means debugging two new things simultaneously, and the failure mode of a bad diff — a write that silently omits a field — looks identical to a sync problem.

**It is also the fix for the concurrency defect found in 1.8** (§4 below), which is not a Phase 4 problem arriving early. It is live today.

### 2.2 The origin trap, and the import-and-verify step

Recorded in `BUILD_NOTES.md`; restated because it is the most surprising item for anyone who has not hit it.

Data lives on the `localhost:5000` origin. A hosted Vantage is a different origin, therefore a different `localStorage`, therefore **it opens empty**. Prospects do not follow.

The ZIP bundle is the bridge, and 1.8 proved the bridge carries real volume: 651 prospects and 1,090 companies restored clean, with a multi-paragraph note character-identical through export → wipe → restore.

Go-live therefore needs an explicit **import, then verify counts, then start using it** sequence — and a rule that no real work happens in the hosted copy before the import completes. Editing the empty hosted app first and importing afterwards produces two divergent databases with no clean reconciliation.

### 2.3 Secrets, in a public repo

`github.com/mharward68/vantage-app` is public and git history is permanent. Being precise about what is actually dangerous, because it is easy to guard the wrong thing:

| Item | Secret? | Note |
| --- | --- | --- |
| Firebase **web** config keys | **No** | Designed to ship in the client. Not the risk. |
| Service-account JSON / admin credentials | **Yes** | Committing one is unrecoverable — rotate immediately if it happens. |
| Security rules | n/a | These are the actual protection. Public keys plus permissive rules is an open database. |
| Migration export files | **Yes, in effect** | Real contact data in CSV/ZIP, produced at exactly the moment `git add -A` is the working habit. |

A `.gitignore` covering ZIPs, `prm_*.csv`, `snapshots/` and the Phase 4 secret shapes was added 2026-08-30. **It does not affect files git already tracks** — `git rm --cached` is required for anything that has already slipped in.

---

## 3. Activates at hosting

### 3.1 Gate D — observability

Inert today by decision, because failures happen in front of Michael. Once Vantage runs where nobody is watching, `DIRECTIVES.md` Gate D applies: no feature ships without error telemetry sufficient to diagnose a failure without reproducing it by hand.

§3 governs the content: **error class, location, correlation id — never prospect data, note bodies, or message content.** This app's payload is almost entirely other people's personal information; one careless log line is the whole liability.

Telemetry tool is still **not chosen**. It needs choosing in the Phase 4 plan, not at deploy time.

### 3.2 Gate A stops being vacuous

Today Gate A is nearly meaningless — one user, one machine. Hosted, it is real and load-bearing. Every query must be incapable of returning another user's rows, which is §1.1's owner field plus rules doing their job.

### 3.3 Snapshots change role

Per `DIRECTIVES.md` §0: Firebase becomes the durable copy and the source of truth; the local snapshot system becomes **disaster recovery only, never a second live database**. Easy to drift on — the snapshot system will still be running and still writing, and treating it as a parallel truth reintroduces exactly the divergence Phase 4 exists to remove.

`state.snapshotHealth` stays excluded from backup and restore. It describes one machine's filesystem; syncing it would make one device claim protection another device earned.

---

## 4. **[new 1.8]** The concurrency defect — already live

Found during the 1.8 restore drill, and not previously recorded anywhere.

**Two Vantage windows open on the same origin share one `localStorage` but keep entirely independent in-memory `state`. Whichever calls `saveState()` last overwrites the other wholesale — no error, no conflict, no warning.**

Observed directly: one window held 31 tasks, the other 86; the second window's save erased 55 tasks from storage with no signal. Both windows also write into the same `snapshots/` folder with second-resolution filenames, producing pairs like

```
vantage_snapshot_2026-08-30_110520.json   1,486 KB   86 tasks
vantage_snapshot_2026-08-30_110522.json   1,470 KB   31 tasks
```

— two seconds apart, two different databases, nothing in either filename indicating which window wrote it. "Restore the newest snapshot" would have quietly restored the wrong one. The concurrent writes also produced a truncated zero-byte snapshot, which C13's read-back confirmation caught and the pruner removed. That is C13 working as designed, and it is also evidence the race is real.

**Why it belongs in this file.** This is the same failure `DECISIONS.md` rejected the single-blob hosted document over — *"two devices editing concurrently overwrite each other wholesale — not a merge conflict, a total silent overwrite."* It was recorded as a hypothetical Phase 4 risk. It is a present-tense defect between two browser tabs.

Firebase improves it but does not close it. Per-entity collections stop two clients erasing each other's entire database, which is the fatal version. Two clients with independent in-memory state still produce last-write-wins **per document**. The thing that actually narrows it is §2.1's shadow-copy diff — writing only what changed means two clients editing different records stop colliding at all.

**Mitigations, cheapest first:**

1. Ship §2.1's granular writes. Highest value, already planned work.
2. A `BroadcastChannel` heartbeat so a second instance opens read-only or warns. Small, self-contained, useful before Phase 4.
3. Stamp an instance id into the snapshot payload and filename, so a folder full of snapshots is attributable. Small.

None are Phase 1 work. Items 2 and 3 are good Phase 4 pre-work or a standalone small session.

---

## 5. Sizing and cost

Not risks — numbers worth knowing before designing the read path.

- **Document limit.** Firestore caps a document at 1 MiB. The whole state as JSON is ~1,466 KB, and companies alone are ~874 KiB as CSV. The single-blob approach is not merely rejected on principle; it **already exceeds the limit today**. Per-entity decomposition is load-bearing, not stylistic.
- **Read volume.** Vantage loads the entire dataset into memory and filters arrays — that is ~1,791 document reads per boot. Verify the current free-tier daily read allowance against Firebase's pricing page rather than trusting a remembered figure; at the scale documented when this was written it is comfortable for one user and is the number that would bite a multi-user version. Firestore's offline cache softens repeat loads.
- **Offline persistence across tabs** needs explicit configuration, and the API for it has changed across Firebase SDK versions. Check current documentation rather than an old snippet — and note this matters more here than usual, given §4.

---

## 6. Non-technical, and genuinely open

`DIRECTIVES.md` §0 records compliance obligations as **NOT DECIDED**. Hosting is where that stops being theoretical: 651 real people who never opted in, on a server rather than one laptop.

- **GDPR** if any prospect is in the EU — lawful basis (legitimate interest), plus deletion and access rights that someone has to be able to action.
- **CAN-SPAM** for US outreach — accurate identification, working opt-out, physical address.

Not urgent for a single-operator tool. Important before anyone else touches it, and before it is sold to anyone. Worth an hour of decision-making in the Phase 4 intake rather than a scramble later.

---

## Checklist

**Irreversible — settle in the Phase 4 plan, before any import**

- [ ] Owner field on every document, written during import (§1.1)
- [ ] Security rules written owner-scoped from the first deploy (§1.1)
- [ ] Document ID scheme decided — synthetic vs email (§1.2)

**Before the migration session**

- [ ] Granular writes built and verified on localStorage (§2.1)
- [ ] `.gitignore` confirmed against Phase 4 secret shapes; nothing already tracked (§2.3)
- [ ] Import-and-verify sequence written into the plan, with the no-work-before-import rule (§2.2)

**At hosting**

- [ ] Telemetry tool chosen; payload rules enforced (§3.1)
- [ ] Snapshot system explicitly demoted to disaster recovery (§3.3)

**Should not wait for Phase 4**

- [ ] Multi-instance guard, or at minimum instance-stamped snapshots (§4)

**Open**

- [ ] Compliance position — GDPR, CAN-SPAM (§6)
