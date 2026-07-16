/**
 * DOM smoke tests for FIGHT / RUN buttons.
 * Open: index.html?smoke=1
 */
const ButtonSmoke = {
  results: [],

  assert(condition, name) {
    this.results.push({ name, pass: !!condition });
    const line = `${condition ? 'PASS' : 'FAIL'}: ${name}`;
    if (condition) console.log(line);
    else console.error(line);
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async run() {
    console.log('=== Zoo Peace Maker Button Smoke Tests ===');
    this.results = [];

    localStorage.removeItem('zoo_peace_save');

    const nameInput = document.getElementById('player-name');
    const beginBtn = document.getElementById('btn-begin');
    this.assert(!!nameInput && !!beginBtn, 'onboarding controls exist');

    nameInput.value = 'Tester';
    beginBtn.click();
    await this.sleep(100);

    const game = document.getElementById('game');
    const panel = document.getElementById('command-panel');
    const engage = document.getElementById('btn-engage');
    const run = document.getElementById('btn-run');
    const strike = document.getElementById('btn-strike');

    this.assert(!game.classList.contains('hidden'), 'game screen visible after begin');
    this.assert(!panel.classList.contains('hidden'), 'command panel visible on fight tab');
    this.assert(!!engage && !engage.classList.contains('hidden'), 'FIGHT button visible');
    this.assert(!!run && !run.classList.contains('hidden'), 'RUN button visible');
    this.assert(Combat.isActive(), 'combat state active after start');

    const beforeAnimal = UI.getSave().currentAnimalIndex;
    const beforeName = document.getElementById('enemy-name').textContent;

    run.click();
    await this.sleep(150);

    const afterRun = UI.getSave().currentAnimalIndex;
    const afterName = document.getElementById('enemy-name').textContent;
    this.assert(afterRun !== beforeAnimal || afterName !== beforeName, 'RUN before fight changes encounter');
    this.assert(Combat.isActive(), 'combat still active after RUN');
    this.assert(!engage.classList.contains('hidden'), 'FIGHT still available after RUN');

    const hpBeforeNum = parseInt(document.getElementById('enemy-hp-text').textContent, 10);
    engage.click();
    await this.sleep(800);

    this.assert(engage.classList.contains('hidden'), 'FIGHT hides after engage');
    this.assert(!strike.classList.contains('hidden'), 'STRIKE appears after engage');

    const victoryVisible = !document.getElementById('victory-modal').classList.contains('hidden');
    const hpAfterNum = parseInt(document.getElementById('enemy-hp-text').textContent, 10);
    this.assert(victoryVisible || hpAfterNum < hpBeforeNum, 'enemy takes damage or fight already won');

    // Flee during combat should either succeed (new animal) or fail (status danger)
    const midAnimal = UI.getSave().currentAnimalIndex;
    run.click();
    await this.sleep(200);
    const status = document.getElementById('encounter-status').textContent;
    const fledOrFailed =
      UI.getSave().currentAnimalIndex !== midAnimal ||
      /escape|escap|逃|भाग/i.test(status);
    this.assert(fledOrFailed, 'RUN during combat either escapes or fails with message');

    // Taunts + i18n
    this.assert(typeof getRandomTaunt === 'function', 'taunt helper loaded');
    this.assert(getAnimalTaunts(109).length === 10, 'each animal has 10 taunts');
    this.assert(getAnimalTaunts(0).length === 10, 'whale has 10 taunts');
    const t1 = getRandomTaunt(109);
    this.assert(typeof t1 === 'string' && t1.length > 5, 'random taunt returns text');

    setLanguage('zh');
    this.assert(animalName('Ant') === '蚂蚁', 'Chinese animal name for Ant');
    this.assert(t('fight') === '战斗', 'Chinese FIGHT label');
    setLanguage('es');
    this.assert(animalName('Whale') === 'Ballena', 'Spanish animal name for Whale');
    setLanguage('hi');
    this.assert(animalName('Lion') === 'शेर', 'Hindi animal name for Lion');
    setLanguage('en');

    // Soft-cap: level-1 scorpion should not melt players
    const scorp = getAnimalStats(106, 1);
    this.assert(scorp.spd <= 2 && scorp.atk <= 8, 'level-1 scorpion is soft-capped');

    const passed = this.results.filter((r) => r.pass).length;
    const total = this.results.length;
    const summary = `${passed}/${total} button smoke tests passed`;
    console.log(`\n${summary}`);
    document.title = summary;
    const banner = document.createElement('div');
    banner.id = 'smoke-results';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px;background:#111;color:#fff;font:14px monospace;';
    banner.textContent = summary + (passed === total ? ' ✅' : ' ❌');
    document.body.appendChild(banner);
    return passed === total;
  },
};
