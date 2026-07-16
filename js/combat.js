const Combat = (() => {
  let state = null;
  let tickInterval = null;
  let onUpdate = null;
  let onVictory = null;
  let onDefeat = null;
  let onFlee = null;
  let tapBoostActive = false;
  let tapBoostCooldown = 0;
  let abilityCooldowns = { calmStrike: 0, shieldBreath: 0, peaceTreaty: 0 };
  let shieldActive = false;
  let shieldTimer = 0;
  let engaged = false;

  const TICK_MS = 200;

  function variance(value) {
    const v = value * (0.9 + Math.random() * 0.2);
    return Math.max(1, Math.floor(v));
  }

  function calcDamage(atk, def) {
    const raw = atk - def * 0.5;
    return variance(Math.max(1, raw));
  }

  function startCombat(save, callbacks) {
    onUpdate = callbacks.onUpdate;
    onVictory = callbacks.onVictory;
    onDefeat = callbacks.onDefeat;
    onFlee = callbacks.onFlee;

    const playerStats = getPlayerCombatStats(save);
    const animalData = getAnimalStats(save.currentAnimalIndex);

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

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, TICK_MS);
    notify();
  }

  function engage() {
    if (!state) return;
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
  }

  function tapStrike() {
    if (!state || !state.fighting || state.enemy.hp <= 0) return;
    if (tapBoostCooldown > 0) return;
    tapBoostActive = true;
    tapBoostCooldown = 1;
    doPlayerAttack(true);
    notify();
  }

  function flee() {
    if (!state || state.enemy.hp <= 0 || state.playerHp <= 0) return false;
    const success = !state.fighting || Math.random() < 0.7;
    if (success) {
      state.fighting = false;
      engaged = false;
    } else {
      doEnemyAttack();
    }
    if (onFlee) onFlee(success);
    notify();
    return success;
  }

  function useAbility(abilityId) {
    if (!state || !state.fighting) return false;
    if (!state.save.unlockedAbilities.includes(abilityId)) return false;
    if (abilityCooldowns[abilityId] > 0) return false;

    if (abilityId === 'calmStrike') {
      const dmg = calcDamage(state.playerStats.attack * 2, state.enemy.def);
      state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
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

  function tick() {
    if (!state) return;

    const dt = TICK_MS / 1000;

    if (tapBoostCooldown > 0) tapBoostCooldown -= dt;
    for (const key of Object.keys(abilityCooldowns)) {
      if (abilityCooldowns[key] > 0) abilityCooldowns[key] -= dt;
    }
    if (shieldTimer > 0) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) shieldActive = false;
    }

    if (!state.fighting || state.enemy.hp <= 0 || state.playerHp <= 0) {
      notify();
      return;
    }

    const playerInterval = 1 / state.playerStats.speed;
    const enemyInterval = 1 / state.enemy.spd;

    state.playerAttackTimer += dt;
    state.enemyAttackTimer += dt;

    if (state.playerAttackTimer >= playerInterval) {
      state.playerAttackTimer = 0;
      doPlayerAttack(tapBoostActive);
      tapBoostActive = false;
    }

    if (state.enemyAttackTimer >= enemyInterval) {
      state.enemyAttackTimer = 0;
      doEnemyAttack();
    }

    notify();
  }

  function doPlayerAttack(boosted) {
    if (!state || state.enemy.hp <= 0) return;
    let atk = state.playerStats.attack;
    if (boosted) atk *= 1.25;
    if (state.save.treatBonus > 0) atk *= 1.1;
    const dmg = calcDamage(atk, state.enemy.def);
    state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
    checkVictory();
  }

  function doEnemyAttack() {
    if (!state || state.playerHp <= 0) return;
    if (shieldActive) return;

    const auraChance = state.playerStats.aura / 100;
    if (Math.random() < auraChance) return;

    const dmg = calcDamage(state.enemy.atk, state.playerStats.defence);
    state.playerHp = Math.max(0, state.playerHp - dmg);
    if (state.playerHp <= 0) {
      state.fighting = false;
      resetWinStreak(state.save);
      if (onDefeat) onDefeat();
    }
  }

  function checkVictory() {
    if (!state || state.enemy.hp > 0) return;
    state.fighting = false;
    if (state.save.treatBonus > 0) state.save.treatBonus -= 1;
    if (onVictory) onVictory();
  }

  function notify() {
    if (!state || !onUpdate) return;
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
    });
  }

  function resetEnemy() {
    if (!state) return;
    const animalData = getAnimalStats(state.save.currentAnimalIndex);
    state.enemy = { ...animalData };
    const playerStats = getPlayerCombatStats(state.save);
    state.playerHp = playerStats.maxHp;
    state.playerMaxHp = playerStats.maxHp;
    state.playerStats = playerStats;
    state.playerAttackTimer = 0;
    state.enemyAttackTimer = 0;
    state.fighting = false;
    engaged = false;
    notify();
  }

  function isActive() {
    return state !== null;
  }

  return {
    startCombat,
    stopCombat,
    engage,
    tapStrike,
    flee,
    useAbility,
    resetEnemy,
    isActive,
  };
})();
