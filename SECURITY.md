# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub's private vulnerability reporting:
**[Report a vulnerability](https://github.com/CROC101/software-empire/security/advisories/new)**
(Security tab → Report a vulnerability).

Include:

- the affected app or package (`apps/<name>`, `packages/<name>`) and URL
- steps to reproduce, or a proof of concept
- the impact: what an attacker can read, change or break

## Disclosure process

This project follows coordinated vulnerability disclosure:

| Step                               | Target             |
| ---------------------------------- | ------------------ |
| Acknowledge your report            | within 3 days      |
| Confirm or reject, with a severity | within 7 days      |
| Fix critical / high issues         | within 14 days     |
| Fix medium / low issues            | within 90 days     |
| Publish a GitHub Security Advisory | when the fix ships |

Please keep the details private until the fix is deployed or 90 days have passed, whichever
comes first. You will be credited in the advisory unless you ask not to be.

## Scope

In scope: everything in this repository and the deployed apps at `*.crocwork.workers.dev`.
Out of scope: denial of service by traffic volume, social engineering, and issues in
third-party services (Supabase, Cloudflare, GitHub) themselves — report those to the vendor.

Good-faith research inside this scope will not lead to legal action. Do not access, change or
delete other people's data; use your own test accounts.

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
- Redirects: every `?next=` target is checked, and property-based fuzz tests (fast-check) throw
  thousands of random inputs at the check.
