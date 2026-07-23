# AI Context Management Protocol

## Trigger
Whenever the user states: "Let's make a new AI-CONTEXT.md" (or a variation of this request), you must strictly follow the sequential workflow below.

## Execution Workflow

**Step 1: Review the Statement of Directive**
Before doing anything else, re-read `StatementOfDirective.md` in the project root (the gates and the ranked priority ladder). Hold these in mind for every decision made during the rest of this workflow and the build phase that follows.

**Step 2: Pause and Query**
Do not immediately create or modify any files. Respond exclusively with:
> "What are we doing? Please provide the goals for this next major build phase."

**Step 3: Await User Input**
Wait for the user to explain the goals and objectives for the upcoming development section.

**Step 4: Archive the Current Context**
Once the user provides the goals, locate the existing `AI-CONTEXT.md` file in the project root. Rename this file to `AI-CONTEXT-[YYYY-MM-DD].md` using the current date. Do not delete any content from this archived file.

**Step 5: Generate the New Context File**
Create a fresh `AI-CONTEXT.md` file in the project root.

**Step 6: Migrate Declarations**
Extract the "states of declaration" (environment variables, tech stack definitions, core project rules) from the top of the newly archived file and paste them at the very top of the new `AI-CONTEXT.md` file.

**Step 7: Synthesize History and Inject Goals**
Below the declarations in the new `AI-CONTEXT.md` file, append the following two sections:
1. **Recent History:** Write a concise, bulleted summary (3-5 points) of the last major changes, features, or bug fixes completed in the previous cycle.
2. **Current Goals:** Insert the goals exactly as explained by the user in Step 3.

**Step 8: Ongoing Maintenance Directive**
Acknowledge to the user that the rollover is complete. Moving forward, as development progresses, actively append new development notes, decisions, and completed tasks to the bottom of the active `AI-CONTEXT.md` file, staying consistent with `StatementOfDirective.md`.

## Expected File Structure Template for New AI-CONTEXT.md

```text
# Project Declarations
[Migrated core rules, e.g., tech stack, architecture patterns, key state shape, boot sequence]

# Recent History
* [Summary of change 1]
* [Summary of change 2]
* [Summary of change 3]

# Current Goals
* [User's stated goals for the current build]

# Development Notes
[To be populated dynamically as work progresses]
```

## Archive Location
Archived files are stored in: `ai-context-archives/`
This folder lives in the project root alongside `AI-CONTEXT.md`.
