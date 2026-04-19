import { AUTO_SAVE_MS, buildingDefs, TICK_MS, upgradeDefs } from "./config.js";
import {
  getBuildingCost,
  getClickPower,
  getPrestigeGain,
  getPrestigeMultiplier,
  getTotalProduction,
} from "./calculations.js";
import { getElements } from "./dom.js";
import { renderGame } from "./render.js";
import { saveState, loadState, resetSave } from "./storage.js";
import { createDefaultState } from "./state.js";

export function createGame() {
  const elements = getElements();
  let state = loadState();

  function addStardust(amount) {
    state.stardust += amount;
    state.totalEarned += amount;
  }

  function spendStardust(amount) {
    if (state.stardust < amount) {
      return false;
    }

    state.stardust -= amount;
    return true;
  }

  function pushLog(message) {
    state.log = [message, ...state.log].slice(0, 5);
  }

  function persist() {
    state.lastSavedAt = saveState(state);
  }

  function render() {
    renderGame(elements, state, actions);
  }

  function gatherStardust() {
    const amount = getClickPower(state);
    addStardust(amount);
    pushLog(`직접 채집으로 별가루 ${amount < 10 ? amount.toFixed(1) : Math.round(amount)} 획득`);
    render();
  }

  function buyBuilding(id) {
    const def = buildingDefs.find((entry) => entry.id === id);
    const cost = getBuildingCost(state, def);
    if (!spendStardust(cost)) {
      return;
    }

    state.buildings[id] += 1;
    pushLog(`${def.name} 구축 완료. 총 ${state.buildings[id]}개 보유`);
    render();
  }

  function buyUpgrade(id) {
    const def = upgradeDefs.find((entry) => entry.id === id);
    if (!def || state.purchasedUpgrades.includes(id) || !def.requirement(state)) {
      return;
    }

    if (!spendStardust(def.cost)) {
      return;
    }

    def.apply(state);
    state.purchasedUpgrades.push(id);
    pushLog(`업그레이드 적용: ${def.name}`);
    render();
  }

  function prestige() {
    const gain = getPrestigeGain(state);
    if (gain <= 0) {
      pushLog("코어를 얻기엔 누적 별가루가 아직 부족합니다.");
      render();
      return;
    }

    const shouldPrestige = window.confirm(
      `코어 ${gain}개를 얻고 진행 상황을 초기화할까요? 영구 배율은 유지됩니다.`
    );

    if (!shouldPrestige) {
      return;
    }

    const nextState = createDefaultState();
    nextState.cores = state.cores + gain;
    nextState.lastSavedAt = Date.now();
    nextState.log = [
      `코어 재점화 완료. 영구 보너스 x${getPrestigeMultiplier(nextState).toFixed(2)} 시작`,
      "새 회차에서 더 빠르게 확장해보세요.",
    ];
    state = nextState;
    persist();
    render();
  }

  function resetGame() {
    const shouldReset = window.confirm("정말로 전체 진행 상황을 초기화할까요?");
    if (!shouldReset) {
      return;
    }

    resetSave();
    state = createDefaultState();
    render();
  }

  function tick() {
    const production = getTotalProduction(state) * (TICK_MS / 1000);
    if (production > 0) {
      addStardust(production);
    }
    render();
  }

  const actions = {
    buyBuilding,
    buyUpgrade,
  };

  elements.gatherButton.addEventListener("click", gatherStardust);
  elements.prestigeButton.addEventListener("click", prestige);
  elements.saveButton.addEventListener("click", () => {
    persist();
    render();
  });
  elements.resetButton.addEventListener("click", resetGame);

  render();
  setInterval(tick, TICK_MS);
  setInterval(persist, AUTO_SAVE_MS);
}
