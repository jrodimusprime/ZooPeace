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
    onPress($('#btn-power'), () => {
      Combat.powerStrike();
      showTaunt();
    });
    onPress($('#btn-guard'), () => Combat.guard());
    onPress($('#btn-taunt'), () => Combat.taunt());
    onPress($('#btn-peace'), () => Combat.peaceOffer());
    onPress($('#btn-run'), () => {
      if (!Combat.isActive()) ensureCombat();
      Combat.flee();
    });
    onPress($('#btn-continue'), hideVictoryModal);
    onPress($('#btn-levelup-ok'), hideLevelUpModal);
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
        const xpResult = tickPassiveXp(save);
        if (xpResult?.xpGain) {
          writeSave(save);
          renderFightHeader();
          if (xpResult.levelsGained > 0) presentLevelUp(xpResult);
        }
      }
    });
  }

  function mergeXpResults(a, b) {
    if (!a) return b;
    if (!b) return a;
    return {
      xpGain: (a.xpGain || 0) + (b.xpGain || 0),
      levelsGained: (a.levelsGained || 0) + (b.levelsGained || 0),
      levelBefore: a.levelBefore,
      levelAfter: b.levelAfter,
      freePointsGained: (a.freePointsGained || 0) + (b.freePointsGained || 0),
      newAbilities: [...(a.newAbilities || []), ...(b.newAbilities || [])],
    };
  }

  function presentLevelUp(result) {
    if (!result || !result.levelsGained) return;

    applyStaticI18n();
    const levelsEl = $('#levelup-levels');
    const multiEl = $('#levelup-multi');
    const pointsEl = $('#levelup-points');
    const abilityEl = $('#levelup-ability');

    if (levelsEl) levelsEl.textContent = `Lv. ${result.levelAfter}`;
    if (multiEl) {
      if (result.levelsGained > 1) {
        multiEl.textContent = t('levelUpMulti', { n: result.levelsGained });
        multiEl.classList.remove('hidden');
      } else {
        multiEl.classList.add('hidden');
      }
    }
    if (pointsEl) {
      const n = result.freePointsGained || result.levelsGained;
      pointsEl.textContent = n === 1
        ? t('levelUpPoints', { n })
        : t('levelUpPointsPlural', { n });
    }
    if (abilityEl) {
      if (result.newAbilities?.length) {
        const names = result.newAbilities.map((id) => {
          const key = (typeof ABILITY_I18N_KEYS !== 'undefined' && ABILITY_I18N_KEYS[id]) || id;
          return t(key);
        });
        abilityEl.textContent = t('levelUpAbility', { name: names.join(', ') });
        abilityEl.classList.remove('hidden');
      } else {
        abilityEl.classList.add('hidden');
      }
    }

    const badge = $('#header-level');
    if (badge) {
      badge.classList.remove('level-ping');
      // restart animation
      void badge.offsetWidth;
      badge.classList.add('level-ping');
    }

    $('#levelup-modal')?.classList.remove('hidden');
  }

  function hideLevelUpModal() {
    $('#levelup-modal')?.classList.add('hidden');
    const badge = $('#header-level');
    if (badge) badge.classList.remove('level-ping');
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
    ensureChallenges(save);
    Combat.startCombat(save, {
      onUpdate: updateCombatUI,
      onVictory: handleVictory,
      onDefeat: handleDefeat,
      onFlee: handleFlee,
      onFlash: (msg) => setCommandPrompt(msg),
    });
  }

  function startGame() {
    const passiveResult = tickPassiveXp(save);
    ensureChallenges(save);
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
    if (passiveResult?.levelsGained > 0) {
      writeSave(save);
      presentLevelUp(passiveResult);
    }
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
    const stats = getAnimalStats(idx, save.level);
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
    const battleOnly = $$('.battle-only');

    if (combatState.fighting) {
      engageBtn?.classList.add('hidden');
      strikeBtn?.classList.remove('hidden');
      battleOnly.forEach((b) => b.classList.remove('hidden'));
      $('#enemy-emoji')?.classList.add('shake');
      if (runBtn) runBtn.disabled = false;
    } else {
      engageBtn?.classList.remove('hidden');
      strikeBtn?.classList.add('hidden');
      battleOnly.forEach((b) => b.classList.add('hidden'));
      $('#enemy-emoji')?.classList.remove('shake');
      if (runBtn) runBtn.disabled = false;
    }

    // Peace only when ready
    const peaceBtn = $('#btn-peace');
    if (peaceBtn) {
      peaceBtn.classList.toggle('hidden', !combatState.fighting || !combatState.peaceReady);
    }

    const guardBtn = $('#btn-guard');
    if (guardBtn) {
      guardBtn.classList.toggle('ready', combatState.fighting && combatState.guardWindow > 0);
      guardBtn.disabled = combatState.guardCooldown > 0;
    }

    const tauntBtn = $('#btn-taunt');
    if (tauntBtn) tauntBtn.disabled = !!combatState.tauntActive;

    const comboHud = $('#combo-hud');
    if (comboHud) {
      if (combatState.combo >= 2) {
        comboHud.textContent = t('comboLabel', { n: combatState.combo });
        comboHud.classList.remove('hidden');
      } else {
        comboHud.classList.add('hidden');
      }
    }

    const streakHud = $('#streak-hud');
    if (streakHud) {
      const heat = streakHeatLabel(combatState.streak || 0);
      if (heat) {
        streakHud.textContent = heat;
        streakHud.classList.remove('hidden');
      } else {
        streakHud.classList.add('hidden');
      }
    }

    const rageHud = $('#rage-hud');
    if (rageHud) {
      rageHud.textContent = t('rageLabel');
      rageHud.classList.toggle('hidden', !combatState.rage);
    }

    const quirkBadge = $('#quirk-badge');
    if (quirkBadge) {
      const label = quirkLabel(combatState.quirk);
      if (label) {
        quirkBadge.textContent = `${t('quirk_label')}: ${label}`;
        quirkBadge.classList.remove('hidden');
      } else {
        quirkBadge.classList.add('hidden');
      }
    }

    const shield = $('#shield-indicator');
    if (shield) shield.classList.toggle('hidden', !combatState.shieldActive);
  }

  function handleVictory(fightStats = {}) {
    const idx = save.currentAnimalIndex;
    const unlockedBefore = getUnlockedAnimalCount(save);
    const killNum = recordKill(save, idx);
    let xp = getXpReward(idx, killNum);
    let gold = getGoldReward(idx);

    if (killNum === KILLS_PER_ANIMAL) {
      xp *= 3;
      gold *= 3;
    }

    // Streak heat
    const mult = streakMultiplier(save.winStreak);
    xp = Math.floor(xp * mult);
    gold = Math.floor(gold * mult);

    // Combo / crit bonuses
    if ((fightStats.maxCombo || fightStats.combo || 0) >= 5) {
      xp = Math.floor(xp * 1.1);
      gold = Math.floor(gold * 1.1);
    }
    if ((fightStats.crits || 0) > 0) {
      xp += fightStats.crits * 3;
    }

    let xpResult = addXp(save, xp);
    save.gold += gold;

    bumpChallenge(save, 'daily_wins');
    const rarity = getAnimalRarity(idx);
    if (rarity === 'rare' || rarity === 'legendary') bumpChallenge(save, 'sess_rare');

    const claimed = claimReadyChallenges(save);
    if (claimed.xp || claimed.gold) {
      xpResult = mergeXpResults(xpResult, addXp(save, claimed.xp));
      save.gold += claimed.gold;
    }

    const unlockedAfter = getUnlockedAnimalCount(save);
    checkGameComplete(save);
    writeSave(save);

    const display = animalName(ANIMALS[idx].name);
    setText('#victory-message', t('oneStepCloser'));
    let xpLine = `+${xp} XP`;
    let goldLine = `+${gold} ${t('gold')}`;
    if (mult > 1) {
      xpLine += ` (${t('streakBonus')})`;
      goldLine += ` (${t('streakBonus')})`;
    }
    if (claimed.claimed?.length) {
      xpLine += ` · ${t('challengeClaimed', { xp: claimed.xp, gold: claimed.gold })}`;
    }
    if (xpResult.levelsGained) {
      xpLine += ` · ${t('levelUp')} Lv.${xpResult.levelAfter}`;
    }
    setText('#victory-xp', xpLine);
    setText('#victory-gold', goldLine);
    setText('#victory-kills', `${ANIMALS[idx].emoji} ${display}: ${killNum} / ${KILLS_PER_ANIMAL}`);

    const unlockEl = $('#victory-unlock');
    if (unlockEl) {
      if (unlockedAfter > unlockedBefore) {
        unlockEl.textContent = t('unlockedEncounters', { n: unlockedAfter - unlockedBefore });
        unlockEl.classList.remove('hidden');
      } else if (killNum === KILLS_PER_ANIMAL) {
        const batch = getBatchUnlockProgress(save);
        let msg = t('fullyPacified', { emoji: ANIMALS[idx].emoji, name: display });
        if (!batch.done && batch.remaining > 0) {
          msg += ` ${t('batchUnlockHint', { n: batch.remaining })}`;
        }
        unlockEl.textContent = msg;
        unlockEl.classList.remove('hidden');
      } else {
        unlockEl.classList.add('hidden');
      }
    }

    if (save.gameComplete) {
      setText('#victory-message', t('zooPeaceAchieved'));
    }

    renderFightHeader();
    $('#victory-modal')?.classList.remove('hidden');

    // Level-up celebration sits on top of victory — make it a big deal.
    if (xpResult.levelsGained > 0) {
      presentLevelUp(xpResult);
    }
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
    $('#btn-engage')?.classList.add('hidden');
    $('#btn-strike')?.classList.add('hidden');
    $$('.battle-only').forEach((b) => b.classList.add('hidden'));
  }

  function hideDefeatModal() {
    $('#defeat-modal')?.classList.add('hidden');
    const previous = save.currentAnimalIndex;
    // Always leave the animal that just knocked you out — stops death loops.
    save.currentAnimalIndex = selectSaferEncounter(save, previous);
    writeSave(save);
    Combat.resetEnemy();
    renderFight();
    const animal = ANIMALS[save.currentAnimalIndex];
    const display = animalName(animal.name);
    const status = $('#encounter-status');
    if (status) {
      status.textContent = t('recoveredNew', { emoji: animal.emoji, name: display });
      status.className = 'encounter-status';
    }
    setCommandPrompt(t('recoveredPrompt', { name: display }));
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
    const batch = getBatchUnlockProgress(save);
    let progressLine = t('animalsPacified', { n: progress.pacified, total: progress.total });
    if (!batch.done) {
      progressLine += ` · ${t('batchUnlockHint', { n: batch.remaining })}`;
    }
    setText('#overall-progress', progressLine);
    setText('#overall-kills', t('totalKillsProgress', { n: progress.kills, total: progress.target }));
    renderLangPickers();
    renderChallenges();
  }

  function renderChallenges() {
    const list = $('#challenges-list');
    if (!list || !save) return;
    ensureChallenges(save);
    list.innerHTML = '';
    const all = [...save.challenges.daily, ...save.challenges.session];
    for (const c of all) {
      const row = document.createElement('div');
      row.className = 'challenge-row' + (c.claimed || c.progress >= c.target ? ' done' : '');
      const pct = Math.min(100, Math.floor((c.progress / c.target) * 100));
      row.innerHTML = `
        <div>${t(c.key)} — ${c.progress}/${c.target}${c.claimed ? ' ✓' : ''}</div>
        <div class="challenge-bar"><span style="width:${pct}%"></span></div>
      `;
      list.appendChild(row);
    }
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
