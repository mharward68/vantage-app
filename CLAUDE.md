# Vantage

Before any build work, read `ai/DIRECTIVES.md`, `ai/DECLARATIONS.md`, `ai/AIContext.md`, and `ai/BUILD_NOTES.md`.

Hard limits in **DIRECTIVES §4** are absolute — each has an observable trigger. When one fires, stop and ask.

`ai/DECISIONS.md` is why the declarations say what they say. Read it when a decision is questioned, and always before proposing to reverse one.

`ai/APP_BUILD_WORKFLOW.md` is the process itself — the six prompts, the five rules, the file templates. Read the relevant prompt before planning a phase, running a session, closing a phase, or amending a declaration. It does not need to be attached to a conversation; it lives here.

`ai/spec/` holds approved feature scopes. `ai/phases/` holds phase plans.

Run locally with `Start_Vantage.bat` → `http://localhost:5000`. No build step, no framework.

The pre-`ai/` context protocol has been retired. If you encounter `AI-CONTEXT.md` or `StatementOfDirective.md` referenced anywhere, those files are gone and the reference is stale.
