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
- user-selected captain ID when set
- user-selected vice-captain ID when set
- bench-order player IDs
- captain and vice-captain source labels
- captain and vice-captain player references
- locked players
- removed players
- ignored locked players
- starter slots
- bench slots

Captain and vice-captain now use explicit user selections when the user marks them on the built or imported squad. If the user has not selected them, the export falls back to the current prototype captain score model and labels the source as model-based.

## Decision Tools

The export includes null-safe decision-tool fields for:

- Captain Change Advisor v0
- Substitution Advisor v0

If no quick check has been run, each advisor exports `saved: false` with null scenario fields. If the user runs a quick check, the latest manual result is exported with `saved: true`, the user-entered raw points, selected matchday, risk style, result, decision score, fixture projection snapshot, QA flags, and warnings.

Saved decision fields are cleared when the related advisor is reset, advisor inputs become invalid, or the Team Builder squad is rebuilt, imported, reset, previewed, or manually swapped.

## Import Compatibility

Team Import v0 reads this same `team-export-v1` schema. It restores builder settings, locked/removed players, starter IDs, bench IDs, user-selected captain/vice captain, and bench order by exact current player IDs. It warns about missing IDs instead of guessing replacements.

Team Import v0 restores saved manual decision scenarios as imported review context. Imported decisions are tagged with `imported_requires_rerun: true` when re-exported until the user reruns the advisor.

## Caveats

- This is not an official FIFA fantasy export.
- Official fantasy player IDs, official prices, official positions, final squads, and final rules are still pending.
- Decision-tool fields remain null until a user runs a quick check. Imported saved decisions are review context until the user reruns the advisor.
- Captain, vice-captain, and bench order are prototype user state when selected. They are not official-game confirmations and do not validate deadlines, live points, or eligibility.
