# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added comprehensive GitHub configuration (issue templates, PR template, CODEOWNERS, dependabot, labeler)
- Added community files (CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTORS.md)
- Added CodeRabbit AI and Gemini Code Assist configurations
- Added GitHub Actions workflows (CI, stale management, CodeQL, labeler, PR size, release-please)
- Revamped documentation website with dark minimal design
- Generated new Flerapii logo

## [1.0.3] - 2026-07-11

### Fixed
- Fixed the popup (and any surface using animated counters) crashing on open with a blank screen. react-countup 6.x is CommonJS-only and its default `<CountUp>` export was mangled by the bundler into an object, throwing React error #130 and taking down the whole popup. Animated counters now render via an interop-safe wrapper built on react-countup's `useCountUp` hook.

## [1.0.2] - 2026-07-11

### Fixed
- Shield-bypass content-script handler now returns synchronously so Chrome keeps the message port open (async handler previously dropped the response, breaking the protection-bypass prompt on Chrome).
- Balance and consumption counters now animate from the previous value to the new value on refresh instead of restarting from zero every time.
- Invalid/expired access-token troubleshooting hint no longer shows for unrelated auto check-in failures (empty-string keywords made the filter always match).
- Default API token auto-provisioning is serialized per account to prevent duplicate "user group (auto)" tokens under concurrent callers.
- `calculateTotalConsumption` is null-safe against incomplete account data so a single malformed account can no longer abort account loading.

### Changed
- Chrome builds no longer expose the Firefox-only `_execute_sidebar_action` command (it was a bindable-but-dead keyboard shortcut on Chrome).
- Removed a stale React DevTools dev artifact from packaged builds (smaller extension size).
- Hardened the GitHub-to-Chrome-Web-Store release pipeline: fail-loud publishing, tag/version guard, frozen-lockfile installs, deterministic zip paths, and a working release trigger.

## [1.0.0] - 2026-03-15

### Added
- Initial release of Flerapii extension
- Unified management for New API-compatible relay accounts
- Auto-checkin capabilities and credential management
- Cross-platform support for Chromium and Firefox
- Data synchronization capabilities via WebDAV
- Comprehensive End-to-End (E2E) testing coverage
- Integrated documentation using Markdown processors
