const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let save = null;
  let eventsBound = false;

  function init(gameSave) {
    save = gameSave;
    bindEvents();
  }

  function onPress(el, handler) {
    if (!el) return;
    const run = (event) => {
      event.preventDefault();
      handler(event);
    };
    el.addEventListener('click', run);
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;

    onPress($('#btn-begin'), onBegin);
    onPress($('#btn-engage'), () => {
      if (!Combat.isActive()) ensureCombat();
      Combat.engage();
      showTaunt();
    });
    onPress($('#btn-strike'), () => {
      Combat.tapStrike();
      showTaunt();
    });
    onPress($('#btn-run'), () => {
      if (!Combat.isActive()) ensureCombat();
      Combat.flee();
    });
    onPress($('#btn-continue'), hideVictoryModal);
    onPress($('#btn-defeat-ok'), hideDefeatModal);

    $$('.nav-tab').forEach((tab) => {
      onPress(tab, () => switchTab(tab.dataset.tab));
    });

    $$('.upgrade-btn').forEach((btn) => {
      onPress(btn, () => {
        if (upgradeStat(save, btn.dataset.stat)) {
          writeSave(save);
          renderStats();
          renderFightHeader();
          if (Combat.isActive()) Combat.resetEnemy();
        }
      });
    });

    $$('.free-point-btn').forEach((btn) => {
      onPress(btn, () => {
        if (spendFreePoint(save, btn.dataset.stat)) {
          writeSave(save);
          renderStats();
          renderFightHeader();
          if (Combat.isActive()) Combat.resetEnemy();
        }
      });
    });

    onPress($('#btn-buy-treat'), () => {
      if (buyTreat(save)) {
        writeSave(save);
        renderStats();
      }
    });

    onPress($('#btn-reset'), () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        Combat.stopCombat();
        save = resetSave();
        showOnboarding();
        $('#command-panel')?.classList.add('hidden');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && save) {
        const passive = tickPassiveXp(save);
        if (passive > 0) {
          writeSave(save);
          renderFightHeader();
        }
      }
    });
  }

  function setCommandPrompt(text) {
    const el = $('#command-prompt-text');
    if (el) el.textContent = text;
  }

  function showTaunt() {
    if (!save) return;
    const taunt = getRandomTaunt(save.currentAnimalIndex);
    setCommandPrompt(taunt);
    const status = $('#encounter-status');
    if (status) {
      status.textContent = taunt;
      status.className = 'encounter-status taunt';
    }
  }

  function onBegin() {
    const name = $('#player-name').value.trim();
    if (!name) {
      $('#name-error').textContent = 'Please enter your name.';
      return;
    }
    save.playerName = name.slice(0, 16);
    save.avatar = document.querySelector('input[name="avatar"]:checked')?.value || '🧑';
    save.onboarded = true;
    writeSave(save);
    hideOnboarding();
    startGame();
  }

  function showOnboarding() {
    $('#onboarding').classList.remove('hidden');
    $('#game').classList.add('hidden');
    $('#command-panel')?.classList.add('hidden');
  }

  function hideOnboarding() {
    $('#onboarding').classList.add('hidden');
    $('#game').classList.remove('hidden');
  }

  function switchTab(tabId) {
    $$('.screen').forEach((s) => s.classList.add('hidden'));
    $(`#screen-${tabId}`)?.classList.remove('hidden');
    $$('.nav-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabId));

    const panel = $('#command-panel');
    if (panel) {
      panel.classList.toggle('hidden', tabId !== 'fight' || !save?.onboarded);
    }

    if (tabId === 'stats') renderStats();
    if (tabId === 'map') renderMap();
    if (tabId === 'fight') {
      renderFight();
      if (!Combat.isActive()) ensureCombat();
    }
  }

  function ensureCombat() {
    if (!save) return;
    Combat.startCombat(save, {
      onUpdate: updateCombatUI,
      onVictory: handleVictory,
      onDefeat: handleDefeat,
      onFlee: handleFlee,
    });
  }

  function startGame() {
    tickPassiveXp(save);
    if (!save.encounterInitialized || save.currentAnimalIndex == null || !ANIMALS[save.currentAnimalIndex]) {
      save.currentAnimalIndex = selectNextEncounter(save);
      save.encounterInitialized = true;
      writeSave(save);
    }

    // Start combat BEFORE rendering so buttons always have an active battle state.
    ensureCombat();
    renderAll();
    switchTab('fight');
    setCommandPrompt(`A wild ${ANIMALS[save.currentAnimalIndex].name} appears!`);
  }

  function renderAll() {
    renderFightHeader();
    renderFight();
    renderStats();
    renderMap();
  }

  function renderFightHeader() {
    const nameEl = $('#header-name');
    if (!nameEl) return;
    nameEl.textContent = `${save.avatar} ${save.playerName}`;
    $('#header-level').textContent = `Lv. ${save.level}`;
    $('#header-title').textContent = getPlayerTitle(save);
    $('#header-gold').textContent = `🪙 ${save.gold}`;
    const needed = xpForLevel(save.level);
    $('#player-xp-bar').style.width = `${Math.min(100, (save.xp / needed) * 100)}%`;
    $('#player-xp-text').textContent = `${save.xp} / ${needed} XP`;
  }

  function renderFight() {
    const idx = save.currentAnimalIndex;
    const animal = ANIMALS[idx];
    if (!animal) return;

    const kills = getKillCount(save, idx);
    const stats = getAnimalStats(idx);
    const rarity = getAnimalRarity(idx);

    setText('#enemy-emoji', animal.emoji);
    setText('#enemy-name', animal.name);
    setText('#enemy-tier', TIER_NAMES[animal.tier]);

    const rarityEl = $('#enemy-rarity');
    if (rarityEl) {
      rarityEl.textContent = RARITY_CONFIG[rarity].label;
      rarityEl.className = `rarity rarity-${rarity}`;
    }

    setText('#kill-count', `${kills} / ${KILLS_PER_ANIMAL}`);
    const killBar = $('#kill-bar');
    if (killBar) killBar.style.width = `${(kills / KILLS_PER_ANIMAL) * 100}%`;

    if (stats) {
      const enemyBar = $('#enemy-hp-bar');
      if (enemyBar) enemyBar.style.width = '100%';
      setText('#enemy-hp-text', `${stats.maxHp} / ${stats.maxHp}`);
    }

    const playerStats = getPlayerCombatStats(save);
    setText('#fight-atk', playerStats.attack);
    setText('#fight-def', playerStats.defence);
    setText('#fight-spd', playerStats.speed.toFixed(1));

    renderAbilities();
  }

  function setText(sel, value) {
    const el = $(sel);
    if (el) el.textContent = value;
  }

  function renderAbilities() {
    const container = $('#abilities');
    if (!container) return;
    container.innerHTML = '';
    const abilityMeta = {
      calmStrike: { label: 'Calm Strike', emoji: '✨' },
      shieldBreath: { label: 'Shield', emoji: '🛡️' },
      peaceTreaty: { label: 'Treaty', emoji: '🕊️' },
    };
    for (const id of save.unlockedAbilities) {
      const meta = abilityMeta[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ability-btn';
      btn.dataset.ability = id;
      btn.textContent = `${meta.emoji} ${meta.label}`;
      onPress(btn, () => Combat.useAbility(id));
      container.appendChild(btn);
    }
  }

  function updateCombatUI(combatState) {
    const playerBar = $('#player-hp-bar');
    const enemyBar = $('#enemy-hp-bar');
    if (playerBar) {
      playerBar.style.width = `${(combatState.playerHp / combatState.playerMaxHp) * 100}%`;
    }
    setText('#player-hp-text', `${Math.ceil(combatState.playerHp)} / ${combatState.playerMaxHp}`);

    if (enemyBar) {
      enemyBar.style.width = `${(combatState.enemyHp / combatState.enemyMaxHp) * 100}%`;
    }
    setText('#enemy-hp-text', `${Math.ceil(combatState.enemyHp)} / ${combatState.enemyMaxHp}`);

    const engageBtn = $('#btn-engage');
    const strikeBtn = $('#btn-strike');
    const runBtn = $('#btn-run');

    if (combatState.fighting) {
      engageBtn?.classList.add('hidden');
      strikeBtn?.classList.remove('hidden');
      $('#enemy-emoji')?.classList.add('shake');
      if (runBtn) runBtn.disabled = false;
    } else {
      engageBtn?.classList.remove('hidden');
      strikeBtn?.classList.add('hidden');
      $('#enemy-emoji')?.classList.remove('shake');
      if (runBtn) runBtn.disabled = false;
    }

    const shield = $('#shield-indicator');
    if (shield) shield.classList.toggle('hidden', !combatState.shieldActive);
  }

  function handleVictory() {
    const idx = save.currentAnimalIndex;
    const unlockedBefore = getUnlockedAnimalCount(save);
    const killNum = recordKill(save, idx);
    const xp = getXpReward(idx, killNum);
    const gold = getGoldReward(idx);

    let xpGain = xp;
    let goldGain = gold;
    if (killNum === KILLS_PER_ANIMAL) {
      xpGain = xp * 5;
      goldGain = gold * 5;
    }
    addXp(save, xpGain);
    save.gold += goldGain;
    const unlockedAfter = getUnlockedAnimalCount(save);

    const streakBonus = save.winStreak >= 10 ? Math.floor(goldGain * 0.2) : 0;
    save.gold += streakBonus;

    checkGameComplete(save);
    writeSave(save);

    setText('#victory-message', 'One Step Closer to Peace');
    setText('#victory-xp', `+${xpGain} XP`);
    setText('#victory-gold', `+${goldGain + streakBonus} Gold`);
    setText('#victory-kills', `${ANIMALS[idx].emoji} ${ANIMALS[idx].name}: ${killNum} / ${KILLS_PER_ANIMAL}`);

    const unlockEl = $('#victory-unlock');
    if (unlockEl) {
      if (unlockedAfter > unlockedBefore) {
        unlockEl.textContent = `${unlockedAfter - unlockedBefore} new animal encounters unlocked by your XP!`;
        unlockEl.classList.remove('hidden');
      } else if (killNum === KILLS_PER_ANIMAL) {
        unlockEl.textContent = `${ANIMALS[idx].emoji} ${ANIMALS[idx].name} fully pacified!`;
        unlockEl.classList.remove('hidden');
      } else {
        unlockEl.classList.add('hidden');
      }
    }

    if (save.gameComplete) {
      setText('#victory-message', 'Zoo Peace Achieved!');
    }

    $('#victory-modal')?.classList.remove('hidden');
    renderFightHeader();
  }

  function hideVictoryModal() {
    $('#victory-modal')?.classList.add('hidden');
    if (save.gameComplete) {
      $('#finale-overlay')?.classList.remove('hidden');
    }
    const previous = save.currentAnimalIndex;
    save.currentAnimalIndex = selectNextEncounter(save, previous);
    writeSave(save);
    Combat.resetEnemy();
    renderFight();
    setCommandPrompt(`A wild ${ANIMALS[save.currentAnimalIndex].name} appears!`);
  }

  function handleFlee(success) {
    const status = $('#encounter-status');
    if (!success) {
      if (status) {
        status.textContent = 'Could not escape! The animal gets a free attack.';
        status.className = 'encounter-status danger';
      }
      setCommandPrompt('Escape failed! Keep fighting!');
      return;
    }

    const previous = save.currentAnimalIndex;
    save.currentAnimalIndex = selectNextEncounter(save, previous);
    writeSave(save);
    Combat.resetEnemy();
    renderFight();
    const animal = ANIMALS[save.currentAnimalIndex];
    if (status) {
      status.textContent = `Got away safely! Next up: ${animal.emoji} ${animal.name}.`;
      status.className = 'encounter-status';
    }
    setCommandPrompt(`Got away safely! A wild ${animal.name} appears!`);
  }

  function handleDefeat() {
    $('#defeat-modal')?.classList.remove('hidden');
    setCommandPrompt('You were knocked out…');
  }

  function hideDefeatModal() {
    $('#defeat-modal')?.classList.add('hidden');
    setTimeout(() => {
      Combat.resetEnemy();
      setCommandPrompt(`A wild ${ANIMALS[save.currentAnimalIndex].name} appears!`);
    }, 500);
  }

  function renderStats() {
    setText('#stats-level', save.level);
    const needed = xpForLevel(save.level);
    setText('#stats-xp', `${save.xp} / ${needed}`);
    const xpBar = $('#stats-xp-bar');
    if (xpBar) xpBar.style.width = `${Math.min(100, (save.xp / needed) * 100)}%`;
    setText('#stats-gold', save.gold);
    setText('#stats-kills', save.totalKills);
    setText('#free-points', save.freeStatPoints);

    for (const key of Object.keys(STAT_CONFIG)) {
      const el = $(`#stat-${key}`);
      const costEl = $(`#cost-${key}`);
      if (el) {
        const lvl = save.statLevels[key];
        const val = STAT_CONFIG[key].effect(lvl);
        el.textContent = typeof val === 'number' && key === 'speed' ? val.toFixed(1) : val;
      }
      if (costEl) {
        costEl.textContent = getUpgradeCost(key, save.statLevels[key]);
      }
    }

    const progress = getOverallProgress(save);
    setText('#overall-progress', `${progress.pacified} / ${progress.total} animals pacified`);
    setText('#overall-kills', `${progress.kills} / ${progress.target} total defeats`);
  }

  function renderMap() {
    const grid = $('#map-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let currentTier = 0;
    for (let i = 0; i < ANIMALS.length; i++) {
      const animal = ANIMALS[i];
      if (animal.tier !== currentTier) {
        currentTier = animal.tier;
        const header = document.createElement('div');
        header.className = 'map-tier-header';
        header.textContent = TIER_NAMES[currentTier];
        grid.appendChild(header);
      }

      const kills = getKillCount(save, i);
      const unlocked = isAnimalUnlocked(save, i);
      const pacified = isAnimalPacified(save, i);
      const current = i === save.currentAnimalIndex;

      const cell = document.createElement('div');
      cell.className = 'map-cell';
      if (!unlocked) cell.classList.add('locked');
      if (pacified) cell.classList.add('pacified');
      if (current) cell.classList.add('current');

      cell.innerHTML = `
        <span class="map-emoji">${unlocked ? animal.emoji : '🔒'}</span>
        <span class="map-name">${unlocked ? animal.name : '???'}</span>
        <span class="map-kills">${unlocked ? `${kills}/${KILLS_PER_ANIMAL}` : ''}</span>
      `;
      grid.appendChild(cell);
    }
  }

  function boot(gameSave) {
    save = gameSave;
    if (!save.onboarded) {
      showOnboarding();
    } else {
      hideOnboarding();
      startGame();
    }
  }

  return {
    init,
    boot,
    getSave: () => save,
    setSave: (s) => { save = s; },
    ensureCombat,
    startGame,
  };
})();
