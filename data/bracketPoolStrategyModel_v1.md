# Bracket Pool Strategy Model v1

Generated: 2026-06-28T12:16:28.960Z

## Purpose

This model adds bracket-pool strategy context on top of the final Round of 32 knockout predictor. Bracket pools reward surviving rounds. A team with a slightly easier path can be a better pool pick than a slightly stronger team with a very hard path.

## Default Scoring

| Round pick | Points |
| --- | --- |
| R32 winner reaches R16 | 1 |
| R16 winner reaches QF | 2 |
| QF winner reaches SF | 4 |
| SF winner reaches Final | 8 |
| Final/Champion | 16 |

Expected pool points are computed as:

`P(R16)*1 + P(QF)*2 + P(SF)*4 + P(Final)*8 + P(Champion)*16`.

## Sources

- `data/knockoutScorePredictor_v1.json`
- `data/r32BracketPathModel_v1.json`
- `worldCupData.js`

The model uses bracket propagation through the official final R32 tree in `worldCupData.js` and matchup advancement probabilities from the knockout score predictor. No betting odds, ownership, invented lineups, or final-squad assumptions are used.

## Strategy Winners

| Strategy | Champion | Finalists | Semifinalists |
| --- | --- | --- | --- |
| Safe | Spain | England v Spain | Brazil, England, Argentina, Spain |
| Path Value | England | England v Spain | Brazil, England, Argentina, Spain |
| Upside | England | England v Spain | Brazil, England, Argentina, Spain |
| Favorite Heavy | Argentina | England v Argentina | Brazil, England, Argentina, Spain |
| High Variance | England | England v Spain | Netherlands, England, Germany, Spain |

## Top 10 Expected Pool Points

| Team | Expected pts | Win title | Path note |
| --- | --- | --- | --- |
| England | 11.638 | 21.1% | Toughest pre-final pocket projects as SF against Brazil. |
| Spain | 10.2905 | 20.8% | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| Argentina | 8.8802 | 18.3% | Likely R16 path runs through France (88.6% if both sides advance). |
| Brazil | 6.5752 | 9.1% | Toughest pre-final pocket projects as SF against England. |
| France | 5.5406 | 9.5% | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Germany | 5.3753 | 6.5% | Toughest pre-final pocket projects as QF against Argentina. |
| Netherlands | 4.9534 | 4.5% | Toughest pre-final pocket projects as SF against England. |
| Colombia | 3.9805 | 2.7% | Toughest pre-final pocket projects as SF against Argentina. |
| Norway | 2.7734 | 1.6% | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| Portugal | 2.3571 | 2.1% | Likely R16 path runs through Spain (89.1% if both sides advance). |

## Top 10 Path Value

| Team | Path value | Expected pts | Path difficulty |
| --- | --- | --- | --- |
| England | 12.4045 | 11.638 | 70.5688 |
| Spain | 10.4974 | 10.2905 | 74.2293 |
| Argentina | 8.8151 | 8.8802 | 76.4245 |
| Brazil | 6.8347 | 6.5752 | 72.6792 |
| Germany | 5.4341 | 5.3753 | 74.9623 |
| France | 5.4316 | 5.5406 | 77.4112 |
| Netherlands | 5.224 | 4.9534 | 71.4678 |
| Colombia | 3.9777 | 3.9805 | 75.8939 |
| Norway | 2.7734 | 2.7734 | 75.8373 |
| Ecuador | 2.4558 | 2.3485 | 72.1823 |

## Risky Favorites

| Team | R32 advance | Bust risk | Path note |
| --- | --- | --- | --- |
| Canada | 79.2% | 84.1% | Likely R16 path runs through Netherlands (71% if both sides advance). |
| USA | 80.8% | 80.8% | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Portugal | 67.1% | 78% | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Switzerland | 68.9% | 73.5% | Toughest pre-final pocket projects as SF against Argentina. |
| Norway | 78.3% | 70% | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| France | 88.6% | 59.8% | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Brazil | 76.8% | 44.6% | Toughest pre-final pocket projects as SF against England. |
| Argentina | 94.1% | 42.3% | Likely R16 path runs through France (88.6% if both sides advance). |
| Netherlands | 71% | 39.4% | Toughest pre-final pocket projects as SF against England. |
| Colombia | 88.3% | 36% | Toughest pre-final pocket projects as SF against Argentina. |

## Hard Path Warnings

| Team | Difficulty | Warning |
| --- | --- | --- |
| USA | 79.0861 | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Bosnia and Herzegovina | 79.0861 | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Switzerland | 77.7385 | Toughest pre-final pocket projects as SF against Argentina. |
| Algeria | 77.7385 | Toughest pre-final pocket projects as SF against Argentina. |
| France | 77.4112 | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Sweden | 77.4112 | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Portugal | 77.2374 | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Croatia | 77.2374 | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Argentina | 76.4245 | Likely R16 path runs through France (88.6% if both sides advance). |
| Cabo Verde | 76.4245 | Likely R16 path runs through France (88.6% if both sides advance). |
| South Africa | 76.1435 | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Canada | 76.1435 | Likely R16 path runs through Netherlands (71% if both sides advance). |
