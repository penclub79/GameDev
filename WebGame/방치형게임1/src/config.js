export const SAVE_KEY = "star-foundry-idle-save-v1";
export const TICK_MS = 100;
export const AUTO_SAVE_MS = 10000;
export const OFFLINE_CAP_SECONDS = 60 * 60 * 4;
export const OFFLINE_EFFICIENCY = 0.85;

export const buildingDefs = [
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

export const upgradeDefs = [
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
