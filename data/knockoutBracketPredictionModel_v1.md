# Knockout Bracket Prediction Model v1

Generated: 2026-07-08T12:36:37.156Z

Status: **FINAL**

## Sources

- R32 fixtures: `data/r32FixtureAuthority_v1.json`
- Bracket tree: `worldCupData.js`
- Model picks: `data/bracketPoolStrategyModel_v1.json`
- Predicted scores: `data/knockoutScorePredictor_v1.json`
- Actual results: `data/liveMatchdayStatus_v1.json`

## Default Strategy

Safe: Prioritizes expected bracket-pool points and lower bust risk.

No ownership signal is used. Final squads are not source-backed.

## Summary

| Metric | Value |
| --- | --- |
| Predicted champion | Argentina |
| Predicted finalists | Spain, Argentina |
| Predicted semifinalists | France, Spain, England, Argentina |
| Decided knockout matches | 24 |
| Correct predictions | 18 |
| Wrong predictions | 6 |
| Pending predictions | 8 |
| Accuracy | 75% |
| Flags missing with no code fallback | 0 |

## Round Counts

| Round | Matches |
| --- | --- |
| Round of 32 | 16 |
| Round of 16 | 8 |
| Quarterfinals | 4 |
| Semifinals | 2 |
| Final | 1 |
| Third Place | 1 |
