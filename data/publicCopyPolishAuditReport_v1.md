# Public Copy Polish Audit v1

Status: GREEN.

## Scope Gate

Scoped copy files are `index.html`, `script.js`, `teamBuilderPublicHelpers.js`, `scripts/lib/teamBuilderPublicModel.mjs`, `world-cup.html`, and the browser content/no-behavior contract reports. Pre-existing `.gitignore`, generated model/report data, `analysis/`, and refereeing files are unrelated and must remain unstaged.

## Findings

| Surface | Classification | Action |
| --- | --- | --- |
| Home hero | safe to polish now | Removed duplicated Final Round setup wording. |
| Picks | safe to polish now | Replaced internal PELE-forward wording with public evidence/caveat copy. |
| Captain Watchlist | safe to polish now | Shortened armband copy and clarified Third Place rotation risk. |
| Team Builder | safe to polish now | Replaced artifact/optimizer-style language with planning-help wording. |
| Match Environment | safe to polish now | Replaced model/xG-heavy intro with expected-goals and score-context wording. |
| Player Profile | should remain unchanged for QA stability | Kept exact player profile behavior and safety context unchanged. |
| Refereeing/conspiracy | should remain unchanged for QA stability | No public copy added. |
| Final squads/XIs | should be handled after tournament unless source-backed | Kept concise caveats; no confirmed-squad or confirmed-XI claim added. |

## Before And After Examples

| Area | Before | After |
| --- | --- | --- |
| Hero | The Fantasy Economist is set up for the Final Round fantasy setup. | Final Round fantasy setup for Final and Third Place decisions. |
| Team Builder caveat | Use the builder as planning help, then confirm squad legality, locks, deadlines, and lineups inside the official FIFA fantasy game. | Planning help, not a guarantee. Verify official FIFA locks, substitutions, and lineups before final decisions. |
| Captain Watchlist | Use these cards to compare Final Round captain options by projected points, matchup, start chance, Third Place rotation risk, and downside. | Compare projected points, matchup, start chance, and downside. Third Place can be higher scoring, but lineups may rotate. |
| Team Builder status | Recommended Balanced Squad loaded from the validated Final Round Team Builder artifact. | Balanced Squad loaded for the Final Round. |

## Risky Copy Left Unchanged

Player Profile exact content and Team Builder golden behavior were left structurally unchanged to preserve the active browser assertions. Final-squad and XI copy remains caveated because there is no independent source-backed final-squad or confirmed-XI feed in this pass.
