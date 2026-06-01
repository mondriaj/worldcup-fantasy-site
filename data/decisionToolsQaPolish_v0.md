# Decision Tools QA Polish v0

Status: active UI safety layer.

## Scope

Decision Tools QA Polish v0 makes the Captain Change Advisor and Substitution Advisor state easier to understand during a real matchday.

It covers:

- visible advisor status badges
- clearer imported-decision warnings
- concise visible instructions
- focused browser QA for export/import/rerun behavior

## Advisor States

Each manual advisor shows one of three states:

- `Manual`: no saved scenario is active.
- `Saved`: the latest completed quick check will be included in Team Export JSON.
- `Imported - rerun needed`: fields were restored from Team Import, but the user must rerun the advisor before acting.

## Guardrails

- Imported saved checks are review context only.
- Imported checks do not verify live points, played/unplayed status, official deadlines, or official-game legality.
- A fresh advisor rerun replaces imported context with a current manual result.
- The 12+ captain-score and 8+ starter-score conservative behavior remains part of the advisor logic.

## Caveats

- This is a UI clarity and QA layer, not a new projection model.
- It does not fetch live scores.
- It does not validate official 2026 fantasy rules.
