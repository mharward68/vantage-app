# AI Context — PHASE 3 IN FLIGHT, SESSION 3.4 SHIPPED · THE REVIEW POINT IS NOW

**Updated:** 2026-09-04 11:27 (America/New_York).

**Last run:** Phase 3 / **Session 3.4 — LinkedIn launch: slug, three kinds, explicit copy controls.** Compartment: **UI**. ✅ **COMPLETE, and it produced a finding that CHANGED WHAT SHIPPED.** No amendment, no frozen contract modified.

**State:** `app.js` **18,793** (+229) · `index.html` **3,981** (unchanged) · `style.css` **5,192** (unchanged). `CACHE_NAME` **v132 → v134**, **TWO bumps** against a budget of two — and the second was not a code change, see the `sw.js` trap below. **One-glance version tell:** console `typeof linkedinSlug` is `"function"` on v134 and `"undefined"` on v132; `LINKEDIN_COMPOSE_ROUTE_LIVE` is `false`. `typeof gmailSearchUrl` is `"undefined"` and must stay that way (A3).

**Only two files changed. `index.html` and `style.css` were NOT touched and did not need to be** — the controls are built with `createElement` into 3.3's existing empty `#task-outreach-actions`, and they reuse `.task-outreach-btn` / `.task-outreach-hint` / `.is-sequence` / `.is-degrade`, which 3.3 already sized for a stacked column. The phase plan lists all four files for this session; two of them had nothing to add. **`check_ids.py` is untouched by construction: this session added ZERO listeners to `setupEventListeners()`.**

**Git: HEAD is `d7d103fb`, parent `4a56a927` — BOTH READ FROM `.git/logs/HEAD` THIS SESSION.** ⛔ **`app.js` and `sw.js` ARE UNCOMMITTED.** Michael runs git.

**Database: 1,562,394 bytes at boot, 1,562,438 at the end — the +44 is ONE DELIBERATE WRITE MICHAEL ASKED FOR and nothing else.** He added **Trisha Harward** mid-session (651 → **652 prospects**) and then asked me to put **his own profile URL on her `linkedin` field** as a test target; it was empty before, and 44 bytes is exactly that string. ⚠️ **REMOVE IT WHEN YOU ARE DONE TESTING — Trisha's record now points at Michael's LinkedIn.** Otherwise: **0 tasks** · `taskSettings` still 2 keys · 38 state keys · only `vantage_prm_database` and `vantage_sidebar_pinned` in `localStorage` · `state.activeView` ended on `dashboard`, where it started. **No task was created or saved at any point** — every check drove the live editor and closed it with Cancel. A TaskHub resize/reorder was rolled back to byte-exact **1,562,394** before that write.

---

## ⛔ THE FINDING THAT CHANGED THE BUILD — READ THIS BEFORE TOUCHING LINKEDIN

**`?recipient=<public-slug>` WORKS, AND THAT IS WHY IT COULD NOT SHIP.** Two real opens, signed in on the work account:

| URL | Result |
| --- | --- |
| `?recipient=cherieneal` — a **1st-degree connection** | ✅ "New message", recipient **chip populated**, compose box focused |
| `?recipient=brooke-naylor-609680151` — **3rd degree, not a connection** | ⛔ the bare messaging **inbox**, empty compose pane. No chip, no error, no clue |

**The route is conditional on connection degree and Vantage cannot know the degree** — no field, no API, and no cross-origin way to read the result. A destination that lands right for some contacts and drops the rest onto an unrelated inbox, with the message already on the clipboard, is worse than one that always lands somewhere right. **DIRECTIVES §2 rung 1 (Stability) over rung 2.** And **the failing half is the common one**: outreach targets people he is not yet connected to, and `inmail` is by definition to a non-connection.

⛔ **TESTING THIS AGAINST A CONNECTION ONLY IS THE HALF-FIX THAT PASSES AND SHIPS BROKEN.** One test would have said "verified".

**What shipped: `LINKEDIN_COMPOSE_ROUTE_LIVE = false`, so all three kinds open the PROFILE.** Right person every time, Message and Connect one click away — confirmed by screenshot on a 3rd-degree contact. **Both builders stay shipped**, so flipping the flag back is one line the day LinkedIn resolves `?recipient=` for non-connections. This is the plan's own accepted outcome, not a strike.

## What was done — two files

| # | Edit |
| --- | --- |
| 1 | `app.js § ✅ TASK EDITOR — OUTREACH LAUNCH` gained a **Session 3.4 sub-section between `gmailComposePlan()` and the clipboard helper**: `LINKEDIN_SLUG_RE`, `linkedinSlug`, `linkedinComposeUrl`, `linkedinProfileUrl`, `LINKEDIN_COMPOSE_ROUTE_LIVE`, `linkedinDestination`. **No seventh sub-block** — `renderTaskOutreachActions()` is the one consumer of both halves and splitting them puts the builders on the far side of their caller. |
| 2 | Two handlers beside the existing ones: `handleTaskCopySubject` and `handleTaskLaunchLinkedIn(kind)`. |
| 3 | `renderTaskOutreachActions()`'s LinkedIn placeholder replaced by the real branch: open button, two disabled-with-reason guards, three hints, and the numbered copies. |
| 4 | `CACHE_NAME` v132 → v133 → v134. |

**`linkedinSlug()` accepts EITHER a prospect object or a URL string** — Q4's literal call form and the string form the controls use. **The controls resolve from the `To` field, not the record**: Q7's auto-fill already puts `prospect.linkedin` there, the field is editable by contract, and **an orphan task has no prospect at all**, so reading the record leaves a typed URL above a dead button.

## Verification — all of it ran

- **`linkedinSlug()` against the six Done-when inputs:** plain `/in/slug` → `trisha-harward`, trailing slash → same, `?utm_source=` → same, `#fragment` → same, `/company/` URL → `""`, `""` → `""`. **Four real slugs, two empty**, exactly as specified.
- **All three URLs, decomposed and decoded back.** Builders: `messaging/compose/` + `recipient=brooke-naylor-609680151` (77 chars, decodes character-identical) and `/in/brooke-naylor-609680151/` (52). **Shipped destinations after the flag: all three are the 52-char profile, and none carries a query string at all.**
- **Guards, with the reason on the button AND on screen.** Empty To → *"Add a LinkedIn profile URL in To before this can open the right person."* Company URL → *"Not a profile URL. Vantage needs a linkedin.com/in/… address…"* Auto-fill from the record into an empty To: confirmed; default kind is `inmail`, never `connect`.
- ⛔ **THE OPEN BUTTON TOUCHES THE CLIPBOARD ON NO PATH — `0` calls before and `0` after (Q5).** Proved with a **write-spy**, never by reading the clipboard back. `window.open` was called once, target `vantage-linkedin`, length 77.
- **Copy Subject passed the bare 33-char subject and never called `clipboard.write`** — no `text/html` flavour, correctly. **Copy Message passed the FLATTENED 144 characters** against 151 stored: `**short guide**` → `short guide`, `[Tech RFP](…)` → `Tech RFP (https://…)`, `*ten minutes*` → `ten minutes`, **and `clipboard.write` was never called at all — LinkedIn is offered no HTML flavour on any path (A2).**
- **Counters at every ceiling, at limit and one over:** `connect` 300/300 clean → 301/300 red; `inmail` 1900 → 1901 red; `message` 3000 → 3001 red; `inmail` **subject** 200 → 201 red. **And A2's rule proved directly: a 304-character stored string that flattens to 300 reads `300/300` and is NOT red.** Markup that never arrives does not push a legal note over.
- **Live, by screenshot:** the composer for a connection, the empty inbox for a non-connection, and the shipped profile destination landing on the right person with a Message button.
- **✅ THE OWED GMAIL CONFIRMATION FROM 3.3 IS DISCHARGED.** `workGmailAddress` is now set. A shipped-builder URL (verified character-identical to a hand-reconstruction) opened **`Compose Mail - michaelh@youravdept.com - Your AV Department Mail`**, with recipient, subject and the body's blank line intact. ⛔ **AND IT REDIRECTED TO `/mail/u/1/`, NOT `/u/0/`** — live proof that A4's reasoning is not theoretical: the work account is at index **1** on this machine, so a `/u/0/` shortcut would have composed from the personal account.
- **Regressions clean.** `channel: ""` → block hidden, `display: none`, 0 visible buttons, 0 toolbar buttons, 0 preview boxes, Subject node detached. Email `compose` still one *Open in Gmail*; email `thread` still *1 · Copy address* / *2 · Copy message* (A3). TaskHub resize **and** reorder applied, **survived a reload**, and were rolled back. All six views render — five at 997px, MediaHub 977px (its known scrollbar case). `#view-data-management` invariant `total − options` = **53**, exact against 3.3c. **Clean five-line boot console, zero errors, zero warnings.**
- ⛔ **AND THE WHOLE PATH RAN END TO END ON A REAL RECORD UNDER A REAL MOUSE CLICK.** Trisha Harward, with Michael's profile URL on her record: channel → LinkedIn **auto-filled `To` from `prospect.linkedin`**, the slug resolved from `To`, and **a genuine click on *Open profile on LinkedIn* opened a new tab titled "Michael Harward | LinkedIn"** — right person, right URL, `window.open` returning a real Window under real transient activation. That is Q5's synchronous rule demonstrated rather than argued. **Toast copy, read in the same call as the click** (it expires in 5s): `inmail`/`message` → *"Profile open — click Message, then paste."*, `connect` → *"Profile open — click Connect, then Add a note, then paste."*, and the no-slug guard → *"No LinkedIn profile in To — Vantage needs a linkedin.com/in/… address."* **with `window.open` provably not called.**
- **`node --check` parses and `check_ids.py` is at baseline** (`{export-backup-btn, restore-backup-input}`), both run against bytes md5-matched to what the browser ran: `app.js 408be778…`, `sw.js a409ffbd…`.

## Backup coverage — DIRECTIVES §4

**NO STORE WAS ADDED OR MODIFIED, AND THAT IS THE WHOLE ANSWER.** This session added no `state` field, no `localStorage` key, no settings row, no CSV column and no `wipeAllData()` line. `LINKEDIN_COMPOSE_ROUTE_LIVE` is a module-scope **constant in source**, not user data — it is edited by a developer, not by Michael, and it is covered by git, not by backup. `TASKS_CSV_HEADERS.length` is untouched and contract **Q8 stands**.

## Assumptions logged this session

1. **The LinkedIn builders live inside 3.3's launch block, not a seventh sub-block.** Same contract (Q4), one consumer. Reversible.
2. **The controls read `To`, not `prospect.linkedin`.** Orphan tasks and edited recipients both work; matches the email branch. Reversible.
3. **`linkedinSlug()` takes a prospect OR a string.** Q4's call form is preserved and exercised; the Done-when's six inputs are strings. Reversible.
4. **The button LABEL is derived from `linkedinDestination().composer`, never from the kind** — so flipping the flag re-labels every button with no second edit, and no button ever says "Open LinkedIn message" while landing on a profile.
5. **The fallback is a one-line constant, not a runtime detection.** A page cannot see across origins what LinkedIn served; a try/catch, a timer or a probe fetch are all impossible here and the first two *look* like they work.
6. **`message` OPENS THE PROFILE LIKE THE OTHER TWO.** If `message` were only ever used on someone who has already accepted a connection, its composer route would always resolve and it could keep it. ⛔ **ASKED AND DEFERRED, 2026-09-04: Michael's answer was "may or may not go out to 1st connections — I'll decide later."** So the premise does **not** hold today, the deterministic option is correct as shipped, and **this is a closed question until he re-opens it.** Do not re-derive it, do not re-ask it, and do not "improve" `message` onto the composer route on the assumption — the change is one line in `linkedinDestination()` the day he says so.

## Open items

- ⛔ **COMMIT `app.js` AND `sw.js`.** Uncommitted against `d7d103fb`.
- ⚠️ **ONE STRAY GMAIL DRAFT IN THE WORK ACCOUNT** from the confirmation above (Gmail's own autosave of a compose window — Vantage created no draft via any API; Q8 holds). Plus **two stray drafts in the personal account** from 3.3, still there.
- ⚠️ **TRISHA HARWARD'S `linkedin` FIELD HOLDS MICHAEL'S OWN PROFILE URL**, written at his explicit request as a test target. Her field was empty before. **Clear it or replace it with her real profile when testing is done.**
- **Health probe, §9.4, run once here: 648 of 652 prospects carry a LinkedIn value and ALL 648 yield a slug.** Zero company pages, zero Sales Navigator links, zero malformed pastes. The four without are simply blank. **The regex needs no widening and the data needs no clean-up.**
- ⛔ **3.4 IS THE REVIEW POINT AND IT IS NOW.** Use the feature for real outreach, then run the review; it takes 3.6+.
- **Phase 2B is still not formally closed** — its snapshot re-verify has not run.
- **Phase 2C, scoped not built:** the sixteen-store `wipeAllData()` gap and the `ensureStateDefaults()` `length === 0` reseed defect.
- **The snapshot system is alive** — boot read `vantage_snapshot_2026-09-04_111348.json` off disk.
- **Still owed by Michael, a NINTH close carrying them:** the five `DECISIONS.md` DECLARATIONS amendments; the two from 2A.6; the domain-is-identity amendment; the 2B.16/2B.17 P4/P5 divergence amendments. `LA` = Louisiana or Los Angeles. Finding 10d's meaning. Three cosmetics from 2B.4 — **leaving them is a valid answer and saying so closes them.** ⚠️ **A4 still owes a `DECISIONS.md` entry, and 3.4's LinkedIn-route decision now owes one too.**
- **`ai/phases/phase-2b-RUNSHEET.md` is spent and marked for deletion. Michael deletes it.**
- **`DECLARATIONS.md` Stack line counts are stale** — it says `app.js` ~13,270; real is **18,793**. Propose at the 3.5 close; do not edit mid-phase.
- **Phase backlog, carried:** the `"Note"` reachout-type reassignment gap; ProspectHub OR-s tags while Advanced Query AND-s them; `p.notes` / `p.location` shape defaults; company-edit uniqueness guard; the §4 back-fill of existing `"domain.com"` rows; the missing `<link rel="icon">`. **The repo is PUBLIC** and DIRECTIVES §0 compliance is undecided. Stale `..\backups\`.
- **Both query surfaces stay DEFERRED**; the `sequences` tab stays `enabled: false`. Neither was touched.
- **The enrollment compartment still has no scope.** Phase 3 needs a Prompt 1 intake before 3.6+ can exist. Seventh close to say so.

## Estimate vs actual

Sized **M / ~10 min / High**. **Size was right, confidence was right, and the plan's own "most likely to overrun" call was right for the right reason** — 3.4 was flagged because it depends on an undocumented URL whose fallback is a live branch, and that is exactly what consumed the session. **Michael's time was ~4 minutes** — four boot answers, one prospect name, and no interruption after that. Two `CACHE_NAME` bumps, but **only one of them was a code change**; the second was recovering a commit that silently wrote stale bytes.

## Files changed

**Code:** `app.js`, `sw.js`. **Documents:** `ai/AIContext.md`, `ai/archive/2026-09-04_1127_AIContext.md` (new), `ai/BUILD_NOTES.md`.

## ⛔ EXACT NEXT STEP

**Commit, then REVIEW — do not run 3.5 yet.** 3.4 is the review point this plan named in advance, and Phase 1's overrun and Phase 2B's seven extra sessions both came from reviewing the session that first showed the thing working. Use it for real outreach for a day, then run the review pass; the sessions it produces take **3.6+**. **3.5 is the close and always runs last.** The enrollment intake (Prompt 1) is still owed and still blocks 3.6+.

**Carry forward:** ⛔ **A `device_commit_files` CALL CAN REPORT `written`, UPDATE THE FILE'S mtime, AND WRITE THE PREVIOUS BYTES — AND A SIZE CHECK CANNOT SEE IT WHEN THE TWO VERSIONS ARE THE SAME LENGTH.** `sw.js` v133 and v134 are both 2,330 bytes; the second commit reused the same staged path and shipped v133. **Re-stage from the device and md5-compare, or write each revision to a NEW staged path.** ⛔ **AND A SERVICE-WORKER CACHE-NAME BUMP DOES NOT LAND ON `reg.update()` ALONE** — `unregister()`, delete the `vantage*` caches, then reload twice; `localStorage` is untouched by that and the DB byte count proves it. ⚠️ **`layoutColumnWidth()` RETURNS THE RESOLVED WIDTH WHILE THE RECORD STORES `0` FOR "default", so reading a width and writing it back is NOT a no-op** — it cost a 2-byte residue, and `setLayoutColumnWidth(k, 0)` cannot undo it because the setter clamps to `LAYOUT_MIN_COL_PX` (60). ⛔ **THE `computer` CLICK COORDINATE IS `css × (screenshotWidth ÷ innerWidth)` AND IS **NOT** THE POSITION YOU CAN SEE IN THE PICTURE — the two differ by `devicePixelRatio` (0.75 here), so reading a button off the screenshot lands ~33% short and silently does something else.** It cost two dead clicks that hit the textarea and collapsed the preview. ⚠️ **AND THE WINDOW RESIZED MID-SESSION AGAIN** — screenshots went 952×874 → 1148×1054 with `innerWidth` 952 → 1269. **Re-derive the scale from a live rect in the same call as the click, every time.** ⚠️ **The extension's content filter blocked `www.linkedin.com` as a "JWT token" and an email's local part and domain as a "Sensitive key"** — decompose and return scalars. **THE APP RUNS PERFECTLY WITH THE SERVER DOWN** — three-probe first; it read `200 / 404 / 200`. **`state` is not `window.state`.** **Do not open the app while Michael's window is up.** **TEST AGAINST REAL RECORDS, WRITE UP PLACEHOLDERS — the repo is public.**
