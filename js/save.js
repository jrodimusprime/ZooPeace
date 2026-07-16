const SAVE_KEY = 'zoo_peace_save';

function detectBrowserLang() {
  const nav = (typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('hi')) return 'hi';
  return 'en';
}

function createDefaultSave() {
  return {
    saveVersion: 3,
    playerName: '',
    avatar: '🧑',
    onboarded: false,
    level: 1,
    xp: 0,
    gold: 0,
    stats: { attack: 10, defence: 5, vitality: 100, speed: 2, aura: 0, resolve: 0 },
    statLevels: { attack: 1, defence: 1, vitality: 1, speed: 1, aura: 0, resolve: 0 },
    freeStatPoints: 0,
    lang: detectBrowserLang(),
    currentAnimalIndex: ANIMALS.length - 1,
    encounterInitialized: false,
    killCounts: {},
    unlockedAbilities: [],
    unlockFloor: UNLOCK_START_COUNT,
    totalKills: 0,
    winStreak: 0,
    treatBonus: 0,
    challenges: { dailyDate: '', daily: [], session: [] },
    gameComplete: false,
    createdAt: new Date().toISOString(),
    lastSaved: new Date().toISOString(),
    lastPassiveTick: Date.now(),
  };
}

function migrateSave(data) {
  const merged = { ...createDefaultSave(), ...data };

  if (!data.saveVersion || data.saveVersion < 2) {
    merged.encounterInitialized = false;
    merged.currentAnimalIndex = ANIMALS.length - 1;
  }

  // v3: batch unlocks. Preserve old level-based pool so mid-game saves don't shrink.
  if (!data.saveVersion || data.saveVersion < 3) {
    const legacyPool = Math.min(ANIMALS.length, 15 + Math.max(0, (merged.level || 1) - 1) * 3);
    merged.unlockFloor = Math.max(UNLOCK_START_COUNT, legacyPool, merged.unlockFloor || 0);
  }

  merged.saveVersion = 3;
  if (merged.unlockFloor == null) merged.unlockFloor = UNLOCK_START_COUNT;
  return merged;
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    return migrateSave(JSON.parse(raw));
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
  const merged = migrateSave(data);
  merged.encounterInitialized = false;
  writeSave(merged);
  return merged;
}
