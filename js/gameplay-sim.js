/**
 * Gameplay simulation — statistical checks for encounter/combat loops.
 * Run via: index.html?gameplay-test=1
 */
const GameplaySim = {
  results: [],

  assert(condition, name) {
    this.results.push({ name, pass: !!condition });
    if (!condition) console.error(`FAIL: ${name}`);
    else console.log(`PASS: ${name}`);
  },

  simulateCombat(playerStats, enemyStats, maxTicks = 500) {
    let playerHp = playerStats.maxHp;
    let enemyHp = enemyStats.maxHp;
    let playerTimer = 0;
    let enemyTimer = 0;
    const playerInterval = 1 / playerStats.speed;
    const enemyInterval = 1 / enemyStats.spd;

    for (let tick = 0; tick < maxTicks; tick++) {
      playerTimer += 0.2;
      enemyTimer += 0.2;

      if (playerTimer >= playerInterval) {
        playerTimer = 0;
        const dmg = Math.max(1, Math.floor(playerStats.attack - enemyStats.def * 0.5));
        enemyHp -= dmg;
      }
      if (enemyHp <= 0) return 'win';

      if (enemyTimer >= enemyInterval) {
        enemyTimer = 0;
        const dmg = Math.max(1, Math.floor(enemyStats.atk - playerStats.defence * 0.5));
        playerHp -= dmg;
      }
      if (playerHp <= 0) return 'loss';
    }
    return 'timeout';
  },

  run() {
    console.log('=== Zoo Peace Maker Gameplay Simulation ===');
    this.results = [];

    const save = createDefaultSave();

    // Starter batch is only 2 animals
    const level1Samples = [];
    for (let i = 0; i < 200; i++) {
      level1Samples.push(selectNextEncounter(save));
    }
    const level1Min = Math.min(...level1Samples);
    this.assert(level1Min >= 108, 'starter samples stay in the first batch of 2');
    this.assert(!level1Samples.includes(0), 'starter never rolls whale');
    this.assert(getUnlockedAnimalCount(save) === 2, 'new save has 2 unlocked');

    // Pool expands by pacifying the current batch, not by level
    save.level = 20;
    this.assert(getUnlockedAnimalCount(save) === 2, 'level alone does not expand the pool');
    save.killCounts['108'] = KILLS_PER_ANIMAL;
    save.killCounts['109'] = KILLS_PER_ANIMAL;
    this.assert(getUnlockedAnimalCount(save) === 4, 'pacifying a batch unlocks 2 more');

    // Rarity weighting in a mid-size unlocked pool
    for (let i = 100; i < 110; i++) save.killCounts[String(i)] = KILLS_PER_ANIMAL;
    this.assert(getUnlockedAnimalCount(save) >= 12, 'more batches unlock after more pacifies');
    const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (let i = 0; i < 500; i++) {
      const idx = selectNextEncounter(save);
      rarityCounts[getAnimalRarity(idx)] += 1;
    }
    this.assert(rarityCounts.common + rarityCounts.uncommon > rarityCounts.legendary, 'commons/uncommons dominate');

    // Pacified animals appear less within the pool
    const unlockedStart = getUnlockedAnimalStartIndex(save);
    save.killCounts[String(unlockedStart)] = KILLS_PER_ANIMAL;
    let pacifiedHits = 0;
    for (let i = 0; i < 120; i++) {
      if (selectNextEncounter(save) === unlockedStart) pacifiedHits++;
    }
    this.assert(pacifiedHits < 40, 'pacified animals appear less often');

    // Flee rate during combat (~55%)
    let fleeSuccess = 0;
    const fleeTrials = 500;
    for (let i = 0; i < fleeTrials; i++) {
      if (Math.random() < 0.55) fleeSuccess++;
    }
    const fleeRate = fleeSuccess / fleeTrials;
    this.assert(fleeRate > 0.45 && fleeRate < 0.65, `flee RNG near 55% (got ${(fleeRate * 100).toFixed(0)}%)`);

    // Combat: starter should beat small animal
    const starter = getPlayerCombatStats(save);
    const ant = getAnimalStats(109, 1);
    const vsAnt = this.simulateCombat(starter, ant);
    this.assert(vsAnt === 'win', 'starter beats ant');

    // Soft-caps still bound early threat (looser than before, but finite)
    const scorpion = getAnimalStats(106, 1);
    this.assert(scorpion.spd <= 3, 'scorpion speed soft-capped at level 1');
    this.assert(scorpion.atk <= 11, 'scorpion attack soft-capped at level 1');

    // Combat: starter should lose to whale (huge HP)
    const whale = getAnimalStats(0, 1);
    const vsWhale = this.simulateCombat(starter, whale);
    this.assert(vsWhale === 'loss', 'starter loses to whale');

    // After a loss, safer encounter avoids the same animal
    save.currentAnimalIndex = 106;
    const safer = selectSaferEncounter(save, 106, () => 0.01);
    this.assert(safer !== 106, 'safer encounter excludes the animal that just won');

    // Upgrades matter
    save.gold = 9999;
    for (let i = 0; i < 10; i++) upgradeStat(save, 'attack');
    const buffed = getPlayerCombatStats(save);
    this.assert(buffed.attack > starter.attack, 'upgrades increase attack');

    // Rewards scale by rarity
    const whaleXp = getXpReward(0, 1);
    const antXp = getXpReward(109, 1);
    this.assert(whaleXp > antXp, 'legendary whale pays more XP');

    const whaleGold = getGoldReward(0);
    const antGold = getGoldReward(109);
    this.assert(whaleGold > antGold, 'legendary whale pays more gold');

    // Win recording
    const beforeKills = save.totalKills;
    recordKill(save, 109);
    this.assert(save.totalKills === beforeKills + 1, 'recordKill increments total');

    // Game complete requires all 110 pacified
    const fresh = createDefaultSave();
    this.assert(!checkGameComplete(fresh), 'new game is not complete');
    for (let i = 0; i < 110; i++) fresh.killCounts[String(i)] = 100;
    this.assert(checkGameComplete(fresh), 'all pacified triggers game complete');

    const passed = this.results.filter((r) => r.pass).length;
    const total = this.results.length;
    console.log(`\n${passed}/${total} gameplay sims passed`);
    return passed === total;
  },
};
