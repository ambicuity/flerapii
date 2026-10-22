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

## [1.1.0] - 2026-10-22

### Fixed
- Temporary-window cookie rules are now installed with a rule id that is unique per request instead of per tab. Concurrent requests to the same origin no longer overwrite or delete each other's injected `Cookie` header, so one account's session can no longer be sent with another account's request.
- In-use temporary-window contexts are tracked per request. A context that is still serving a request is no longer handed to a second request, and releasing one request no longer tears the tab down while another request is still running.
- Temporary windows and tabs are now removed as the resource kind they actually are. Passing a tab id to the window-removal API could close an unrelated browser window, because Chrome allocates window and tab ids from separate counters.
- The OneHub/DoneHub token listing now understands the `{ items }` response envelope as well as a bare array and `{ data }`. The previously unhandled shape returned an empty key list without an error, which also made key auto-provisioning create duplicate keys.
- Importing a backup that is not version 2.0 no longer silently drops API credential profiles, bookmarks or the pinned/ordered account ids, and the import result now accounts for every requested section instead of reporting a complete success.
- A malformed `sortingPriorityConfig` no longer makes the settings read fail. A failed read now falls back to the stored preferences instead of the defaults, so a later save can no longer replace real settings (including the WebDAV password) with default values.
- Resetting the account sorting priority now actually persists the default order. Preferences are deep-merged, so the previous reset wrote the old custom order straight back.
- Account schema migrations now run as a read-modify-write inside the storage write lock. A background migration can no longer delete an account that was added concurrently from another extension context.
- The dashboard's "today's consumption" USD and CNY totals are now derived from the same account set. Disabling an account previously lowered the USD figure but not the CNY one, so the two currencies of the same metric disagreed.
- A failed read of the account store is no longer reported as a successful daily auto check-in. The run now fails visibly, the day is not marked as already checked in, and the day's check-in is not silently lost.

## [1.0.3] - 2026-07-11

### Fixed
- Fixed the popup (and any surface using animated counters) crashing on open with a blank screen. react-countup 6.x is CommonJS-only and its default `<CountUp>` export was mangled by the bundler into an object, throwing React error #130 and taking down the whole popup. Animated counters now render via an interop-safe wrapper built on react-countup's `useCountUp` hook.
- Fixed horizontal overflow of the popup at narrow widths (down to 360px). The popup document width was hard-coded to 410px; it now caps at the viewport width so content reflows and the header no longer overflows on small displays.

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
