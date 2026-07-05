---
name: new-ai-context
description: >
  Rotate the Vantage PRM AI-CONTEXT.md file. Archives the current file with
  today's date, then creates a fresh AI-CONTEXT.md scoped to the new development
  session. Triggered when the user says something like "let's make a new AI-CONTEXT",
  "start a new context", or "rotate the AI context".
---

# New AI-CONTEXT Rotation — Procedure

This skill follows the protocol defined in `AI-CONTEXT-PROTOCOL.md` in the project root.
Always read that file first if you need the authoritative reference.

---

## Step 1 — Pause and Query

Do NOT create or modify any files yet. Respond only with:

> "What are we doing? Please provide the goals for this next major build phase."

---

## Step 2 — Await User Input

Wait for the user to describe the goals. Do not proceed until they respond.

---

## Step 3 — Archive the Current Context

- Copy `AI-CONTEXT.md` → `ai-context-archives/AI-CONTEXT-YYYY-MM-DD.md` (use today's date)
- If that filename already exists, append `-b`, `-c`, etc.
- Do NOT modify the archived copy — it is a faithful snapshot

---

## Step 4 — Generate the New AI-CONTEXT.md

Create a fresh `AI-CONTEXT.md` in the project root using this exact structure:

```text
# Project Declarations
[Migrated core rules, tech stack, architecture patterns, key state shape, boot sequence]

# Recent History
* [Summary of change 1]
* [Summary of change 2]
* [Summary of change 3]

# Current Goals
* [User's stated goals for the current build — copied exactly]

# Development Notes
[To be populated dynamically as work progresses]
```

---

## Step 5 — Migrate Declarations

Copy the **Project Declarations** block verbatim from the archived file into the top of the new file. This includes:
- App Overview (stack, server, URL)
- Architecture Overview (file tree, state shape, boot sequence, view routing, backup system, color theming)
- Current State (update if anything changed)
- Known Issues / Watch-outs (update as needed)

---

## Step 6 — Synthesize History and Inject Goals

Append below the declarations:

**Recent History** — 3–5 bullet points summarizing the last major changes from the archived file. Be concise.

**Current Goals** — Insert the user's goals exactly as they stated them in Step 2. Do NOT interpret, expand, or add detail beyond what the user said.

---

## Step 7 — Confirm Rollover

Tell the user:
- Archive filename (with clickable link)
- New AI-CONTEXT.md is ready (with clickable link)
- Repeat the Current Goals back to them for confirmation

---

## Ongoing Maintenance

As development progresses during the session, **append entries to the `# Development Notes` section** after completing meaningful units of work:

```markdown
### [Feature or Fix — Date]
- What was changed and why
- Files touched / key functions modified
- Any caveats or follow-ups needed
```

Do this proactively — do not wait for the user to ask.
