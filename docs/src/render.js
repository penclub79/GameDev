import { buildingDefs, upgradeDefs } from "./config.js";
import {
  getBuildingCost,
  getBuildingProduction,
  getClickPower,
  getGoalText,
  getPrestigeGain,
  getPrestigeMultiplier,
  getTotalProduction,
} from "./calculations.js";
import { formatNumber, formatRelativeTime } from "./formatters.js";

function renderBuildings(elements, state, actions) {
  elements.buildingsList.innerHTML = "";

  buildingDefs.forEach((def) => {
    const cost = getBuildingCost(state, def);
    const production = getBuildingProduction(state, def);
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${def.name}</h3>
          <p>${def.description}</p>
        </div>
        <span class="owned-tag">보유 ${state.buildings[def.id]}</span>
      </div>
      <div class="card-bottom">
        <div>
          <span class="cost-tag">비용 ${formatNumber(cost)}</span>
          <p class="card-meta">현재 초당 +${formatNumber(production)}</p>
        </div>
      </div>
    `;

    const button = document.createElement("button");
    button.className = "buy-button";
    button.textContent = "구매";
    button.disabled = state.stardust < cost;
    button.addEventListener("click", () => actions.buyBuilding(def.id));
    card.querySelector(".card-bottom").appendChild(button);
    elements.buildingsList.appendChild(card);
  });
}

function renderUpgrades(elements, state, actions) {
  elements.upgradesList.innerHTML = "";

  const availableDefs = upgradeDefs.filter(
    (def) => !state.purchasedUpgrades.includes(def.id) && def.requirement(state)
  );

  if (availableDefs.length === 0) {
    const empty = document.createElement("article");
    empty.className = "card";
    empty.innerHTML = `
      <h3>아직 해금된 업그레이드가 없습니다.</h3>
      <p>건물을 더 짓거나 누적 별가루를 늘리면 새로운 최적화가 열립니다.</p>
    `;
    elements.upgradesList.appendChild(empty);
    return;
  }

  availableDefs.forEach((def) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${def.name}</h3>
          <p>${def.description}</p>
        </div>
        <span class="cost-tag">비용 ${formatNumber(def.cost)}</span>
      </div>
    `;

    const button = document.createElement("button");
    button.className = "buy-button";
    button.textContent = "연구";
    button.disabled = state.stardust < def.cost;
    button.addEventListener("click", () => actions.buyUpgrade(def.id));
    card.appendChild(button);
    elements.upgradesList.appendChild(card);
  });
}

function renderLog(elements, state) {
  elements.eventLog.innerHTML = "";

  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    elements.eventLog.appendChild(item);
  });
}

export function renderGame(elements, state, actions) {
  const production = getTotalProduction(state);
  const prestigeData = getGoalText(state);

  elements.stardustValue.textContent = formatNumber(state.stardust);
  elements.rateValue.textContent = `초당 ${formatNumber(production)}`;
  elements.clickValue.textContent = `+${formatNumber(getClickPower(state))}`;
  elements.perClickValue.textContent = formatNumber(getClickPower(state));
  elements.automationValue.textContent = formatNumber(production);
  elements.prestigeBonusValue.textContent = `x${getPrestigeMultiplier(state).toFixed(2)}`;
  elements.coreValue.textContent = formatNumber(state.cores);
  elements.prestigeGainValue.textContent = formatNumber(getPrestigeGain(state));
  elements.lifetimeValue.textContent = formatNumber(state.totalEarned);
  elements.saveStatus.textContent = `마지막 저장 ${formatRelativeTime(state.lastSavedAt)}`;
  elements.goalText.textContent = prestigeData.goal;
  elements.statusText.textContent = prestigeData.status;
  elements.prestigeButton.disabled = getPrestigeGain(state) <= 0;

  renderBuildings(elements, state, actions);
  renderUpgrades(elements, state, actions);
  renderLog(elements, state);
}
