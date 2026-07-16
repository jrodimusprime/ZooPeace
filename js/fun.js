/**
 * Quirks, streak heat helpers, and daily/session challenges.
 */

const QUIRK_TYPES = ['none', 'poison', 'armored', 'skittish', 'enraged'];

function rollQuirk(random = Math.random) {
  const roll = random();
  if (roll < 0.55) return { id: 'none', armoredHits: 0 };
  if (roll < 0.70) return { id: 'poison', armoredHits: 0, poisonTick: 0 };
  if (roll < 0.82) return { id: 'armored', armoredHits: 2 };
  if (roll < 0.92) return { id: 'skittish', armoredHits: 0 };
  return { id: 'enraged', armoredHits: 0 };
}

function quirkLabel(quirk) {
  if (!quirk || quirk.id === 'none') return '';
  return t(`quirk_${quirk.id}`);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureChallenges(save) {
  if (!save.challenges) {
    save.challenges = { dailyDate: '', daily: [], session: [] };
  }
  const today = todayKey();
  if (save.challenges.dailyDate !== today) {
    save.challenges.dailyDate = today;
    save.challenges.daily = pickDailyChallenges();
  }
  if (!save.challenges.session || !save.challenges.session.length) {
    save.challenges.session = pickSessionChallenges();
  }
  return save.challenges;
}

function pickDailyChallenges() {
  return [
    { id: 'daily_crits', key: 'chal_daily_crits', progress: 0, target: 3, rewardXp: 80, rewardGold: 40, claimed: false },
    { id: 'daily_wins', key: 'chal_daily_wins', progress: 0, target: 10, rewardXp: 100, rewardGold: 50, claimed: false },
    { id: 'daily_power', key: 'chal_daily_power', progress: 0, target: 2, rewardXp: 70, rewardGold: 35, claimed: false },
  ];
}

function pickSessionChallenges() {
  return [
    { id: 'sess_combo', key: 'chal_sess_combo', progress: 0, target: 1, rewardXp: 40, rewardGold: 20, claimed: false },
    { id: 'sess_parry', key: 'chal_sess_parry', progress: 0, target: 2, rewardXp: 50, rewardGold: 25, claimed: false },
    { id: 'sess_rare', key: 'chal_sess_rare', progress: 0, target: 1, rewardXp: 60, rewardGold: 30, claimed: false },
  ];
}

function bumpChallenge(save, id, amount = 1) {
  ensureChallenges(save);
  const all = [...save.challenges.daily, ...save.challenges.session];
  for (const c of all) {
    if (c.id === id && !c.claimed) {
      c.progress = Math.min(c.target, c.progress + amount);
    }
  }
}

function claimReadyChallenges(save) {
  ensureChallenges(save);
  let xp = 0;
  let gold = 0;
  const claimed = [];
  const all = [...save.challenges.daily, ...save.challenges.session];
  for (const c of all) {
    if (!c.claimed && c.progress >= c.target) {
      c.claimed = true;
      xp += c.rewardXp;
      gold += c.rewardGold;
      claimed.push(c);
    }
  }
  return { xp, gold, claimed };
}

function streakMultiplier(winStreak) {
  if (winStreak >= 10) return 1.35;
  if (winStreak >= 5) return 1.2;
  if (winStreak >= 3) return 1.1;
  return 1;
}

function streakHeatLabel(winStreak) {
  if (winStreak >= 10) return t('heat_blazing', { n: winStreak });
  if (winStreak >= 5) return t('heat_onfire', { n: winStreak });
  if (winStreak >= 3) return t('heat_hot', { n: winStreak });
  return '';
}
