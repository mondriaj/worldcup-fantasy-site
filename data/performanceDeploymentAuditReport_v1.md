# Performance And Deployment Audit v1

Generated: 2026-07-18T12:16:55.422Z

Status: **pass**

## Largest Public Files

- `fantasyPoolFinanceMetricsData.js`: 8282613 bytes
- `fantasyPoolMatchdayProjectionsData.js`: 4641345 bytes
- `fantasyPoolRecommendationsData.js`: 2508699 bytes
- `fantasyPoolScorePredictionsData.js`: 1846419 bytes
- `livePlayerStatusData.js`: 985154 bytes
- `fantasyPoolOfficialDataStatusData.js`: 798676 bytes
- `script.js`: 599320 bytes
- `playersData.js`: 409591 bytes
- `liveMatchdayStatusData.js`: 220263 bytes
- `style.css`: 116285 bytes

## Cache Busting

- `index.html` loads `https://www.googletagmanager.com/gtag/js` with cache bust `none`
- `index.html` loads `playersData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyRulesData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyPoolRecommendationsData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyPoolMatchdayProjectionsData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyPoolFinanceMetricsData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyPoolScorePredictionsData.js` with cache bust `20260718-final-round`
- `index.html` loads `knockoutBracketPredictionData.js` with cache bust `20260718-final-round`
- `index.html` loads `fantasyPoolOfficialDataStatusData.js` with cache bust `20260718-final-round`
- `index.html` loads `liveMatchdayStatusData.js` with cache bust `20260718-final-round`
- `index.html` loads `livePlayerStatusData.js` with cache bust `20260718-final-round`
- `index.html` loads `r16FixtureAuthorityData.js` with cache bust `20260718-final-round`
- `index.html` loads `qfFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `index.html` loads `sfFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `index.html` loads `finalRoundFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `index.html` loads `teamBuilderFinalRoundArtifactData.js` with cache bust `20260718-builder-artifact-equivalence`
- `index.html` loads `script.js` with cache bust `20260718-builder-artifact-equivalence`
- `world-cup.html` loads `https://www.googletagmanager.com/gtag/js` with cache bust `none`
- `world-cup.html` loads `worldCupData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `liveMatchdayStatusData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `r32FixtureAuthorityData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `r16FixtureAuthorityData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `qfFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `sfFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `finalRoundFixtureAuthorityData.js` with cache bust `20260718-final-round`
- `world-cup.html` loads `worldCupPage.js` with cache bust `20260718-final-round`

## Safe Compaction Candidates

- `fantasyPoolFinanceMetricsData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyPoolScorePredictionsData.js`
- `livePlayerStatusData.js`
- `fantasyPoolOfficialDataStatusData.js`
- `playersData.js`

## Deployment Smoke-Test Gaps

- No single current deployed-site command found that asserts every active Final Round player/fixture name against artifacts.
- Cache-bust versions are present, but index.html and world-cup.html use different final cache-bust labels for script.js/teamBuilder artifact.

## Issues

- **WARN / Large public payload:** Largest public files exceed 1.5 MB and should be compacted or split before a top-client handoff. Evidence: `{"largest":[{"file":"fantasyPoolFinanceMetricsData.js","bytes":8282613},{"file":"fantasyPoolMatchdayProjectionsData.js","bytes":4641345},{"file":"fantasyPoolRecommendationsData.js","bytes":2508699},{"file":"fantasyPoolScorePredictionsData.js","bytes":1846419},`.
- **WARN / Cache busting:** Some loaded scripts/styles do not have explicit cache-bust versions. Evidence: `{"cacheIssues":[{"order":1,"page":"index.html","src":"https://www.googletagmanager.com/gtag/js?id=G-MSZET05H11","file":"https://www.googletagmanager.com/gtag/js","cacheBust":null,"exists":false},{"order":1,"page":"world-cup.html","src":"https://www.googletagma`.
