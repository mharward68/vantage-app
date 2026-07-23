# Statements of Directive

## Gates (Non-negotiable):

1. **Security (no user-data leakage).** Never trade data isolation for a nicer UX, more speed, or less code. But proportionate — don't gold-plate beyond protecting user data.
2. **Scale (thousands of clients / hundreds of thousands of users).** Reject any architecture that can't get there, even if it's simpler or ships faster today. This is what kills the per-subdomain-OAuth model.
3. **Backup/restoring data:** Before finishing a section and/or after a major build, consider the backup/storage procedure. Anything added that the user will manipulate or add data, needs to be included in the back-up/restore system. Anything that meets the above criteria, ask me if we need to back it up before doing anything.
4. **Observability & Logging.** You cannot guarantee your "Stability" ladder rung if you cannot see the errors. Consider adding a rule: No feature ships without telemetry. If it fails in production, we must be able to see why without relying on user reports.

## Ranked in ladder (higher wins when a decision is close):

1. **Stability.** A plain feature that always works beats a flashy one that's flaky. Determinism over cleverness.
2. **Premium enterprise UX.** This is the product's reason to exist, so it outranks simplicity and efficiency — Premium means sub-second UI responses (even if the backend is still processing), zero layout shifts, offline-graceful states, and strict adherence to our design system. I'll accept more complexity or cost to deliver the enterprise-grade experience, as long as gates 1–2 and stability hold.
3. **Simplicity.** The default tiebreaker among comparable options — prefer the simplest, most stable structure that still meets everything above. Simplicity mostly serves stability and security rather than competing with them.
4. **Efficiency.** Optimize last, once it's secure, scalable, stable, premium, and simple — no premature optimization, but also no wasteful/runaway patterns (those are really stability failures anyway).
5. **Cross-Platform Parity (Netlify/App Stores):** Since we are targeting web, iOS, and Android, core business logic must reside in the API, not the client, ensuring the PWA and native mobile wrappers behave identically.
