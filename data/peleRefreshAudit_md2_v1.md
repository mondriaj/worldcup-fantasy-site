# PELE Refresh Audit MD2 v1

Generated: 2026-06-18T18:04:02.064Z
Status: **GREEN**
PELE promoted: **Yes**
MD2 playing status safe: **Yes**

## Source Refresh

- Old PELE source checked: 2026-06-01
- New PELE source checked: 2026-06-18
- Old ratings CSV: https://datawrapper.dwcdn.net/4oVop/19/dataset.csv
- New ratings CSV: https://datawrapper.dwcdn.net/4oVop/87/dataset.csv
- Old tilt CSV: https://datawrapper.dwcdn.net/dxUJw/15/dataset.csv
- New tilt CSV: https://datawrapper.dwcdn.net/dxUJw/44/dataset.csv
- Old offense/defense CSV: https://datawrapper.dwcdn.net/DcqkH/13/dataset.csv
- New offense/defense CSV: https://datawrapper.dwcdn.net/DcqkH/46/dataset.csv
- Row count: 211 -> 211
- World Cup teams with PELE rating: 48/48
- Missing World Cup PELE teams: none

## Safety Gates

- Score metadata peleRebuilt: Yes
- Score metadata md2AlreadyStarted: Yes
- MD2 live actuals used for calibration: No
- MD2 in-progress scores used for calibration: No
- Ownership used as model signal: No
- Final squads source-backed: No

## Live Status Guard

- Live fixture mapping: passed
- Final fixtures shown: 24
- In-progress fixtures suppressed: 1
- Unsafe fixture/player point leaks: 0
- MD2 playing fixture projection rows: 50
- MD2 playing fixture recommendation rows: 1
- MD2 live player points used by projections: No
- MD2 live points used by recommendations: No

## Model QA

- Score v4 QA: pass
- Projection v4 QA: pass
- Recommendation v4 QA: pass
- Team Builder v4 QA: pass
- Active data-flow QA: pass
- Local browser QA: pass

## Largest PELE Rating Changes

| Team | Code | Old | New | Delta |
| --- | --- | --- | --- | --- |
| American Samoa | ASA | 791.6 | 705.1 | -86.5 |
| Tonga | TGA | 851 | 774.8 | -76.2 |
| Aruba | ARU | 1323.5 | 1247.9 | -75.6 |
| Eritrea | ERI | 1351.9 | 1290.3 | -61.6 |
| Cook Islands | COK | 867.5 | 806.5 | -61 |
| Pakistan | PAK | 1047 | 1102.4 | 55.4 |
| Samoa | SAM | 954.2 | 902.3 | -51.9 |
| Curacao | CUW | 1606 | 1558.2 | -47.8 |
| United States | USA | 1785.2 | 1832 | 46.8 |
| Singapore | SGP | 1247.6 | 1291.5 | 43.9 |

## Largest World Cup Team Quality Changes

| Team | Old | New | Delta |
| --- | --- | --- | --- |
| Curaçao | 5.55 | 0.52 | -5.03 |
| USA | 48.96 | 53.21 | 4.25 |
| Haiti | 14.81 | 10.61 | -4.2 |
| Côte d'Ivoire | 36.9 | 40.35 | 3.45 |
| Tunisia | 28.17 | 24.93 | -3.24 |
| Cabo Verde | 10.59 | 13.77 | 3.18 |
| Germany | 73.15 | 76.22 | 3.07 |
| Panama | 33.73 | 31.09 | -2.64 |
| Sweden | 43.47 | 45.99 | 2.52 |
| Ghana | 20.47 | 22.74 | 2.27 |

## Largest Score Total xG Changes

| Fixture | MD | Old xG | New xG | Delta |
| --- | --- | --- | --- | --- |
| France vs Iraq | md2 | 3.221 | 4.954 | 1.733 |
| Norway vs France | md3 | 2.854 | 4.409 | 1.555 |
| Norway vs Senegal | md2 | 2.485 | 3.82 | 1.335 |
| Curaçao vs Côte d'Ivoire | md3 | 2.593 | 3.923 | 1.33 |
| Tunisia vs Japan | md2 | 2.303 | 3.558 | 1.255 |
| Senegal vs Iraq | md3 | 2.334 | 3.546 | 1.212 |
| Japan vs Sweden | md3 | 2.635 | 3.802 | 1.167 |
| Tunisia vs Netherlands | md3 | 2.679 | 3.834 | 1.155 |
| Ecuador vs Germany | md3 | 2.784 | 3.928 | 1.144 |
| Panama vs England | md3 | 2.918 | 4.04 | 1.122 |

## Team Builder Delta

- Balanced starter points: 83.402 -> 83.134 (-0.268)
- Captain: Michael Olise
- Vice captain: Lionel Messi

## Remaining Limits

- Final squads are not source-backed in the active data path.
- Official lock/deadline legality is not claimed as verified by this refresh.
- MD2 in-progress fixture/player actuals are display/support only and not model calibration signal.
- Ownership movement is monitored as a feed change but is not used as a model signal.
- This remains an independent fantasy helper, not an official FIFA recommendation.
