<!--
  PR TITLE -- READ BEFORE TYPING (bot will auto-reject if wrong)

  Format:  <type>(<scope>): <short summary, lowercase, no period>

  Types:
    feat     - new feature
    fix      - bug fix
    docs     - documentation only
    test     - tests only, no production code
    chore    - maintenance (deps, CI, housekeeping)
    refactor - code change that is neither fix nor feature
    perf     - performance improvement

  Scopes (optional but recommended):
    dashboard, keys, models, checkin, export, sync, ui, ci, docs, tests

  Examples:
    feat(dashboard): add bulk balance refresh
    fix(export): handle missing API key on export
    chore(ci): pin actions/checkout to v4
    docs(contributing): clarify local dev setup
-->

## Linked Issue

Fixes #

## Summary

<!-- What changed and why? One or two sentences max. -->

## Changes Made

<!-- Which files changed and why? Delete rows that do not apply. -->

| File | What changed |
|------|-------------|
| `src/` | |
| `.github/workflows/` | |
| `tests/` | |
| Other | |

## Testing

<!-- How did you verify this locally before pushing? -->

- [ ] `pnpm lint` -- no errors
- [ ] `pnpm compile` -- no type errors
- [ ] `pnpm test` -- all tests pass
- [ ] `pnpm build` -- builds successfully

## Notes for Reviewer

<!-- Anything non-obvious about the approach? Leave blank if straightforward. -->

---

> **Checked automatically by CI -- you do not need to self-certify these:**
>
> | Check | Enforced by |
> |-------|-------------|
> | PR title follows Conventional Commits | CI title check |
> | Lint and format | `ci.yml` |
> | Type check | `ci.yml` |
> | Unit tests pass | `ci.yml` |
> | Security scan | `codeql.yml` |
