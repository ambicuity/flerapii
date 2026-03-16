# Repository Guidelines

## Project Structure

- `src/entrypoints/`: WXT extension entrypoints for `background`, `content`, `popup`, `options`, and `sidepanel`.
- `src/features/`: Feature-oriented UI modules; keep entrypoints thin and push reusable logic into features, services, hooks, or utils.
- `src/components/` and `src/components/ui/`: Shared React components and UI primitives.
- `src/services/`: Business logic, persistence, site adapters, and browser integration.
- `src/hooks/`, `src/contexts/`, `src/utils/`, `src/types/`, `src/constants/`, `src/lib/`, `src/styles/`: Shared app building blocks.
- `src/locales/`: App i18n resources; manifest strings live in `src/public/_locales/`.
- `tests/`: Vitest setup, MSW handlers, and shared test utilities.
- `e2e/`: Playwright end-to-end coverage.
- Build artifacts are written to `.output/`.

## Build, Test, and Development Commands

Prerequisites: Node.js 20+ and pnpm 10+.

- Install: `pnpm install` (runs `wxt prepare` via `postinstall`).
- Dev, Chromium: `pnpm dev`, then load `.output/chrome-mv3-dev` as an unpacked extension.
- Dev, Firefox: `pnpm dev:firefox`, then load `.output/firefox-mv2-dev` as a temporary add-on.
- Build: `pnpm build`, `pnpm build:firefox`, `pnpm build:all`.
- Package: `pnpm zip`, `pnpm zip:firefox`, `pnpm zip:all`.
- Type-check: `pnpm compile`.
- Lint/format checks: `pnpm lint`, `pnpm format:check`.
- Unit tests: `pnpm test`, `pnpm test:watch`, `pnpm test:ci`.
- E2E tests: `pnpm e2e:install`, `pnpm e2e`, `pnpm e2e:ui`.

## Coding Style

- TypeScript + React with Prettier formatting and ESLint enforcement.
- Follow the existing repo style: 2 spaces, no semicolons, double quotes.
- Prefer `~/` for `src/` imports.
- Tests use `*.test.ts` or `*.test.tsx`.
- Keep entrypoints thin; shared logic should not depend on entrypoint-specific modules.

## Testing Guidelines

- Unit and component tests use Vitest with jsdom and Testing Library.
- HTTP mocking uses MSW from `tests/msw/handlers.ts` and `tests/msw/server.ts`.
- Shared test rendering utilities live in `tests/test-utils/render.tsx`.
- Global test setup lives in `tests/setup.ts` and uses `wxt/testing/fake-browser` for WebExtension API mocking.
- Start with the smallest affected test set, then broaden only if the change is cross-cutting.

## Security

- Never commit secrets, tokens, or private environment overrides.
- Use `.env.example` as the reference for supported environment variables.
