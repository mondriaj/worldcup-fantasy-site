# Bracket Pool Strategy Model v1

Generated: 2026-06-28T11:52:42.227Z

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

The model uses bracket propagation through the official final R32 tree and matchup advancement probabilities from the knockout score predictor. No betting odds, ownership, invented lineups, or final-squad assumptions are used.

## Strategy Winners

| Strategy | Champion | Finalists | Semifinalists |
| --- | --- | --- | --- |
| Safe | Spain | Argentina v Spain | Brazil, Argentina, England, Spain |
| Path Value | Spain | Argentina v Spain | Brazil, Argentina, England, Spain |
| Upside | Spain | Argentina v Spain | Brazil, Argentina, England, Spain |
| Favorite Heavy | Argentina | Argentina v Spain | Brazil, Argentina, England, Spain |
| High Variance | England | Netherlands v England | Netherlands, Germany, England, Spain |

## Top 10 Expected Pool Points

| Team | Expected pts | Win title | Path note |
| --- | --- | --- | --- |
| Spain | 12.0715 | 24.6% | Toughest pre-final pocket projects as SF against England. |
| England | 10.61 | 18.6% | Toughest pre-final pocket projects as SF against Spain. |
| Argentina | 9.3025 | 19% | Likely R16 path runs through France (88.6% if both sides advance). |
| Brazil | 7.2174 | 9.6% | Toughest pre-final pocket projects as SF against Argentina. |
| France | 5.7836 | 9.8% | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Germany | 4.9188 | 5.8% | Toughest pre-final pocket projects as QF against Argentina. |
| Netherlands | 4.2957 | 3.5% | Toughest pre-final pocket projects as SF against Argentina. |
| Colombia | 3.3466 | 2.3% | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| Portugal | 2.9798 | 2.6% | Toughest pre-final pocket projects as QF against Spain. |
| Ecuador | 2.2133 | 0.7% | Toughest pre-final pocket projects as SF against Spain. |

## Top 10 Path Value

| Team | Path value | Expected pts | Path difficulty |
| --- | --- | --- | --- |
| Spain | 12.8118 | 12.0715 | 71.9899 |
| England | 11.2143 | 10.61 | 72.3391 |
| Argentina | 9.3783 | 9.3025 | 76.2438 |
| Brazil | 7.7122 | 7.2174 | 71.4109 |
| France | 5.7594 | 5.7836 | 77.2305 |
| Germany | 4.9608 | 4.9188 | 76.2139 |
| Netherlands | 4.4341 | 4.2957 | 74.3186 |
| Colombia | 3.3071 | 3.3466 | 77.8388 |
| Portugal | 2.9798 | 2.9798 | 76.8959 |
| Ecuador | 2.2948 | 2.2133 | 73.9526 |

## Risky Favorites

| Team | R32 advance | Bust risk | Path note |
| --- | --- | --- | --- |
| Switzerland | 68.9% | 88.5% | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Canada | 79.2% | 86.9% | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| USA | 80.8% | 76% | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Norway | 78.3% | 68.7% | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Portugal | 67.1% | 61.2% | Toughest pre-final pocket projects as QF against Spain. |
| France | 88.6% | 59.8% | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Colombia | 88.3% | 54.1% | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| Netherlands | 71% | 44.5% | Toughest pre-final pocket projects as SF against Argentina. |
| Argentina | 94.1% | 42.3% | Likely R16 path runs through France (88.6% if both sides advance). |
| Germany | 85.1% | 40% | Toughest pre-final pocket projects as QF against Argentina. |

## Hard Path Warnings

| Team | Difficulty | Warning |
| --- | --- | --- |
| Côte d'Ivoire | 78.8746 | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Norway | 78.8746 | Likely R16 path runs through Germany (85.1% if both sides advance). |
| Colombia | 77.8388 | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| Ghana | 77.8388 | Likely R16 path runs through Portugal (67.1% if both sides advance). |
| Switzerland | 77.7854 | Likely R16 path runs through Spain (89.1% if both sides advance). |
| Algeria | 77.7854 | Likely R16 path runs through Spain (89.1% if both sides advance). |
| USA | 77.6197 | Likely R16 path runs through Netherlands (71% if both sides advance). |
| Bosnia and Herzegovina | 77.6197 | Likely R16 path runs through Netherlands (71% if both sides advance). |
| South Africa | 77.4069 | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| Canada | 77.4069 | Likely R16 path runs through Brazil (76.8% if both sides advance). |
| France | 77.2305 | Likely R16 path runs through Argentina (94.1% if both sides advance). |
| Sweden | 77.2305 | Likely R16 path runs through Argentina (94.1% if both sides advance). |
