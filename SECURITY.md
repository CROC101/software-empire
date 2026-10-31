# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report privately through
GitHub: **Security → Report a vulnerability** on this repository (private vulnerability
reporting). Include the affected app (`apps/<name>`), steps to reproduce and the impact.

You will get an answer within 7 days. Fixes for confirmed issues ship as soon as they are
ready; you will be credited in the release notes unless you ask not to be.

## Supported versions

Only the current `main` branch (what is deployed) receives security fixes.

## How this project is protected

- Every pull request: lint, types, tests, build (`ci.yml`), database RLS tests with pgTAP
  (`database.yml`), CodeQL code scanning, dependency review (no known-vulnerable or copyleft
  dependency may be added), deploy dry run.
- `main` is protected: changes land only through a pull request that passes `verify`.
- Supply chain: every GitHub Action is pinned to a commit SHA, workflows run with least
  privilege, Dependabot keeps dependencies current, OpenSSF Scorecard runs weekly.
- Secrets: GitHub secret scanning with push protection; no secret is stored in the repository.
- Data: every Supabase table has row level security, tested in `supabase/tests`; sessions live in
  cookies, never in `localStorage`; user HTML goes through DOMPurify.
