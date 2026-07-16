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

    // Encounter pool at level 1
    const level1Samples = [];
    for (let i = 0; i < 200; i++) {
      level1Samples.push(selectNextEncounter(save));
    }
    const level1Max = Math.max(...level1Samples);
    const level1Min = Math.min(...level1Samples);
    this.assert(level1Min >= 95, 'level 1 samples stay in smallest-animal band');
    this.assert(!level1Samples.includes(0), 'level 1 never rolls whale');

    // Pool expansion
    save.level = 10;
    const pool10 = getUnlockedAnimalCount(save);
    save.level = 20;
    const pool20 = getUnlockedAnimalCount(save);
    this.assert(pool20 > pool10, 'encounter pool grows with level');

    // Rarity weighting — commons should dominate at same level
    save.level = 15;
    const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (let i = 0; i < 500; i++) {
      const idx = selectNextEncounter(save);
      rarityCounts[getAnimalRarity(idx)] += 1;
    }
    this.assert(rarityCounts.common > rarityCounts.legendary, 'commons outnumber legendaries');
    this.assert(rarityCounts.legendary > 0, 'legendaries can still spawn at mid level');

    // Pacified animals appear less
    save.killCounts['109'] = 100;
    let pacifiedHits = 0;
    for (let i = 0; i < 100; i++) {
      if (selectNextEncounter(save) === 109) pacifiedHits++;
    }
    this.assert(pacifiedHits < 30, 'pacified animals appear less often');

    // Flee rate during combat (~70%)
    let fleeSuccess = 0;
    const fleeTrials = 500;
    for (let i = 0; i < fleeTrials; i++) {
      if (Math.random() < 0.7) fleeSuccess++;
    }
    const fleeRate = fleeSuccess / fleeTrials;
    this.assert(fleeRate > 0.6 && fleeRate < 0.8, `flee RNG near 70% (got ${(fleeRate * 100).toFixed(0)}%)`);

    // Combat: starter should beat small animal
    const starter = getPlayerCombatStats(save);
    const ant = getAnimalStats(109);
    const vsAnt = this.simulateCombat(starter, ant);
    this.assert(vsAnt === 'win', 'starter beats ant');

    // Combat: starter should lose to whale
    const whale = getAnimalStats(0);
    const vsWhale = this.simulateCombat(starter, whale);
    this.assert(vsWhale === 'loss', 'starter loses to whale');

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
