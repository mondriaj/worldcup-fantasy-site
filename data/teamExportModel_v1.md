# Team Export Model v1

Status: active export format.

## Scope

Team Export JSON v1 makes the Team Builder export useful for saving, sharing, testing, and the active Team Import v0 restore flow.

It preserves the older readable fields such as `players`, `starting_11`, `bench`, `captain`, `total_price`, `remaining_budget`, `rule_checks`, and `portfolio_analytics`, then adds structured v1 metadata and state.

## Added Structure

- `schema_version: team-export-v1`
- `export_version: 1`
- `exported_at`
- `model_metadata`
- `builder_settings`
- `squad_state`
- `decision_tools`
- `recommendation_notes`

## Model Metadata

The export records active browser model versions where available:

- finance browser data schema and generated date
- matchday projection schema and row counts
- score prediction schema and fixture count
- fantasy rules version, budget, country limit, and allowed formations

## Builder Settings

The export records:

- formation
- current render mode
- active matchday
- recommendation style
- trust mode
- advice pool mode
- position and price filters
- risk controls
- initial budget and budget label

## Squad State

The export records:

- squad player IDs
- starter player IDs
- bench player IDs
- captain and vice-captain player references
- locked players
- removed players
- ignored locked players
- starter slots
- bench slots

Captain and vice-captain are still prototype recommendations from the current captain score model. They are placeholders for future official fantasy captain selection or user-selected captain state.

## Decision Tool Placeholders

The export includes null-safe placeholders for:

- Captain Change Advisor v0
- Substitution Advisor v0

These placeholders do not claim a saved user decision. They exist so a future saved-decision flow has stable field names for manual decision scenarios.

## Import Compatibility

Team Import v0 reads this same `team-export-v1` schema. It restores builder settings, locked/removed players, starter IDs, and bench IDs by exact current player IDs. It warns about missing IDs instead of guessing replacements.

## Caveats

- This is not an official FIFA fantasy export.
- Official fantasy player IDs, official prices, official positions, final squads, and final rules are still pending.
- Decision-tool fields remain null until a future save/import flow captures a specific user scenario.
- Exported captain and vice-captain are model suggestions, not confirmed user choices.
