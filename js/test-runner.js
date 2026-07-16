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
    this.assert(save.currentAnimalIndex === ANIMALS.length - 1, 'starts among smallest animals');
    this.assert(!isAnimalUnlocked(save, 0), 'whale is locked for a new player');
    this.assert(isAnimalUnlocked(save, 109), 'small animals are unlocked first');
    this.assert(getUnlockedAnimalCount(save) === 15, 'level 1 has 15 possible encounters');

    const firstEncounter = selectNextEncounter(save, -1, () => 0.5);
    this.assert(firstEncounter >= 95, 'level 1 encounter stays in small-animal pool');

    save.level = 33;
    this.assert(isAnimalUnlocked(save, 0), 'XP level eventually unlocks whale encounters');

    const whale = getAnimalStats(0);
    this.assert(whale.hp > 0 && whale.atk > 0, 'animal stats computed');

    const xp1 = getXpReward(0, 1);
    const xp50 = getXpReward(0, 50);
    this.assert(xp50 > xp1, 'XP scales with kill count');
    this.assert(getXpReward(0, 1) > getXpReward(109, 1), 'legendary whale grants more XP');
    this.assert(getAnimalRarity(0) === 'legendary', 'whale is legendary rarity');

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
