# Final Round Browser Content Contract v1

Status: active browser QA contract

## Purpose

This contract defines the exact public Final Round content that browser QA must see for Picks, Captain Watchlist, Match Environment, Player Profile, and the Team Builder golden squad. It hardens the public preview check from "the page rendered" to "the active Final Round content is the expected content."

## Protected Surfaces

| Surface | Exact expectations |
| --- | --- |
| Picks | Final Round context, eligible teams only, at least one Final player, at least one Third Place player, visible Third Place/risk wording, and official-lock/final-squad caveats |
| Captain Watchlist | Final Round context, eligible teams only, no eliminated players, high-upside Final options, risk-aware Third Place options, and captain/watchlist labels |
| Match Environment | Spain vs Argentina Final, France vs England Third Place, completed SF scores France 0-2 Spain and England 1-2 Argentina, no stale default copy or Final Round TBDs, and visible predictions |
| Player Profile | Opens one Final player and one Third Place player, keeps Final Round context, shows eligible team/opponent context, and includes role/evidence/caution wording |
| Team Builder | Visible squad matches `data/teamBuilderGoldenFinalRound_v1.json`, budget remains 94.8 / 105, and no eliminated players appear |

## Caveats

The public page must continue to communicate that official fantasy-pool data is used, independently source-backed final squads are not verified, final XIs are not confirmed, official locks/substitutions/lineups must be checked before final decisions, and Third Place lineups carry extra risk.

## Intentional Updates

Update this contract only when the active model or public Final Round content is intentionally changed. If the visible content changes because of a model update, update the contract and explain the model change in a separate commit.
