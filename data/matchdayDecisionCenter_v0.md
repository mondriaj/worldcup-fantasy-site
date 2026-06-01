# Matchday Decision Center v0

Status: active workflow layer.

## Scope

Matchday Decision Center v0 gives one saved-squad view for in-matchday captain and bench decisions.

It uses:

- the current built or imported Team Builder squad
- user-selected captain and vice captain when present
- user-selected bench order when present
- the existing Captain Change Advisor v0 scoring
- the existing Substitution Advisor v0 scoring
- the selected matchday and risk style
- user-entered raw points

It does not replace the detailed advisors. It summarizes likely checks and fills the detailed advisor fields when the user wants to run one comparison.

## What It Adds

- A Matchday Decision Center section near the existing captain and substitution tools.
- Matchday and risk-style controls.
- Manual captain raw-points input.
- Manual played-starter selection and raw-points input.
- A captain-switch summary using the saved captain and best saved-squad replacement options.
- A bench-check summary using bench order `B1`-`B4`.
- Fill buttons that send one comparison into Captain Change Advisor or Substitution Advisor.

## Guardrails

- A full built/imported Team Builder squad is required.
- Raw fantasy points must be entered manually.
- Played/unplayed state is not inferred.
- Captain candidates are shown as options to check, not confirmed legal switches.
- Bench candidates are shown in saved bench order, not as automatic substitutions.
- Different-position substitutions still require manual formation legality checks.
- Official deadlines and official game rules are not validated.

## Caveats

- This is not live fantasy tracking.
- This is not official FIFA fantasy advice.
- It uses prototype matchday projections and compressed raw-point signals.
- It depends on the current prototype player IDs until official fantasy IDs are imported.
- Re-check this workflow after official fantasy rules, final squads, official positions, and official matchday deadlines are available.
