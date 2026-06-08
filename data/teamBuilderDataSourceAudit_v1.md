# Team Builder Data Source Audit v1

Generated: 2026-06-08

## Current Source Before Changes

Before this task, Team Builder used `window.FINANCE_PLAYERS_DATA || window.PLAYERS_DATA` as its normal player pool. The previous official-position fix overrode public positions after load, but the builder universe still came from the older finance/player layer and only filtered unavailable official fantasy rows afterward.

## Target Source After Changes

Team Builder now starts from `fantasyPoolOfficialDataStatusData.js` `official_position_records`, keeps only official selectable players, then joins current fantasy-pool matchday projections, finance/value metrics, recommendation signals, and score context.

## Fields Team Builder Uses Now

- Official fantasy player ID
- Official fantasy position
- Official fantasy price
- Official selectable status
- Country/team identity
- Current matchday projections
- Current finance/value/risk metrics
- Current recommendation signal when a candidate row exists
- Current score fixture context through the fantasy-pool projection bundle
- Official squad rules from `fantasyRulesData.js` for budget, squad size, position counts, country limits, and formations

## Remaining Fallbacks

- Runtime legacy player fallback remains only if the official fantasy-pool browser layer is missing.
- Display-only club fallback may use legacy player rows when current projection rows do not include club context.
- No legacy position, price, or selectable status can silently override official fantasy-pool fields.

## Coverage Summary

- Official fantasy players: 1481
- Official selectable players: 1248
- Team Builder candidates: 1248
- Nonselectable official rows excluded: 233
- Missing projection fields: 0
- Missing finance/value fields: 0
- Missing score context: 0
- Runtime legacy fallback rows: 0

## Monitor Note

The latest monitor result was completed with decision `official_player_import_rerun_needed`. Player changes included 1 new players, 8 selectable-status changes, 0 price changes, and 0 position changes. A separate official player import refresh is still recommended before broader model reruns.
