# Saved Decision Import v0

Status: active workflow layer.

## Scope

Saved Decision Import v0 restores saved manual advisor scenarios from Team Export JSON v1.

It covers:

- Captain Change Advisor v0
- Substitution Advisor v0

It does not treat imported decisions as fresh live advice. It restores the scenario fields and marks the result as imported review context.

## Import Behavior

When a valid `team-export-v1` file has saved `decision_tools`, Team Import v0 restores:

- selected matchday
- selected risk style
- user-entered raw points
- current captain or played starter when the saved player ID still exists
- replacement captain or bench candidate when the saved player ID still exists
- imported result context for display and re-export

The advisor result panel shows an imported saved check and tells the user to rerun the advisor before acting.

## Export Behavior After Import

Imported saved decisions remain in Team Export JSON v1 as saved scenarios, but they are tagged with:

- `imported: true`
- `saved_decision_import_version: saved_decision_import_v0`
- `imported_requires_rerun: true`
- `source: imported_team_export`

If the user edits the advisor fields or clicks the advisor check button, the current model reruns and replaces the imported context with a fresh manual result.

## Guardrails

- Player restoration uses exact current player IDs.
- Missing player IDs are warned instead of guessed from names.
- Replacement captain and bench candidate are required for a useful restored scenario.
- Current captain and played starter are optional because the quick-check tools can still compare against user-entered raw points without them.
- Squad import can still be partial; restored decision fields do not make the official-game squad legal.

## Caveats

- No live points are fetched or inferred.
- Played/unplayed state is not verified.
- Official fantasy deadlines and official same-day captain/substitution windows are not verified.
- Substitution formation legality is not fully validated.
- Official 2026 fantasy rules must still be checked once FIFA publishes them.
