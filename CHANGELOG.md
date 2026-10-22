# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/ambicuity/flerapii/compare/v1.0.3...v1.1.0) (2026-10-22)


### Features

* **publish:** add a Chrome Web Store review status check ([7cf184d](https://github.com/ambicuity/flerapii/commit/7cf184dd5677804f672657529df011bfb4da645b))
* **publish:** add a Chrome Web Store review status check ([8681013](https://github.com/ambicuity/flerapii/commit/868101335f1ed4b0288411779727b56fd4d76f4d))


### Bug Fixes

* **accounts:** migrate accounts under the storage write lock ([57018c9](https://github.com/ambicuity/flerapii/commit/57018c949ebf643ea4d49a888ee395dcde321990)), closes [#71](https://github.com/ambicuity/flerapii/issues/71)
* **api:** support every token-list envelope in the OneHub and shared adapters ([fc9c76b](https://github.com/ambicuity/flerapii/commit/fc9c76b879e693e9ce712f8ec4b968cf126bfbf4)), closes [#67](https://github.com/ambicuity/flerapii/issues/67)
* **browser:** remove temp windows and tabs by their actual resource kind ([75cb5bc](https://github.com/ambicuity/flerapii/commit/75cb5bcec675d382047c6db0cee563066ef8b250)), closes [#66](https://github.com/ambicuity/flerapii/issues/66)
* **checkin:** do not report a successful daily run when accounts cannot be read ([e712696](https://github.com/ambicuity/flerapii/commit/e71269607f796355ccc0b29718d08046ea5c3b63)), closes [#73](https://github.com/ambicuity/flerapii/issues/73)
* **dashboard:** derive the consumption totals from one account set ([87defcf](https://github.com/ambicuity/flerapii/commit/87defcfb47eec9fd5ab39bc77920b1008432ddfd)), closes [#72](https://github.com/ambicuity/flerapii/issues/72)
* **import:** keep every backup section when importing a non-2.0 payload ([625de57](https://github.com/ambicuity/flerapii/commit/625de57b2fea0e2e8b668585e228cb772cbb1684)), closes [#68](https://github.com/ambicuity/flerapii/issues/68)
* **preferences:** keep stored settings when the sorting config is malformed ([b3da7c1](https://github.com/ambicuity/flerapii/commit/b3da7c15693980cf6006a38b89b5c36b7333ce23)), closes [#69](https://github.com/ambicuity/flerapii/issues/69)
* **preferences:** persist the default sorting priority config on reset ([b7b5aee](https://github.com/ambicuity/flerapii/commit/b7b5aee2817cc3b3dc91e17c14f757644af604b1)), closes [#70](https://github.com/ambicuity/flerapii/issues/70)
* **publish:** log the real draft version after a Chrome Web Store upload ([d5beffd](https://github.com/ambicuity/flerapii/commit/d5beffdf7a3eb9ccf49f4557b19c1f065d415fdf))
* **publish:** log the real draft version after a Chrome Web Store upload ([9f3d40a](https://github.com/ambicuity/flerapii/commit/9f3d40a14c9f8d3e5df699fd7a49f42c11ae4c27))
* resolve 10 verified bugs across temp-window, storage, preferences, import and check-in ([54314d2](https://github.com/ambicuity/flerapii/commit/54314d214fe1812d5fe16c70633b1cb1b869a2ec))
* **temp-window:** allocate a unique DNR rule id per cookie-rule install ([272420d](https://github.com/ambicuity/flerapii/commit/272420dfb3b5758c1f3d6d30cb3c3e02e1c7ed6e)), closes [#64](https://github.com/ambicuity/flerapii/issues/64)
* **temp-window:** track in-use temp contexts per request ([c1bd3e5](https://github.com/ambicuity/flerapii/commit/c1bd3e50b8d13d2c87e364d1149b876267e63c8c)), closes [#65](https://github.com/ambicuity/flerapii/issues/65)
* **tests:** use the public import path instead of the removed saveAccounts helper ([d8558f8](https://github.com/ambicuity/flerapii/commit/d8558f8ea8ea32fa86265c2d333eab10e16cc9c4))

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
