# Public Payload Contract v1

Generated: 2026-07-18T13:30:00.000Z

Active stage: finalRound

| Wrapper | Required top-level fields | Stage rule | Browser features |
| --- | --- | --- | --- |
| recommendations | recommendationCandidates, summary, modelVersion, data_status | Rows may include SF/QF/R16/R32 history; active Final Round views filter to matchday === finalRound. | Picks, Captain Watchlist, Player Profile, Team Builder candidate enrichment |
| projections | playerMatchdayProjections, summary, modelVersion, data_status | Rows may include SF/QF/R16/R32 history; active Final Round views filter to matchday === finalRound. | Player Profile, Team Builder, Final Round role/risk labels |
| scorePredictions | fixtureScorePredictions, teamFixturePredictions, summary, modelVersion | Rows may include earlier knockout history; active Match Environment filters to fantasy_matchday_id === finalRound where needed. | Match Environment, score context in player profile, fixture projections |
| teamBuilderArtifact | strategy, selectedSquad, starters, bench, captain, viceCaptain, summary | Final Round artifact only. | Team Builder default artifact, browser equivalence QA, budget and optionality display |
| officialStatus | pass-through | unchanged | official position and status labels |
| liveMatchdayStatus | pass-through | Used by multiple live score and fixture validators. | Match Environment, World Cup fixtures live/final score display |
| livePlayerStatus | pass-through | Used as status overlay data. | player status labels |
| knockoutBracket | pass-through | World Cup bracket rendering uses nested match/team structures. | Knockout Bracket |
| worldCupData | pass-through | World Cup page uses groups, fixtures, bracket, and sources. | World Cup page |
| fixtureAuthority | pass-through | unchanged | Final/Third Place fixture authority |
