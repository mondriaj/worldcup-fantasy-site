(function () {
  window.WORLD_CUP_DATA = {
    lastChecked: "May 13, 2026",
    sources: [
      {
        label: "FIFA match schedule",
        url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums",
        note: "Primary public source for fixtures, venues, and tournament dates."
      },
      {
        label: "FIFA groups and tie-breakers",
        url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers",
        note: "Primary public source for groups, progression format, and tie-breakers."
      },
      {
        label: "FIFA final draw results",
        url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-draw-results",
        note: "Primary public source for the group draw."
      },
      {
        label: "OpenFootball World Cup JSON",
        url: "https://github.com/openfootball/worldcup.json",
        note: "Technical cross-check only. FIFA wins if sources conflict."
      }
    ],
    groups: [
      { id: "A", teams: ["Mexico", "South Africa", "Korea Republic", "Czechia"] },
      { id: "B", teams: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"] },
      { id: "C", teams: ["Brazil", "Morocco", "Haiti", "Scotland"] },
      { id: "D", teams: ["USA", "Paraguay", "Australia", "Türkiye"] },
      { id: "E", teams: ["Germany", "Curaçao", "Côte d’Ivoire", "Ecuador"] },
      { id: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
      { id: "G", teams: ["Belgium", "Egypt", "IR Iran", "New Zealand"] },
      { id: "H", teams: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"] },
      { id: "I", teams: ["France", "Senegal", "Iraq", "Norway"] },
      { id: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
      { id: "K", teams: ["Portugal", "Congo DR", "Uzbekistan", "Colombia"] },
      { id: "L", teams: ["England", "Croatia", "Ghana", "Panama"] }
    ],
    bracket: {
      note: "Some Round of 32 matchups depend on which third-place teams advance. These placeholders show tournament paths, not predictions.",
      rounds: [
        {
          name: "Round of 32",
          matches: [
            { id: "73", path: "Group A runner-up v Group B runner-up" },
            { id: "74", path: "Group E winner v third-place team from Group A/B/C/D/F" },
            { id: "75", path: "Group F winner v Group C runner-up" },
            { id: "76", path: "Group C winner v Group F runner-up" },
            { id: "77", path: "Group I winner v third-place team from Group C/D/F/G/H" },
            { id: "78", path: "Group E runner-up v Group I runner-up" },
            { id: "79", path: "Group A winner v third-place team from Group C/E/F/H/I" },
            { id: "80", path: "Group L winner v third-place team from Group E/H/I/J/K" },
            { id: "81", path: "Group D winner v third-place team from Group B/E/F/I/J" },
            { id: "82", path: "Group G winner v third-place team from Group A/E/H/I/J" },
            { id: "83", path: "Group K runner-up v Group L runner-up" },
            { id: "84", path: "Group H winner v Group J runner-up" },
            { id: "85", path: "Group B winner v third-place team from Group E/F/G/I/J" },
            { id: "86", path: "Group J winner v Group H runner-up" },
            { id: "87", path: "Group K winner v third-place team from Group D/E/I/J/L" },
            { id: "88", path: "Group D runner-up v Group G runner-up" }
          ]
        },
        {
          name: "Round of 16",
          matches: [
            { id: "89", path: "Winner Match 74 v Winner Match 77" },
            { id: "90", path: "Winner Match 73 v Winner Match 75" },
            { id: "91", path: "Winner Match 76 v Winner Match 78" },
            { id: "92", path: "Winner Match 79 v Winner Match 80" },
            { id: "93", path: "Winner Match 83 v Winner Match 84" },
            { id: "94", path: "Winner Match 81 v Winner Match 82" },
            { id: "95", path: "Winner Match 86 v Winner Match 88" },
            { id: "96", path: "Winner Match 85 v Winner Match 87" }
          ]
        },
        {
          name: "Quarter-finals",
          matches: [
            { id: "97", path: "Winner Match 89 v Winner Match 90" },
            { id: "98", path: "Winner Match 93 v Winner Match 94" },
            { id: "99", path: "Winner Match 91 v Winner Match 92" },
            { id: "100", path: "Winner Match 95 v Winner Match 96" }
          ]
        },
        {
          name: "Semi-finals",
          matches: [
            { id: "101", path: "Winner Match 97 v Winner Match 98" },
            { id: "102", path: "Winner Match 99 v Winner Match 100" }
          ]
        },
        {
          name: "Final matches",
          matches: [
            { id: "103", path: "Loser Match 101 v Loser Match 102, third-place match" },
            { id: "104", path: "Winner Match 101 v Winner Match 102, final" }
          ]
        }
      ]
    }
  };
}());
