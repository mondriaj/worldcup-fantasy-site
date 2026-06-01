# Saved Decision Export v0

Status: active workflow layer.

## Scope

Saved Decision Export v0 writes the latest manual advisor result into Team Export JSON v1.

It covers:

- Captain Change Advisor v0
- Substitution Advisor v0

It does not add live score tracking, full squad tracking, user accounts, or a decision history. The user still enters the actual raw fantasy points and confirms whether a player has already played.

## Export Behavior

Team Export JSON v1 keeps the existing `decision_tools` object.

If no quick check has been run, each advisor exports a null-safe `saved: false` placeholder.

If a quick check has been run, the relevant advisor exports `saved: true` with:

- saved timestamp
- selected matchday
- selected risk style
- result and result class
- user-entered raw points
- current captain or starter reference where available
- replacement captain or bench candidate reference
- decision score, threshold, and edge
- compressed raw signal
- start probability and expected minutes
- fixture projection snapshot
- QA flags and warnings

## Clearing Rules

Saved decisions are cleared when:

- the related advisor is reset
- advisor inputs become invalid and the check re-renders
- the Team Builder squad is rebuilt, imported, reset, previewed, or manually swapped

This keeps exports from carrying a manual decision that was made against an old squad context.

## Import Behavior

Saved Decision Import v0 restores saved decision scenarios as imported review context. It fills the advisor fields and keeps the imported result available for re-export, but marks the scenario as requiring an advisor rerun before acting.

## Caveats

- No PELE, score prediction, or player projection value is invented by this layer.
- Saved user-entered points are stored exactly from the quick-check input.
- Played/unplayed status is not verified.
- Formation legality is not fully verified for substitution decisions.
- Imported saved decisions are not fresh live recommendations until rerun.
- Official 2026 fantasy rules, deadlines, captain switching, and substitution rules must still be checked when FIFA publishes them.
