# Agent operating rules

- Use synthetic student data only in development and tests.
- Never expose database credentials or student personal information in logs, prompts, screenshots, or QR payloads.
- Enforce tenant authorization on the server for every protected query and mutation.
- Keep changes small and reviewable; add tests for each behavior.
- Never run destructive database operations without explicit human approval.
- Do not claim a feature is complete until implementation and relevant checks are verified.
- Production deployment and production migrations require human approval.
