# Exact Browser Assertions Audit v1

Status: complete

## Coverage Before This Pass

| Surface | Coverage |
| --- | --- |
| Homepage loads | Checked |
| Final Round default | Checked |
| Picks | Render and eliminated-player checks existed, but exact visible player/content checks were missing |
| Captain Watchlist | Render and eliminated-player checks existed, but exact visible player/content checks were missing |
| Player Profile | Modal-opening checks existed, but exact Final and Third Place player contracts were missing |
| Team Builder | Strong golden/browser/artifact coverage existed |
| Match Environment | Render/access checks existed, but exact Final/Third Place fixtures and completed SF score checks were missing from public preview QA |
| Knockout Bracket | Rendered card counts and path guard checked |
| Knockout Prediction | Final Round known fixtures checked |
| World Cup page | Fixture authority and bracket content checked |
| Console errors | Checked |
| Failed requests | Checked, with analytics failures ignored as non-blocking |

## Gap

The browser QA could pass when a public section rendered but showed the wrong visible Final Round content. This pass adds a JSON content contract and exact browser assertions for Picks, Captain Watchlist, Match Environment, Player Profile, and Team Builder golden squad visibility.
