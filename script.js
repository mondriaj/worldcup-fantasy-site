// This list contains the fake 11-player team that appears on the field.
const fakeTeam = [
  { name: "Rafa Silva", country: "Portugal", role: "Goalkeeper", top: "88%", left: "50%" },
  { name: "Jules Martin", country: "France", role: "Defender", top: "68%", left: "18%" },
  { name: "Diego Luna", country: "Argentina", role: "Defender", top: "68%", left: "39%" },
  { name: "Noah Kim", country: "South Korea", role: "Defender", top: "68%", left: "61%" },
  { name: "Samir Haddad", country: "Morocco", role: "Defender", top: "68%", left: "82%" },
  { name: "Emil Costa", country: "Spain", role: "Midfielder", top: "48%", left: "22%" },
  { name: "Marco Vale", country: "Portugal", role: "Midfielder", top: "48%", left: "50%" },
  { name: "Akira Sato", country: "Japan", role: "Midfielder", top: "48%", left: "78%" },
  { name: "Owen Reed", country: "USA", role: "Forward", top: "24%", left: "24%" },
  { name: "Leo Santos", country: "Brazil", role: "Forward", top: "18%", left: "50%" },
  { name: "Tariq Noor", country: "Morocco", role: "Forward", top: "24%", left: "76%" }
];

const buildTeamButton = document.getElementById("build-team-btn");
const teamField = document.getElementById("team-field");
const teamPlayers = document.getElementById("team-players");
const teamMessage = document.getElementById("team-message");

// Create one visual player card for each player in the fake team list.
function buildTeam() {
  teamPlayers.innerHTML = "";

  fakeTeam.forEach((player) => {
    const playerCard = document.createElement("article");
    playerCard.className = "player-card";
    playerCard.style.top = player.top;
    playerCard.style.left = player.left;

    playerCard.innerHTML = `
      <span class="player-card__role">${player.role}</span>
      <strong>${player.name}</strong>
      <p>${player.country}</p>
    `;

    teamPlayers.appendChild(playerCard);
  });

  teamField.classList.remove("hidden");
  teamMessage.textContent = "Your fake World Cup fantasy team is ready.";
}

buildTeamButton.addEventListener("click", buildTeam);
