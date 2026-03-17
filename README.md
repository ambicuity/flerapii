<div align="center">
  <img src="assets/logo.png" alt="Flerapii Logo" width="128" height="128">

# Flerapii

**Unified management for New API-compatible relay accounts: balance and usage dashboards, automated check-in, one-click key export to popular clients, in-page API validation, channel and model synchronization.**

<p align="center">
<a href="https://github.com/ambicuity/flerapii/releases">
  <img alt="GitHub version" src="https://img.shields.io/github/v/release/ambicuity/flerapii?label=GitHub&logo=github&style=flat">
</a>
<a href="https://github.com/ambicuity/flerapii/blob/main/LICENSE">
  <img alt="License" src="https://img.shields.io/github/license/ambicuity/flerapii?style=flat">
</a>
<a href="https://github.com/ambicuity/flerapii/stargazers">
  <img alt="Stars" src="https://img.shields.io/github/stars/ambicuity/flerapii?style=flat">
</a>
</p>

---

**[Documentation](https://ambicuity.github.io/flerapii/) | [Supported Tools](https://ambicuity.github.io/flerapii/supported-export-tools.html) | [Supported Sites](https://ambicuity.github.io/flerapii/supported-sites.html) | [Quick Start](https://ambicuity.github.io/flerapii/get-started.html) | [FAQ](https://ambicuity.github.io/flerapii/faq.html) | [Changelog](CHANGELOG.md) | [Contributing](CONTRIBUTING.md)**

---

</div>

## Introduction

The AI ecosystem increasingly relies on New API-based relay stations and self-hosted panels. Managing balances, model lists, and API keys across multiple sites is fragmented and time-consuming.

Flerapii is a browser extension that consolidates all of this into a single interface. It currently supports accounts on platforms built from the following projects:

- [one-api](https://github.com/songquanpeng/one-api)
- [new-api](https://github.com/QuantumNous/new-api)
- [Veloera](https://github.com/Veloera/Veloera)
- [one-hub](https://github.com/MartialBE/one-hub)
- [done-hub](https://github.com/deanxv/done-hub)
- [Sub2API](https://github.com/Wei-Shaw/sub2api)
- [AnyRouter](https://anyrouter.top)

For the full compatibility list and export tool list, see:

- [Supported Sites](https://ambicuity.github.io/flerapii/supported-sites.html)
- [Supported Tools](https://ambicuity.github.io/flerapii/supported-export-tools.html)

## Features

- **Smart Site Detection**
  Paste a site URL after logging in to add an account. The extension auto-detects site name, top-up ratio, and other metadata. Manual entry is available as a fallback with duplicate detection.

- **Multi-Account Dashboard**
  Aggregate multiple sites and accounts into a single panel. View balances, usage, and health status at a glance with support for automatic data refresh.

- **Automated Check-In**
  Identifies sites that support daily check-in and processes them centrally. Supports automatic scheduling and execution history to avoid missed credits.

- **Token and Key Management**
  Centralized viewing, copying, and batch management of API keys. Reduces context-switching between site backends.

- **Model Information and Pricing**
  View model lists and pricing across all sites. Compare available models and cost differences in a unified view.

- **Model and Endpoint Validation**
  Validate API key and model availability directly. Includes CLI compatibility checks for diagnosing cases where an endpoint appears functional but fails in downstream tools.

- **Usage Analytics and Visualization**
  Multi-site, multi-account usage reports with filtering by site, account, token, and date range. View usage, spend, model distribution, trends, latency, and slow-request analysis.

- **Quick Export Integration**
  One-click export to CherryStudio, CC Switch, CLIProxyAPI, Claude Code Router, Kilo Code, and self-hosted platforms (New API / DoneHub / Veloera / Octopus).

- **Self-Hosted Site Backend Integration**
  For administrators of self-hosted New API, DoneHub, Veloera, and Octopus instances: channel import, backend synchronization, and channel management tools.

- **Cloudflare Challenge Assistant**
  Automatically opens a temporary window when a Cloudflare challenge is encountered, resumes the original workflow after verification.

- **Data Backup and Sync**
  Import/export data, WebDAV backup with automatic synchronization. Supports multi-device and multi-browser workflows.

- **Cross-Platform Support**
  Compatible with Chrome, Edge, Firefox, and mobile browsers (Edge Mobile, Firefox for Android, Kiwi). Full dark mode support.

- **Privacy-First Local Storage**
  All data is stored locally by default with no telemetry. External services like WebDAV are only used if explicitly configured.

> [!NOTE]
> Data format remains compatible with various management tools for direct import.

## Installation

| Channel | Link | Version |
|---------|------|---------|
| GitHub Release | [Download](https://github.com/ambicuity/flerapii/releases) | [![GitHub version](https://img.shields.io/github/v/release/ambicuity/flerapii?label=GitHub&logo=github&style=flat)](https://github.com/ambicuity/flerapii/releases) |

<details>
<summary>Manual Installation (Unpacked)</summary>

1. Download the latest release package
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted extension folder

</details>

> [!TIP]
> The extension also supports mobile browsers such as Edge Mobile, Firefox for Android, and Kiwi.

## Quick Start

See the [Quick Start Guide](https://ambicuity.github.io/flerapii/get-started.html).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and contribution guidelines.

## Tech Stack

- **Framework**: [WXT](https://wxt.dev) -- Multi-browser extension toolchain and build pipeline
- **UI**: [React](https://react.dev) -- Extension options page and popup interface
- **Language**: [TypeScript](https://www.typescriptlang.org) -- End-to-end type safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com) -- Utility-first CSS framework
- **Components**: [Headless UI](https://headlessui.com) -- Unstyled, accessible UI primitives

## License

This project is licensed under the [AGPL-3.0 License](LICENSE).

## Author

**Ritesh Rana** -- [contact@riteshrana.engineer](mailto:contact@riteshrana.engineer)

---

<div align="center">
  <strong>If this project is useful to you, consider giving it a star.</strong>
</div>
