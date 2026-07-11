# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2](https://github.com/ambicuity/flerapii/compare/v1.0.1...v1.0.2) (2026-07-11)


### Bug Fixes

* **ci:** make GitHub-to-CWS publish reliable and fail-loud ([8017fcd](https://github.com/ambicuity/flerapii/commit/8017fcd1a31c36a702b57a922f8f4a1521dd8a34))
* correct content-handler, animation, keyword, token, and manifest bugs ([1aeeac4](https://github.com/ambicuity/flerapii/commit/1aeeac4ab65504a30f0a0fcd098a07ead48cca67))
* **popup:** cap popup document width to viewport to stop 360px overflow ([272ccae](https://github.com/ambicuity/flerapii/commit/272ccaee32fa3491b484264dfe1bb8e317ee09c9))
* **popup:** repair react-countup interop crash (React [#130](https://github.com/ambicuity/flerapii/issues/130)) + bump to 1.0.3 ([78f477d](https://github.com/ambicuity/flerapii/commit/78f477d299782f90108aeb5eba07876289691f1e))
* **popup:** repair react-countup interop crash (React [#130](https://github.com/ambicuity/flerapii/issues/130)), bump to 1.0.3 ([aecfd74](https://github.com/ambicuity/flerapii/commit/aecfd74d822edd672d42fc05df12d896fd0818f9))
* repair GitHub→CWS publish pipeline and fix verified extension bugs ([0dc05ba](https://github.com/ambicuity/flerapii/commit/0dc05ba42326ffa42b47590ccdda842a182b645f))
* **security:** patch remaining CVEs via pnpm overrides ([a14e81f](https://github.com/ambicuity/flerapii/commit/a14e81fb7b27138bfb65e39ecdbc94f4f7bfd768))
* **security:** update yaml override to &gt;=2.8.3 ([e609ca0](https://github.com/ambicuity/flerapii/commit/e609ca0cb7cff67c8bbe7609c06b2e0489945978))

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
