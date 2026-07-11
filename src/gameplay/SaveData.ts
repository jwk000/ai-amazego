const storageKey = "amazego-save-v1";

type SaveData = {
  unlockedLevel: number;
  stars: Record<string, number>;
  bestTimes: Record<string, number>;
};

const defaults: SaveData = { unlockedLevel: 1, stars: {}, bestTimes: {} };

export const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? { ...defaults, ...JSON.parse(raw) as SaveData } : { ...defaults };
  } catch {
    return { ...defaults };
  }
};

export const recordWin = (levelNumber: number, stars: number, elapsedSeconds: number): void => {
  const save = loadSave();
  const key = String(levelNumber);
  save.unlockedLevel = Math.max(save.unlockedLevel, levelNumber + 1);
  save.stars[key] = Math.max(save.stars[key] ?? 0, stars);
  save.bestTimes[key] = Math.min(save.bestTimes[key] ?? Number.POSITIVE_INFINITY, elapsedSeconds);
  localStorage.setItem(storageKey, JSON.stringify(save));
};
