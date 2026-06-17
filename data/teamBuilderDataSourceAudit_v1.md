# Team Builder Data Source Audit v1

Generated: 2026-06-17

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

- Official fantasy players: 1488
- Official selectable players: 1245
- Team Builder candidates: 1233
- Nonselectable official rows excluded: 243
- Model-not-ready official rows excluded: 12
- Missing projection fields: 0
- Missing finance/value fields: 0
- Missing score context: 0
- Runtime legacy fallback rows: 0

## Monitor Note

The latest monitor result was completed with decision `full_model_rerun_recommended`. Player changes included 6 new players, 16 selectable-status changes, 0 price changes, and 0 position changes. A separate official player import refresh is still recommended before broader model reruns.
