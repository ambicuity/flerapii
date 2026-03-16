# Contributing to Flerapii

Thank you for your interest in contributing to Flerapii. This document explains the process and standards for making contributions.

## Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Local Development Setup](#local-development-setup)
3. [Contribution Lifecycle](#contribution-lifecycle)
4. [Branching and Commit Standards](#branching-and-commit-standards)
5. [Pull Request Checklist](#pull-request-checklist)
6. [Code Style](#code-style)
7. [Good First Issues](#good-first-issues)

---

## Ways to Contribute

| Contribution | How |
|---|---|
| Report a bug | [Open a Bug Report](https://github.com/ambicuity/flerapii/issues/new?template=bug_report.yml) |
| Request a feature | [Open a Feature Request](https://github.com/ambicuity/flerapii/issues/new?template=feature_request.yml) |
| Fix a bug | Claim an issue, submit a PR |
| Add a feature | Claim an issue, submit a PR |
| Improve docs | Submit a PR to `docs/` or `*.md` files |
| Review PRs | Comment on open PRs with constructive feedback |

> [!IMPORTANT]
> **You must claim an issue before starting work.** Comment `/assign` on the issue to be assigned. PRs without a prior assignment will be closed.

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
git clone git@github.com:ambicuity/flerapii.git
cd flerapii
pnpm install
```

### Development

```bash
# Chromium development
pnpm dev
# Then load .output/chrome-mv3-dev as an unpacked extension in chrome://extensions/

# Firefox development
pnpm dev:firefox
# Then load .output/firefox-mv2-dev as a temporary add-on

# Type checking
pnpm compile

# Lint
pnpm lint

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## Contribution Lifecycle

### Phase 1: Claiming the Issue

1. Find an issue you want to work on
2. Comment `/assign` to claim it
3. Wait for assignment confirmation before starting

### Phase 2: Local Setup

```bash
# Fork and clone
git clone git@github.com:<your-username>/flerapii.git
cd flerapii

# Add upstream remote
git remote add upstream git@github.com:ambicuity/flerapii.git

# Create a feature branch from main
git checkout -b feat/your-feature-name main
```

### Phase 3: Development

1. Make your changes following the [Code Style](#code-style) guidelines
2. Write or update tests for your changes
3. Ensure all checks pass locally:

```bash
pnpm lint
pnpm compile
pnpm test
pnpm build
```

### Phase 4: Commit and Push

```bash
# Rebase on latest main
git fetch upstream
git rebase upstream/main

# Commit with Conventional Commits format
git commit -m "feat(dashboard): add bulk balance refresh"

# Push
git push origin feat/your-feature-name
```

### Phase 5: Opening the Pull Request

1. Open a PR against `ambicuity/flerapii:main`
2. Use the PR template -- fill in all sections
3. Ensure the PR title follows [Conventional Commits](#branching-and-commit-standards) format
4. Include `Fixes #<issue-number>` in the PR description

### Phase 6: Code Review

1. Address all review comments
2. Use `git commit --amend` or interactive rebase to keep commit history clean
3. Force push if needed: `git push --force-with-lease`

---

## Branching and Commit Standards

### Branch Naming

```
<type>/<short-description>
```

| Type | Use for |
|------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `chore/` | Maintenance |
| `refactor/` | Refactoring |
| `test/` | Tests |

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description>
```

**Types**: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`

**Scopes** (optional): `dashboard`, `keys`, `models`, `checkin`, `export`, `sync`, `ui`, `ci`, `docs`, `tests`

**Examples**:
- `feat(dashboard): add bulk balance refresh button`
- `fix(export): handle missing API key gracefully`
- `chore(ci): pin actions/checkout to v4`

---

## Pull Request Checklist

Before submitting a PR, verify:

- [ ] PR title follows Conventional Commits format
- [ ] PR description includes `Fixes #<issue-number>`
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm compile` passes with zero type errors
- [ ] `pnpm test` passes all tests
- [ ] `pnpm build` completes successfully
- [ ] No unrelated changes in the diff

---

## Code Style

- TypeScript with React
- Prettier formatting (run `pnpm format` to auto-fix)
- ESLint enforcement (run `pnpm lint:fix` to auto-fix)
- 2-space indentation
- No semicolons
- Double quotes
- Use `~/` for `src/` imports
- Brief inline comments for non-obvious logic only

---

## Good First Issues

New to the project? Look for issues labeled [`good first issue`](https://github.com/ambicuity/flerapii/labels/good%20first%20issue). These are scoped, well-documented tasks suitable for first-time contributors.

---

## Security

If you discover a security vulnerability, **do NOT open a public issue**. Email `contact@riteshrana.engineer` directly. See [SECURITY.md](SECURITY.md) for details.
