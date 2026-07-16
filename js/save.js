const SAVE_KEY = 'zoo_peace_save';

function createDefaultSave() {
  return {
    saveVersion: 2,
    playerName: '',
    avatar: '🧑',
    onboarded: false,
    level: 1,
    xp: 0,
    gold: 0,
    stats: { attack: 10, defence: 5, vitality: 100, speed: 2, aura: 0, resolve: 0 },
    statLevels: { attack: 1, defence: 1, vitality: 1, speed: 1, aura: 0, resolve: 0 },
    freeStatPoints: 0,
    currentAnimalIndex: ANIMALS.length - 1,
    encounterInitialized: false,
    killCounts: {},
    unlockedAbilities: [],
    totalKills: 0,
    winStreak: 0,
    treatBonus: 0,
    gameComplete: false,
    createdAt: new Date().toISOString(),
    lastSaved: new Date().toISOString(),
    lastPassiveTick: Date.now(),
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    const data = JSON.parse(raw);
    const merged = { ...createDefaultSave(), ...data };
    if (data.saveVersion !== 2) {
      merged.saveVersion = 2;
      merged.encounterInitialized = false;
      merged.currentAnimalIndex = ANIMALS.length - 1;
    }
    return merged;
  } catch {
    return createDefaultSave();
  }
}

function writeSave(save) {
  save.lastSaved = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return createDefaultSave();
}

function exportSave(save) {
  return JSON.stringify(save, null, 2);
}

function importSave(json) {
  const data = JSON.parse(json);
  const merged = { ...createDefaultSave(), ...data };
  merged.saveVersion = 2;
  merged.encounterInitialized = false;
  writeSave(merged);
  return merged;
}
