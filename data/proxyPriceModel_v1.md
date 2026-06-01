# Proxy Price Model v1

Generated for Week 6 data sprint.

## Purpose

Official World Cup fantasy prices are not available yet. `proxy_price_v1` is a prototype budget price used only so the Team Builder, Best Value, Cheap Enabler, Premium Worth It, and portfolio analytics can be tested.

It is not an official FIFA fantasy price.

## Why v1 Exists

`proxy_price_v0` was useful, but it could overprice players whose raw projected return looked high even when their expected tournament role was weak. That was especially visible for low-start goalkeepers, substitutes, and players with strong per-90 or save-driven upside but low expected minutes.

That made the Team Builder feel tighter than it needed to be.

## Main Change

`proxy_price_v1` prices the usable tournament role, not only raw upside.

The model now creates a role-usability score from:

- start probability
- expected minutes
- role confidence

Then it uses that role-usability score to shrink raw expected return and risk-adjusted return before pricing the player.

## Inputs

The model uses:

- `data/playerValueModel_v0.json`
- `data/playerFinanceMetrics_v0.json`
- `data/playerRecommendationInputs_v0.json`
- `data/playerMinutesModel_v0.json`

## Calibration Rules

- Position floors and caps:
  - GK: 4.0 to 6.5
  - DEF: 4.0 to 7.5
  - MID: 4.5 to 10.0
  - FWD: 5.0 to 11.0
- Prices round to the nearest 0.5 unit.
- Low-role players below 25% start probability or below 30 expected minutes cannot increase versus v0.
- Insufficient-data players cannot increase versus v0.
- Strong starters with high expected return can still hold premium prices.
- `proxy_price_v0` remains in the data for audit and comparison.

## Distribution Impact

Position-ready players: 1,335.

- Average proxy price moved from 6.03 to 5.59.
- 701 players became cheaper.
- 620 players were unchanged.
- 14 players became slightly more expensive.
- Minimum v1 price is 4.0.
- Maximum v1 price is 11.0.

By position:

- GK average: 4.94, max 6.5.
- DEF average: 5.27, max 7.5.
- MID average: 5.62, max 10.0.
- FWD average: 6.30, max 11.0.

## Website Usage

The website now treats `proxy_price_v1` as the active prototype price.

The browser data keeps:

- `proxy_price_v0`
- `proxy_price_v1`
- `proxy_price_delta_v1`
- `proxy_price_active_version`
- v0 value fields where useful for audit
- v1 value fields for active recommendations

Team JSON export includes both v0 and v1 proxy prices.

## Fallback Rules

- If official fantasy prices arrive, official prices should replace proxy prices in the active builder.
- If `proxy_price_v1` is missing for a player, the site can fall back to `proxy_price_v0`, then to the legacy `price` field.
- If official fantasy positions or scoring rules differ from the prototype assumptions, recalibrate v1 or replace it with v2.

## Known Limits

- This is not trained against official 2026 fantasy prices.
- It does not know future ownership, injuries, final lineups, or official role designations.
- It smooths the Team Builder experience, but it should not be treated as a real market price.
