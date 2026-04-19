import {
  buildingDefs,
  OFFLINE_CAP_SECONDS,
  OFFLINE_EFFICIENCY,
} from "./config.js";

export function getPrestigeMultiplier(state) {
  return 1 + state.cores * 0.15;
}

export function getClickPower(state) {
  return state.clickMultiplier * getPrestigeMultiplier(state);
}

export function getBuildingCost(state, def) {
  return Math.floor(def.baseCost * def.costScale ** state.buildings[def.id]);
}

export function getBuildingProduction(state, def) {
  return (
    state.buildings[def.id] *
    def.production *
    state.buildingMultipliers[def.id] *
    state.globalAutomationMultiplier *
    getPrestigeMultiplier(state)
  );
}

export function getTotalProduction(state) {
  return buildingDefs.reduce(
    (sum, def) => sum + getBuildingProduction(state, def),
    0
  );
}

export function getPrestigeGain(state) {
  return Math.floor(Math.sqrt(state.totalEarned / 2500));
}

export function getOfflineGain(state, awaySeconds) {
  const cappedAwaySeconds = Math.min(awaySeconds, OFFLINE_CAP_SECONDS);
  return getTotalProduction(state) * cappedAwaySeconds * OFFLINE_EFFICIENCY;
}

export function getGoalText(state) {
  if (state.buildings.drone < 5) {
    return {
      goal: "채집 드론 5기 확보",
      status: "기본 자동 생산을 먼저 안정화하면 다음 업그레이드가 열립니다.",
    };
  }

  if (state.purchasedUpgrades.length < 2) {
    return {
      goal: "첫 업그레이드 조합 완성",
      status: "클릭 강화와 드론 최적화를 확보해 성장 속도를 끌어올리세요.",
    };
  }

  if (getPrestigeGain(state) < 1) {
    return {
      goal: "첫 코어 재점화 준비",
      status: "누적 별가루를 더 모아 영구 배율을 해금할 타이밍입니다.",
    };
  }

  return {
    goal: "코어를 모아 회차 가속",
    status: "재점화를 반복하며 더 빠른 성장 루프를 만들어보세요.",
  };
}
