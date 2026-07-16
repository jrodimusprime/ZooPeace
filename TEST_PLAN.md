# Zoo Peace Maker — Test Plan

Manual and automated testing guide for the mobile HTML/JS game.

---

## Quick Start

### Run locally

```bash
cd /Users/jared/code/zoo_peace
python3 -m http.server 8080
```

Open **http://localhost:8080** on desktop, or use your LAN IP on a phone (e.g. `http://192.168.x.x:8080`).

### Run automated logic tests

**Option A — Browser (no Node required):**

```
http://localhost:8080/index.html?test=1
```

Open DevTools console; expect all `PASS:` lines.

**Option B — Node:**

```bash
node scripts/run-tests.js
```

---

## 1. Automated Tests (Logic)

| ID | Test | Command / How |
|----|------|----------------|
| A1 | Animal roster count | `node scripts/run-tests.js` |
| A2 | Kill unlock chain | same |
| A3 | XP / gold scaling | same |
| A4 | Upgrade cost scaling | same |
| A5 | Level-up + ability unlock | same |
| A6 | Overall progress target (11,000) | same |

**Pass criteria:** All assertions green, exit code 0.

---

## 2. Onboarding Tests (Manual)

| ID | Step | Expected |
|----|------|----------|
| O1 | Load fresh (clear localStorage or Reset) | Onboarding screen shows |
| O2 | Tap Begin without name | Error: "Please enter your name." |
| O3 | Enter name + pick avatar + Begin | Fight screen loads, name/avatar in header |
| O4 | Refresh page | Save persists, skips onboarding |

**Clear save (DevTools console):**

```javascript
localStorage.removeItem('zoo_peace_save');
location.reload();
```

---

## 3. Combat Tests (Manual)

| ID | Step | Expected |
|----|------|----------|
| C1 | Tap **Engage** | Auto-battle starts, enemy HP drops |
| C2 | Tap **TAP TO STRIKE** during fight | Extra damage burst, ~1s cooldown |
| C3 | Win a fight | Modal: **"One Step Closer to Peace"**, XP + gold shown |
| C4 | Tap Continue | New fight, kill counter +1 |
| C5 | Let HP reach 0 (no upgrades) | Defeat modal, win streak resets |
| C6 | After defeat, Recover | 5s-ish delay, full HP, Engage again |

**Fast-win dev cheat (console):**

```javascript
// Instantly kill current enemy (if combat active)
document.getElementById('btn-strike')?.click();
```

---

## 4. Progression Tests (Manual)

| ID | Step | Expected |
|----|------|----------|
| P1 | Check kill bar | Shows `N / 100` for current animal |
| P2 | Simulate 100 kills (console below) | Next animal unlocks, unlock message on victory |
| P3 | Open **Map** tab | Tier headers, locked 🔒, current highlighted |
| P4 | Pacify animal (100 kills) | Map cell gets green border |
| P5 | Overall stats | Stats tab shows `X / 110` pacified, `Y / 11000` defeats |

**Simulate 100 kills (console):**

```javascript
const save = JSON.parse(localStorage.getItem('zoo_peace_save'));
save.killCounts['0'] = 100;
save.currentAnimalIndex = 1;
localStorage.setItem('zoo_peace_save', JSON.stringify(save));
location.reload();
```

---

## 5. Stats & Economy Tests (Manual)

| ID | Step | Expected |
|----|------|----------|
| S1 | Win fights, earn gold | Gold increases in header |
| S2 | Upgrade Attack | Gold deducted, ATK value rises, fight ATK updates |
| S3 | Upgrade with insufficient gold | No change |
| S4 | Level up | Free stat point appears |
| S5 | Spend free point | Stat +1, free points decrease |
| S6 | Buy Treat (25 gold) | +10% damage for next 10 fights |
| S7 | Reach level 5 | Calm Strike button appears in fight |
| S8 | Use Calm Strike | Big damage, cooldown applied |

---

## 6. Mobile / UX Tests (Manual — use real phone)

| ID | Check | Expected |
|----|-------|----------|
| M1 | Portrait layout | No horizontal scroll, readable text |
| M2 | Tap targets | Engage / Strike buttons easy to tap (≥44px) |
| M3 | Safe area | Bottom nav not clipped on iPhone |
| M4 | Add to Home Screen (PWA) | App icon, standalone mode |
| M5 | Background + return | Passive XP may apply (wait 1+ min) |
| M6 | Emoji render | Animals display correctly (especially 🐻‍❄️, 🐦‍⬛) |

---

## 7. Persistence Tests (Manual)

| ID | Step | Expected |
|----|------|----------|
| D1 | Play 5 fights, refresh | Kills, gold, level retained |
| D2 | Close tab, reopen | Same state |
| D3 | Reset Progress | Back to onboarding, all data cleared |

---

## 8. Endgame Test (Manual / Simulated)

| ID | Step | Expected |
|----|------|----------|
| E1 | Pacify all 110 animals (sim below) | "Zoo Peace Achieved!" finale |
| E2 | Title in header | "Zoo Peacekeeper Supreme" |

**Simulate full completion (console):**

```javascript
const save = JSON.parse(localStorage.getItem('zoo_peace_save'));
for (let i = 0; i < 110; i++) save.killCounts[String(i)] = 100;
save.currentAnimalIndex = 109;
save.gameComplete = true;
localStorage.setItem('zoo_peace_save', JSON.stringify(save));
location.reload();
```

---

## 9. Cross-Browser Matrix

| Browser | Platform | Priority |
|---------|----------|----------|
| Safari | iOS | P0 |
| Chrome | Android | P0 |
| Chrome | Desktop | P1 (dev) |
| Firefox | Desktop | P2 |

---

## 10. Regression Checklist (Before Release)

- [ ] `node scripts/run-tests.js` passes
- [ ] Fresh onboarding works
- [ ] Victory message always says "One Step Closer to Peace" (except finale)
- [ ] 100-kill gate blocks next animal
- [ ] Save survives refresh
- [ ] No console errors during 10-fight session
- [ ] Phone playtest: one-thumb usable

---

## 11. Known Limitations (v1)

- Passive XP only ticks on visibility change (not true background idle)
- No sound effects yet
- Full 11,000-kill playthrough is hours — use simulation cheats above for QA
- Combat balance tuned for early tiers; late-game may need adjustment after playtesting

---

## Test Execution Log (template)

| Date | Tester | Device | Automated | Manual | Notes |
|------|--------|--------|-----------|--------|-------|
| | | | ☐ Pass | ☐ Pass | |
