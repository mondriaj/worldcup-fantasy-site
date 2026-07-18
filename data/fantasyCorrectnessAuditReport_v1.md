# Fantasy Correctness Audit v1

Generated: 2026-07-18T12:16:55.247Z

Status: **pass**

## Final Round Boundary

- Eligible teams from fixture authority: Argentina, England, France, Spain
- Fixtures: M103 Third Place (France v England); M104 Final (Spain v Argentina)
- Team Builder budget checked: 105
- Browser/artifact equivalence: pass
- Core Pick lineup evidence QA: pass

## Targeted Leakage Checks

- Lerma / Raphinha / Vinicius hits: 0
- Brazil / Colombia active player hits: 0
- Score prediction fixture rows checked: 2

## Issues

- **WARN / Fallback discipline:** script.js contains many fallback paths; Final Round is currently safe, but hidden fallbacks reduce auditability. Evidence: `{"fallbackMentions":78}`.
- **WARN / Public copy:** Stats Notes still say $100m starting budget while Final Round budget is 105. Evidence: `{"file":"index.html"}`.
