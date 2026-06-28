# Bracket Pool Strategy Model v1

Generated: 2026-06-28T12:31:04.249Z

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
| Safe | Argentina | Spain v Argentina | France, Spain, England, Argentina |
| Path Value | Argentina | Spain v Argentina | France, Spain, England, Argentina |
| Upside | Argentina | Spain v Argentina | France, Spain, England, Argentina |
| Favorite Heavy | Argentina | Spain v Argentina | France, Spain, England, Argentina |
| High Variance | Spain | Spain v Argentina | Netherlands, Spain, Brazil, Argentina |

## Top 10 Expected Pool Points

| Team | Expected pts | Win title | Path note |
| --- | --- | --- | --- |
| Argentina | 13.5656 | 28.1% | Toughest pre-final pocket projects as SF against England. |
| Spain | 11.2352 | 22.1% | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| England | 8.8036 | 14.2% | Toughest pre-final pocket projects as SF against Argentina. |
| France | 7.6935 | 12.6% | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Brazil | 4.9799 | 6% | Toughest pre-final pocket projects as SF against Argentina. |
| Germany | 4.5541 | 5.4% | Likely R16 path runs through France (88.6% if both sides advance). |
| Netherlands | 4.1082 | 3.2% | Toughest pre-final pocket projects as QF against France. |
| Colombia | 4.0445 | 2.7% | Toughest pre-final pocket projects as QF against Argentina. |
| Portugal | 2.6427 | 2.4% | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Norway | 2.1703 | 0.9% | Likely R16 path runs through Brazil (76.8% if both sides advance). |

## Top 10 Path Value

| Team | Path value | Expected pts | Path difficulty |
| --- | --- | --- | --- |
| Argentina | 14.8078 | 13.5656 | 69.7458 |
| Spain | 11.6695 | 11.2352 | 73.9795 |
| England | 8.9151 | 8.8036 | 76.0584 |
| France | 7.7688 | 7.6935 | 76.2883 |
| Brazil | 4.9799 | 4.9799 | 77.0718 |
| Germany | 4.5008 | 4.5541 | 78.0077 |
| Netherlands | 4.2341 | 4.1082 | 74.62 |
| Colombia | 4.0814 | 4.0445 | 76.3426 |
| Portugal | 2.6455 | 2.6427 | 76.9876 |
| Belgium | 2.1982 | 2.1696 | 76.0153 |

## Risky Favorites

| Team | R32 advance | Bust risk | Path note |
| --- | --- | --- | --- |
| Canada | 79.2% | 84.1% | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Portugal | 67.1% | 78% | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Switzerland | 68.9% | 73.5% | Toughest pre-final pocket projects as QF against Argentina. |
| Norway | 78.3% | 70% | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| USA | 80.8% | 68.8% | Toughest pre-final pocket projects as QF against Spain. |
| Germany | 85.1% | 61.2% | Likely R16 path runs through France (88.6% if both sides advance). |
| Brazil | 76.8% | 44.6% | Toughest pre-final pocket projects as SF against Argentina. |
| France | 88.6% | 43.5% | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Netherlands | 71% | 39.4% | Toughest pre-final pocket projects as QF against France. |
| Colombia | 88.3% | 36% | Toughest pre-final pocket projects as QF against Argentina. |

## Hard Path Warnings

| Team | Difficulty | Warning |
| --- | --- | --- |
| Côte d'Ivoire | 80.23 | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| Norway | 80.23 | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| Mexico | 79.4586 | Likely R16 path runs through England (91.5% if both sides advance). |
| Ecuador | 79.4586 | Likely R16 path runs through England (91.5% if both sides advance). |
| South Africa | 79.2957 | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Canada | 79.2957 | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Switzerland | 78.1872 | Toughest pre-final pocket projects as QF against Argentina. |
| Algeria | 78.1872 | Toughest pre-final pocket projects as QF against Argentina. |
| USA | 78.1513 | Toughest pre-final pocket projects as QF against Spain. |
| Bosnia and Herzegovina | 78.1513 | Toughest pre-final pocket projects as QF against Spain. |
| Germany | 78.0077 | Likely R16 path runs through France (88.6% if both sides advance). |
| Paraguay | 78.0077 | Likely R16 path runs through France (88.6% if both sides advance). |
