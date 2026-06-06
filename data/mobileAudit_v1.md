# Mobile Audit

Date: 2026-06-06

## Viewports Tested

- 320 x 820
- 360 x 820
- 390 x 844
- 430 x 820

## Features Tested

- Home navigation, hero actions, and footer disclaimer.
- Squad Builder Starter cards, Pick Explorer, Add to Builder, and Player Profile.
- Team Builder controls, generated squad field, bench, Squad Strategy Report, export controls, and advanced strategy comparison.
- Match Environment / Score Prediction with the full group-stage fixture view.
- Captain switch, bench switch, saved-squad decision surfaces, and model notes.
- Fantasy Finance cards where visible.
- World Cup Guide and `world-cup.html` groups, fixtures, and bracket sections.

## Issues Found

- The Team Builder workspace and review cards could keep wider intrinsic widths on very small screens, especially after a player profile had opened.
- Rule-check cards and built-squad field cards could feel cramped at 320px.
- Squad-field metric chips could squeeze into narrow columns.

## Fixes Made

- Added mobile shrink constraints for nested Team Builder, modal, strategy-comparison, export, and control containers.
- Kept background page overflow clipped while Player Profile is open.
- Let mobile buttons, controls, and player-card text wrap inside their containers.
- Changed mobile Team Builder rule checks and squad-field metric chips to simpler one-column layouts where needed.
- Preserved the Match Environment mobile card layout and separate clean-sheet lines.

## Remaining Known Mobile Limits

- Native select menus can still show long player names in the operating-system picker, but the closed controls stay within the page.
- Strategy comparison can take around 50 seconds because it builds all five strategy squads; the layout remains usable while it runs.

## Checks Run

- Targeted mobile browser audit at 320px, 360px, 390px, and 430px for `index.html` and `world-cup.html`.
- Focused 320px Player Profile check with long player names and fixture-context labels.
- Focused Match Environment check confirmed 72 fixtures and the public fields at all tested widths.
- Focused 390px strategy-comparison check confirmed all five strategy cards rendered without overflow.
- In-app browser smoke check at 390px.
- Standard syntax, whitespace, local-load, public preview, and launch checks were run after the CSS update.
