const SAVE_KEY = "star-foundry-idle-save-v1";
const TICK_MS = 100;

const buildingDefs = [
  {
    id: "drone",
    name: "채집 드론",
    description: "소형 드론이 별가루를 자동 채집합니다.",
    baseCost: 15,
    costScale: 1.16,
    production: 0.2,
  },
  {
    id: "satellite",
    name: "정제 위성",
    description: "주변 궤도에서 별가루를 정제해 공급량을 늘립니다.",
    baseCost: 120,
    costScale: 1.18,
    production: 1.4,
  },
  {
    id: "reactor",
    name: "성운 반응로",
    description: "불안정한 성운 입자를 가공해 대량 생산을 시작합니다.",
    baseCost: 950,
    costScale: 1.2,
    production: 8,
  },
  {
    id: "gate",
    name: "항성 관문",
    description: "먼 우주 채굴망을 연결해 생산량을 폭발적으로 증가시킵니다.",
    baseCost: 7200,
    costScale: 1.22,
    production: 36,
  },
];

const upgradeDefs = [
  {
    id: "click-1",
    name: "강화 장갑",
    description: "클릭당 별가루 획득량이 2배가 됩니다.",
    cost: 50,
    requirement: () => true,
    apply: (state) => {
      state.clickMultiplier *= 2;
    },
  },
  {
    id: "drone-1",
    name: "드론 경로 최적화",
    description: "채집 드론 생산량이 2배가 됩니다.",
    cost: 200,
    requirement: (state) => state.buildings.drone >= 5,
    apply: (state) => {
      state.buildingMultipliers.drone *= 2;
    },
  },
  {
    id: "all-1",
    name: "별빛 압축 알고리즘",
    description: "모든 자동 생산량이 1.5배가 됩니다.",
    cost: 900,
    requirement: (state) => state.totalEarned >= 700,
    apply: (state) => {
      state.globalAutomationMultiplier *= 1.5;
    },
  },
  {
    id: "satellite-1",
    name: "궤도 동기화",
    description: "정제 위성 생산량이 2배가 됩니다.",
    cost: 2400,
    requirement: (state) => state.buildings.satellite >= 5,
    apply: (state) => {
      state.buildingMultipliers.satellite *= 2;
    },
  },
  {
    id: "click-2",
    name: "중력 스윙 채집",
    description: "클릭당 획득량이 다시 2배가 됩니다.",
    cost: 4800,
    requirement: (state) => state.totalEarned >= 3000,
    apply: (state) => {
      state.clickMultiplier *= 2;
    },
  },
  {
    id: "all-2",
    name: "심우주 자동화",
    description: "모든 자동 생산량이 2배가 됩니다.",
    cost: 12000,
    requirement: (state) => state.totalEarned >= 12000,
    apply: (state) => {
      state.globalAutomationMultiplier *= 2;
    },
  },
];

const defaultState = () => ({
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
});

let state = loadState();

const els = {
  stardustValue: document.getElementById("stardust-value"),
  rateValue: document.getElementById("rate-value"),
  clickValue: document.getElementById("click-value"),
  perClickValue: document.getElementById("per-click-value"),
  automationValue: document.getElementById("automation-value"),
  prestigeBonusValue: document.getElementById("prestige-bonus-value"),
  buildingsList: document.getElementById("buildings-list"),
  upgradesList: document.getElementById("upgrades-list"),
  eventLog: document.getElementById("event-log"),
  coreValue: document.getElementById("core-value"),
  prestigeGainValue: document.getElementById("prestige-gain-value"),
  lifetimeValue: document.getElementById("lifetime-value"),
  saveStatus: document.getElementById("save-status"),
  goalText: document.getElementById("goal-text"),
  statusText: document.getElementById("status-text"),
  gatherButton: document.getElementById("gather-button"),
  prestigeButton: document.getElementById("prestige-button"),
  saveButton: document.getElementById("save-button"),
  resetButton: document.getElementById("reset-button"),
};

els.gatherButton.addEventListener("click", () => {
  const amount = getClickPower();
  addStardust(amount);
  pushLog(`직접 채집으로 별가루 ${formatNumber(amount)} 획득`);
  render();
});

els.prestigeButton.addEventListener("click", () => {
  const gain = getPrestigeGain();
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

  const nextState = defaultState();
  nextState.cores = state.cores + gain;
  nextState.lastSavedAt = Date.now();
  nextState.log = [
    `코어 재점화 완료. 영구 보너스 x${getPrestigeMultiplier(nextState).toFixed(2)} 시작`,
    "새 회차에서 더 빠르게 확장해보세요.",
  ];
  state = nextState;
  saveState();
  render();
});

els.saveButton.addEventListener("click", () => {
  saveState();
  render();
});

els.resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("정말로 전체 진행 상황을 초기화할까요?");
  if (!shouldReset) {
    return;
  }
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  render();
});

function getPrestigeMultiplier(source = state) {
  return 1 + source.cores * 0.15;
}

function getClickPower() {
  return state.clickMultiplier * getPrestigeMultiplier();
}

function getBuildingCost(def) {
  return Math.floor(def.baseCost * def.costScale ** state.buildings[def.id]);
}

function getBuildingProduction(def) {
  return (
    state.buildings[def.id] *
    def.production *
    state.buildingMultipliers[def.id] *
    state.globalAutomationMultiplier *
    getPrestigeMultiplier()
  );
}

function getTotalProduction() {
  return buildingDefs.reduce((sum, def) => sum + getBuildingProduction(def), 0);
}

function getPrestigeGain() {
  return Math.floor(Math.sqrt(state.totalEarned / 2500));
}

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

function buyBuilding(id) {
  const def = buildingDefs.find((entry) => entry.id === id);
  const cost = getBuildingCost(def);
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

function getGoalText() {
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
  if (getPrestigeGain() < 1) {
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

function renderBuildings() {
  els.buildingsList.innerHTML = "";
  buildingDefs.forEach((def) => {
    const cost = getBuildingCost(def);
    const production = getBuildingProduction(def);
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
    button.addEventListener("click", () => buyBuilding(def.id));
    card.querySelector(".card-bottom").appendChild(button);
    els.buildingsList.appendChild(card);
  });
}

function renderUpgrades() {
  els.upgradesList.innerHTML = "";
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
    els.upgradesList.appendChild(empty);
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
    button.addEventListener("click", () => buyUpgrade(def.id));
    card.appendChild(button);
    els.upgradesList.appendChild(card);
  });
}

function renderLog() {
  els.eventLog.innerHTML = "";
  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    els.eventLog.appendChild(item);
  });
}

function render() {
  const production = getTotalProduction();
  const prestigeData = getGoalText();
  els.stardustValue.textContent = formatNumber(state.stardust);
  els.rateValue.textContent = `초당 ${formatNumber(production)}`;
  els.clickValue.textContent = `+${formatNumber(getClickPower())}`;
  els.perClickValue.textContent = formatNumber(getClickPower());
  els.automationValue.textContent = formatNumber(production);
  els.prestigeBonusValue.textContent = `x${getPrestigeMultiplier().toFixed(2)}`;
  els.coreValue.textContent = formatNumber(state.cores);
  els.prestigeGainValue.textContent = formatNumber(getPrestigeGain());
  els.lifetimeValue.textContent = formatNumber(state.totalEarned);
  els.saveStatus.textContent = `마지막 저장 ${formatRelativeTime(state.lastSavedAt)}`;
  els.goalText.textContent = prestigeData.goal;
  els.statusText.textContent = prestigeData.status;
  els.prestigeButton.disabled = getPrestigeGain() <= 0;

  renderBuildings();
  renderUpgrades();
  renderLog();
}

function gameTick() {
  const production = getTotalProduction() * (TICK_MS / 1000);
  if (production > 0) {
    addStardust(production);
  }
  render();
}

function saveState() {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw);
    const merged = defaultState();
    merged.stardust = Number(parsed.stardust) || 0;
    merged.totalEarned = Number(parsed.totalEarned) || 0;
    merged.cores = Number(parsed.cores) || 0;
    merged.clickMultiplier = Number(parsed.clickMultiplier) || 1;
    merged.globalAutomationMultiplier = Number(parsed.globalAutomationMultiplier) || 1;
    merged.buildings = { ...merged.buildings, ...(parsed.buildings || {}) };
    merged.buildingMultipliers = { ...merged.buildingMultipliers, ...(parsed.buildingMultipliers || {}) };
    merged.purchasedUpgrades = Array.isArray(parsed.purchasedUpgrades) ? parsed.purchasedUpgrades : [];
    merged.lastSavedAt = Number(parsed.lastSavedAt) || Date.now();
    merged.log = Array.isArray(parsed.log) && parsed.log.length > 0 ? parsed.log.slice(0, 5) : merged.log;

    const awaySeconds = Math.max(0, (Date.now() - merged.lastSavedAt) / 1000);
    const cappedAwaySeconds = Math.min(awaySeconds, 60 * 60 * 4);
    const offlineGain = getOfflineGain(merged, cappedAwaySeconds);
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
    return defaultState();
  }
}

function getOfflineGain(sourceState, seconds) {
  const prestigeMultiplier = 1 + sourceState.cores * 0.15;
  const production = buildingDefs.reduce((sum, def) => {
    const owned = Number(sourceState.buildings[def.id]) || 0;
    const multiplier = Number(sourceState.buildingMultipliers[def.id]) || 1;
    return sum + owned * def.production * multiplier;
  }, 0);

  return production * (sourceState.globalAutomationMultiplier || 1) * prestigeMultiplier * seconds * 0.85;
}

function formatNumber(value) {
  if (value < 1000) {
    return value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1);
  }

  const units = ["K", "M", "B", "T", "Qa", "Qi"];
  let unitIndex = -1;
  let scaled = value;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${units[unitIndex]}`;
}

function formatRelativeTime(timestamp) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 5) {
    return "방금 전";
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`;
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}분 전`;
  }
  return `${Math.floor(diffSeconds / 3600)}시간 전`;
}

render();
setInterval(gameTick, TICK_MS);
setInterval(saveState, 10000);
