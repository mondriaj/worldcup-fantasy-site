# User Squad Selection v0

Status: active saved-squad workflow.

## Scope

User Squad Selection v0 lets a user mark the built or imported Team Builder squad with fantasy-management choices that the model should not guess:

- captain
- vice captain
- bench order 1-4

These choices are stored as user state. They are not projections and they do not change the optimizer.

## Website Behavior

- Starter cards show `C` and `VC` controls.
- Bench cards show `B1`, `B2`, `B3`, and `B4` controls.
- Captain and vice captain must be different starters.
- Bench order can only be assigned to current bench players.
- Rebuilding, previewing, clearing, or manually changing the squad clears stale saved decision results.
- Captain Change Advisor, Substitution Advisor, and Saved Squad Timeline use the user labels when present.

## Export Behavior

Team Export JSON v1 writes the selection state inside `squad_state`:

- `user_squad_selection_version`
- `user_captain_id`
- `user_vice_captain_id`
- `bench_order_player_ids`
- `bench_order_source`
- `bench_order`
- `captain_source`
- `vice_captain_source`

When a user has not selected captain or vice captain, the export keeps the current model fallback and marks the source as model-based. When the user has selected captain or vice captain, the export marks the source as `user_selected`.

## Import Behavior

Team Import v0 restores user selections only when the saved player IDs still exist in the restored starters or bench.

The importer warns instead of guessing when:

- the saved captain is not in the restored starters
- the saved vice captain is not in the restored starters
- the saved vice captain matches the restored captain
- a saved bench-order player is not in the restored bench

Missing bench-order IDs are not replaced by name matching. Remaining restored bench players are appended to keep the bench order usable.

## Caveats

- This is not official FIFA fantasy state.
- It does not validate official captain, vice-captain, substitution, or bench-order rules.
- It does not infer live points, played/unplayed state, deadlines, or eligibility.
- It depends on the current prototype player IDs staying stable until official fantasy IDs are imported.
