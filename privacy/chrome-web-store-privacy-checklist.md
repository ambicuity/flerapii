# Chrome Web Store Privacy URL Checklist

Use this checklist before every Chrome Web Store submission.

This file is the quick operational checklist. For the full submission runbook, see:

- `docs/docs/chrome-web-store-submission.md`
- `docs/docs/chrome-web-store-data-usage-mapping.md`

## Privacy policy URL requirements

- [ ] URL opens publicly without login in an incognito window
- [ ] URL points directly to a privacy policy page (not a generic homepage, owner profile, or repository root)
- [ ] URL is stable across releases and controlled by this project
- [ ] URL exactly matches the value entered in the Chrome Web Store "Privacy policy" field

## Canonical URL for this project

- `https://flerapii.riteshrana.engineer/privacy.html`

## Manual validation steps

1. Open the canonical URL in an incognito window.
2. Confirm the page clearly includes:
   - policy title
   - "Last updated"
   - data categories
   - usage
   - storage/transmission
   - deletion
   - contact
3. Confirm the same URL is used in:
   - Chrome Web Store listing
   - `PRIVACY.md`
   - docs privacy page
   - in-app About privacy notice link

## Listing consistency checks

- [ ] Listing description does not claim "no network usage"
- [ ] Listing/privacy wording reflects "local-first by default" and optional user-configured external endpoints
- [ ] Permission explanations in store listing are consistent with current `wxt.config.ts`

## Data usage alignment checks (before submit)

- [ ] Store data usage answers match `wxt.config.ts` permissions and host access
- [ ] "Local-first" claims include optional user-configured transmissions (WebDAV and configured relay endpoints)
- [ ] No claim states data is never transmitted under any circumstance
