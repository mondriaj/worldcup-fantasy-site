# Saved Squad Decision Mode v0

Status: active workflow layer for manual decision tools.

## Scope

Saved Squad Decision Mode v0 lets Captain Change Advisor v0 and Substitution Advisor v0 use the current Team Builder squad after the user builds or imports a full 15-player team.

It does not replace the quick manual checks. It only narrows the player-picking step to the user's saved squad.

## What It Adds

- Captain Change Advisor shows saved-squad player cards with buttons for current captain and new captain.
- Substitution Advisor shows saved starters and saved bench players with buttons for played starter and bench option.
- The cards use the selected advisor matchday and risk style to show fixture, start, minutes, and compressed decision signal context.
- Manual search still works when no saved squad is available.

## Guardrails

- A full Team Builder squad is required before saved-squad buttons appear.
- The mode uses current browser player IDs from the built or imported squad.
- It does not infer who has already played.
- It does not infer live fantasy points.
- It does not validate official-game legality beyond the existing different-position substitution warning.
- It does not save captain-change or substitution decisions into the exported JSON yet.

## Caveats

- Official fantasy player IDs, prices, positions, and rules are still pending.
- If future official data changes player IDs, saved-squad imports may need migration before this mode can use old exports.
- This is a usability layer over the existing prototype projection model, not a new prediction model.
