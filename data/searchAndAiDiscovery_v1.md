# Search and AI Discovery

Date: 2026-06-06

## Purpose

This note tracks the public search and AI-discovery basics for Fantasy Economist. It does not change model outputs, generated fantasy data, score predictions, fantasy rules data, Team Builder logic, Google Analytics, CNAME, or export/import behavior.

## Added Public Discovery Files

- `robots.txt` allows crawling and points crawlers to the sitemap.
- `sitemap.xml` lists the homepage and World Cup fixtures page using the custom domain.
- `llms.txt` gives AI tools a short public-safe summary of the site, main pages, main features, and independence disclaimer.
- `index.html` includes simple JSON-LD structured data for the public website.

## Manual Submission Checklist

1. Add `https://fantasyeconomist.com` to Google Search Console.
2. Submit `https://fantasyeconomist.com/sitemap.xml`.
3. Use URL Inspection for the homepage and World Cup page.
4. Add the site to Bing Webmaster Tools.
5. Submit the sitemap and main URLs.
6. Check Google Analytics Realtime after visiting the site.
7. Recheck indexing after a few days.

## Operating Notes

- Keep canonical and sitemap URLs on `https://fantasyeconomist.com`.
- Do not block AI crawlers unless the launch strategy changes.
- Do not add social preview image metadata until a safe original image exists.
- No model rerun is needed for discovery-file updates.
