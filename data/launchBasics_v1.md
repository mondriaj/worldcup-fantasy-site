# Launch Basics

Date: 2026-06-05

## Purpose

This note records the launch-readiness basics for public sharing. It covers metadata, social preview, analytics, support link, custom domain, and public trust copy. It does not change player recommendations, Team Builder strategy behavior, score predictions, generated fantasy data, fantasy rules data, or export/import schema.

## Launch Metadata Status

Status: ready for current static launch.

- `index.html` has a clear page title, meta description, Open Graph title and description, Twitter card title and description, mobile viewport, and favicon link.
- `world-cup.html` has a clear page title, meta description, Open Graph title and description, Twitter card title and description, mobile viewport, and favicon link.
- No canonical URL or `og:url` is added yet because no final custom domain is configured in the repo.

## Social Preview Status

Status: basic metadata ready; image pending.

- The pages use Twitter summary cards and Open Graph text fields.
- No safe original social preview image is present in the repo.
- No official logos, trophy marks, flag-branding artwork, or copyrighted imagery were added.

TODO:

- Create a safe original social preview image later.
- Wire `og:image` and `twitter:image` only after that image exists and the final public URL is known.

## Analytics Status

Status: pending measurement ID.

- No real Google Analytics measurement ID was found in the project.
- No placeholder analytics script was added.

TODO:

- Add Google Analytics only after a real GA measurement ID is available.
- Keep the tag easy to remove and document where it was added.

## Support Link Status

Status: pending creator URL.

- No real Buy Me a Coffee or support URL was found in the project.
- No fake or placeholder support link was added.

TODO:

- Add a subtle footer/support link only after a real public creator URL is available.

## Custom Domain Status

Status: pending final domain.

- No `CNAME` file is present in the repo.
- No custom domain or DNS setting was changed.

TODO:

- Add a `CNAME` only after the final custom domain is known.
- Update launch docs if the deployment URL changes.

## Public Disclaimer Status

Status: ready.

- Footer copy says the site is independent and not official FIFA fantasy advice.
- Footer copy says model outputs are planning estimates, not guarantees.
- Footer copy tells users to confirm rules, deadlines, locks, boosters, and live details inside the official game.
- The copy stays short so the site feels practical rather than overly legal.

## Remaining Launch TODOs

- Confirm final public URL or custom domain.
- Create a safe original social preview image.
- Add `canonical`, `og:url`, `og:image`, and `twitter:image` after the final URL and preview image are ready.
- Add Google Analytics only after a real measurement ID is available.
- Add a support link only after a real public creator URL is available.

## Checks Run

- Reviewed launch metadata in `index.html` and `world-cup.html`.
- Confirmed `favicon.svg` exists.
- Confirmed no `CNAME` file exists.
- Confirmed no real GA measurement ID or support URL was found.
- Confirmed no runtime data fetch was added.
- Confirmed static browser data loading remains unchanged.
- Confirmed `index.html` and `world-cup.html` returned HTTP 200 from a local server.
- Public preview browser check passed with no console warnings, console errors, failed requests, or page overflow.
- Launch browser check passed and built a 15-player Team Builder squad on desktop and mobile.
