# Chrome Web Store Data Usage Mapping

This page maps Flerapii behavior to Chrome Web Store data-usage disclosures so listing answers stay consistent with implementation.

## Purpose

- Prevent mismatches between dashboard answers and real extension behavior.
- Keep privacy policy, in-product disclosures, and store listing aligned.
- Provide reviewer-friendly evidence for internal audits and appeal packets.

## Data Handling Summary

| Topic | Actual behavior |
|---|---|
| Default storage | Local-first: data is stored in browser extension storage by default. |
| External transmission | Only when user explicitly configures/uses related features (relay endpoint calls, WebDAV backup/sync, optional verification/protection flows). |
| First-party telemetry | Not used. |
| Advertising trackers | Not used. |
| Data sale | Not used. |

## Disclosure Mapping (What to Confirm in Dashboard)

| Disclosure area | What must be true in listing answers |
|---|---|
| Privacy policy URL | Must exactly match: `https://flerapii.riteshrana.engineer/privacy.html` |
| Data collection/use narrative | Must state local-first default and user-configured external transmissions only. |
| Sharing/transfers | Must not imply third-party sharing beyond user-directed endpoint interactions. |
| Security wording | Must avoid absolute claims like "never transmitted" or "fully offline" for all scenarios. |

## Permission/Behavior Evidence Pointers

- Manifest and permission scope: `wxt.config.ts`
- Privacy policy source of truth: `PRIVACY.md`
- Store submission process: `docs/docs/chrome-web-store-submission.md`
- Operational checklist: `privacy/chrome-web-store-privacy-checklist.md`

## Red-Flag Claims to Avoid

- "No network usage" (incorrect when optional integrations are used)
- "Never uploads any data under any condition" (incorrect)
- "Runs fully offline in all modes" (incorrect)

Use precise wording:

- "Local-first by default"
- "External traffic occurs only for features you configure/use"

## Pre-Submit Validation

1. Re-read current CWS questionnaire answers.
2. Compare each answer against this mapping and `wxt.config.ts`.
3. Confirm policy URL, listing text, and in-app privacy notice are consistent.
4. Capture screenshots of final listing answers for audit trail.

## Related Documentation

- [Chrome Web Store Submission Guide](./chrome-web-store-submission.md)
- [Privacy Policy](./privacy.md)
- [Permission Management](./permissions.md)
