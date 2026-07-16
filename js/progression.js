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

/**
 * Unlock in small batches: start with 3, then +3 only after every
 * currently unlocked animal is fully pacified. Level no longer opens packs.
 */
function getUnlockedAnimalCount(save) {
  const total = ANIMALS.length;
  let count = Math.min(total, UNLOCK_START_COUNT);

  while (count < total) {
    const start = total - count;
    let batchPacified = true;
    for (let i = start; i < total; i++) {
      if (getKillCount(save, i) < KILLS_PER_ANIMAL) {
        batchPacified = false;
        break;
      }
    }
    if (!batchPacified) break;
    count = Math.min(total, count + UNLOCK_BATCH_SIZE);
  }

  // Never lock animals a save has already fought, or an older unlock floor.
  let fromProgress = Math.max(UNLOCK_START_COUNT, save.unlockFloor || 0);
  for (let i = 0; i < total; i++) {
    if (getKillCount(save, i) > 0) {
      fromProgress = Math.max(fromProgress, total - i);
    }
  }
  if (save.currentAnimalIndex != null && save.currentAnimalIndex >= 0) {
    fromProgress = Math.max(fromProgress, total - save.currentAnimalIndex);
  }

  const unlocked = Math.min(total, Math.max(count, fromProgress));
  if ((save.unlockFloor || 0) < unlocked) save.unlockFloor = unlocked;
  return unlocked;
}

function getUnlockedAnimalStartIndex(save) {
  return ANIMALS.length - getUnlockedAnimalCount(save);
}

/** How many animals still need pacifying before the next batch unlocks. */
function getBatchUnlockProgress(save) {
  const total = ANIMALS.length;
  const count = getUnlockedAnimalCount(save);
  if (count >= total) {
    return { remaining: 0, unlocked: count, nextUnlock: 0, done: true };
  }
  const start = total - count;
  let remaining = 0;
  for (let i = start; i < total; i++) {
    if (getKillCount(save, i) < KILLS_PER_ANIMAL) remaining += 1;
  }
  return {
    remaining,
    unlocked: count,
    nextUnlock: Math.min(UNLOCK_BATCH_SIZE, total - count),
    done: false,
  };
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
    if (kills >= KILLS_PER_ANIMAL) {
      weight *= 0.08; // push hard toward unfinished animals in the tiny pool
    } else {
      // Prefer the least-progressed of the current batch (the real grind).
      const progress = kills / KILLS_PER_ANIMAL;
      weight *= 1.35 - progress;
    }
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
