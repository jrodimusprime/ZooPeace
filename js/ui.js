const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let save = null;
  let eventsBound = false;

  function init(gameSave) {
    save = gameSave;
    setLanguage(save.lang || 'en');
    bindEvents();
    renderLangPickers();
  }

  function onPress(el, handler) {
    if (!el) return;
    const run = (event) => {
      event.preventDefault();
      handler(event);
    };
    el.addEventListener('click', run);
  }

  function changeLanguage(lang) {
    setLanguage(lang);
    if (save) {
      save.lang = lang;
      writeSave(save);
    }
    renderLangPickers();
    updateHeaderLangChip();
    if (save?.onboarded) {
      renderAll();
      const animal = ANIMALS[save.currentAnimalIndex];
      if (animal) setCommandPrompt(t('wildAppears', { name: animalName(animal.name) }));
    }
  }

  function renderLangPickers() {
    ['#lang-picker', '#lang-picker-stats', '#lang-picker-modal'].forEach((sel) => {
      const box = $(sel);
      if (!box) return;
      box.innerHTML = '';
      Object.entries(I18N.langs).forEach(([code, meta]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lang-btn' + (I18N.current === code ? ' active' : '');
        btn.dataset.lang = code;
        btn.innerHTML = `<span class="lang-flag">${meta.flag}</span><span class="lang-name">${meta.label}</span>`;
        onPress(btn, () => {
          changeLanguage(code);
          $('#lang-modal')?.classList.add('hidden');
        });
        box.appendChild(btn);
      });
    });
  }

  function updateHeaderLangChip() {
    const chip = $('#btn-lang-header');
    if (chip) chip.textContent = I18N.langs[I18N.current]?.flag || '🌐';
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
    onPress($('#btn-lang-header'), () => $('#lang-modal')?.classList.remove('hidden'));
    onPress($('#btn-lang-close'), () => $('#lang-modal')?.classList.add('hidden'));

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
      if (confirm(t('resetConfirm'))) {
        const lang = save?.lang || I18N.current;
        Combat.stopCombat();
        save = resetSave();
        save.lang = lang;
        writeSave(save);
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
      $('#name-error').textContent = t('nameError');
      return;
    }
    save.playerName = name.slice(0, 16);
    save.avatar = document.querySelector('input[name="avatar"]:checked')?.value || '🧑';
    save.lang = I18N.current;
    save.onboarded = true;
    writeSave(save);
    hideOnboarding();
    startGame();
  }

  function showOnboarding() {
    $('#onboarding').classList.remove('hidden');
    $('#game').classList.add('hidden');
    $('#command-panel')?.classList.add('hidden');
    applyStaticI18n();
    renderLangPickers();
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

    ensureCombat();
    applyStaticI18n();
    updateHeaderLangChip();
    renderAll();
    switchTab('fight');
    setCommandPrompt(t('wildAppears', { name: animalName(ANIMALS[save.currentAnimalIndex].name) }));
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

  function rarityLabel(rarity) {
    return t(rarity);
  }

  function tierLabel(tier) {
    return t(`tier${tier}`);
  }

  function renderFight() {
    const idx = save.currentAnimalIndex;
    const animal = ANIMALS[idx];
    if (!animal) return;

    const kills = getKillCount(save, idx);
    const stats = getAnimalStats(idx);
    const rarity = getAnimalRarity(idx);

    setText('#enemy-emoji', animal.emoji);
    setText('#enemy-name', animalName(animal.name));
    setText('#enemy-tier', tierLabel(animal.tier));

    const rarityEl = $('#enemy-rarity');
    if (rarityEl) {
      rarityEl.textContent = rarityLabel(rarity);
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
      calmStrike: { labelKey: 'calmStrike', emoji: '✨' },
      shieldBreath: { labelKey: 'shield', emoji: '🛡️' },
      peaceTreaty: { labelKey: 'treaty', emoji: '🕊️' },
    };
    for (const id of save.unlockedAbilities) {
      const meta = abilityMeta[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ability-btn';
      btn.dataset.ability = id;
      btn.textContent = `${meta.emoji} ${t(meta.labelKey)}`;
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

    const display = animalName(ANIMALS[idx].name);
    setText('#victory-message', t('oneStepCloser'));
    setText('#victory-xp', `+${xpGain} XP`);
    setText('#victory-gold', `+${goldGain + streakBonus} ${t('gold')}`);
    setText('#victory-kills', `${ANIMALS[idx].emoji} ${display}: ${killNum} / ${KILLS_PER_ANIMAL}`);

    const unlockEl = $('#victory-unlock');
    if (unlockEl) {
      if (unlockedAfter > unlockedBefore) {
        unlockEl.textContent = t('unlockedEncounters', { n: unlockedAfter - unlockedBefore });
        unlockEl.classList.remove('hidden');
      } else if (killNum === KILLS_PER_ANIMAL) {
        unlockEl.textContent = t('fullyPacified', { emoji: ANIMALS[idx].emoji, name: display });
        unlockEl.classList.remove('hidden');
      } else {
        unlockEl.classList.add('hidden');
      }
    }

    if (save.gameComplete) {
      setText('#victory-message', t('zooPeaceAchieved'));
    }

    $('#victory-modal')?.classList.remove('hidden');
    renderFightHeader();
  }

  function hideVictoryModal() {
    $('#victory-modal')?.classList.add('hidden');
    if (save.gameComplete) {
      $('#finale-overlay')?.classList.remove('hidden');
      applyStaticI18n();
    }
    const previous = save.currentAnimalIndex;
    save.currentAnimalIndex = selectNextEncounter(save, previous);
    writeSave(save);
    Combat.resetEnemy();
    renderFight();
    setCommandPrompt(t('wildAppears', { name: animalName(ANIMALS[save.currentAnimalIndex].name) }));
  }

  function handleFlee(success) {
    const status = $('#encounter-status');
    if (!success) {
      if (status) {
        status.textContent = t('escapeFailed');
        status.className = 'encounter-status danger';
      }
      setCommandPrompt(t('escapeFailedPrompt'));
      return;
    }

    const previous = save.currentAnimalIndex;
    save.currentAnimalIndex = selectNextEncounter(save, previous);
    writeSave(save);
    Combat.resetEnemy();
    renderFight();
    const animal = ANIMALS[save.currentAnimalIndex];
    const display = animalName(animal.name);
    if (status) {
      status.textContent = t('gotAway', { emoji: animal.emoji, name: display });
      status.className = 'encounter-status';
    }
    setCommandPrompt(t('gotAwayPrompt', { name: display }));
  }

  function handleDefeat() {
    $('#defeat-modal')?.classList.remove('hidden');
    setCommandPrompt(t('knockedOutPrompt'));
  }

  function hideDefeatModal() {
    $('#defeat-modal')?.classList.add('hidden');
    setTimeout(() => {
      Combat.resetEnemy();
      setCommandPrompt(t('wildAppears', { name: animalName(ANIMALS[save.currentAnimalIndex].name) }));
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
    setText('#overall-progress', t('animalsPacified', { n: progress.pacified, total: progress.total }));
    setText('#overall-kills', t('totalKillsProgress', { n: progress.kills, total: progress.target }));
    renderLangPickers();
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
        header.textContent = tierLabel(currentTier);
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
        <span class="map-name">${unlocked ? animalName(animal.name) : '???'}</span>
        <span class="map-kills">${unlocked ? `${kills}/${KILLS_PER_ANIMAL}` : ''}</span>
      `;
      grid.appendChild(cell);
    }
  }

  function boot(gameSave) {
    save = gameSave;
    setLanguage(save.lang || 'en');
    updateHeaderLangChip();
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
    changeLanguage,
  };
})();
