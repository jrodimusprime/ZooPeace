const STAT_CONFIG = {
  attack: { label: 'Attack', baseCost: 10, effect: (lvl) => lvl * 2 + 8 },
  defence: { label: 'Defence', baseCost: 10, effect: (lvl) => lvl * 1 + 3 },
  vitality: { label: 'Vitality', baseCost: 12, effect: (lvl) => 80 + lvl * 10 },
  // Slower attack rate growth so mid/late fights don't melt in a few seconds.
  speed: { label: 'Speed', baseCost: 15, effect: (lvl) => 0.85 + lvl * 0.35 },
  aura: { label: 'Peace Aura', baseCost: 20, effect: (lvl) => lvl * 2 },
  resolve: { label: 'Resolve', baseCost: 18, effect: (lvl) => lvl * 3 },
};

function xpForLevel(level) {
  // Steeper curve so levels (and free points) stay meaningful across a long grind.
  return Math.floor(120 * Math.pow(1.2, level - 1));
}

function getUpgradeCost(statKey, currentLevel) {
  const cfg = STAT_CONFIG[statKey];
  return Math.floor(cfg.baseCost * Math.pow(1.12, currentLevel));
}

function getPlayerCombatStats(save) {
  const sl = save.statLevels;
  // Combat uses upgraded levels only (legacy flat save.stats bonuses ignored).
  return {
    attack: STAT_CONFIG.attack.effect(sl.attack),
    defence: STAT_CONFIG.defence.effect(sl.defence),
    maxHp: STAT_CONFIG.vitality.effect(sl.vitality),
    speed: STAT_CONFIG.speed.effect(sl.speed),
    aura: STAT_CONFIG.aura.effect(sl.aura),
    resolve: STAT_CONFIG.resolve.effect(sl.resolve),
  };
}

function addXp(save, amount) {
  const resolveBonus = 1 + STAT_CONFIG.resolve.effect(save.statLevels.resolve) / 100;
  const xpGain = Math.floor(amount * resolveBonus);
  const levelBefore = save.level;
  const abilitiesBefore = save.unlockedAbilities.slice();
  save.xp += xpGain;

  let levelsGained = 0;
  while (save.xp >= xpForLevel(save.level)) {
    save.xp -= xpForLevel(save.level);
    save.level += 1;
    save.freeStatPoints += 1;
    levelsGained += 1;
    checkAbilityUnlocks(save);
  }

  const newAbilities = save.unlockedAbilities.filter((id) => !abilitiesBefore.includes(id));
  return {
    xpGain,
    levelsGained,
    levelBefore,
    levelAfter: save.level,
    freePointsGained: levelsGained,
    newAbilities,
  };
}

function checkAbilityUnlocks(save) {
  const abilities = [
    { id: 'calmStrike', level: 5 },
    { id: 'shieldBreath', level: 15 },
    { id: 'peaceTreaty', level: 30 },
  ];
  for (const a of abilities) {
    if (save.level >= a.level && !save.unlockedAbilities.includes(a.id)) {
      save.unlockedAbilities.push(a.id);
    }
  }
}

const ABILITY_I18N_KEYS = {
  calmStrike: 'calmStrike',
  shieldBreath: 'shield',
  peaceTreaty: 'treaty',
};

function upgradeStat(save, statKey) {
  const cost = getUpgradeCost(statKey, save.statLevels[statKey]);
  if (save.gold < cost) return false;
  save.gold -= cost;
  save.statLevels[statKey] += 1;
  return true;
}

function spendFreePoint(save, statKey) {
  if (save.freeStatPoints <= 0) return false;
  save.freeStatPoints -= 1;
  save.statLevels[statKey] += 1;
  return true;
}

function buyTreat(save) {
  const cost = 25;
  if (save.gold < cost) return false;
  save.gold -= cost;
  save.treatBonus = 10;
  return true;
}

function getPlayerTitle(save) {
  if (save.gameComplete) return t('supremeTitle');
  if (!save.totalKills) return t('noviceTitle');
  const animal = ANIMALS[Math.min(save.currentAnimalIndex, ANIMALS.length - 1)];
  return t('pacifierTitle', { name: animalName(animal.name) });
}

function tickPassiveXp(save) {
  const now = Date.now();
  const elapsed = now - (save.lastPassiveTick || now);
  if (elapsed < 60000) return null;
  const minutes = Math.floor(elapsed / 60000);
  save.lastPassiveTick = now;
  const passive = Math.floor(minutes * save.level * 0.75);
  if (passive > 0) return addXp(save, passive);
  return null;
}
