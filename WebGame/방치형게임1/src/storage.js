import { SAVE_KEY } from "./config.js";
import { getOfflineGain } from "./calculations.js";
import { formatNumber } from "./formatters.js";
import { createDefaultState, cloneState } from "./state.js";

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw);
    const merged = createDefaultState();
    merged.stardust = Number(parsed.stardust) || 0;
    merged.totalEarned = Number(parsed.totalEarned) || 0;
    merged.cores = Number(parsed.cores) || 0;
    merged.clickMultiplier = Number(parsed.clickMultiplier) || 1;
    merged.globalAutomationMultiplier =
      Number(parsed.globalAutomationMultiplier) || 1;
    merged.buildings = { ...merged.buildings, ...(parsed.buildings || {}) };
    merged.buildingMultipliers = {
      ...merged.buildingMultipliers,
      ...(parsed.buildingMultipliers || {}),
    };
    merged.purchasedUpgrades = Array.isArray(parsed.purchasedUpgrades)
      ? parsed.purchasedUpgrades
      : [];
    merged.lastSavedAt = Number(parsed.lastSavedAt) || Date.now();
    merged.log =
      Array.isArray(parsed.log) && parsed.log.length > 0
        ? parsed.log.slice(0, 5)
        : merged.log;

    const awaySeconds = Math.max(0, (Date.now() - merged.lastSavedAt) / 1000);
    const offlineGain = getOfflineGain(merged, awaySeconds);
    if (offlineGain > 0) {
      merged.stardust += offlineGain;
      merged.totalEarned += offlineGain;
      merged.log = [
        `오프라인 보상으로 별가루 ${formatNumber(offlineGain)} 획득`,
        ...merged.log,
      ].slice(0, 5);
    }

    merged.lastSavedAt = Date.now();
    return merged;
  } catch (error) {
    console.error("Save load failed", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  const snapshot = cloneState(state);
  snapshot.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  return snapshot.lastSavedAt;
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
}
