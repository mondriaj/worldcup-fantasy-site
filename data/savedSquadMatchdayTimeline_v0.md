# Saved Squad Matchday Timeline v0

Status: active workflow layer for built/imported Team Builder squads.

## Scope

Saved Squad Matchday Timeline v0 groups the current full Team Builder squad by kickoff for Matchday 1, Matchday 2, and Matchday 3.

It is designed to make captain switching and substitutions easier during a matchday. The timeline does not track live scores or played status.

## What It Uses

- current built or imported Team Builder squad
- `matchdayProjectionsData.js`
- fixture `date`
- fixture `eastern_datetime_label`
- opponent
- start probability
- expected minutes
- compressed captain-switch signal
- compressed substitution signal
- user-selected captain, vice-captain, and bench-order labels when available

## What It Adds

- MD1/MD2/MD3 timeline selector
- kickoff groups for the saved squad
- user-selected captain, vice-captain, and bench-order labels when present, otherwise starter/bench labels
- opponent and fixture difficulty context
- quick-fill buttons for:
  - current captain
  - new captain
  - played starter
  - bench option

## Guardrails

- A full Team Builder squad is required before timeline cards appear.
- Quick-fill buttons only fill the existing manual advisor fields.
- The user must still enter actual raw fantasy points.
- The user must still confirm who has already played.
- The user must still confirm official formation legality before making substitutions.

## Caveats

- This is not live fantasy tracking.
- Timeline quick-fill actions alone do not save captain-change or substitution decisions.
- Completed quick checks can be included in Team Export JSON v1 by Saved Decision Export v0.
- It depends on prototype player IDs and prototype matchday projection rows until official fantasy data is imported.
- Official 2026 fantasy matchday deadlines and same-day rules may require updates once published.
