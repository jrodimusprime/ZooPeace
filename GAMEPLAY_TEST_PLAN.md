# Zoo Peace Maker — Gameplay Test Plan

How to actually play-test (and simulate) the game without grinding 11,000 fights.

**Live:** https://jrodimusprime.github.io/ZooPeace/  
**Local:** `python3 -m http.server 8080` → http://localhost:8080

---

## Three ways to test

| Method | Time | Best for |
|--------|------|----------|
| **A. Button smoke (Chrome)** | 5 sec | FIGHT / RUN actually clickable |
| **B. Automated sim** | 30 sec | Encounter pools, flee odds, combat math |
| **C. Guided play sessions** | 5–30 min | Does it *feel* fun on a phone? |
| **D. Console cheats** | 1 min | Jump to a specific scenario |

---

## A. Button smoke tests (must pass)

```bash
python3 -m http.server 8080
python3 scripts/chrome-smoke.py
```

Or open `http://localhost:8080/index.html?smoke=1`

**Pass:** `13/13 button smoke tests passed`

Checks: onboarding → FIGHT visible → RUN changes animal → FIGHT starts damage → STRIKE appears → mid-fight RUN works.

---

## B. Automated gameplay simulation

Open DevTools console on:

```
http://localhost:8080/index.html?gameplay-test=1
```

Or on the live site (append `?gameplay-test=1`).

This runs ~20 statistical checks:

- Level 1 never rolls whale/large animals
- Encounter pool grows with player level
- Flee success rate clusters near 70% in combat
- Wins award XP/gold; upgrades change damage
- Pacified animals appear less often

**Pass:** Console ends with `X/X gameplay sims passed`.

For logic-only unit tests (no combat sim):

```
http://localhost:8080/index.html?test=1
```

---

## C. Guided play sessions

### Session 1 — Smoke test (5 min)

Goal: confirm a new player has a fair start.

| Step | Do | Pass if |
|------|-----|---------|
| 1 | Clear save (cheat below), create character | Onboarding works |
| 2 | Note first animal | Small critter (ant, fly, worm…) — **not** whale/elephant |
| 3 | Tap **Run Away** before Engage | New animal appears, no damage |
| 4 | Engage + win one fight | "One Step Closer to Peace" modal |
| 5 | Check rarity badge | Shows Common / Uncommon / Rare / Legendary |
| 6 | Open Map | Most animals locked; a few small ones visible |
| 7 | Refresh page | Progress saved |

### Session 2 — Core loop (15 min)

Goal: fight → earn → upgrade → flee → repeat feels good.

| Step | Do | Pass if |
|------|-----|---------|
| 1 | Win 5 fights | Gold and XP climb steadily |
| 2 | Upgrade Attack once | Next fights end faster |
| 3 | Lose on purpose (no DEF upgrades) | Defeat modal, streak resets |
| 4 | Run away **during** combat 5 times | ~3–4 escapes, ~1–2 "Could not escape!" |
| 5 | Buy a Treat (25 gold) | Damage feels higher for several fights |
| 6 | Reach level 5 | Calm Strike appears |
| 7 | Use Calm Strike | Big hit, then cooldown |

### Session 3 — Progression curve (30 min)

Goal: XP unlocks bigger animals; rarity matters.

| Step | Do | Pass if |
|------|-----|---------|
| 1 | Play naturally to level 5 | Larger animals start appearing |
| 2 | Note a Rare/Legendary spawn | Higher XP/gold reward on win |
| 3 | Pacify one animal to 100/100 | Map cell turns green; that species spawns less |
| 4 | Jump to level 20 (cheat) | Mid-tier animals in pool |
| 5 | Jump to level 33 (cheat) | Whale can appear (legendary) |
| 6 | Phone test | One-thumb playable, no layout breaks |

---

## D. Console cheats

Open DevTools → Console on the game page.

### Reset to brand-new player

```javascript
localStorage.removeItem('zoo_peace_save');
location.reload();
```

### Inspect current encounter pool

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
const start = getUnlockedAnimalStartIndex(s);
console.log('Level', s.level, '— pool size', getUnlockedAnimalCount(s));
console.log('Can appear:', ANIMALS.slice(start).map((a, i) => `${a.emoji} ${a.name}`));
```

### Sample 50 random encounters (distribution check)

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
const counts = {};
for (let i = 0; i < 50; i++) {
  const idx = selectNextEncounter(s);
  const name = ANIMALS[idx].name;
  counts[name] = (counts[name] || 0) + 1;
}
console.table(counts);
```

### Jump to level 20 (mid-game)

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
s.level = 20;
s.xp = 0;
s.gold = 2000;
s.currentAnimalIndex = selectNextEncounter(s);
s.encounterInitialized = true;
localStorage.setItem('zoo_peace_save', JSON.stringify(s));
location.reload();
```

### Jump to level 33 (whale unlocked)

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
s.level = 33;
s.xp = 0;
s.gold = 5000;
s.currentAnimalIndex = selectNextEncounter(s);
s.encounterInitialized = true;
localStorage.setItem('zoo_peace_save', JSON.stringify(s));
location.reload();
```

### Force next encounter to be a whale

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
s.level = 33;
s.currentAnimalIndex = 0;
localStorage.setItem('zoo_peace_save', JSON.stringify(s));
location.reload();
```

### Insta-win current fight (combat must be active)

```javascript
// Engage first, then run:
for (let i = 0; i < 50; i++) document.getElementById('btn-strike')?.click();
```

### Simulate full zoo completion

```javascript
const s = JSON.parse(localStorage.getItem('zoo_peace_save'));
for (let i = 0; i < 110; i++) s.killCounts[String(i)] = 100;
s.gameComplete = true;
localStorage.setItem('zoo_peace_save', JSON.stringify(s));
location.reload();
```

---

## What to watch for (balance red flags)

| Signal | Likely problem |
|--------|----------------|
| Level 1 sees whale/elephant | Encounter pool bug |
| Can't kill anything after 10+ wins | Attack too low vs early HP |
| Always dying before 3 wins | Enemy damage too high |
| Run away never fails in combat | Flee RNG broken |
| Run away always fails in combat | Flee RNG broken |
| Same animal 10 times in a row | Reroll / exclude logic broken |
| Legendary feels identical to common | Rarity rewards not applying |
| Upgrades do nothing | Stat calc not wired to combat |

---

## Mobile playtest script

Do this on a real phone (Safari iOS or Chrome Android):

1. Open the live URL
2. Add to Home Screen
3. Complete Session 1 (smoke test)
4. Play until first level-up
5. Try Run Away with your thumb while walking — button must be easy to hit
6. Rotate to landscape → should still be usable (portrait preferred)
7. Lock phone 2 min, unlock → passive XP may tick; no crash

---

## Regression checklist (ship gate)

- [ ] `?smoke=1` / `python3 scripts/chrome-smoke.py` — FIGHT + RUN work
- [ ] `?test=1` — all logic tests pass
- [ ] `?gameplay-test=1` — all gameplay sims pass
- [ ] Session 1 smoke test passes on phone
- [ ] New player starts with small animal
- [ ] Command panel FIGHT / RUN always visible above bottom nav
- [ ] Run away works before engage (100%)
- [ ] Victory always says "One Step Closer to Peace"
- [ ] 100/100 pacification still tracked per species
- [ ] No console errors in 10-fight session

---

## Test log

| Date | Tester | Device | Sim (`?gameplay-test=1`) | Session 1 | Session 2 | Notes |
|------|--------|--------|--------------------------|-------------|-------------|-------|
| | | | ☐ | ☐ | ☐ | |
