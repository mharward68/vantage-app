# Scope: Multi-Channel Outreach Launch from Tasks (Phase 3 component)

**Status:** Draft for approval — no code written.
**Belongs in:** `ai/spec/sequence-outreach-launch-scope.md`
**Phase:** 3. Not Phase 1, not a phase of its own. **Phase 2 is untouched by this document.**
**Depends on:** Phase 1 TaskHub (`ai/spec/taskhub-scope.md`), which owns the task entity this extends.
**Replaces:** the 2026-09-02 draft `sequence-email-launch-scope.md`, which covered email only. Nothing was built from it; this supersedes it whole.

**Relationship to the other sequencing docs:** `claude/sequence-feature-scope.md`
is retired and describes the *enrollment and scheduling* half of sequencing.
This document describes the *outreach and launch* half. Both feed the Phase 3
re-scope (Prompt 1) and the phase plan generated from it (Prompt 3). Neither is
a phase plan on its own.

---

## 1. What this builds

Sequence steps gain a **channel**. Each step produces a task carrying a
ready-to-send message for that channel, and the task shows an action button
that opens the right destination with as much staged as that platform allows.

**Vantage never sends, on any channel.** It stages; Michael reviews and sends.

| Channel | Status |
| --- | --- |
| Email | Scoped here |
| LinkedIn | Scoped here |
| Text | **Out of scope.** Not stubbed, not reserved. See §13. |

### 1.1 Two halves, built in that order

The feature divides along a clean seam, and the build follows it:

**The consumer** — task fields, the outreach block in the task inspector, the
buttons, the URL builders, the settings, backup coverage. This lives entirely
in the task entity and works with **values typed by hand**. It has no
dependency on sequences existing.

**The producer** — the channel and kind pickers in the sequence builder,
per-step templates, token resolution at task creation, per-step defaults. This
needs sequences.

Both ship in Phase 3, but the consumer is built and testable first, against
manually entered tasks. That ordering is not cosmetic: it means the URL
builders, the clipboard fallbacks, the validation and the whole restore path
are proven against real use before any sequencing machinery is layered on top.
When the producer lands, it is only filling fields that already work.

It also means one-off outreach is a supported use, not a side effect — see §4.1.

---

## 2. The constraint that shapes everything

The two channels are not symmetric, and the design should not pretend they are.

**Email prefills.** Gmail's compose URL accepts `to`, `bcc`, `su` and `body`.
Vantage builds a complete draft and one click opens it.

**LinkedIn prefills nothing.** There is no subject parameter, no body
parameter, no supported API for this. Nor can Vantage paste into LinkedIn — a
web page cannot inject text into another origin's page. Every LinkedIn step is
therefore *open the right screen, then copy and paste by hand*.

This is not a gap to engineer around. It is the platform, and the scope treats
it as fixed. What Vantage can do is remove every other friction: land on the
exact right screen, have the text resolved and validated and one click from the
clipboard, and never make Michael retype anything.

### 2.1 The one useful LinkedIn URL

```
https://www.linkedin.com/messaging/compose/?recipient=<profile-slug>
```

This opens the message composer already addressed to that person, skipping
profile-then-click-Message. The slug is the segment after `/in/` in their
profile URL, which the prospect record already stores.

**It is undocumented.** It works today; it is not a supported API and LinkedIn
can remove it without notice. Every LinkedIn action therefore has a declared
fallback to the plain profile URL, and §9.3 makes verifying it a build step
rather than an assumption.

---

## 3. Channel and kind model

A step declares a channel and, within it, a kind. The kind determines the
destination, whether a subject exists, and which limit applies.

| Channel | Kind | Opens | Subject? | Body limit |
| --- | --- | --- | --- | --- |
| email | `compose` | Gmail compose, **prefilled** | Yes, typed on the step | ~2000 chars of URL |
| email | `thread` | Gmail search for the contact | Inherited, shown as `Re:` | none |
| linkedin | `connect` | LinkedIn profile page | No | **300** |
| linkedin | `inmail` | LinkedIn composer | Yes, typed on the step | **1900** |
| linkedin | `message` | LinkedIn composer | No | **3000** |

`connect` is a connection request with a note — a different action from a
message, reached from the profile's Connect button, not the composer. It is
scoped as its own kind rather than a message variant because the destination,
the limit and the flow all differ.

### 3.1 Defaults in the sequence builder

- Step 1 of a LinkedIn run defaults to `inmail`; later LinkedIn steps default
  to `message`. This delivers the "only the first LinkedIn step asks for a
  subject" decision without a separate rule — the kind carries it.
- `connect` is never a default. It is chosen deliberately.
- Email step 1 defaults to `compose`; later email steps default to `thread`.

All defaults are overridable per step. A sequence may legitimately restart an
email thread mid-run, or open with a connection request before any InMail.

---

## 4. What a task looks like

Below the existing Due Date / Task Title / Notes block in the TaskHub
inspector. LinkedIn InMail shown:

```
Due Date:    2026-09-14
Task Title:  LinkedIn InMail — Acme AV proposal

Notes
─────────────────────────────────────────────
Sally Quinn
Acme, LLC
LinkedIn:  linkedin.com/in/sally-quinn-1234

Subject:   AV production for the Acme Summit          [copy]  84/200

Dear Sally,

<body, editable>

Best,

Michael
                                                      [copy]  612/1900
─────────────────────────────────────────────
[ Open LinkedIn ]   [ Copy Subject ]   [ Copy Body ]
```

Per channel, the controls are:

| Kind | Button | Copy controls |
| --- | --- | --- |
| email `compose` | Open Gmail | Copy Body (fallback only) |
| email `thread` | Open Thread | Copy Body |
| linkedin `connect` | Open Profile | Copy Note |
| linkedin `inmail` | Open LinkedIn | Copy Subject, Copy Body |
| linkedin `message` | Open LinkedIn | Copy Body |

**LinkedIn buttons open only — they never touch the clipboard.** Copying is
always an explicit, separately labelled click. With two things to paste and one
clipboard, implicit copying means never being sure what is on it. Email
`thread` keeps its auto-copy from the earlier decision; see §9.5 on whether to
align these.

Live character counts sit next to each field, red past the limit. Contact
header, subject and body all render from the task's message fields, not from
`notes` — `notes` keeps its Phase 1 meaning as free text Michael types.

### 4.1 Manual entry

Every field a sequence would write can be typed by hand on any task. The task
editor gains, below the existing fields:

- **Channel** — None / Email / LinkedIn. Defaults to **None**, which is the
  state of every task that predates this feature and every task created without
  outreach in mind. None hides everything below it and shows no buttons.
- **Kind** — the options valid for the chosen channel, per §3's table.
- **To** — email address or LinkedIn profile URL, per channel.
- **Subject** — shown only for kinds that have one.
- **Body** — with the live counter and the §6.1 limit for the chosen kind.

**To auto-fills from the linked prospect.** Session 1.9 gave tasks a prospect
link; when one exists, choosing Email fills To from the prospect's email field
and choosing LinkedIn fills it from `prospect.linkedin`. The field stays editable —
auto-fill is a starting value, not a lock — and an orphan task simply requires
typing it.

This is what makes the consumer half testable before any sequencing exists, and
it earns its place permanently: a one-off email to a prospect gets the same
Bcc, the same validation and the same launch button as a sequenced one, without
building a one-step sequence to get it.

Sequence-generated tasks use the identical fields. A sequence is a *writer* of
these values, never a separate path.

---

## 5. Data model

### 5.1 Task fields

Field names are **channel-neutral**. The earlier draft named them `emailTo`,
`emailBody` and so on; that was wrong the moment a second channel appeared.
Nothing is built yet, so this costs nothing to fix now and would be a migration
later.

```js
task.channel    = "email" | "linkedin" | "";   // "" = not an outreach task
task.msgKind    = "compose" | "thread" | "connect" | "inmail" | "message" | "";
task.msgTo      = "sally.quinn@acmellc.com";   // or the LinkedIn profile URL
task.msgSubject = "AV production for the Acme Summit";   // resolved, no "Re:"
task.msgBody    = "Dear Sally,\n\n…";          // resolved, editable
```

`msgKind` collapses what would otherwise be two fields (an email mode and a
LinkedIn kind). The five values are unambiguous across both channels.

`channel === ""` means no outreach block and no buttons — the default for a
manually created TaskHub task, and the state of every task predating this
feature.

All values are **literal resolved text**, holding the Phase 1 rule that a task
never stores an unresolved merge token. This is true whether a sequence wrote
them or Michael typed them; there is no second code path and no task that
stores a live token awaiting resolution.

All five fields are user-editable at any time, on any task, sequence-generated
or not. Editing them never touches the originating step template.

### 5.2 Sequence step fields

```js
step.channel         = "email" | "linkedin";
step.kind            = "compose" | "thread" | "connect" | "inmail" | "message";
step.subject         = "AV production for the [Conference Name]";  // tokens intact
step.body            = "Dear [First Name],\n\n…";                  // tokens intact
```

`subject` is present and required only where §3's table says a subject exists.
The builder hides the field entirely for the other kinds rather than showing a
disabled one.

### 5.3 Merge tokens

Existing list: First Name, Last Name, Company, Title, Conference Name,
Conference Start Date, Conference End Date, Conference City/Venue.

**`[Email]` must be added** — it is not in the list and email steps cannot work
without it. See §9.1.

`[LinkedIn]` is deliberately *not* added as a token. The profile URL is
plumbing that Vantage consumes to build a link; there is no reason to paste it
into message text.

Tokens resolve in both `subject` and `body` at task-creation time.

### 5.4 Global settings

Two new keys on the existing `state.taskSettings` object — **not a new store**,
per the instruction at `app.js` 1268–1286 and the `columnLayouts` precedent:

```js
state.taskSettings.workGmailAddress = "";                       // targets the right account
state.taskSettings.emailBcc         = "michaelh@youravdept.com"; // editable, may be blank
```

`wipeAllData()` already clears `taskSettings` whole (repaired in Session 2B.7),
so both keys inherit that coverage with no new line.

Both are editable text fields; nothing is hardcoded. Blank
`workGmailAddress` disables email buttons with a message pointing at Settings.
Blank `emailBcc` omits the Bcc and hides the Bcc line.

`emailBcc` is a single address in this pass. Gmail's `bcc` parameter accepts
comma-separated values, so supporting a list later is a validation change only.

---

## 6. Validation

### 6.1 Limits

| Kind | Subject | Body |
| --- | --- | --- |
| linkedin `connect` | — | 300 |
| linkedin `inmail` | 200 | 1900 |
| linkedin `message` | — | 3000 |
| email `compose` | — | governed by URL length, §8 |

**Validate at two moments, not one.** A template that fits can stop fitting
once tokens resolve — a 290-character connection note plus a company called
"Northwestern Mutual Financial Network" overflows. So:

1. **In the sequence builder**, with a live counter, warning as the *template*
   approaches the limit.
2. **At task creation**, after tokens resolve. An over-limit task is created
   anyway but flagged, with its counter red and the button warning before it
   opens. Blocking task creation would silently drop a step out of a sequence,
   which is worse than a visible over-length task.

### 6.2 The connection-request ceiling worth knowing before you build on it

The 300-character note limit is the same on free and Premium accounts. But
**free accounts are capped at roughly five noted invitations per month** — past
that, LinkedIn only allows blank invitations until the cycle resets.

If the work LinkedIn account is free, a sequence built around `connect` steps
stops working after the fifth contact each month, and it will fail quietly. Worth
confirming the account tier before `connect` gets built at all. Flagged as
§9.4.

---

## 7. URL construction

### 7.1 Email — account targeting

```
https://mail.google.com/mail/u/<workGmailAddress>/…
```

Gmail accepts an email address in place of the account index and redirects to
whichever `/u/N/` that account occupies. Preferred over `/u/0/`, which reflects
sign-in order and renumbers silently when accounts are added or removed — a
wrong-inbox bug that surfaces months later as "the button stopped working."

Separately worth considering: a dedicated Chrome profile signed into only the
work account makes `/u/0/` unambiguous forever.

### 7.2 Email — `compose`

```js
const url =
  `https://mail.google.com/mail/u/${encodeURIComponent(settings.workGmailAddress)}/` +
  `?to=${encodeURIComponent(task.msgTo)}` +
  `&su=${encodeURIComponent(task.msgSubject)}` +
  `&body=${encodeURIComponent(task.msgBody)}` +
  (settings.emailBcc ? `&bcc=${encodeURIComponent(settings.emailBcc)}` : ``) +
  `&tf=cm`;
```

`tf=cm` opens the compose window. **Do not use `view=cm&fs=1`** — that pairing
is widely copied from older answers; `fs` no longer does anything and `view=cm`
has been superseded.

Newlines survive as `%0A` and render as line breaks in the composer.

The Bcc is read from Settings at click time, not snapshotted onto the task, so
changing it applies immediately to tasks already generated — the behavior you
want from a logging address.

### 7.3 Email — `thread`

```js
const q = `to:${task.msgTo} OR from:${task.msgTo}`;
const url =
  `https://mail.google.com/mail/u/${encodeURIComponent(settings.workGmailAddress)}/` +
  `#search/${encodeURIComponent(q)}`;
```

Search is by contact address only, not by subject — it never breaks when a
thread gets retitled in Gmail.

### 7.4 LinkedIn — slug derivation

```js
const slug = (prospect.linkedin || "")
  .match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1] || "";
```

**The record key is `linkedin`, not `linkedinUrl`** — verified 2026-09-02 against
`phase-2b-prospect-detail-view.md` P5 and `#pros-linkedin`. Anything assuming
otherwise reads a field that does not exist and silently disables every
LinkedIn button.

Tolerates trailing slashes, query strings and fragments. A profile URL that
does not match — a company page, a malformed paste — yields no slug and
disables the button with a message rather than opening something wrong.

### 7.5 LinkedIn — destinations

```js
// inmail, message
const url = `https://www.linkedin.com/messaging/compose/?recipient=${encodeURIComponent(slug)}`;

// connect
const url = `https://www.linkedin.com/in/${encodeURIComponent(slug)}/`;
```

If §9.3's verification finds the `compose` route dead, `inmail` and `message`
fall back to the profile URL and the toast tells Michael to click Message.

### 7.6 The Bcc gap on everything except email `compose`

Email `compose` gets the Bcc in the URL. Nothing else can: email `thread`
replies and all LinkedIn sends happen in composers Michael opens by hand, out
of Vantage's reach. LinkedIn has no Bcc at all.

For email `thread`, the Bcc line renders on the task with its own copy control
and the toast says "Body copied — remember Bcc."

**The proper fix, worth checking before building the workaround:** if
`youravdept.com` is a Google Workspace domain, an admin can set an outbound
content-compliance rule blind-copying all outbound mail to that address. That
covers every reply automatically, not just Vantage's, and reduces the in-app
Bcc to a convenience. Flagged as §9.2.

---

## 8. Failure paths

Each degrades to an explicit copy control plus a toast naming what happened.
Nothing fails silently.

| Risk | Guard |
| --- | --- |
| **URL length.** A long body pushes the Gmail URL past what it handles reliably. | Over ~2000 characters, open compose with To, Bcc and Subject only, copy the body, toast "Body copied — paste into Gmail." |
| **Popup blocked.** | `window.open` must be called **synchronously in the click handler**. No `await` before it. Clipboard writes, state saves and re-renders all happen after. This is the single most common way this feature breaks. |
| **Clipboard unavailable.** `navigator.clipboard.writeText` needs a secure context and a live user gesture. | Fall back to hidden-textarea + `document.execCommand('copy')`. If that fails too, select the field's text so Ctrl+C works. |
| **Blank `workGmailAddress`.** | Email buttons disabled, tooltip points at Settings. |
| **Blank `msgTo`.** | Button disabled. Flag at enrollment, not at click time — a prospect with no email address should not silently produce a dead email task. |
| **No LinkedIn slug.** | Button disabled with the reason shown. |
| **Over-limit body.** | Task created, counter red, button warns before opening. |

### 8.1 Tab reuse

```js
window.open(url, 'vantage-gmail');      // and 'vantage-linkedin'
```

Named targets mean each channel reuses the window Vantage opened for it.

**Stated plainly because it will otherwise arrive as a bug report:** a web page
cannot detect or focus a tab *you* opened by hand. Browsers forbid it, and no
amount of work in Vantage changes that. Reusing Vantage's own tab is the
closest achievable version of "go to it if it's already open."

Michael has not confirmed a preference between reused and always-fresh tabs.
**Assumption: reused.** One line either way.

---

## 9. Open items

**9.1 RESOLVED 2026-09-02 — the prospect email field exists.** Key `email`,
control `#pros-email`, field 3 of the 17 in `phase-2b-prospect-detail-view.md`
P5. Session 2B.7 built `prospectByEmail()` on it and made it unique. **No
prospect-model work is needed**; only the `[Email]` merge token has to be added
to the existing list, and that belongs to the producer half.

**9.2 Is `youravdept.com` on Google Workspace with admin access?** If yes,
§7.6's journaling rule solves the Bcc gap properly.

**9.3 Does `?recipient=<slug>` still open the composer?** One manual test before
it goes in BUILD_NOTES as settled. It is undocumented and unversioned.

**9.4 Is the work LinkedIn account free or Premium?** Free caps noted
invitations at ~5/month, which would make `connect` steps unusable at sequence
volume. Answer before building `connect`.

**9.5 Should email `thread` stop auto-copying, for consistency?** LinkedIn
steps copy only on an explicit click; email `thread` copies implicitly. Two
behaviors for the same gesture is a small papercut. Recommend aligning on
explicit, but it reverses an earlier decision so it is raised rather than
assumed.

**9.6 RESOLVED 2026-09-02 — the task CSV path is known.** `TASKS_CSV_HEADERS`
(`app.js` 1904) holds 13 columns; `taskCSVRow()` (1909) writes them;
`restoreTasksFromCSV()` (2703) reads them by header name through a `pick()`
helper. The five new columns append to all three. Scalar settings ride as
`["Option Type", "Option Value"]` rows in `prm_settings.csv` beside
`["Task Date Mode", …]` (2084), which is why §5.4's settings live on
`state.taskSettings` rather than in a new store — `wipeAllData()` already clears
that object as of 2B.7, so the coverage is inherited whole.

---

## 10. Decisions (resolved with Michael, 2026-09-02)

1. **Vantage never sends**, on any channel. It stages; Michael sends.
2. **Steps carry a channel.** Email and LinkedIn now; Text is out entirely, not
   stubbed.
3. **Email follow-ups use search plus clipboard**, not the Gmail API.
   Upgradeable if Phase 4 auth makes the API cheap.
4. **Email thread matching is by contact address only** — `to:X OR from:X`.
5. **Email subject comes from the step**, tokens resolved per contact.
   Follow-ups inherit it, displayed as `Re:`.
6. **Body is editable on the task**, saved per contact, template untouched.
7. **Every composed email is Bcc'd** to a single editable address, defaulting
   to `michaelh@youravdept.com`, read at click time.
8. **LinkedIn buttons open only.** Subject and body get separate, explicitly
   labelled copy controls.
9. **Only the first LinkedIn step carries a subject** — expressed through the
   `inmail` vs `message` kind rather than a positional rule.
10. **Connection requests are a first-class kind**, validated at 300 characters.
11. **This lands in Phase 3**, not Phase 1 and not a phase of its own.
    **Phase 2 keeps its number and scope, untouched.**
12. **The task side works standalone.** Outreach fields are typeable by hand on
    any task, so one-off outreach is supported and the consumer half is
    testable before the sequence half exists.

---

## 11. Backup coverage (DIRECTIVES §4)

Nothing here is done until all of this is covered:

- Five new task columns — `channel`, `msgKind`, `msgTo`, `msgSubject`,
  `msgBody` — in the task CSV export and restore. `msgBody` contains newlines
  and commas; `convertToCSV`'s quoting should handle it, but this needs a
  specific round-trip restore test, not an assumption.
- `channel`, `kind`, `subject` and `body` on sequence steps, in the sequence
  export/restore.
- `settings.workGmailAddress` and `settings.emailBcc` in the settings
  export/restore, with `emailBcc` defaulting to `michaelh@youravdept.com` on a
  restore predating the field.
- `ensureStateDefaults()` migration: existing tasks get `channel: ""` and empty
  strings for the rest; existing sequence steps default to
  `channel: "email"` with `kind` set by position.
- Restore router hook is `processRestoreFile()` in `app.js`.
  **Not `processSingleCSVContent()`** — that function has never existed, and the
  wrong name has already propagated through two documents.
- `CACHE_NAME` bump in `sw.js`.

---

## 12. Build order

Two tranches, per §1.1. **Everything in the first tranche is usable and
testable on its own**, driven by manual entry, before any sequencing work
begins.

### Tranche A — the consumer

1. Prospect email field, if §9.1 finds it missing — plus the `[Email]` token.
2. Task message fields + `ensureStateDefaults()` migration + CSV
   export/restore. Backup first, per DIRECTIVES §4.
3. Settings: `workGmailAddress`, `emailBcc`, plus UI.
4. Task editor manual-entry controls (§4.1), including auto-fill of To from a
   linked prospect.
5. Task inspector outreach block — render, editable body, copy controls,
   character counters and resolved-length validation.
6. Email URL builders and buttons, with every guard in §8.
7. LinkedIn slug derivation, URL builders and buttons. `connect` last, gated on
   §9.4.
8. **Test pass and stop point.** Over-limit body on each kind, popup blocker
   on, clipboard denied, blank settings, blank prospect email, malformed
   LinkedIn URL, a Bcc changed after tasks exist, orphan task with a typed
   address, and a full backup/restore round trip.

At the end of Tranche A the feature is complete for one-off outreach and every
risky mechanism is proven. Nothing below can break it; the work only adds a
second way to fill the same fields.

### Tranche B — the producer

9. Sequence step `channel`, `kind`, `subject`, `body` + step export/restore.
10. Sequence builder: channel picker, kind picker, conditional subject field,
    template-level character counters against §6.1, per-step defaults (§3.1).
11. Token resolution at task creation, writing the same task fields Tranche A
    already reads.
12. Test pass: a multi-step mixed-channel sequence end to end, resolved-length
    overflow on a long company name, and a restore round trip covering steps
    and generated tasks together.

---

## 13. Out of scope

- **Text / SMS.** Not built, not stubbed, no reserved value in the channel
  enum. Adding it later means revisiting the step model, which is the accepted
  cost of not designing around an undefined use case.
- Sending, on any channel.
- Tracking: opens, replies, acceptance rates, bounces.
- Gmail API, OAuth, drafts created by Vantage.
- LinkedIn API or any automation of LinkedIn actions. Vantage opens a page;
  Michael does the rest. Automated LinkedIn messaging violates their user
  agreement and risks the account.
- Reconstructing reply-all recipient lists.
- Attachments.
- Any email provider other than Gmail.
- Mobile. These URLs do not reliably open a compose window in mobile Safari.
