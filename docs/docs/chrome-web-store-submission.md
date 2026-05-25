# Chrome Web Store Submission Guide

This guide is the project-standard process for submitting new versions of Flerapii to the Chrome Web Store and avoiding policy regressions.

## Purpose

- Keep listing metadata aligned with real extension behavior.
- Reduce avoidable rejections (especially privacy URL and data usage mismatches).
- Ensure every submission can be audited and reproduced.

## Canonical Privacy Policy URL

Use this exact URL in the Chrome Web Store dashboard:

- `https://flerapii.riteshrana.engineer/privacy.html`

Do not use:

- repository root URLs
- generic project homepages
- author profile pages
- temporary preview links

## Pre-Submission Checklist

### 1) Privacy URL validity

- Open the privacy URL in an incognito window while logged out.
- Confirm the page loads directly and includes:
  - policy title
  - "Last updated" date
  - data categories
  - usage purpose
  - storage/transmission behavior
  - retention/deletion controls
  - contact method

### 2) Manifest-to-listing alignment

Review current manifest behavior from `wxt.config.ts`:

- Required permissions: `tabs`, `storage`, `alarms`, `contextMenus`, and `sidePanel` (Chromium)
- Optional permissions:
  - Chromium: `cookies`, `declarativeNetRequestWithHostAccess`, `clipboardRead`
  - Firefox: `cookies`, `webRequest`, `webRequestBlocking`, `clipboardRead`
- Host permissions: `<all_urls>`

Store declarations must not understate or overstate these capabilities.

### 3) Data handling alignment

Ensure all policy and listing statements match the implementation:

- Local-first storage by default (browser extension storage).
- Optional user-configured external transmission only when features are enabled:
  - relay endpoints configured by user
  - WebDAV backup/sync configured by user
- No first-party telemetry backend.
- No advertising trackers.

Use [Store Data Usage Mapping](./chrome-web-store-data-usage-mapping.md) as the source for dashboard questionnaire alignment.

### 4) Documentation alignment

Verify these surfaces use consistent privacy wording and links:

- `PRIVACY.md`
- `docs/docs/privacy.md`
- `privacy/chrome-web-store-privacy-checklist.md`
- About page privacy notice in extension UI

## Chrome Web Store Dashboard Update Steps

1. Open the item in Chrome Web Store Developer Dashboard.
2. Update the Privacy policy field to the canonical URL above.
3. Re-check all Data usage answers against the checklist in this guide.
4. Save listing metadata changes.
5. Submit for review.

## Recommended Reviewer Notes (optional but useful)

When submitting, include a concise note:

> Privacy policy URL has been updated to a direct public policy page.  
> Policy and in-app disclosures were aligned with current implementation: local-first storage by default, optional user-configured external sync/endpoint traffic only, no first-party telemetry backend.

## Evidence to Capture for Audit Trail

Store these artifacts for each submission:

- Screenshot of the privacy URL field in dashboard
- Screenshot of the privacy policy page loaded in incognito
- Build version / commit hash submitted
- Submission timestamp
- Reviewer outcome and any follow-up notes

## If Rejected Again

1. Compare rejection reason against this guide and `privacy/chrome-web-store-privacy-checklist.md`.
2. Correct metadata first (if metadata issue).
3. Resubmit.
4. File an appeal only if rejection conflicts with visible, verifiable facts.

## Related Documentation

- [Privacy Policy](./privacy.md)
- [Permission Management](./permissions.md)
- [Getting Started](./get-started.md)
- [Store Data Usage Mapping](./chrome-web-store-data-usage-mapping.md)

## Privacy and Security Notes

- Flerapii is local-first by default: extension configuration and operational data are stored in browser extension storage.
- External network traffic is feature-driven and user-configured (for example relay endpoint operations, optional WebDAV sync, or explicit integration actions).
- Canonical privacy policy URL: `https://flerapii.riteshrana.engineer/privacy.html`.
