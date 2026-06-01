# Team Import Model v0

Status: active saved-team restore flow.

## Scope

Team Import v0 reads the existing `team-export-v1` JSON payload created by the Team Builder export button.

It is meant for saving a draft squad locally, then restoring it later in the same browser site without rerunning the optimizer.

## What It Restores

- formation
- matchday view
- recommendation style
- trust mode
- price filters
- risk controls
- locked players
- removed players
- starter player IDs
- bench player IDs
- saved Captain Change Advisor scenario fields when present
- saved Substitution Advisor scenario fields when present

The imported squad is restored by exact player IDs from the current browser dataset.

Saved decision scenarios are restored as imported review context. The advisor fields are filled, the imported result is shown, and the user is told to rerun the advisor before acting.

## Guardrails

- The importer accepts only `schema_version: team-export-v1`.
- Missing player IDs are shown as warnings instead of guessed.
- If the starter positions do not match an allowed formation, the saved squad is not forced into the field layout.
- If only part of the file can be restored, settings and available locks are kept, but the user is told the full squad was not restored.
- Import does not infer official fantasy player IDs, prices, live scores, captain choices, played/unplayed status, or official-game legality.
- Imported saved decisions are tagged with `imported_requires_rerun: true` when re-exported.

## Caveats

- This is not an official FIFA fantasy import.
- It depends on the current prototype player IDs staying stable.
- If official fantasy data changes player IDs, a migration step will be needed before old exports can be restored cleanly.
- Importing a team does not validate that captain, substitution, or transfer decisions are legal in the official game.
