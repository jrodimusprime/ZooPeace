const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let save = null;

  function init(gameSave) {
    save = gameSave;
    bindEvents();
  }

  function bindEvents() {
    $('#btn-begin')?.addEventListener('click', onBegin);
    $('#btn-engage')?.addEventListener('click', () => Combat.engage());
    $('#btn-strike')?.addEventListener('click', () => Combat.tapStrike());
    $('#btn-continue')?.addEventListener('click', hideVictoryModal);
    $('#btn-defeat-ok')?.addEventListener('click', hideDefeatModal);

    $$('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    $$('.upgrade-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (upgradeStat(save, btn.dataset.stat)) {
          writeSave(save);
          renderStats();
          renderFightHeader();
        }
      });
    });

    $$('.free-point-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (spendFreePoint(save, btn.dataset.stat)) {
          writeSave(save);
          renderStats();
          renderFightHeader();
        }
      });
    });

    $('#btn-buy-treat')?.addEventListener('click', () => {
      if (buyTreat(save)) {
        writeSave(save);
        renderStats();
      }
    });

    $$('.ability-btn').forEach((btn) => {
      btn.addEventListener('click', () => Combat.useAbility(btn.dataset.ability));
    });

    $('#btn-reset')?.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        save = resetSave();
        showOnboarding();
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
  }

  function hideOnboarding() {
    $('#onboarding').classList.add('hidden');
    $('#game').classList.remove('hidden');
  }

  function switchTab(tabId) {
    $$('.screen').forEach((s) => s.classList.add('hidden'));
    $(`#screen-${tabId}`)?.classList.remove('hidden');
    $$('.nav-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabId));
    if (tabId === 'stats') renderStats();
    if (tabId === 'map') renderMap();
    if (tabId === 'fight') renderFight();
  }

  function startGame() {
    tickPassiveXp(save);
    renderAll();
    Combat.startCombat(save, {
      onUpdate: updateCombatUI,
      onVictory: handleVictory,
      onDefeat: handleDefeat,
    });
    switchTab('fight');
  }

  function renderAll() {
    renderFightHeader();
    renderFight();
    renderStats();
    renderMap();
  }

  function renderFightHeader() {
    const stats = getPlayerCombatStats(save);
    $('#header-name').textContent = `${save.avatar} ${save.playerName}`;
    $('#header-level').textContent = `Lv. ${save.level}`;
    $('#header-title').textContent = getPlayerTitle(save);
    $('#header-gold').textContent = `🪙 ${save.gold}`;
    $('#header-hp-text').textContent = `${stats.maxHp}`;
    $('#player-xp-bar').style.width = `${(save.xp / xpForLevel(save.level)) * 100}%`;
    $('#player-xp-text').textContent = `${save.xp} / ${xpForLevel(save.level)} XP`;
  }

  function renderFight() {
    const idx = save.currentAnimalIndex;
    const animal = ANIMALS[idx];
    const kills = getKillCount(save, idx);
    const stats = getAnimalStats(idx);

    $('#enemy-emoji').textContent = animal.emoji;
    $('#enemy-name').textContent = animal.name;
    $('#enemy-tier').textContent = TIER_NAMES[animal.tier];
    $('#kill-count').textContent = `${kills} / ${KILLS_PER_ANIMAL}`;
    $('#kill-bar').style.width = `${(kills / KILLS_PER_ANIMAL) * 100}%`;

    if (stats) {
      $('#enemy-hp-bar').style.width = '100%';
      $('#enemy-hp-text').textContent = `${stats.maxHp} HP`;
    }

    const playerStats = getPlayerCombatStats(save);
    $('#fight-atk').textContent = playerStats.attack;
    $('#fight-def').textContent = playerStats.defence;
    $('#fight-spd').textContent = playerStats.speed.toFixed(1);

    renderAbilities();
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
      btn.className = 'ability-btn';
      btn.dataset.ability = id;
      btn.textContent = `${meta.emoji} ${meta.label}`;
      container.appendChild(btn);
      btn.addEventListener('click', () => Combat.useAbility(id));
    }
  }

  function updateCombatUI(combatState) {
    $('#player-hp-bar').style.width = `${(combatState.playerHp / combatState.playerMaxHp) * 100}%`;
    $('#player-hp-text').textContent = `${Math.ceil(combatState.playerHp)} / ${combatState.playerMaxHp}`;

    $('#enemy-hp-bar').style.width = `${(combatState.enemyHp / combatState.enemyMaxHp) * 100}%`;
    $('#enemy-hp-text').textContent = `${Math.ceil(combatState.enemyHp)} / ${combatState.enemyMaxHp}`;

    const engageBtn = $('#btn-engage');
    const strikeBtn = $('#btn-strike');
    if (combatState.fighting) {
      engageBtn.classList.add('hidden');
      strikeBtn.classList.remove('hidden');
      $('#enemy-emoji').classList.add('shake');
    } else if (!combatState.engaged) {
      engageBtn.classList.remove('hidden');
      strikeBtn.classList.add('hidden');
      $('#enemy-emoji').classList.remove('shake');
    } else {
      engageBtn.classList.remove('hidden');
      strikeBtn.classList.add('hidden');
      $('#enemy-emoji').classList.remove('shake');
    }

    if (combatState.shieldActive) {
      $('#shield-indicator').classList.remove('hidden');
    } else {
      $('#shield-indicator').classList.add('hidden');
    }
  }

  function handleVictory() {
    const idx = save.currentAnimalIndex;
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

    const streakBonus = save.winStreak >= 10 ? Math.floor(goldGain * 0.2) : 0;
    save.gold += streakBonus;

    if (canProgress()) advanceAnimal();
    checkGameComplete(save);
    writeSave(save);

    $('#victory-message').textContent = 'One Step Closer to Peace';
    $('#victory-xp').textContent = `+${xpGain} XP`;
    $('#victory-gold').textContent = `+${goldGain + streakBonus} Gold`;
    $('#victory-kills').textContent = `${ANIMALS[idx].emoji} ${ANIMALS[idx].name}: ${killNum} / ${KILLS_PER_ANIMAL}`;

    if (killNum === KILLS_PER_ANIMAL && idx < ANIMALS.length - 1) {
      $('#victory-unlock').textContent = `Unlocked: ${ANIMALS[idx + 1].emoji} ${ANIMALS[idx + 1].name}!`;
      $('#victory-unlock').classList.remove('hidden');
    } else {
      $('#victory-unlock').classList.add('hidden');
    }

    if (save.gameComplete) {
      $('#victory-message').textContent = 'Zoo Peace Achieved!';
    }

    $('#victory-modal').classList.remove('hidden');
    renderFightHeader();
  }

  function hideVictoryModal() {
    $('#victory-modal').classList.add('hidden');
    if (save.gameComplete) {
      $('#finale-overlay').classList.remove('hidden');
    }
    Combat.resetEnemy();
    renderFight();
  }

  function handleDefeat() {
    $('#defeat-modal').classList.remove('hidden');
  }

  function hideDefeatModal() {
    $('#defeat-modal').classList.add('hidden');
    setTimeout(() => Combat.resetEnemy(), 500);
  }

  function renderStats() {
    $('#stats-level').textContent = save.level;
    $('#stats-xp').textContent = `${save.xp} / ${xpForLevel(save.level)}`;
    $('#stats-xp-bar').style.width = `${(save.xp / xpForLevel(save.level)) * 100}%`;
    $('#stats-gold').textContent = save.gold;
    $('#stats-kills').textContent = save.totalKills;
    $('#free-points').textContent = save.freeStatPoints;

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
    $('#overall-progress').textContent = `${progress.pacified} / ${progress.total} animals pacified`;
    $('#overall-kills').textContent = `${progress.kills} / ${progress.target} total defeats`;
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

  return { init, boot, getSave: () => save, setSave: (s) => { save = s; } };
})();
