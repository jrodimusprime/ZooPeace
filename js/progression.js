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
  if (animalIndex === 0) return true;
  const prevKills = getKillCount(save, animalIndex - 1);
  return prevKills >= KILLS_PER_ANIMAL;
}

function isAnimalPacified(save, animalIndex) {
  return getKillCount(save, animalIndex) >= KILLS_PER_ANIMAL;
}

function canProgress(save) {
  const kills = getKillCount(save, save.currentAnimalIndex);
  return kills >= KILLS_PER_ANIMAL && save.currentAnimalIndex < ANIMALS.length - 1;
}

function advanceAnimal(save) {
  if (!canProgress(save)) return false;
  save.currentAnimalIndex += 1;
  return true;
}

function checkGameComplete(save) {
  const lastIdx = ANIMALS.length - 1;
  if (getKillCount(save, lastIdx) >= KILLS_PER_ANIMAL) {
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
