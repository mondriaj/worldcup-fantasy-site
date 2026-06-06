# Launch Basics

Date: 2026-06-05

## Purpose

This note records the launch-readiness basics for public sharing. It covers metadata, social preview, analytics, support link, custom domain, and public trust copy. It does not change player recommendations, Team Builder strategy behavior, score predictions, generated fantasy data, fantasy rules data, or export/import schema.

## Launch Metadata Status

Status: ready for current static launch.

- `index.html` has a clear page title, meta description, Open Graph title, description, image fields, Twitter card title, description, image fields, mobile viewport, and favicon link.
- `world-cup.html` has a clear page title, meta description, Open Graph title, description, image fields, Twitter card title, description, image fields, mobile viewport, and favicon link.
- Canonical URLs and Open Graph URLs use `https://fantasyeconomist.com`.

## Social Preview Status

Status: ready.

- The pages use Twitter/X `summary_large_image` cards and Open Graph image fields.
- `social-preview.png` is a safe original 1200 x 630 image in the repo.
- The preview image uses site colors and the public action labels: Team Builder, Score Prediction, and World Cup Fixtures.
- `index.html` and `world-cup.html` reference `https://fantasyeconomist.com/social-preview.png`.
- No official logos, trophy marks, flag-branding artwork, or copyrighted imagery were added.

## Analytics Status

Status: installed for the current custom-domain public URL.

- Google Analytics is installed on `index.html` and `world-cup.html` with Measurement ID `G-MSZET05H11`.
- The current tracked public URL is `https://fantasyeconomist.com`.
- No placeholder analytics script was added.
- No player recommendations, Team Builder strategy behavior, score predictions, generated fantasy data, fantasy rules data, or export/import schema changed for analytics.

TODO:

- Verify the property receives page views after the GitHub Pages deployment updates.

## Search and AI Discovery Status

Status: basic files ready; manual submission pending.

- `robots.txt` allows crawling and points to `https://fantasyeconomist.com/sitemap.xml`.
- `sitemap.xml` lists the homepage and World Cup page on the custom domain.
- `llms.txt` provides a short public-safe summary for AI tools.
- `index.html` includes simple JSON-LD structured data for the website.
- No model outputs changed for discovery metadata.

TODO:

- Add `https://fantasyeconomist.com` to Google Search Console.
- Submit `https://fantasyeconomist.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
- Use URL Inspection for the homepage and World Cup page after deployment.

## Support Link Status

Status: pending creator URL.

- No real Buy Me a Coffee or support URL was found in the project.
- No fake or placeholder support link was added.

TODO:

- Add a subtle footer/support link only after a real public creator URL is available.

## Custom Domain Status

Status: configured.

- The root `CNAME` file contains `fantasyeconomist.com`.
- Canonical URLs and Open Graph URLs use `https://fantasyeconomist.com`.

TODO:

- Verify DNS and HTTPS status in GitHub Pages after deployment.

## Public Disclaimer Status

Status: ready.

- Footer copy says the site is independent and not official FIFA fantasy advice.
- Footer copy says model outputs are planning estimates, not guarantees.
- Footer copy tells users to confirm rules, deadlines, locks, boosters, and live details inside the official game.
- The copy stays short so the site feels practical rather than overly legal.

## Remaining Launch TODOs

- Submit the sitemap in Google Search Console and Bing Webmaster Tools.
- Check Google Analytics Realtime after visiting the deployed custom-domain site.
- Add a support link only after a real public creator URL is available.

## Checks Run

- Reviewed launch metadata in `index.html` and `world-cup.html`.
- Confirmed `favicon.svg` exists.
- Confirmed `CNAME` contains `fantasyeconomist.com`.
- Confirmed Google Analytics Measurement ID `G-MSZET05H11` is installed on the public HTML entry points and the support URL remains pending.
- Confirmed search and AI-discovery files are public-safe and use the custom domain.
- Confirmed no runtime data fetch was added.
- Confirmed static browser data loading remains unchanged.
- Confirmed `index.html` and `world-cup.html` returned HTTP 200 from a local server.
- Public preview browser check passed with no console warnings, console errors, failed requests, or page overflow.
- Launch browser check passed and built a 15-player Team Builder squad on desktop and mobile.
