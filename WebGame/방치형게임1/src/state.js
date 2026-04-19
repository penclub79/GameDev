import { buildingDefs } from "./config.js";

export function createDefaultState() {
  return {
    stardust: 0,
    totalEarned: 0,
    cores: 0,
    clickMultiplier: 1,
    globalAutomationMultiplier: 1,
    buildings: Object.fromEntries(buildingDefs.map((def) => [def.id, 0])),
    buildingMultipliers: Object.fromEntries(buildingDefs.map((def) => [def.id, 1])),
    purchasedUpgrades: [],
    lastSavedAt: Date.now(),
    log: [
      "채집을 시작했습니다. 첫 생산 라인을 세워보세요.",
      "건물을 구매하면 초당 별가루가 자동으로 증가합니다.",
    ],
  };
}

export function cloneState(source) {
  return {
    ...source,
    buildings: { ...source.buildings },
    buildingMultipliers: { ...source.buildingMultipliers },
    purchasedUpgrades: [...source.purchasedUpgrades],
    log: [...source.log],
  };
}
