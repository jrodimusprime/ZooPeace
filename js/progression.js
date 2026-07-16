function getKillCount(save, animalIndex) {
  return save.killCounts[String(animalIndex)] || 0;
}

function recordKill(save, animalIndex) {
  const key = String(animalIndex);
  save.killCounts[key] = (save.killCounts[key] || 0) + 1;
  save.totalKills += 1;
  save.winStreak += 1;
  return save.killCounts[key];
}

function resetWinStreak(save) {
  save.winStreak = 0;
}

function isAnimalUnlocked(save, animalIndex) {
  return animalIndex >= getUnlockedAnimalStartIndex(save);
}

function isAnimalPacified(save, animalIndex) {
  return getKillCount(save, animalIndex) >= KILLS_PER_ANIMAL;
}

function getUnlockedAnimalCount(save) {
  return Math.min(ANIMALS.length, 15 + Math.max(0, save.level - 1) * 3);
}

function getUnlockedAnimalStartIndex(save) {
  return ANIMALS.length - getUnlockedAnimalCount(save);
}

function selectNextEncounter(save, excludeIndex = -1, random = Math.random) {
  const start = getUnlockedAnimalStartIndex(save);
  const candidates = [];
  let totalWeight = 0;

  for (let index = start; index < ANIMALS.length; index++) {
    if (index === excludeIndex && ANIMALS.length - start > 1) continue;
    const rarity = getAnimalRarity(index);
    let weight = RARITY_CONFIG[rarity].weight;
    const kills = getKillCount(save, index);
    if (kills >= KILLS_PER_ANIMAL) weight *= 0.15;
    totalWeight += weight;
    candidates.push({ index, weight });
  }

  let roll = random() * totalWeight;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.index;
  }
  return candidates[candidates.length - 1].index;
}

/** After a loss, prefer lower-threat animals so players aren't stuck in a death loop. */
function selectSaferEncounter(save, excludeIndex = -1, random = Math.random) {
  const start = getUnlockedAnimalStartIndex(save);
  const candidates = [];
  let totalWeight = 0;

  for (let index = start; index < ANIMALS.length; index++) {
    if (index === excludeIndex && ANIMALS.length - start > 1) continue;
    const animal = ANIMALS[index];
    const threat = Math.max(1, animal.baseAtk * animal.baseSpd);
    // Invert threat — safer animals get higher weight.
    let weight = 120 / threat;
    const rarity = getAnimalRarity(index);
    if (rarity === 'common') weight *= 1.4;
    if (rarity === 'legendary') weight *= 0.4;
    const kills = getKillCount(save, index);
    if (kills >= KILLS_PER_ANIMAL) weight *= 0.2;
    totalWeight += weight;
    candidates.push({ index, weight });
  }

  let roll = random() * totalWeight;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.index;
  }
  return candidates[candidates.length - 1].index;
}

function checkGameComplete(save) {
  const allPacified = ANIMALS.every((_, index) => isAnimalPacified(save, index));
  if (allPacified) {
    save.gameComplete = true;
    return true;
  }
  return false;
}

function getZoneProgress(save, tier) {
  const animals = ANIMALS.map((a, i) => ({ ...a, index: i })).filter((a) => a.tier === tier);
  const pacified = animals.filter((a) => isAnimalPacified(save, a.index)).length;
  return { total: animals.length, pacified };
}

function getOverallProgress(save) {
  let pacified = 0;
  for (let i = 0; i < ANIMALS.length; i++) {
    if (isAnimalPacified(save, i)) pacified++;
  }
  return { pacified, total: ANIMALS.length, kills: save.totalKills, target: ANIMALS.length * KILLS_PER_ANIMAL };
}
