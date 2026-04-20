(function () {
  const SAVE_KEY = "star-foundry-idle-save-v1";
  const TICK_MS = 100;
  const AUTO_SAVE_MS = 10000;
  const OFFLINE_CAP_SECONDS = 60 * 60 * 4;
  const OFFLINE_EFFICIENCY = 0.85;

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

  function createDefaultState() {
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

  function cloneState(source) {
    return {
      ...source,
      buildings: { ...source.buildings },
      buildingMultipliers: { ...source.buildingMultipliers },
      purchasedUpgrades: [...source.purchasedUpgrades],
      log: [...source.log],
    };
  }

  function getPrestigeMultiplier(state) {
    return 1 + state.cores * 0.15;
  }

  function getClickPower(state) {
    return state.clickMultiplier * getPrestigeMultiplier(state);
  }

  function getBuildingCost(state, def) {
    return Math.floor(def.baseCost * def.costScale ** state.buildings[def.id]);
  }

  function getBuildingProduction(state, def) {
    return (
      state.buildings[def.id] *
      def.production *
      state.buildingMultipliers[def.id] *
      state.globalAutomationMultiplier *
      getPrestigeMultiplier(state)
    );
  }

  function getTotalProduction(state) {
    return buildingDefs.reduce((sum, def) => sum + getBuildingProduction(state, def), 0);
  }

  function getPrestigeGain(state) {
    return Math.floor(Math.sqrt(state.totalEarned / 2500));
  }

  function getOfflineGain(state, awaySeconds) {
    const cappedAwaySeconds = Math.min(awaySeconds, OFFLINE_CAP_SECONDS);
    return getTotalProduction(state) * cappedAwaySeconds * OFFLINE_EFFICIENCY;
  }

  function getGoalText(state) {
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

    const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return `${scaled.toFixed(digits)}${units[unitIndex]}`;
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

  function loadState() {
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
      merged.globalAutomationMultiplier = Number(parsed.globalAutomationMultiplier) || 1;
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

  function saveState(state) {
    const snapshot = cloneState(state);
    snapshot.lastSavedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    return snapshot.lastSavedAt;
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  function getElements() {
    return {
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
  }

  function renderBuildings(elements, state, actions, view) {
    if (view.buildingCards.size === 0) {
      elements.buildingsList.innerHTML = "";

      buildingDefs.forEach((def) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <h3>${def.name}</h3>
              <p>${def.description}</p>
            </div>
            <span class="owned-tag"></span>
          </div>
          <div class="card-bottom">
            <div>
              <span class="cost-tag"></span>
              <p class="card-meta"></p>
            </div>
          </div>
        `;

        const button = document.createElement("button");
        button.className = "buy-button";
        button.textContent = "구매";
        button.addEventListener("click", () => actions.buyBuilding(def.id));
        card.querySelector(".card-bottom").appendChild(button);
        elements.buildingsList.appendChild(card);

        view.buildingCards.set(def.id, {
          owned: card.querySelector(".owned-tag"),
          cost: card.querySelector(".cost-tag"),
          production: card.querySelector(".card-meta"),
          button,
        });
      });
    }

    buildingDefs.forEach((def) => {
      const refs = view.buildingCards.get(def.id);
      const cost = getBuildingCost(state, def);
      const production = getBuildingProduction(state, def);

      refs.owned.textContent = `보유 ${state.buildings[def.id]}`;
      refs.cost.textContent = `비용 ${formatNumber(cost)}`;
      refs.production.textContent = `현재 초당 +${formatNumber(production)}`;
      refs.button.disabled = state.stardust < cost;
    });
  }

  function renderUpgrades(elements, state, actions, view) {
    const availableDefs = upgradeDefs.filter(
      (def) => !state.purchasedUpgrades.includes(def.id) && def.requirement(state)
    );
    const nextUpgradeKey = availableDefs.map((def) => def.id).join("|");

    if (view.upgradeListKey === nextUpgradeKey) {
      availableDefs.forEach((def) => {
        const refs = view.upgradeCards.get(def.id);
        if (refs) {
          refs.cost.textContent = `비용 ${formatNumber(def.cost)}`;
          refs.button.disabled = state.stardust < def.cost;
        }
      });
      return;
    }

    view.upgradeListKey = nextUpgradeKey;
    view.upgradeCards.clear();
    elements.upgradesList.innerHTML = "";

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

      view.upgradeCards.set(def.id, {
        cost: card.querySelector(".cost-tag"),
        button,
      });
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

  function renderGame(elements, state, actions, view) {
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

    renderBuildings(elements, state, actions, view);
    renderUpgrades(elements, state, actions, view);
    renderLog(elements, state);
  }

  function createGame() {
    const elements = getElements();
    let state = loadState();
    const view = {
      buildingCards: new Map(),
      upgradeCards: new Map(),
      upgradeListKey: "",
    };

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
      renderGame(elements, state, actions, view);
    }

    function gatherStardust() {
      const amount = getClickPower(state);
      addStardust(amount);
      pushLog(`직접 채집으로 별가루 ${formatNumber(amount)} 획득`);
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

  createGame();
})();
