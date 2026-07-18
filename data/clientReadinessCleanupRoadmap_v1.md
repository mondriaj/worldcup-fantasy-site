# Client Readiness Cleanup Roadmap v1

Current verdict: **public-safe, but not top consulting client code-review ready**.

Target standard: a reviewer should find one active-stage contract, compact public payloads, generated/model code separated from UI code, manifest-driven QA, and short public explanations that do not overclaim.

## Top 10 Cleanup Items

| Order | Group | Cleanup | Risk | Likely files | Benefit | Must not change | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Stage/data ownership cleanup | Active-stage manifest | Low | `data/activeStageManifest_v1.json`, validators | One source for active Final Round wiring | Public behavior, model outputs, Team Builder squad | Manifest QA, browser QA, no-behavior proof |
| 2 | QA/browser equivalence hardening | Manifest-driven active QA runner | Low/Medium | `scripts/validateActiveFantasyDataFlow.mjs`, QA scripts | One obvious GREEN gate | Existing validator semantics | All existing validators |
| 3 | Public payload slimming | Split display rows from diagnostics | Medium | wrapper builders, public data wrappers | Faster page, cleaner client artifact | Recommendation/projection values | Row-count/value parity tests |
| 4 | Team Builder model extraction | Move scoring profiles and optimizer helpers out of `script.js` | Medium | `script.js`, `scripts/lib/teamBuilderModel.mjs` | Smaller UI file, reusable model logic | Default artifact-backed squad and browser equivalence | Team Builder artifact/browser QA |
| 5 | Stage/data ownership cleanup | Replace hardcoded stage strings in validators with manifest reads | Low/Medium | validators | Fewer stale-stage bugs | Stage defaults | Manifest QA and active data-flow QA |
| 6 | QA/browser equivalence hardening | Add exact DOM assertions for Picks, Captain Watchlist, Match Environment | Low | `scripts/runPublicPreviewBrowserQa.mjs` | QA validates what users see | UI behavior | Browser QA snapshots |
| 7 | UI/copy polish | Shorten caveats and fix legacy budget copy | Low | `index.html`, maybe generated copy metadata | More polished public surface | Safety caveats and 105 budget | Browser text QA |
| 8 | Documentation and source discipline | Add client-readable model weights appendix | Low | `data/*Model*_v1.md` | Faster external review | Model weights and outputs | Doc review plus validator references |
| 9 | Public payload slimming | Remove inactive historical payloads from default public load | Medium/High | HTML, wrappers, browser code | Better performance | Historical views unless intentionally retired | Browser QA across historical views |
| 10 | Post-tournament cleanup | Archive tournament-specific scripts and QA outputs | Low | `scripts/`, `data/` | Easier onboarding for next tournament | Published final archive | Smoke tests and static link checks |

## Implementation Order

1. Active-stage manifest.
2. Manifest validator.
3. Wire low-risk validators and browser QA to the manifest.
4. Create an active-stage QA command that runs the manifest-owned validators.
5. Add exact DOM assertions for every active public surface.
6. Split public display payloads from diagnostics.
7. Extract Team Builder model/optimizer code from `script.js`.
8. Polish public copy and collapse long method notes.
9. Document model weights in one appendix.
10. Archive post-tournament historical code and data.

## Grouped Future Work

### Stage/Data Ownership Cleanup

Centralize active stage, source files, wrappers, validators, cache busts, and blocked globals. Future promotion should start by editing the manifest and should fail if wrappers, validators, and HTML disagree.

### Public Payload Slimming

Public wrappers are large and carry diagnostics that are useful for audit but noisy for a client-facing static site. Split display payloads from internal QA/model diagnostics.

### Team Builder Model Extraction

The default Final Round squad is artifact-backed, which is correct. The browser still holds too much optimizer/scoring logic for locks and historical views. Extract that logic into a shared module only after current browser equivalence remains GREEN.

### QA/Browser Equivalence Hardening

Team Builder has strong equivalence QA. Other surfaces need similarly exact assertions for rendered player names, fixture rows, budget, caveats, and blocked legacy globals.

### UI/Copy Polish

The site is careful, but caveat density and legacy method notes make it feel less polished. Shorten current-stage copy and move historical method detail behind archive-style notes.

### Documentation And Source Discipline

Create one model-contract appendix that maps each model to inputs, outputs, weights, assumptions, caveats, and validators.

### Post-Tournament Cleanup

Archive or delete stale stage-specific scripts, obsolete generated files, and old wrapper names once the tournament is complete.

## First Implementation Step

The first step is the **active-stage manifest** because it is low risk, does not change model outputs, and gives later cleanup a single contract to preserve.
