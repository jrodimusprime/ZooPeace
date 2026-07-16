/**
 * Zoo Peace Maker — browser test harness
 * Open index.html?test=1 in browser console, or run: node js/test-runner.js (logic-only)
 */
const TestRunner = {
  results: [],

  assert(condition, name) {
    this.results.push({ name, pass: !!condition });
    if (!condition) console.error(`FAIL: ${name}`);
    else console.log(`PASS: ${name}`);
  },

  runLogicTests() {
    console.log('=== Zoo Peace Maker Logic Tests ===');

    this.assert(ANIMALS.length === 110, '110 animals defined');
    this.assert(KILLS_PER_ANIMAL === 100, '100 kills per animal');

    const save = createDefaultSave();
    this.assert(save.currentAnimalIndex === 0, 'starts at animal 0');
    this.assert(isAnimalUnlocked(save, 0), 'first animal unlocked');
    this.assert(!isAnimalUnlocked(save, 1), 'second animal locked');

    for (let i = 0; i < 100; i++) recordKill(save, 0);
    this.assert(isAnimalUnlocked(save, 1), 'second animal unlocks after 100 kills');
    this.assert(canProgress(save), 'can progress after 100 kills');

    advanceAnimal(save);
    this.assert(save.currentAnimalIndex === 1, 'advances to next animal');

    const whale = getAnimalStats(0);
    this.assert(whale.hp > 0 && whale.atk > 0, 'animal stats computed');

    const xp1 = getXpReward(0, 1);
    const xp50 = getXpReward(0, 50);
    this.assert(xp50 > xp1, 'XP scales with kill count');

    const cost1 = getUpgradeCost('attack', 1);
    const cost10 = getUpgradeCost('attack', 10);
    this.assert(cost10 > cost1, 'upgrade costs scale');

    save.gold = 1000;
    const before = save.statLevels.attack;
    upgradeStat(save, 'attack');
    this.assert(save.statLevels.attack === before + 1, 'upgrade increases stat level');

    addXp(save, 10000);
    this.assert(save.level > 1, 'XP adds levels');
    this.assert(save.unlockedAbilities.includes('calmStrike'), 'Calm Strike unlocks at level 5');

    const progress = getOverallProgress(save);
    this.assert(progress.target === 11000, 'total target is 11000 kills');

    const passed = this.results.filter((r) => r.pass).length;
    const total = this.results.length;
    console.log(`\n${passed}/${total} tests passed`);
    return passed === total;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestRunner;
}
