---
home: true
title: Home
heroImage: /512.png
heroText: Flerapii - AI Aggregation Relay Manager
tagline: "Open-source browser extension to uniformly manage third-party AI aggregation relays and self-built New APIs: automatically identify accounts, view balances, sync models, manage keys, and support cross-platform and cloud backups."
actions:
  - text: Get Started
    link: /get-started.html
    type: primary
    
  - text: Chrome Store
    link: https://chromewebstore.google.com/detail/cocbaodnhomfmikmkgplahalapdbgkjm
    type: secondary

  - text: Edge Store
    link: https://microsoftedge.microsoft.com/addons/search/flerapii
    type: secondary

  - text: FireFox Store
    link: https://addons.mozilla.org/firefox/addon/contact@riteshrana.engineer
    type: secondary

features:
  - title: Intelligent Site Management
    details: Automatically identify AI aggregation relay sites and create access tokens, intelligently obtain site names and recharge ratios, supporting duplicate detection and manual addition.
  - title: Multi-Account System
    details: Supports adding multiple accounts for each site, account grouping and quick switching, real-time balance viewing, and detailed usage logs.
  - title: Token and Key Management
    details: Conveniently manage all API Keys, supporting viewing, copying, refreshing, and batch operations.
  - title: Model Information Viewing
    details: Clearly displays the list of supported models and pricing information for the site.
  - title: Check-in Status Monitoring
    details: Automatically detects which sites support check-ins and marks accounts that have not checked in for the day, allowing you to complete multi-site check-ins sequentially within a single panel, reducing the waste of free Quota due to forgotten check-ins.
  - title: Quick Export Integration
    details: One-click export of configurations to Cherry Studio, CC Switch, Kilo Code, CLIProxyAPI, Claude Code Router, and self-built hosted sites.
  - title: Self-built Site Backend Linkage
    details: Supports backend linkage and Channel-related operations for self-built New API, DoneHub, Veloera, and Octopus instances.
  - title: Data Backup and Recovery
    details: Supports JSON format import/export and WebDav cloud backup for cross-device data synchronization.
  - title: Full Platform Support
    details: Compatible with browsers such as Chrome, Edge, Firefox, and also supports mobile browsers like mobile Edge, Firefox for Android, Kiwi, etc., with dark mode adaptation.
  - title: Privacy and Security
    details: Local-first by default: extension data stays in browser storage. Network requests only occur for features you use (for example relay endpoints, optional WebDAV backup/sync, and optional verification flows).
  - title: Cloudflare Anti-Bot Assistant
    details: Automatically pops up to bypass the 5-second shield when encountered, ensuring sites can be identified and recorded.

footer: AGPL-3.0 Licensed | Copyright 2025-present Flerapii
---

## Introduction

The AI ecosystem now has an increasing number of aggregation relays and self-built panels based on the New API series. Managing the balances, model lists, and API keys of various sites simultaneously is often scattered and time-consuming.

Flerapii, as a browser extension, can automatically identify accounts on these sites and provide one-click access to view balances, manage models, keys, and perform automatic check-ins. It also offers backend linkage and Channel-related tools for self-built New API, DoneHub, Veloera, and Octopus. Currently, it supports aggregation relay accounts based on the following projects:

- [one-api](https://github.com/songquanpeng/one-api)
- [new-api](https://github.com/QuantumNous/new-api)
- [Veloera](https://github.com/Veloera/Veloera)
- [one-hub](https://github.com/MartialBE/one-hub)
- [done-hub](https://github.com/deanxv/done-hub)
- [Sub2API](https://github.com/Wei-Shaw/sub2api)
- [AnyRouter](https://anyrouter.top)
- WONG Public Welfare Site
- Neo-API (Closed Source)
- Super-API (Closed Source)
- RIX_API (Closed Source, basic functionality supported)
- VoAPI (Closed Source, older versions supported)

## Compliance and Privacy

- [Privacy Policy](./privacy.md)
- [Permission Management](./permissions.md)
- [Chrome Web Store Submission Guide](./chrome-web-store-submission.md)

## Release Notes for Store Links

- Chrome listing ID is active and documented: `cocbaodnhomfmikmkgplahalapdbgkjm`.
- Edge Add-ons listing ID is pending publication confirmation. Until confirmed, documentation links to Edge search rather than a specific listing page.

## Privacy and Security Notes

- Flerapii is local-first by default: extension data remains in browser extension storage unless you enable external integrations.
- External traffic is feature-driven and user-configured (for example relay endpoint operations, optional WebDAV sync, or selected integration actions).
- Canonical privacy policy URL: `https://flerapii.riteshrana.engineer/privacy.html`.

## Related Documentation

- [Getting Started](./get-started.md)
- [Privacy Policy](./privacy.md)
- [Permission Management](./permissions.md)
- [Chrome Web Store Submission Guide](./chrome-web-store-submission.md)
