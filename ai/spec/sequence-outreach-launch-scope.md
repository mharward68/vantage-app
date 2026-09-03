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

⚠️ **STILL REQUIRED AFTER 2026-09-03, AND FOR `compose` ONLY.** Michael's
instruction is to *"assume gmail is open and on the correct account."* **Keep
the explicit address anyway** — it costs one parameter, it is what makes the
assumption safe rather than merely likely, and the failure it prevents is
silent and delayed. §7.3 no longer builds a URL at all, so this now applies to
exactly one kind.

⛔ **AND THE "IF NOT, FIRE A QUICK POPUP" HALF CANNOT BE BUILT. THIS IS A
BROWSER BOUNDARY, NOT A SCOPE DECISION.** A page on `localhost:5000` **cannot
detect whether a `mail.google.com` tab is open, nor which Google account is
signed into it.** Cross-origin, no API, no workaround — and every technique that
looks like it might work (probing the URL, reading a frame, timing a fetch) is
either blocked or produces an answer that is wrong often enough to be worse than
none. **A popup conditional on Gmail being closed is not implementable.**

**What IS available, and it is the honest version of the same intent:**

1. **A static line in the outreach block** — *"Assumes Gmail is open on
   `<workGmailAddress>`"* — always shown, costs nothing, needs no detection.
   **Recommended.**
2. **Nothing.** `compose` opens Gmail itself, so it works whether or not Gmail
   was already open; and after §7.3, `thread` opens nothing at all. **The
   assumption is about Michael's habit, not about anything the app does** —
   which is why the conditional dissolved rather than being descoped.

**Separately worth considering:** a dedicated Chrome profile signed into only
the work account makes `/u/0/` unambiguous forever.

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

### 7.3 Email — `thread` · ⛔ THE SEARCH LINK IS REPLACED. NO URL IS BUILT.

**Michael, 2026-09-03: *"I believe the search link was to search email address
in my gmail so, replace."*** The `#search/` deep link, its `to:X OR from:X`
query and the `/u/<address>/` targeting for this kind are all **cut**. A
`thread` task opens nothing.

```
Copy address  ->  clipboard = task.msgTo      // he searches Gmail himself
Copy message  ->  clipboard = task.msgBody    // he pastes into Reply All
```

**Both are plain `navigator.clipboard.writeText()` calls on fields §5.1 already
defines.** There is no URL builder, no account targeting and no popup blocker in
this path at all — which removes one of the two failure modes the phase plan
named for Session 3.3.

⚠️ **THE BUTTONS ARE NOT A UI CHOICE — THEY ARE REQUIRED BY THE BROWSER.** A
clipboard write needs a **real user gesture**; a page cannot put something on
the clipboard on its own, on load, or when a task is opened. **So "the app
copies and Michael pastes" is exactly two buttons, and "just have it already on
the clipboard" is not an option that exists.** Recorded because it looks like a
convenience that was skipped rather than a constraint.

⚠️ **THERE IS ONE CLIPBOARD, SO THE TWO BUTTONS ARE A SEQUENCE, NOT A PAIR —
AND 3.2's LAYOUT SHOULD SAY SO.** The second copy overwrites the first, so the
real order is `Copy address` → paste → open the thread → `Copy message` → paste.
**Michael cannot stage both and paste them one after the other.** Present them
in that order, top to bottom or left to right, and do not render them as two
equivalent options side by side — that shape invites clicking both and losing
the first. **The failure is silent** (the address is simply gone from the
clipboard) and it looks like the first button did not work.

⛔ **THERE IS NO PASTE BUTTON, AND THERE CANNOT BE ONE. CONFIRMED BY MICHAEL
2026-09-03: *"You copy and then I will go to the message and hit ctrl V."***
Recorded because his earlier phrasing was *"a button that is a copy and paste of
the message"*, and a session reading that line alone could try to build a paste.
**A page cannot put text into another origin's input** — same boundary as the
Gmail-detection note in §7.1, arrived at from the other direction. **Vantage's
job ends at the clipboard; the paste is Ctrl+V in Gmail and is his.**

**What replaced what, so nobody restores the old builder as a missing feature:**
the search link was *one* click that landed him in a searched Gmail; the copy
button is *one* click that lets him search a Gmail he already has open. **His
workflow starts inside Gmail, so the link was solving a problem he does not
have.**

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

**9.2 RESOLVED 2026-09-03 — YES, Google Workspace, and `michaelh@youravdept.com`
is admin.** So §7.6's proper fix is available: an **outbound content-compliance
rule blind-copying all outbound mail** to the logging address. ⚠️ **THIS IS A
SCOPE REDUCTION FOR SESSION 3.3, NOT A NOTE.** The rule covers every reply
automatically — including ones sent from Gmail with Vantage nowhere in sight —
which reduces the in-app Bcc to a convenience and makes §7.6's workaround
(the rendered Bcc line, its own copy control, and the "Body copied — remember
Bcc" toast on email `thread`) **unnecessary rather than merely redundant.**

✅ **CLOSED 2026-09-03 — Michael: *"Gotcha. Taken care of. Disregard."*** The
compliance rule is handled outside Vantage. **SESSION 3.3 DROPS §7.6's
WORKAROUND ENTIRELY** — no rendered Bcc line on email `thread`, no separate Bcc
copy control, no "Body copied — remember Bcc" toast. That is a real scope
reduction, not a deferral.

⚠️ **WHAT IS KEPT, AND SAY SO IF THIS READING IS WRONG: the `compose` Bcc stays.**
Decision §10.7 still holds and it costs one URL parameter (`&bcc=`), so the
in-app Bcc remains as belt-and-braces on the one path that can carry it. **What
was dropped is the WORKAROUND for the paths that cannot** — which is the only
part the compliance rule makes redundant.

**9.3 Does `?recipient=<slug>` still open the composer?** One manual test before
it goes in BUILD_NOTES as settled. It is undocumented and unversioned.

**9.4 RESOLVED 2026-09-03 — Premium, with Sales Navigator.** The ~5/month free
invitation cap does not apply, so **`connect` stays a first-class kind and 3.4
builds it.** The risk register's "may be cut mid-session on the account-tier
answer" is retired.

✅ **AND THE SECOND URL SPACE IS A NON-ISSUE — Michael, 2026-09-03: *"I only
want LinkedIn URLs saved."*** The `linkedin` field holds **public profile URLs
(`/in/<slug>`)**; Sales Navigator is how he FINDS people, not what he SAVES.
**§7.4's regex is correct as written, `connect` is built, and no second branch
is needed.** ⛔ **Do not add Sales Navigator URL handling** — it would be
building for data the field is not supposed to contain.

**THE CONSEQUENCE IS A DATA-HYGIENE RULE RATHER THAN A CODE BRANCH**, and it is
worth stating because it changes what §7.4's failure MEANS: a `linkedin` value
that yields no slug is now **a data error to fix, not a format to support.**
The disabled button and its message are the right behaviour and double as the
signal. **Still worth running the probe below ONCE** — not to decide the design,
but to confirm the data matches the intent. If a meaningful number of the 651
hold `sales/lead` URLs or anything else, that is cleanup he would want to know
about, and the 2B.10 drill session is already going to be in the app.

*The original finding, kept because it is the reason the probe exists:*

⚠️ **SALES NAVIGATOR IS A SECOND URL SPACE AND §7.4's SLUG REGEX DOES NOT MATCH IT.** Sales Navigator identifies people as
`linkedin.com/sales/lead/<opaque-id>`, not `linkedin.com/in/<slug>`. The
matcher is `/linkedin\.com\/in\/([^/?#]+)/i` — a lead URL yields **no slug**,
which disables every LinkedIn button on that prospect with a message. **That is
the designed failure and it is safe; the question is how OFTEN it fires**, and
that depends entirely on where Michael copied his `linkedin` values from.

**Answerable in one console line against the production database, and the
2B.10 drill session is already going to be in the app:**

```js
const v = state.prospects.map(p => p.linkedin || "");
({ total: v.length, blank: v.filter(x => !x).length,
   inSlug: v.filter(x => /linkedin\.com\/in\//i.test(x)).length,
   salesLead: v.filter(x => /linkedin\.com\/sales\//i.test(x)).length,
   other: v.filter(x => x && !/linkedin\.com\/(in|sales)\//i.test(x)).length })
```

**Read the result as DATA HEALTH, not as a design input** (see the resolution
above): `inSlug` should be essentially all of the non-blank values. Anything in
`salesLead` or `other` is a record to fix by hand, not a format to support.

**9.5 RESOLVED 2026-09-03 — Michael: *"Thread is for email only."*** The
question's premise was wrong: there is no shared gesture to align, because
`thread` is not a LinkedIn concept at all. **Email `thread` keeps its implicit
copy; LinkedIn keeps its explicit copy controls; the earlier decision stands
un-reversed.** ⛔ **Do not re-raise this as a consistency papercut** — two
channels behaving differently is not an inconsistency when the behaviour
belongs to only one of them.

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

### Added 2026-09-03

13. **The Bcc default is `michaelh@youravdept.com`** — local part confirmed by
    Michael 2026-09-03. Seeded by Session 3.1. See §9.7 for why the spelling
    gets one on-screen check rather than a fourth question.
14. **The Workspace content-compliance rule is SET.** §7.6's workaround is cut
    from 3.3; the `compose` Bcc stays.
15. **LinkedIn is Premium with Sales Navigator, and only `/in/` profile URLs
    are saved.** `connect` is built; §7.4 is correct as written; Sales
    Navigator URLs are a data error, not a supported format.
16. **Email `thread` is TWO COPY BUTTONS — address and message — and Vantage
    reads no mail.** The thread-content-in-the-task request is **withdrawn**,
    and the Gmail read scope with it. `compose` keeps its prefilled composer.
17. **The search link is REPLACED, not supplemented** (2026-09-03). §7.3 builds
    no URL and a `thread` task opens nothing. **Two buttons, not three.**
18. **Gmail is ASSUMED open on the work account.** ⛔ The "otherwise pop up a
    reminder" half **cannot be built** — a page cannot see across origins to a
    Gmail tab or its signed-in account. **A static hint line replaces it;**
    see §7.1.

---

## 9.7 ⛔ THE BCC ADDRESS SPELLING — ONE CHARACTER, AND IT FAILS SILENTLY

Raised 2026-09-03 at the Phase 2B close. **This document, §10.7 and Session
3.1's input line all say `michaelh@youravdept.com`. Confirming it on
2026-09-03, Michael wrote `michalh@youravdept.com`** — no `e`. One of the two
is wrong and this scope cannot tell which.

**Why it is worth a question rather than a guess:** the Bcc is the logging
address for every piece of outreach the app stages. A wrong address does not
throw, does not warn, and does not appear in any Done-when — **it either
bounces silently or delivers someone else's mail to a stranger**, and the
symptom is "my sent-mail archive has a hole in it" discovered weeks later.
`michaelh@` also matches the admin account named in §9.2, which is weak
evidence for it and not proof.

**RESOLVED 2026-09-03, and the resolution is worth recording because a THIRD
spelling appeared while settling it.** Michael confirmed *"michaelh@youavdept is
correct"* — local part **`michaelh`** (matching this document), domain written
**`youavdept`**, missing the `r`. **The value taken is
`michaelh@youravdept.com`**: `youravdept.com` is his own company domain and
appears throughout the repo, including `BUILD_NOTES.md`'s note that it is
deliberately kept OFF the free-email blocklist because it is a real company he
wants matched. Three typings produced three spellings, so the local part is
confirmed and the domain is settled by corroboration rather than by the typing.

⛔ **THE CHECK IS ON SCREEN, NOT ANOTHER QUESTION.** Asking a fourth time buys
nothing — the failure is in transcription, and re-typing is the thing that keeps
failing. **Session 3.1's Done-when must render the seeded value in the Settings
field and have Michael eyeball it once**, which tests the string that actually
shipped rather than the string he retyped.

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

---

## 9.8 ✅ EMAIL FOLLOW-UPS: TWO COPY BUTTONS. RESOLVED 2026-09-03, AND IT COSTS LESS THAN WHAT IT REPLACES

**Michael's design, 2026-09-03:** *"a button that simply copies the email
address and I will handle the rest of the email search and open the appropriate
message and hit reply all. Then another button on the task that is a copy and
paste of the message. I will then review and edit the message and send."*

⛔ **THIS DROPS THE THREAD-CONTENT-IN-THE-TASK REQUEST ENTIRELY, AND WITH IT THE
GMAIL SCOPE CLIFF.** Vantage reads no mail, needs no restricted scope, and buys
no annual third-party security assessment. **Recorded explicitly because it was
asked for one message earlier** — the earlier request is withdrawn, not deferred,
and a later session should not resurrect it as an unbuilt idea.

### What it is

On an email **`thread`** task, two buttons, both plain clipboard writes:

| Button | Copies | He then does |
| --- | --- | --- |
| **Copy address** | `task.msgTo` | searches Gmail himself, opens the right message, Reply All |
| **Copy message** | `task.msgBody` | pastes into the reply, reviews, edits, sends |

### ⚠️ IT NEEDS NO NEW FIELDS AND NO URL BUILDER — IT IS A SCOPE REDUCTION

**Both values already exist in §5.1.** `msgTo` and `msgBody` are two of the five
fields 3.1 lands. **So the entire email follow-up path becomes two clipboard
writes against fields that are already there** — no `#search/` deep link to
construct, no `/u/<address>/` account targeting to get right for this kind, and
nothing new in the data model.

**And it makes email look like LinkedIn**, which is where §9.5 was groping and
could not get to: decision §10.8 already says *"LinkedIn buttons open only.
Subject and body get separate, explicitly labelled copy controls."* **Email
`thread` now works the same way — arrived at from workflow rather than from
consistency, which is why the consistency framing of §9.5 got nowhere.**

### ✅ THE OPEN QUESTION IS CLOSED — REPLACE. TWO BUTTONS, NOT THREE.

**Michael, 2026-09-03: *"I believe the search link was to search email address
in my gmail so, replace."*** §7.3's builder is **cut**, not kept beside the copy
button. **The reason it was worth asking rather than inferring is the reason the
answer is right:** the search link was one click that landed him in a *searched*
Gmail, and his workflow starts inside a Gmail that is *already open* — so it was
solving a problem he does not have, and keeping it would have been a button that
looks useful and is never the one he reaches for.

### ⚠️ THE RISK MOVES RATHER THAN DISAPPEARING

This trades a **popup-blocker** risk for a **clipboard** risk, and the phase plan
already names both as 3.3's runner-up danger: *"the popup-blocker and clipboard
guards are the kind that pass every console check and fail on the user's
machine."* **`navigator.clipboard.writeText()` requires a secure context and a
real user gesture**, returns a promise that can reject silently, and on
`localhost` behaves differently from a hosted origin — which matters at Phase 4.
**Every copy button needs a visible success state and a fallback, and 3.3's
Done-when must exercise them on the real machine rather than in the console.**
A copy that silently fails looks exactly like a copy that worked.

### What is unchanged

**Email `compose` (the first touch) keeps §7.2's prefilled composer** — one
click, `to` / `su` / `body` / `bcc` all staged, no reading involved, nothing
about it touched by this decision. **The two-button design is the `thread`
answer, not an email-wide replacement.** Confirm if that reading is wrong.

