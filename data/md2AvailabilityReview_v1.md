# MD2 Availability Review v1

Generated: 2026-06-17T22:45:24.963Z

## Verdict

PASS: high-impact MD1 non-starters were reviewed against the official fantasy feed and targeted public-source checks. Where no reliable current external source was found, the model keeps an explicit manual-review/downgrade flag instead of inventing availability.

## Reviewed Players

| Player | Country | Official status | MD1 status | Review status | Model action | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| Lamine Yamal Nasraoui Ebana | Spain | playing | sub | available_managed_minutes | cap_below_safe | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json)<br>[The Sun US](https://www.the-sun.com/sport/16522611/lamine-yamal-spain-barcelona-alexander-isak-liverpool-sweden/) |
| Alphonso Davies | Canada | playing | sub | available_low_start_evidence | maintain_low_role | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json)<br>[The Guardian](https://www.theguardian.com/football/2026/jun/11/canada-world-cup-opening-game-jesse-marsch)<br>[Bavarian Football Works](https://www.bavarianfootballworks.com/bayern-munich-transfer-news-rumors/215368/saudis-not-likely-to-overwhelm-bayern-munich-with-offer-for-alphonso-davies) |
| Bukayo Saka | England | playing | sub | available_managed_minutes | cap_below_safe | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json)<br>[The Sun](https://www.thesun.co.uk/sport/39441763/why-bukayo-saka-not-starting-england-croatia-world-cup-2026/) |
| Tino Livramento | England | transferred | not_in_squad | ruled_out_replaced | block_not_selectable | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json)<br>[New York Post](https://nypost.com/2026/06/16/sports/englands-tino-livramento-out-of-world-cup-in-injury-blow/) |
| Giorgian de Arrascaeta | Uruguay | playing | not_in_squad | no_external_update_found | cap_after_not_in_squad | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json) |
| Ronald Araujo | Uruguay | playing | not_in_squad | no_external_update_found | cap_after_not_in_squad | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json) |
| Julian Alvarez | Argentina | playing | sub | md1_sub_no_external_issue_found | rotation_after_sub | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json) |
| Nico Williams | Spain | playing | sub | md1_sub_no_external_issue_found | rotation_after_sub | [FIFA fantasy feed](https://play.fifa.com/json/fantasy/players.json) |

## Source Policy

- Official fantasy player status and MD1 matchStatus come from `https://play.fifa.com/json/fantasy/players.json`.
- Public articles are used only as supporting context; if they are absent or unclear, the official feed and MD1 lineup evidence drive a conservative model action.
- No injury, suspension, or lineup claim is added without a source link or an explicit no-source-found note.
