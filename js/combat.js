const Combat = (() => {
  let state = null;
  let tickInterval = null;
  let onUpdate = null;
  let onVictory = null;
  let onDefeat = null;
  let onFlee = null;
  let onFlash = null;

  let tapBoostActive = false;
  let tapBoostCooldown = 0;
  let abilityCooldowns = { calmStrike: 0, shieldBreath: 0, peaceTreaty: 0 };
  let shieldActive = false;
  let shieldTimer = 0;
  let engaged = false;
  let defeatHandled = false;
  let victoryHandled = false;

  // Fun combat state
  let combo = 0;
  let quirk = { id: 'none', armoredHits: 0 };
  let tauntActive = false;
  let powerVulnerable = false;
  let skipNextAuto = false;
  let guardWindow = 0;
  let guardCooldown = 0;
  let peaceUsed = false;
  let fightStats = { crits: 0, maxCombo: 0, parries: 0, powerUsed: false, tookDamage: false };
  let lastFlash = '';

  const TICK_MS = 200;
  const CRIT_CHANCE = 0.12;
  /** Higher = slower auto-attacks. Stretches fights so buttons matter. */
  const PLAYER_ATTACK_PACE = 2.05;
  const STRIKE_COOLDOWN = 1.45;
  const STRIKE_MULT = 1.12;
  const POWER_MULT = 2.0;

  function variance(value) {
    const v = value * (0.9 + Math.random() * 0.2);
    return Math.max(1, Math.floor(v));
  }

  function calcDamage(atk, def) {
    // Defence matters more — fights last longer and punish low DEF.
    const raw = atk - def * 0.7;
    return variance(Math.max(1, raw));
  }

  function animalForSave(save) {
    return getAnimalStats(save.currentAnimalIndex, save.level);
  }

  function flash(msg) {
    lastFlash = msg;
    if (onFlash) onFlash(msg);
  }

  function inRage() {
    return state && state.playerHp > 0 && state.playerHp / state.playerMaxHp <= 0.25;
  }

  function resetFightToys() {
    combo = 0;
    quirk = rollQuirk();
    tauntActive = false;
    powerVulnerable = false;
    skipNextAuto = false;
    guardWindow = 0;
    guardCooldown = 0;
    peaceUsed = false;
    fightStats = { crits: 0, maxCombo: 0, parries: 0, powerUsed: false, tookDamage: false };
    lastFlash = '';
  }

  function startCombat(save, callbacks) {
    onUpdate = callbacks.onUpdate;
    onVictory = callbacks.onVictory;
    onDefeat = callbacks.onDefeat;
    onFlee = callbacks.onFlee;
    onFlash = callbacks.onFlash || null;

    ensureChallenges(save);
    const playerStats = getPlayerCombatStats(save);
    const animalData = animalForSave(save);

    state = {
      save,
      playerHp: playerStats.maxHp,
      playerMaxHp: playerStats.maxHp,
      playerStats,
      enemy: { ...animalData },
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      fighting: false,
    };

    abilityCooldowns = { calmStrike: 0, shieldBreath: 0, peaceTreaty: 0 };
    tapBoostActive = false;
    tapBoostCooldown = 0;
    shieldActive = false;
    shieldTimer = 0;
    engaged = false;
    defeatHandled = false;
    victoryHandled = false;
    resetFightToys();

    if (quirk.id === 'enraged') {
      state.enemy.atk = Math.floor(state.enemy.atk * 1.3);
    }
    if (quirk.id !== 'none') {
      flash(`${t('quirk_label')}: ${quirkLabel(quirk)}`);
    }

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, TICK_MS);
    notify();
  }

  function engage() {
    if (!state || defeatHandled || victoryHandled) return;
    if (state.playerHp <= 0 || state.enemy.hp <= 0) return;
    engaged = true;
    state.fighting = true;
    notify();
  }

  function stopCombat() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    state = null;
    engaged = false;
    defeatHandled = false;
    victoryHandled = false;
  }

  function tapStrike() {
    if (!state || !state.fighting || state.enemy.hp <= 0 || defeatHandled) return;
    if (tapBoostCooldown > 0) return;
    tapBoostActive = true;
    tapBoostCooldown = STRIKE_COOLDOWN;
    doPlayerAttack(true);
    notify();
  }

  function powerStrike() {
    if (!state || !state.fighting || defeatHandled || victoryHandled) return false;
    if (state.enemy.hp <= 0) return false;
    fightStats.powerUsed = true;
    bumpChallenge(state.save, 'daily_power');
    powerVulnerable = true;
    skipNextAuto = true;
    doPlayerAttack(false, { power: true });
    flash(t('flash_power'));
    notify();
    return true;
  }

  function guard() {
    if (!state || !state.fighting || defeatHandled || victoryHandled) return false;
    if (guardCooldown > 0) return false;

    if (guardWindow > 0) {
      // Perfect parry — cancel incoming hit window and counter
      guardWindow = 0;
      guardCooldown = 1.2;
      fightStats.parries += 1;
      bumpChallenge(state.save, 'sess_parry');
      combo += 1;
      fightStats.maxCombo = Math.max(fightStats.maxCombo, combo);
      const dmg = calcDamage(state.playerStats.attack * 1.5, effectiveEnemyDef());
      applyDamageToEnemy(dmg, false);
      flash(t('flash_parry'));
      checkVictory();
      notify();
      return true;
    }

    // Early/late guard — short shield only
    shieldActive = true;
    shieldTimer = 0.6;
    guardCooldown = 1.5;
    flash(t('flash_guard_weak'));
    notify();
    return true;
  }

  function taunt() {
    if (!state || !state.fighting || defeatHandled || victoryHandled || tauntActive) return false;
    tauntActive = true;
    state.enemy.atk = Math.floor(state.enemy.atk * 1.4);
    state.enemy.def = Math.max(0, Math.floor(state.enemy.def * 0.6));
    flash(t('flash_taunt'));
    notify();
    return true;
  }

  function peaceOffer() {
    if (!state || !state.fighting || defeatHandled || victoryHandled || peaceUsed) return false;
    if (state.enemy.hp / state.enemy.maxHp > 0.3) return false;
    peaceUsed = true;

    if (Math.random() < 0.35) {
      state.enemy.hp = 0;
      flash(t('flash_peace_yes'));
      checkVictory();
    } else {
      state.enemy.hp = Math.min(state.enemy.maxHp, Math.floor(state.enemy.hp + state.enemy.maxHp * 0.25));
      flash(t('flash_peace_no'));
      doEnemyAttack({ forced: true });
    }
    notify();
    return true;
  }

  function flee() {
    if (!state || state.enemy.hp <= 0 || state.playerHp <= 0 || defeatHandled) return false;
    const success = !state.fighting || Math.random() < 0.55;
    if (success) {
      state.fighting = false;
      engaged = false;
    } else {
      doEnemyAttack({ forced: true });
      if (defeatHandled) {
        notify();
        return false;
      }
    }
    if (onFlee) onFlee(success);
    notify();
    return success;
  }

  function useAbility(abilityId) {
    if (!state || !state.fighting || defeatHandled) return false;
    if (!state.save.unlockedAbilities.includes(abilityId)) return false;
    if (abilityCooldowns[abilityId] > 0) return false;

    if (abilityId === 'calmStrike') {
      const dmg = calcDamage(state.playerStats.attack * 2, effectiveEnemyDef());
      applyDamageToEnemy(dmg, false);
      abilityCooldowns.calmStrike = 150;
      checkVictory();
    } else if (abilityId === 'shieldBreath') {
      shieldActive = true;
      shieldTimer = 15;
      abilityCooldowns.shieldBreath = 300;
    } else if (abilityId === 'peaceTreaty') {
      if (state.enemy.hp / state.enemy.maxHp < 0.15) {
        state.enemy.hp = 0;
        checkVictory();
      }
      abilityCooldowns.peaceTreaty = 600;
    }
    notify();
    return true;
  }

  function effectiveEnemyDef() {
    return state.enemy.def;
  }

  function tick() {
    if (!state) return;
    const dt = TICK_MS / 1000;

    if (tapBoostCooldown > 0) tapBoostCooldown -= dt;
    if (guardCooldown > 0) guardCooldown -= dt;
    if (guardWindow > 0) guardWindow -= dt;
    for (const key of Object.keys(abilityCooldowns)) {
      if (abilityCooldowns[key] > 0) abilityCooldowns[key] -= dt;
    }
    if (shieldTimer > 0) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) shieldActive = false;
    }

    // Poison quirk ticks while fighting
    if (state.fighting && quirk.id === 'poison' && !defeatHandled && !victoryHandled) {
      quirk.poisonTick = (quirk.poisonTick || 0) + dt;
      if (quirk.poisonTick >= 1) {
        quirk.poisonTick = 0;
        state.playerHp = Math.max(0, state.playerHp - 2);
        fightStats.tookDamage = true;
        if (state.playerHp <= 0) handlePlayerDeath();
      }
    }

    if (!state.fighting || state.enemy.hp <= 0 || state.playerHp <= 0 || defeatHandled || victoryHandled) {
      notify();
      return;
    }

    let enemySpd = Math.max(0.5, state.enemy.spd);
    if (tauntActive) enemySpd *= 1.15;
    const playerInterval = PLAYER_ATTACK_PACE / Math.max(0.5, state.playerStats.speed);
    const enemyInterval = 1 / enemySpd;

    state.playerAttackTimer += dt;
    state.enemyAttackTimer += dt;

    // Open guard window shortly before enemy hits
    if (enemyInterval - state.enemyAttackTimer <= 0.45 && enemyInterval - state.enemyAttackTimer > 0) {
      if (guardWindow <= 0) guardWindow = 0.45;
    }

    if (state.playerAttackTimer >= playerInterval) {
      state.playerAttackTimer = 0;
      if (skipNextAuto) {
        skipNextAuto = false;
      } else {
        doPlayerAttack(tapBoostActive);
        tapBoostActive = false;
      }
    }

    if (defeatHandled || victoryHandled) {
      notify();
      return;
    }

    if (state.enemyAttackTimer >= enemyInterval) {
      state.enemyAttackTimer = 0;
      guardWindow = 0;
      doEnemyAttack();
    }

    notify();
  }

  function doPlayerAttack(boosted, opts = {}) {
    if (!state || state.enemy.hp <= 0 || defeatHandled) return;

    // Skittish dodge
    if (quirk.id === 'skittish' && Math.random() < 0.15 && !opts.power) {
      flash(t('flash_dodge'));
      return;
    }

    let atk = state.playerStats.attack;
    if (boosted) atk *= STRIKE_MULT;
    if (opts.power) atk *= POWER_MULT;
    if (state.save.treatBonus > 0) atk *= 1.1;
    if (inRage()) atk *= 1.25;

    let critChance = CRIT_CHANCE + (tauntActive ? 0.1 : 0) + (inRage() ? 0.1 : 0);
    const isCrit = Math.random() < critChance;
    if (isCrit) {
      atk *= 2;
      fightStats.crits += 1;
      bumpChallenge(state.save, 'daily_crits');
    }

    let dmg = calcDamage(atk, effectiveEnemyDef());

    // Combo bonus
    if (combo > 0) {
      dmg = Math.floor(dmg * (1 + Math.min(combo, 10) * 0.08));
    }

    // Armored quirk
    if (quirk.id === 'armored' && quirk.armoredHits > 0) {
      dmg = Math.max(1, Math.floor(dmg * 0.5));
      quirk.armoredHits -= 1;
    }

    applyDamageToEnemy(dmg, isCrit);

    combo += 1;
    fightStats.maxCombo = Math.max(fightStats.maxCombo, combo);
    if (combo >= 5) bumpChallenge(state.save, 'sess_combo');

    if (isCrit) flash(t('flash_crit', { n: dmg }));
    else if (opts.power) flash(t('flash_power_hit', { n: dmg }));
    else if (combo >= 3) flash(t('flash_combo', { n: combo }));

    checkVictory();
  }

  function applyDamageToEnemy(dmg, isCrit) {
    state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
  }

  function doEnemyAttack(opts = {}) {
    if (!state || state.playerHp <= 0 || defeatHandled) return;

    // Perfect guard window already handled via guard(); if still in window and not forced, allow hit
    if (shieldActive && !opts.forced) return;

    const auraChance = state.playerStats.aura / 100;
    if (!opts.forced && Math.random() < auraChance) {
      flash(t('flash_aura'));
      return;
    }

    let atk = state.enemy.atk;
    if (powerVulnerable) {
      atk *= 1.5;
      powerVulnerable = false;
    }

    const dmg = calcDamage(atk, state.playerStats.defence);
    state.playerHp = Math.max(0, state.playerHp - dmg);
    fightStats.tookDamage = true;
    combo = 0;

    if (inRage() && state.playerHp > 0) {
      flash(t('flash_rage'));
    }

    if (state.playerHp <= 0) handlePlayerDeath();
  }

  function handlePlayerDeath() {
    state.fighting = false;
    engaged = false;
    if (!defeatHandled) {
      defeatHandled = true;
      resetWinStreak(state.save);
      writeSave(state.save);
      if (onDefeat) onDefeat();
    }
  }

  function checkVictory() {
    if (!state || state.enemy.hp > 0 || victoryHandled || defeatHandled) return;
    state.fighting = false;
    engaged = false;
    victoryHandled = true;
    if (state.save.treatBonus > 0) state.save.treatBonus -= 1;

    // Attach fight stats for reward calc
    state.lastFightStats = { ...fightStats, combo: fightStats.maxCombo, quirk: quirk.id };
    if (onVictory) onVictory(state.lastFightStats);
  }

  function notify() {
    if (!state || !onUpdate) return;
    const enemyHpPct = state.enemy.maxHp > 0 ? state.enemy.hp / state.enemy.maxHp : 0;
    onUpdate({
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      enemyHp: state.enemy.hp,
      enemyMaxHp: state.enemy.maxHp,
      fighting: state.fighting,
      engaged,
      tapBoostCooldown,
      abilityCooldowns: { ...abilityCooldowns },
      shieldActive,
      defeatHandled,
      combo,
      quirk,
      tauntActive,
      guardWindow,
      guardCooldown,
      peaceReady: state.fighting && !peaceUsed && enemyHpPct > 0 && enemyHpPct <= 0.3,
      peaceUsed,
      rage: inRage(),
      streak: state.save.winStreak || 0,
      lastFlash,
      powerVulnerable,
    });
  }

  function resetEnemy() {
    if (!state) return;
    const animalData = animalForSave(state.save);
    state.enemy = { ...animalData };
    const playerStats = getPlayerCombatStats(state.save);
    state.playerHp = playerStats.maxHp;
    state.playerMaxHp = playerStats.maxHp;
    state.playerStats = playerStats;
    state.playerAttackTimer = 0;
    state.enemyAttackTimer = 0;
    state.fighting = false;
    engaged = false;
    defeatHandled = false;
    victoryHandled = false;
    abilityCooldowns = { calmStrike: 0, shieldBreath: 0, peaceTreaty: 0 };
    tapBoostActive = false;
    tapBoostCooldown = 0;
    shieldActive = false;
    shieldTimer = 0;
    resetFightToys();
    if (quirk.id === 'enraged') {
      state.enemy.atk = Math.floor(state.enemy.atk * 1.3);
    }
    if (quirk.id !== 'none') {
      flash(`${t('quirk_label')}: ${quirkLabel(quirk)}`);
    }
    notify();
  }

  function isActive() {
    return state !== null;
  }

  function getFightStats() {
    return { ...fightStats, combo: fightStats.maxCombo, quirk: quirk.id };
  }

  return {
    startCombat,
    stopCombat,
    engage,
    tapStrike,
    powerStrike,
    guard,
    taunt,
    peaceOffer,
    flee,
    useAbility,
    resetEnemy,
    isActive,
    getFightStats,
  };
})();
