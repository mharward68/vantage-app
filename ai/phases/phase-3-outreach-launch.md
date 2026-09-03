# Phase 3: Sequencing — Outreach Launch compartment

**Planned:** 2026-09-02 · Prompt 3
**Scope:** `ai/spec/sequence-outreach-launch-scope.md` (drafted 2026-09-02)
**Depends on:** Phase 1 (closed 2026-08-30), Phase 2A, Phase 2B

> ## ⛔ HARD PREREQUISITE — Phase 2B has NOT closed as of 2026-09-02
>
> Verified against the tree while writing this plan, not inferred:
>
> - `ai/AIContext.md` is the **Session 2B.9** handoff, dated 2026-09-01 11:05. `CACHE_NAME` is **v107**.
> - **2B.10, the phase close, has not run** and is explicitly "ALWAYS LAST."
> - Seven review-response sessions — **2B.11 through 2B.17** — are planned in `ai/phases/phase-2b-review-response-plan.md` and none has run.
> - Two of 2B.10's own owed items are Phase 3's starting conditions: the `DECLARATIONS.md` seventh-view amendment, and the instruction that **Phase 3 needs an intake, not a Prompt 3**.
>
> **This plan is complete and correct for the compartment it covers; it may not start.**
> Run 2B.11–2B.17, then 2B.10, then the Phase 3 intake below.

> ## ⚠️ THIS IS A PARTIAL PHASE PLAN — one of Phase 3's two compartments
>
> Phase 3 is Sequencing. It has two halves and only one of them is scoped:
>
> | Compartment | Scope | Status |
> | --- | --- | --- |
> | **Outreach launch** — what a task carries and how it reaches Gmail or LinkedIn | `ai/spec/sequence-outreach-launch-scope.md` | Scoped. **Planned below as 3.1–3.4.** |
> | **Enrollment and scheduling** — sequences, steps, enrollments, business-day advance | `claude/sequence-feature-scope.md` — **SUPERSEDED** | **Not scoped. Needs a Prompt 1 intake.** |
>
> `AIContext.md` and the 2B run sheet both already say Phase 3 needs an intake.
> This plan does not replace it. It plans the half that can be planned, because
> that half has **no dependency on sequences existing** — see the Goal.
>
> **Session numbers.** The close is **3.5** by this plan's count and it always
> runs last. Enrollment-compartment sessions and the outreach *producer*
> sessions take **3.6 and up** when the intake produces them, exactly as 1.9–1.11
> appended above 1.8 and 2B.11–2B.17 above 2B.10. 3.5 keeps its number and still
> runs last.

---

## Goal — what's true after that isn't now

- **A task can carry a ready-to-send message** — channel, kind, recipient, subject and body — and those five fields survive export, wipe and restore.
- **Any task's message can be typed by hand.** There is no dependency on sequences. A one-off email to a prospect gets the same Bcc, the same validation and the same launch button a sequenced one will.
- **One click opens Gmail composed** — recipient, Bcc, subject and body prefilled, on the work account, with the body's line breaks intact.
- **One click opens Gmail searching a contact's history**, for a follow-up that belongs in an existing thread.
- **One click opens LinkedIn on the right person** — the message composer for an InMail or DM, the profile for a connection request — with subject and body one labelled click from the clipboard each.
- **Every message is validated against its channel's real ceiling**, at the moment it is typed and again when a sequence resolves it, so nothing is discovered mid-paste.
- **The Bcc address is a setting, not a constant**, and changing it applies to tasks that already exist.
- **`state.taskSettings` gains two keys and the app gains no new store.**

## Out of scope

- **Sending.** Vantage stages; Michael sends. On every channel, permanently — scope §13.
- **Text / SMS.** Not built, not stubbed, **no reserved value in the channel enum.** Scope §13, decided not deferred.
- **The Gmail API, OAuth, or drafts created by Vantage.** Scope §2. Revisit only if Phase 4 auth makes it cheap.
- **Any LinkedIn API or automated LinkedIn action.** Vantage opens a page; Michael does the rest. Automation there violates their user agreement and risks the account.
- **Sequences, steps, enrollments, and business-day advance.** The other compartment. Nothing below creates or reads a sequence entity.
- **The `sequences` tab in `PROSPECT_DETAIL_TABS`.** It is `enabled: false` with `render: null` and stays that way — it belongs to the enrollment compartment, which is what fills it.
- **Tracking of any kind** — opens, replies, acceptances, bounces.
- **Routing.** P9 still holds and is not relaxed by anything here.

## Assumptions

Every one is reversible.

1. **The consumer is built before, and independently of, the producer.** Sessions 3.1–3.4 deliver a complete, usable feature driven by manual entry. The producer half — channel pickers in the sequence builder, per-step templates, token resolution — is planned by the enrollment intake and only ever *writes the fields 3.1 defines*. Reasoning: every genuinely risky mechanism here (URL length, popup blocking, clipboard permissions, LinkedIn's undocumented compose route, the restore round trip) is proven against real one-off use before any sequencing machinery sits on it. Reversible: if the intake reorders the phase, 3.1–3.4 stand unchanged, because nothing in them imports a sequence concept.

2. **Manual entry is permanent, not scaffolding.** It is how a one-off email gets the Bcc and the validation without building a one-step sequence. It is not removed when the producer lands.

3. **`state.taskSettings` gains the two settings; no new store is created.** The codebase's own instruction, written at `app.js` 1268–1286: a second consumer joins an existing record rather than starting a sibling store, and renaming the field later is "a rename with a defaults migration, not a new store." `taskSettings` is already exported (`app.js` 2084), restored, and — since 2B.7 — cleared by `wipeAllData()`. Two new keys inherit all of that. Reversible: promoting them to their own object later is a defaults migration.

4. **The five task fields are flat, not a nested object.** The backup layer is CSV and `TASKS_CSV_HEADERS` is a flat 13-column list. Five columns restore legibly and diff readably; one JSON blob does not. Reversible in either direction, and cheaper to do now.

5. **`source` and `sourceRef` already exist on the task record** (`app.js` 1923–1924, defaulting to `"manual"`) and are **not** repurposed. They record where a task came from. `channel` records what the task *is*. A sequence-written task will set both; a hand-typed outreach task sets `channel` and leaves `source` as `"manual"`. Conflating them would make "did a sequence make this" unanswerable.

6. **Field-name neutrality is decided now.** `msgTo` / `msgSubject` / `msgBody`, never `emailTo` / `emailSubject` / `emailBody`. The scope's first draft used the email names and they were wrong the moment LinkedIn arrived. Nothing is built, so this costs nothing today and is a CSV-column migration later.

7. **The outreach block is a new section in the task editor, and `notes` is untouched.** `notes` keeps its Phase 1 meaning — free text Michael types — and is still exported as the `"Notes"` column. The message body is a separate field. Reasoning: `restoreTasksFromCSV()` deliberately does not trim the Notes value because "Notes may legitimately hold a multi-paragraph body" (`app.js` 2714–2716); overloading it with a structured email body makes that column two things at once.

8. **Verification of a launch button is verification of the URL string, not of Gmail.** A Done-when cannot paste Gmail's DOM. Each session builds the URL, pastes it, and decodes it back to prove every part survived; **one** real open per channel is confirmed by screenshot. Stated as an assumption because it is a genuine weakening of the usual standard and it should be visible, not silent.

9. **Review point is after 3.4.** That is the session at which the feature is complete and usable for real outreach, which makes it this phase's 1.5 and 2B.6. Expect it to produce sessions; they take 3.6+.

---

## Frozen contracts — written literally; later sessions treat as read-only

> ## ⛔ THREE OF THESE WERE AMENDED ON 2026-09-03. READ § Frozen-contract amendments BELOW BEFORE BUILDING Q3, Q4 OR Q5.
>
> **Q3, Q4 and Q5 still say Vantage emits a Bcc. It does not.** The contracts
> below are left as originally written — that is this project's convention, and
> the amendment record is the mechanism — but **a session that builds Q4's
> `&bcc=` term because it read this section and not the amendments has shipped
> the wrong thing.** The amendments section is immediately after Q8.

### Q1 — The task's five outreach fields

```js
task.channel    = "email" | "linkedin" | "";   // "" = not an outreach task
task.msgKind    = "compose" | "thread" | "connect" | "inmail" | "message" | "";
task.msgTo      = "sally.quinn@acmellc.com";   // or a LinkedIn profile URL
task.msgSubject = "AV production for the Acme Summit";   // resolved, NO "Re:" prefix
task.msgBody    = "Dear Sally,\n\n…";          // resolved, editable
```

- **All five hold literal text.** A task never stores an unresolved merge token — Phase 1's rule, and it holds identically whether a sequence wrote the value or Michael typed it. There is one code path, not two.
- `channel === ""` hides the whole block and every button. It is the default for a manually created task and the migrated value for every task that predates this feature.
- **`msgKind` is one field, not two.** The five values are unambiguous across both channels; an email mode plus a LinkedIn kind would be two fields that must never disagree.
- **`msgSubject` never stores `"Re:"`.** The prefix is display-only, added by the renderer for `msgKind === "thread"`. Storing it means a second follow-up reads `"Re: Re: …"`.
- `source` / `sourceRef` are **not** touched — Assumption 5.

### Q2 — Channel, kind, and what each one means

| `channel` | `msgKind` | Opens | Subject? | Body ceiling |
| --- | --- | --- | --- | --- |
| `email` | `compose` | Gmail compose, **prefilled** | Yes | URL length, Q6 |
| `email` | `thread` | Gmail search for the contact | Inherited, shown as `Re:` | none |
| `linkedin` | `connect` | LinkedIn **profile** page | No | **300** |
| `linkedin` | `inmail` | LinkedIn composer | Yes | **1900** |
| `linkedin` | `message` | LinkedIn composer | No | **3000** |

- `connect` is a connection request with a note. Different destination, different ceiling, different gesture — it is its own kind, not a message variant.
- The kind, not the step's position, decides whether a subject exists. This is what delivers "only the first LinkedIn step carries a subject" without a positional rule anywhere in the code.

### Q3 — Settings: two keys, no new store

```js
state.taskSettings.workGmailAddress = "";   // "" disables every email button
state.taskSettings.emailBcc         = "michaelh@youravdept.com";
```

- Defaults seeded in `ensureStateDefaults()` beside `dateMode` (`app.js` 1262–1267).
- **Backup coverage is two rows in `prm_settings.csv`**, written at `generateSettingsCSV()` beside `["Task Date Mode", …]` (`app.js` 2084), and read back by the same restore leg:

```js
rows.push(["Outreach Work Gmail", (state.taskSettings && state.taskSettings.workGmailAddress) || ""]);
rows.push(["Outreach Bcc",        (state.taskSettings && state.taskSettings.emailBcc) || ""]);
```

- **`wipeAllData()` needs no new line.** It clears `state.taskSettings` whole, as of 2B.7. That is the entire reason these keys go there and not into a store of their own.
- **`emailBcc` is read at click time, never snapshotted onto a task.** Changing it applies immediately to tasks that already exist, which is the only sane behaviour for a logging address.
- Blank `emailBcc` omits the parameter and hides the Bcc line. Blank `workGmailAddress` disables email buttons with a message naming Settings — it never silently falls back to `/u/0/`.

### Q4 — The URL builders

**Account targeting.** Gmail accepts an address in place of the account index and redirects to whichever `/u/N/` that account currently occupies. `/u/0/` reflects sign-in order and renumbers silently when an account is added — a wrong-inbox bug that surfaces months later as "the button stopped working."

```js
function gmailBase() {
  return `https://mail.google.com/mail/u/${encodeURIComponent(state.taskSettings.workGmailAddress)}/`;
}

// msgKind "compose"
function gmailComposeUrl(task) {
  const bcc = state.taskSettings.emailBcc;
  return gmailBase() +
    `?to=${encodeURIComponent(task.msgTo)}` +
    `&su=${encodeURIComponent(task.msgSubject)}` +
    `&body=${encodeURIComponent(task.msgBody)}` +
    (bcc ? `&bcc=${encodeURIComponent(bcc)}` : ``) +
    `&tf=cm`;
}

// msgKind "thread"
function gmailSearchUrl(task) {
  const q = `to:${task.msgTo} OR from:${task.msgTo}`;
  return gmailBase() + `#search/${encodeURIComponent(q)}`;
}
```

**`tf=cm` is the compose parameter. `view=cm&fs=1` is NOT.** That pairing is widely copied from older answers; `fs` no longer does anything and `view=cm` has been superseded. A session that "fixes" this by restoring the old pair has broken it.

Newlines survive as `%0A` and render as line breaks in the composer.

**LinkedIn.**

```js
function linkedinSlug(prospect) {
  return (prospect && prospect.linkedin || "")
    .match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1] || "";
}
```

**The prospect record key is `linkedin`, not `linkedinUrl`** — verified against P5 of `phase-2b-prospect-detail-view.md` and `#pros-linkedin`. Anything that assumes otherwise reads a field that does not exist and silently disables every LinkedIn button.

```js
// inmail, message
`https://www.linkedin.com/messaging/compose/?recipient=${encodeURIComponent(slug)}`
// connect
`https://www.linkedin.com/in/${encodeURIComponent(slug)}/`
```

**The `?recipient=` composer route is undocumented.** It works today and is not a supported API. Session 3.4 verifies it live before relying on it, and its fallback — the profile URL plus a toast saying to click Message — is written in the same session, not deferred. A no-match slug disables the button with the reason shown; it never opens something wrong.

### Q5 — The launch handler, and the order operations must happen in

```js
window.open(url, "vantage-gmail");     // or "vantage-linkedin"
```

- **`window.open` is called SYNCHRONOUSLY inside the click handler. No `await` before it, ever.** Clipboard writes, `saveState()` and every re-render happen after. This is the single most likely way this feature ships broken, and it fails only under a popup blocker — which means it passes every console check.
- Named targets mean each channel reuses the window Vantage opened for it.
- **A web page cannot detect or focus a tab the user opened by hand.** Browsers forbid it. Reusing Vantage's own tab is the closest achievable version of "go to it if it's already open," and a future session must not attempt to "fix" this.
- **LinkedIn buttons open only — they never touch the clipboard.** With two things to paste and one clipboard, an implicit copy means never knowing what is on it. Every LinkedIn copy is a separate, labelled click.
- Email `thread` copies the body on open and toasts "Body copied — remember Bcc." (Whether this should also become explicit, for consistency with LinkedIn, is scope §9.5 and is Michael's call, not a session's.)
- Clipboard writes go through one helper: `navigator.clipboard.writeText`, falling back to a hidden textarea plus `document.execCommand("copy")`, falling back to selecting the field's text. Never assume the first works — it needs a secure context and a live gesture.

### Q6 — Validation, at two moments

| `msgKind` | Subject | Body |
| --- | --- | --- |
| `connect` | — | 300 |
| `inmail` | 200 | 1900 |
| `message` | — | 3000 |
| `compose` | — | assembled URL ≤ ~2000 chars |

- **Validate when typed, and again when resolved.** A 290-character connection note plus a company called "Northwestern Mutual Financial Network" overflows. The producer half validates the *template*; this half validates the *literal value on the task*, and both are needed.
- **An over-limit value is never blocked or truncated.** The counter goes red and the button warns before opening. Blocking would silently drop a step out of a sequence, which is worse than a visible over-length task.
- Over the compose URL ceiling: open with To, Bcc and Subject only, copy the body, toast "Body copied — paste into Gmail." Degrade, never fail silently.

### Q7 — Manual entry and auto-fill

The task editor gains, below its existing fields: **Channel** (None / Email / LinkedIn, defaulting to None), **Kind** (the options valid for that channel), **To**, **Subject** (only for kinds that have one), **Body** with its live counter.

- **To auto-fills from the linked prospect.** Session 1.9 gave tasks a prospect link; choosing Email fills from `prospect.email`, choosing LinkedIn from `prospect.linkedin`. **The field stays editable** — auto-fill is a starting value, not a lock — and an orphan task simply requires typing it.
- Auto-fill fires on channel change only, and **only into an empty field.** It never overwrites a value already there, typed or sequence-written.
- `createElement` / `appendChild` throughout. `innerHTML +=` destroys listeners and has bitten this codebase.

### Q8 — What does not change

- **No new top-level store.** No `state.outreachSettings`, no `state.emailTemplates`. Q3 is the whole persistence story beyond the five task columns.
- **No new CSV file.** Five columns appended to `TASKS_CSV_HEADERS`, two rows added to `prm_settings.csv`. Nothing joins the ZIP bundle.
- **`notes` is not repurposed** — Assumption 7.
- **`source` / `sourceRef` are not repurposed** — Assumption 5.
- **No routing.** P9 holds unchanged. A recipient address must never enter a URL, hash or `document.title` — imported `prospectId` values are already email addresses (`app.js` 2275, 10487) and this feature adds real addresses to a second surface. The Gmail and LinkedIn URLs are `window.open` targets, never `location.hash`.
- **`#modal-prospect` is untouched.** So is every Phase 2B surface.
- **The `sequences` tab stays `enabled: false`.**
- **No email is sent, and no draft is created via any API.**

---

## Frozen-contract amendments

*A frozen contract is not modified mid-phase by a session. It is amended by Michael, in writing, with the reasoning in `DECISIONS.md` and the record here. This section is the one place a later session learns that a contract above no longer describes what gets built. Following the 2B P5 / P8 / P9 precedent.*

### A1 — 2026-09-03 · **Q3, Q4, Q5: Vantage emits no Bcc.** Authorised by Michael at the close of Session 3.1.

**His words:** *"Google Workspace Bcc rule is in place. Vantage does not Bcc emails."* The Workspace outbound content-compliance rule blind-copies every message sent from the work account — including replies typed straight into Gmail — so the logging the Bcc existed to provide already happens, and happens in cases Vantage could never reach. Full reasoning, rejected alternatives and the reversal condition: `ai/DECISIONS.md`, 2026-09-03.

| Contract | As frozen | **As amended** |
| --- | --- | --- |
| **Q3** | `state.taskSettings.emailBcc = "michaelh@youravdept.com"`, seeded, exported as `["Outreach Bcc", …]`, restored, read at click time | **The key does not exist.** No seed, no `OUTREACH_BCC_DEFAULT`, no settings row, no restore leg. ⚠️ **`workGmailAddress` is untouched** — it targets the right inbox and has nothing to do with this. |
| **Q4** | `gmailComposeUrl()` appends `(bcc ? \`&bcc=${encodeURIComponent(bcc)}\` : \`\`)` | **The term is deleted.** Not made conditional on a blank setting — **the parameter does not exist.** Everything else in Q4 stands, `tf=cm` included. |
| **Q5** | email `thread` copies the body and toasts *"Body copied — remember Bcc."* | **Copy-on-open stands; the toast reads "Body copied."** Only the Bcc half of the message goes. |

**Consequences a later session must not re-derive:**

- **Open Risk 6 is RETIRED, not mitigated.** It was the risk this rule removes.
- **Scope §7.6 and §9.2's "scope reduction for 3.3" is now this amendment.** Do not re-open it as an unanswered question — it is answered.
- **Scope §9.7 (the Bcc spelling) is MOOT.** Michael confirmed `michaelh@youravdept.com` correct on screen at 3.1's close and the value was retired the same hour. **The section stays as the record of how to settle a silent-failure value** — render it from live state and have the human read it — which is the part worth keeping.
- ⛔ **IT COSTS A REPAIR PASS ON A SHIPPED SESSION. SEE SESSION 3.1b BELOW.**

---

## Sessions

### Session 3.1 — Task outreach fields, settings, and their backup coverage

- **Compartment:** DATA · **Depends on:** Phase 2B closed
- **Goal:** Q1's five fields and Q3's two settings exist, default correctly, survive a reload, and survive export → `wipeAllData()` → restore character-identical. No UI yet.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. `ensureStateDefaults()`: seed the two `taskSettings` keys beside `dateMode` (`app.js` 1262). **No new store, no `wipeAllData()` line** — Q3.
  2. Task migration: every existing task gets `channel: ""` and `""` for the other four. Absent-key tolerant on read, so a task object from an older backup is never rejected.
  3. Append five headers to `TASKS_CSV_HEADERS` (`app.js` 1904) and five values to `taskCSVRow()` (1909). **Append at the end** — a restore reads by header name via `pick()`, but a human reading a diff reads by position.
  4. `restoreTasksFromCSV()` (2703): five `pick()` calls, defaulting to `""`. Follow the existing pattern exactly, including not trimming `msgBody` — like Notes, its whitespace is content.
  5. Two rows in `generateSettingsCSV()` per Q3, and their restore leg.
  6. Bump `CACHE_NAME`. **Budget two bumps.**
- **Inputs needed from me:** the Bcc default is `michaelh@youravdept.com` — confirm before it is written as the seed.
- **Done when:**
  - Console: paste `state.taskSettings` showing all three keys with the seeded defaults.
  - Console: set all five fields on one real task, `saveState()`, reload, paste them back unchanged.
  - Console: paste `TASKS_CSV_HEADERS.length` (**18**) and one `taskCSVRow(t)` for the populated task, showing the five values in order.
  - **ZIP round trip, driven per `BUILD_NOTES.md`** (stub `prompt`/`alert`/`confirm` into a capture array, wrap `saveBackupFile` to stash the blob): export → `wipeAllData()` → paste `state.taskSettings` and the task's five fields showing them **genuinely cleared** → restore → paste both again, character-identical. A leg that cannot fail proves nothing — 2B.7's lesson.
  - Console: restore a **pre-Phase-3 tasks CSV** (13 columns) and paste one task showing `channel === ""` and no error. The migration must tolerate the old shape.
  - Console: paste a `msgBody` containing `\n\n` and an embedded `"` surviving the round trip character-identical.
  - Clean console; `check_ids.py` at baseline; existing views render; state survives reload.
- **Needs my eyes:** nothing rendered this session.
- **Risk and fallback:** low. The one real risk is the CSV round trip on a body holding quotes and newlines; `convertToCSV` quotes unconditionally and `parseCSV` tracks quote state, verified in Session 1.3 against a note with embedded quotes. If it ever fails, base64 the cell — **do not add a file** (the C17 instruction at `app.js` 2090).
- **⚠️ Backup point: manual ZIP before this session.** Its Done-when calls `wipeAllData()` against real data.

### Session 3.1b — Remove the Bcc (amendment A1)

- **Compartment:** DATA · **Depends on:** 3.1 (shipped 2026-09-03) · **Added 2026-09-03**, after Michael authorised amendment A1 hours after 3.1 shipped the Q3 half in good faith.
- **Goal:** amendment A1 is true in the code. `state.taskSettings.emailBcc` does not exist; nothing exports it, nothing restores it, nothing seeds it.
- **Size: S** · My time: ~2 min · **Confidence: High**
- **Sized S and it genuinely is one** — it deletes four small things 3.1 added and touches no logic. It is filed as its own session rather than folded into 3.2 because it is a **DATA** change with a settings-CSV leg, and 3.2 is UI; and because a removal that rides along inside a feature session is the kind that gets half-done.
- **Files:** modified `app.js`, `sw.js`
- **Tasks:**
  1. Delete the `OUTREACH_BCC_DEFAULT` constant above `ensureStateDefaults()` and the `emailBcc` seed line beside `workGmailAddress`.
  2. Delete the `["Outreach Bcc", …]` row from `generateSettingsCSV()`, and the `"outreach bcc"` branch, its two `let` declarations and its apply block from `restoreSettingsFromCSV()`.
  3. **Leave `workGmailAddress` entirely alone** — seed, row, branch and apply block all stand.
  4. **Delete the key from any live record**, so a database that already carries it (Michael's does, from 3.1) does not keep a dead field forever: `delete state.taskSettings.emailBcc` in `ensureStateDefaults()`. ⚠️ **This is the one line in the session that needs thought** — it is a field removal on a live store, so state the rollback in the summary. It is not a DIRECTIVES §4 destructive change (no user-entered content is destroyed; the value is a seeded default nobody has edited), **but say so explicitly rather than leaving it unremarked.**
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** none. A1 is already authorised.
- **Done when:**
  - Console: paste `state.taskSettings` showing **`emailBcc` absent** and `workGmailAddress` present, after a reload.
  - Console: paste `typeof OUTREACH_BCC_DEFAULT` as `"undefined"`.
  - Console: paste `generateSettingsCSV()` filtered to `/Outreach/`, showing **only the Work Gmail row**.
  - Console: restore a **3.1-era settings CSV that still contains an `Outreach Bcc` row** and paste `state.taskSettings` showing the row ignored, no error, and `workGmailAddress` still restored. **The old row must be inert, not fatal.**
  - Clean console; `check_ids.py` at baseline; existing views render; state survives reload.
- **Needs my eyes:** nothing rendered.
- **Risk and fallback:** low. The one thing to get right is that an older backup carrying the retired row restores cleanly — a `sawX` branch that no longer exists simply falls through the `else if` chain, which is the existing behaviour for any unknown Option Type, but **prove it rather than assume it.**

### Session 3.2 — The outreach block: manual entry, auto-fill, counters

- **Compartment:** UI · **Depends on:** 3.1
- **Goal:** Q7 exists. Any task can be given a channel, kind, recipient, subject and body by hand; To auto-fills from a linked prospect; character counters read against Q6's ceilings. **No buttons yet** — nothing opens anything.
- **Size: M** · My time: ~8 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. Channel and Kind selects; Kind's options rebuild from Q2 when Channel changes. Channel `None` hides everything below it.
  2. To / Subject / Body controls. Subject renders only for `compose` and `inmail`.
  3. Auto-fill on channel change, **into an empty field only** — Q7.
  4. Live counters against Q6, red past the ceiling, no truncation and no block.
  5. Read-side render of the block in the task inspector: contact header, Bcc line for email kinds, `Re:` prefix on `thread` subjects. `createElement` throughout.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** none.
- **Done when:**
  - Console: for each of the five fields, set the control, dispatch `change`, paste the stored value off `state.tasks`.
  - Console: paste the Kind select's options for each channel, matching Q2 exactly; paste that Subject is **absent from the DOM** (not hidden) for `connect`, `message` and `thread`.
  - Console: on a task linked to a prospect, switch Channel to Email and paste `msgTo` against `prospect.email`; switch to LinkedIn and paste it against `prospect.linkedin`. Then set To by hand, switch channel again, and paste it **unchanged** — auto-fill must not overwrite.
  - Console: on an orphan task, switch channel and paste `msgTo === ""` with no error.
  - Console: paste the counter text and its computed colour at 299/300, 300/300 and 301/300 on a `connect` task.
  - **Screenshot** the block at canvas width for `compose` and for `connect`, sidebar pinned and unpinned.
  - Reload; the five fields survive. Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** where the block sits relative to Notes, and whether the always-visible Bcc line is reassuring or noise.
- **Risk and fallback:** the task editor is a shipped, daily-use surface. If the block crowds it, fall back to a collapsed disclosure that opens when Channel is not None — same fields, one wrapper. Do **not** fall back to a separate modal.

### Session 3.3 — Email launch: URL builders, buttons, and every guard

- **Compartment:** UI, with LOGIC · **Depends on:** 3.2
- **Two compartments justified:** the builders exist only to serve these two buttons and the buttons cannot be verified without them. Splitting ships either dead functions or dead controls.
- **Goal:** Q4's email builders and Q5's handler exist. **Launch Email** opens Gmail composed on the work account with Bcc; **Open Thread** opens Gmail searching that contact and copies the body. Every guard in Q5 and Q6 fires.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. `gmailBase()`, `gmailComposeUrl()`, `gmailSearchUrl()` per Q4, with `tf=cm`.
  2. The one clipboard helper and its two fallbacks, per Q5.
  3. Both buttons, with `window.open` called **synchronously first** — Q5. Everything else after.
  4. Guards: blank `workGmailAddress` (disabled + Settings message), blank `msgTo` (disabled), over-length URL (compose without body + copy + toast).
  5. Settings UI for the two keys.
  6. Bump `CACHE_NAME`.
- **Inputs needed from me:** the work Gmail address, to enter in Settings. One real Gmail open to look at.
- **Done when:**
  - Console: paste `gmailComposeUrl(task)` in full for a task whose body holds two blank lines, an ampersand, a `+` and a `"`. Then paste each parameter run back through `decodeURIComponent`, showing To, Bcc, Subject and Body **character-identical to `state`**, and `%0A` present where the newlines were.
  - Console: paste the URL showing `tf=cm` present and `view=cm` / `fs=` **absent**.
  - Console: clear `emailBcc`, paste the URL showing **no `&bcc=`**; restore it and paste it back.
  - Console: paste `gmailSearchUrl(task)`, and the decoded fragment reading `to:<addr> OR from:<addr>`.
  - Console: set `workGmailAddress = ""` → paste both buttons' `disabled` and their title text. Set `msgTo = ""` → same.
  - Console: set a body long enough to push the URL past 2000 → paste the URL showing **no `body=`**, paste the clipboard content equal to `msgBody`, and paste the toast text.
  - **One real open per kind, by screenshot:** Gmail compose showing To, Bcc, Subject and the body's paragraph breaks intact; Gmail search showing the contact's thread list.
  - **Popup-blocker check:** with the handler's `window.open` deliberately moved behind an `await` in the console, paste `window.open`'s return as `null` under a blocker; then confirm the shipped code path returns a window. This is the one guard a normal check cannot see.
  - Clean console; `check_ids.py` at baseline.
- **Needs my eyes:** the composed email in Gmail — the body's line breaks are the thing to look at, and no console check can judge them.
- **Risk and fallback:** `#search/` must survive Gmail's account redirect (`/mail/u/<address>/` → `/mail/u/N/`). Fragments normally survive, but this is unverified. If it does not, fall back to storing the resolved numeric index in Settings alongside the address — and record the finding in `BUILD_NOTES.md` either way, because the next person will assume it works.

### Session 3.4 — LinkedIn launch: slug, three kinds, explicit copy controls

- **Compartment:** UI · **Depends on:** 3.3
- **Goal:** Q4's LinkedIn half exists. `inmail` and `message` open the composer on the right person; `connect` opens the profile. Subject and body each copy from their own labelled button. The undocumented route is verified or its fallback is live.
- **Size: M** · My time: ~10 min · **Confidence: High**
- **Files:** modified `app.js`, `index.html`, `style.css`, `sw.js`
- **Tasks:**
  1. `linkedinSlug(prospect)` per Q4 — **reading `prospect.linkedin`**, tolerant of trailing slashes, query strings and fragments.
  2. The three destinations, and the profile-URL fallback wired **this session**, not deferred.
  3. Open-only button plus separate Copy Subject / Copy Body controls, per Q5.
  4. No-slug and company-URL guards: button disabled, reason shown.
  5. Bump `CACHE_NAME`.
- **Inputs needed from me:** whether the work LinkedIn account is free or Premium — **this gates `connect`**, see the risk below. One real LinkedIn open to look at.
- **Done when:**
  - Console: paste `linkedinSlug()` against six inputs — a plain `/in/slug`, one with a trailing slash, one with `?utm_source=`, one with `#`, a `/company/` URL, and `""` — showing the four real slugs and two empty strings.
  - Console: paste all three URLs for the same prospect, showing `compose/?recipient=` for `inmail` and `message` and `/in/<slug>/` for `connect`.
  - Console: for a prospect whose `linkedin` is empty or a company URL, paste the button's `disabled` and its reason text.
  - Console: click Copy Subject, paste the clipboard; click Copy Body, paste it; confirm **the open button changed neither** — paste the clipboard before and after clicking it.
  - **Live verification of the undocumented route, by screenshot:** the composer open and addressed to the right person. If it does not open addressed, the fallback ships instead and **that is the accepted outcome, not a strike** — record which one shipped in `BUILD_NOTES.md`.
  - Counters at 1900 (`inmail`), 3000 (`message`) and 300 (`connect`), each pasted at limit and one over.
  - Clean console; `check_ids.py` at baseline; **TaskHub and the task editor regress clean** — resize, reorder, reload, and a task saved with `channel: ""` unaffected.
- **Needs my eyes:** the composer landing on the right person, and whether two copy buttons plus an open button is one control too many on the row.
- **Risk and fallback:** **`?recipient=` is undocumented and unversioned.** Contained by verifying it live in this session and shipping the profile-URL fallback alongside it. The second risk is not technical: **free LinkedIn accounts are capped at roughly five noted invitations per month**, after which only blank invitations send. If the account is free, `connect` is unusable at sequence volume and **should be cut from this session rather than built and discovered later** — which is why the account tier is an input, not a detail.

### Session 3.5 — Phase close: drill, curation, declarations audit

- **Compartment:** QA · **Depends on:** everything, **including the enrollment compartment and any review-response sessions.** Always last.
- **Goal:** The phase goal is verified against real data, the export path is re-proved whole, the standing files are true, and Phase 4 has a starting point.
- **Size: M** · My time: ~20 min · **Confidence: High**
- **Sized M deliberately.** `DECISIONS.md` 2026-08-30: a phase close is not a small session and must not be sized as one. Session 1.8 was sized S, ran L, and ate 45 of Phase 1's 88 minutes.
- **Files:** modified `ai/BUILD_NOTES.md`, `ai/AIContext.md`, `ai/DECISIONS.md`, `ai/DECLARATIONS.md` (proposals only), the phase run sheet (deleted at close)
- **Tasks:**
  1. **Re-prove the export path** — full export → wipe → restore on real data, counts pasted. This phase **did** add five columns and two settings rows, so this is not a formality.
  2. **Re-verify a snapshot restore.** Tier 1 remains the sole protection; re-proved at every close.
  3. **Estimate calibration** — and say whether Phase 3 repeated the 8→11 and 10→17 pattern.
  4. **Amendments owed:** a `DECISIONS.md` entry for why the Gmail API was declined and what would reverse it; a `BUILD_NOTES.md` entry for `tf=cm` versus the stale `view=cm&fs=1`; another for whether `#search/` survives the account redirect; another for whichever LinkedIn route shipped. Propose; do not apply.
  5. **Phase 4 is Hosting** and its pre-flight already exists at `ai/spec/phase-4-firebase-preflight.md`. Unlike Phase 3, it does **not** need an intake — say so in the handoff.
- **Inputs needed from me:** the amendment approvals, and one click if the snapshot folder needs re-granting.
- **Done when:** every check has real pasted output, `BUILD_NOTES.md` has been curated with what was cut reported, `DECLARATIONS.md` is still one page.
- **Needs my eyes:** the amendments, and the calibration's conclusion for Phase 4.
- **⚠️ Backup point: manual ZIP and a confirmed green snapshot before this session.** It calls `wipeAllData()` against real data. Non-negotiable.

---

## Session order

```
3.1  Task fields + settings   (DATA, M)  — ✅ SHIPPED 2026-09-03.  Ran with 2B still open, on
                                            Michael's explicit instruction.  Its ZIP was taken
                                            in-session, wroteToFolder: true, 1,211,512 bytes.
3.1b Remove the Bcc           (DATA, S)  — after 3.1, BEFORE 3.3.  Amendment A1.  Added 2026-09-03
3.2  Outreach block           (UI,   M)  — after 3.1
3.3  Email launch             (UI,   M)  — after 3.2
3.4  LinkedIn launch          (UI,   M)  — after 3.3          ← the review point
──── enrollment compartment ─────────────  NOT PLANNED. Needs a Prompt 1 intake. Takes 3.6+
──── outreach producer ──────────────────  NOT PLANNED. Depends on the enrollment entities. Takes 3.6+
3.5  Close                    (QA,   M)  — LAST. Always last.  ⚠️ ZIP + green snapshot first
```

**3.1 → 3.4 is strictly sequential and each session leaves the app usable.** Nothing is removed at any point; every session is purely additive, which is what makes this compartment safe to run before the half of Phase 3 that isn't scoped.

**3.4 is the review point, and this plan says so in advance.** It is the session at which the feature is complete and used for real outreach — this phase's 1.5 and 2B.6. Phase 1's entire overrun and Phase 2B's seven extra sessions both came from a review pass over the session that first showed the thing working, on the day it shipped. **Review it before starting the enrollment intake**, and expect it to produce sessions.

**The enrollment compartment must be scoped before it can be ordered.** It is not merely unplanned — its entities do not exist, so the producer sessions that depend on them cannot be written either. What is knowable today: the producer only ever *writes* Q1's fields, so no contract above changes when it lands.

**The close keeps its number and moves last**, exactly as 1.8 and 2B.10 did. `BUILD_NOTES.md` and `AIContext.md` will point at "3.5" as the close long before the appended sessions exist.

## Phase estimate

| | |
| --- | --- |
| **Sessions planned** | **5** — and this is **one compartment of two**, not the phase. |
| **Sessions forecast, this compartment** | **6–7**, applying the +35% contingency from `DECISIONS.md` 2026-08-30. The contingency is what the 3.4 review is expected to produce; it takes 3.6+. |
| **Sessions forecast, Phase 3 whole** | **Unknown, and deliberately not guessed.** The enrollment compartment has no scope. The retired scope's own build order listed six work items before any of this existed, so 6–9 is a floor, not an estimate. |
| **Mix** | 0 L · 5 M · 0 S. No S: every session here touches `app.js` and `sw.js`, and three touch all four files. Sizing any of them S would be the 1.8 mistake. |
| **My total attention** | **~56 min planned** for this compartment, no session over 10 except the close at 20. Add ~15 min for review-response → **~70 min forecast.** Method unchanged from Phase 1 per the calibration's instruction. |
| **Most likely to overrun** | **3.4.** It depends on an undocumented URL, its fallback is a live branch rather than a theory, and its `connect` kind may be cut mid-session on the account-tier answer. Runner-up **3.3**: the popup-blocker and clipboard guards are the kind that pass every console check and fail on the user's machine. **3.1** is the largest data change but the least likely to surprise — the CSV round trip has been proved four times in two phases. |
| **`CACHE_NAME` budget** | **Two bumps per session, ~10 for the compartment.** Not one session in Phase 1 or 2B finished on a single bump. The first reload after a bump still serves the old document — hand over a one-glance version tell with every summary. |

## Backup points

- **Before 3.1** — manual ZIP, stored outside the project folder. Its Done-when calls `wipeAllData()`.
- **Before 3.5** — manual ZIP **and** a confirmed green snapshot. `wipeAllData()` against real data again. Non-negotiable.
- **At phase close** — full ZIP, retained outside the project folder per DECLARATIONS.

Backups live in `..\backups-production\`; automatic snapshots in its `snapshots\` subfolder.

## Open risks

1. **Phase 2B has not closed.** The blocking risk and the only one live today. Nine sessions stand between now and 3.1 — 2B.11 through 2B.17, then 2B.10. Retired when 2B closes.

2. **Half of Phase 3 has no scope.** This plan is honest about covering one compartment, but the risk is that it reads as the phase plan and the enrollment intake never happens. `AIContext.md` and the 2B run sheet already flag the intake; this plan's banner is the third place it is written down.

3. **The LinkedIn compose route is undocumented.** `?recipient=` is not an API and can disappear without notice — including *after* 3.4 verifies it. The fallback is live from day one, which turns a breakage into a degraded button rather than a dead one. Accepted, not eliminated.

4. **The free-account invitation cap may make `connect` pointless.** Roughly five noted invitations per month on a free account, then blank invitations only, failing quietly. If the tier answer is "free," `connect` should be cut from 3.4 rather than built. This is a product risk, not a technical one, and it is the reason the tier is a session input.

5. **The guards that matter fail invisibly.** A popup blocker, a clipboard permission denial, and an over-long URL all produce a button that looks like it worked. Q5's synchronous-`window.open` rule and 3.3's deliberate popup-blocker check exist for this, and they are the parts of those sessions most likely to be skipped under time pressure. **Do not skip them.**

6. ~~**The Bcc does not reach follow-ups or LinkedIn.**~~ ✅ **RETIRED 2026-09-03 — the real fix landed, outside the app, exactly as this risk said it would.** The Workspace outbound rule is in place and Vantage emits no Bcc at all; see **amendment A1** and `DECISIONS.md`. **The workaround was dropped rather than built, which is the outcome this entry asked for** — worth keeping visible, because a risk retired by something happening outside the codebase is the kind that otherwise gets re-litigated by the next session to read the scope.

7. **Live contact addresses reach a second surface.** DIRECTIVES §0 compliance is still `NOT DECIDED`. This phase does not change what data is held, but it puts real email addresses and profile URLs into `window.open` targets and onto the clipboard. P9's no-routing rule is what keeps them out of the address bar and browser history, and it must not be relaxed for convenience.

8. **Manual entry and sequence writing must never diverge.** Q1 exists so there is one set of fields and one render. The failure mode is a later session adding a sequence-only field, or a second render path for sequence tasks, at which point a hand-typed task and a generated one behave differently on the same screen. **One path.**

---

**Next: run the Phase 3 intake (Prompt 1) for the enrollment compartment — *after Phase 2B has closed.* Then Prompt 3 to merge both compartments into one phase plan, then Prompt 4 for Session 3.1.**
