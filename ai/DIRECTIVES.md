# Statement of Directives — Vantage

*Instantiated 2026-08-27 · Revised 2026-08-28*

How to decide. What was decided lives in `DECLARATIONS.md`; why, in `DECISIONS.md`; what was discovered, in `BUILD_NOTES.md`.

> Recalibrated 2026-08-27. The previous version of this file was Onyva's, pasted verbatim — "thousands of clients / hundreds of thousands of users," the per-subdomain-OAuth reference, business-logic-in-the-API with native wrappers. None of it described Vantage, and Gate 2 as written would have required rejecting localStorage, the entire architecture. Structure kept; parameters made real.

---

## 0. Project Parameters

| Parameter | Value |
| --- | --- |
| **Scale horizon** | One user today. Architected so a multi-user version needs no data migration. Not "hundreds of thousands of users" — that was Onyva's number. |
| **Data sensitivity** | Contact data on prospects who never opted in: names, titles, emails, phones, LinkedIn URLs, employers, plus Michael's private notes about them. No payment data. ⚠️ See compliance below — this is third-party personal data. |
| **UX tier** | **Polished.** Confirmed 2026-08-28. Premium is over-specified for a tool with one user; raise the tier before external launch. |
| **Accessibility target** | **none** — Gate F inert. New markup follows the three authoring habits below. WCAG 2.2 AA adopted before external launch. Confirmed 2026-08-28. |
| **Platform targets** | Web PWA: desktop and mobile browsers. No native app-store wrappers (that was Onyva's line). |
| **Telemetry tool** | ⚠️ NOT DECIDED — **deferred to Phase 2 by decision, not omission.** Near-vacuous while the only user is watching it happen locally. Gate D activates at hosting, where failures happen out of sight. |
| **Recovery objectives** | Two tiers. **Tier 1 — local snapshots**, File System Access API, one directory handle granted once. Written ~2 minutes after the last mutation (debounced), plus on tab-hide and on close. Retention: last 10 rolling + newest-of-day for 14 days + newest-of-week for 8 weeks. State JSON on every snapshot; IndexedDB binaries mirrored once daily, deduped by id, never touched by the pruner. Sole protection during Phase 1. **Tier 2 — Firebase** as the durable copy from Phase 2, and the source of truth once it exists; the local copy is disaster recovery, never a second live database. Manual ZIP export stays as an on-demand third option. Set 2026-08-28. |
| **Compliance obligations** | ⚠️ NOT DECIDED — see below. |

**On accessibility.** The target is `none`, so Gate F is inert: no conformance claim, no audit, nothing to verify in a session's Done-when. But Phase 1 authors three new UI surfaces from scratch, and three habits cost nothing at the moment of writing where retrofitting them costs a pass over every view — **every input labeled, every control keyboard-operable, focus visible.** Authoring habits, not a gate; a session is never blocked on them.

The earlier draft of this file anchored AA adoption to "the Phase 2 rebuild, the cheapest moment this will ever have." That premise is wrong: `DECISIONS.md` (persistence) states Phase 2 leaves every render function, filter and view untouched — which is the entire reason Phase 2 is a contained migration rather than a rewrite. Phase 2 is not a UI rebuild and buys no free retrofit. The anchor is external launch.

**On compliance.** A prospecting tool holds personal data about people who never signed up for anything. That is a real obligation, not a formality: GDPR if any prospect is in the EU (legitimate interest, plus deletion and access rights), and CAN-SPAM for outreach email in the US (accurate identification, working opt-out, physical address). Worth settling before this is sold to anyone.

**On snapshots.** Two design constraints for the Phase 1 session that builds this. The File System Access API permission occasionally needs re-granting, and a snapshotter that fails silently is worse than none — a denied or failed write must surface visibly, not log and continue. And per Gate C, that session's Done-when includes an actual restore *from* a snapshot, not merely a successful write.

---

## 1. Gates — Non-Negotiable

Binary. All must hold. If a gate can't be satisfied, stop and escalate — never silently downgrade.

**A. Data protection.** No user-data leakage. Today this is nearly vacuous — one user, one machine. It becomes real and load-bearing at hosting, and fully so at multi-user. Design as though a second user already exists: every record traceable to an owner, no query that could return another user's rows.

**B. No foreclosed scale.** Reject anything that can't reach the §0 horizon: multi-user later without migrating anyone's data.

The test: can it be fixed later without migrating existing data or breaking a public contract?

- No → gate matter. The data model, ownership, record identity. This is what killed the single-blob shortcut.
- Yes → not a gate. Query tuning, caching, bundle size. That's Ladder 4.

**C. Recoverability.** *(active as of 2026-08-28 — §0 recovery objectives are set)* All user-writable data covered by a backup/restore procedure that has actually been tested. A backup nobody has restored from is not a backup.

**D. Observability.** *(activates at hosting)* Once Vantage runs somewhere Michael isn't watching, no feature ships without error telemetry sufficient to diagnose a failure without reproducing it by hand. Error class, location, correlation id — never user content. See §3.

**E. Client/server boundary.** Onyva's "business logic in the API" does not apply — Vantage is client-side by design and correctly so. The Vantage-specific version: the in-memory state shape is the contract. Persistence may change beneath it; render and filter code must not have to care.

**F. Accessibility.** *(inert — §0 target is `none`. The three authoring habits in the §0 note are habits, not this gate; do not enforce them as one.)*

---

## 2. Ladder — Ranked Tiebreakers

Higher rung wins when a decision is close and all gates hold. A rung never overrides a gate.

1. **Stability.** A plain feature that always works beats a flashy flaky one. Determinism over cleverness.
2. **User experience quality.** To the §0 tier: it works, it's clear, it never lies about state; no layout shift, deliberate loading and empty states, graceful failure.
3. **Simplicity.** Default tiebreaker. Mostly serves stability rather than competing with it — and in a 10,000-line single file, it's the difference between a change you can reason about and one you can't.
4. **Efficiency.** Optimize last. No premature optimization, no runaway patterns.

---

## 3. Conflict Resolutions

**Observability vs. Data protection** → Data protection wins. Telemetry never carries prospect data, note content, or message bodies. This app's payload is almost entirely other people's personal information; an error log that dumps it is the whole liability in one line.

**UX quality vs. Stability** → Stability wins. Optimistic UI is a recorded decision, not a default.

**Scale vs. Simplicity** → Apply the Gate B reversibility test. Reversible means simplicity wins today.

---

## 4. Hard Limits — Stop and Ask

Observable triggers. "I considered it" is not compliance.

**Backup coverage.** Any session creating or modifying a store of user-writable data states in its summary whether it's covered by backup/restore. Not covered → stop and ask. (This is Michael's original Gate 3, kept — it's the reason the sequencing spec puts backup second in its build order.)

**Destructive data change.** Any migration altering or deleting existing data → stop, present the rollback plan, wait. Includes the localStorage→hosted migration, which is the single highest-risk operation on the roadmap.

**New dependency.** Vantage has no build step and no framework. Adding either is an architecture change, not a convenience — stop and ask.

**Secrets.** Never committed, never logged, never printed in chat, never sent to telemetry.

**Auth changes.** Stop and ask.

**Service worker cache.** Bump `CACHE_NAME` in `sw.js` whenever `index.html`, `app.js`, or `style.css` changes. Not optional — skipping it ships code nobody receives.

**Frozen contracts.** Not modified mid-phase.

---

## 5. Decision Procedure

1. **Gates.** Any option failing any gate is eliminated. If all fail, stop and escalate — don't pick the least-bad.
2. **Ladder.** Top down. First rung where options genuinely differ decides it.
3. **Still tied?** Simplest option, logged as an assumption.
4. **Record.** DECLARATIONS gets the line; DECISIONS gets the reasoning and the rejected alternatives.

**Operating rule.** Make the obvious calls independently. Come to Michael only when two directives genuinely conflict and it's close. Surface the tradeoff; don't silently optimize one at the others' expense.

---

## 6. Amendments

| Date | Change | Why |
| --- | --- | --- |
| 2026-08-27 | Recalibrated from Onyva's pasted directives. Real §0 parameters; Gate B rewritten to Vantage's actual constraint; Gate E replaced (API-boundary → state-shape contract); Gates C/D/F scoped to when they activate; §3, §4, §5 added. | The prior file described a different product. Gate 2 as written would have required rejecting the app's own architecture. |
| 2026-08-28 | §0 closed out. **Recovery objectives** completed with snapshot cadence, retention tiers, and attachment handling; Gate C moved from blocked to active. **UX tier** confirmed Polished. **Accessibility** confirmed `none` with three authoring habits added for new markup, and the WCAG 2.2 AA anchor moved from "the Phase 2 rebuild" to "before external launch." **Telemetry** restated as deferred to Phase 2 by decision rather than left open. | Recovery objectives were blocking Gate C outright, and Gate 3 (backup coverage) fires during Phase 1 with live enrollment data — this could not wait for hosting. The accessibility anchor moved because the "hosting rebuild touches everything anyway" premise is contradicted by DECISIONS' own persistence entry, which is the load-bearing one. |
