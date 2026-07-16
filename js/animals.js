/**
 * Zoo Peace Maker — 110 emoji animals, largest to smallest.
 * Each animal: emoji, name, tier (1-18), baseHp, baseAtk, baseDef, baseSpd
 */
const ANIMALS = [
  // Tier 1 — Megafauna
  { emoji: '🐋', name: 'Whale', tier: 1, baseHp: 500, baseAtk: 8, baseDef: 6, baseSpd: 1 },
  { emoji: '🐘', name: 'Elephant', tier: 1, baseHp: 450, baseAtk: 10, baseDef: 8, baseSpd: 1 },
  { emoji: '🦣', name: 'Mammoth', tier: 1, baseHp: 420, baseAtk: 11, baseDef: 7, baseSpd: 1 },
  { emoji: '🦛', name: 'Hippo', tier: 1, baseHp: 400, baseAtk: 12, baseDef: 6, baseSpd: 2 },
  { emoji: '🦏', name: 'Rhino', tier: 2, baseHp: 380, baseAtk: 13, baseDef: 9, baseSpd: 2 },
  { emoji: '🦒', name: 'Giraffe', tier: 2, baseHp: 350, baseAtk: 9, baseDef: 5, baseSpd: 2 },
  { emoji: '🐃', name: 'Water Buffalo', tier: 2, baseHp: 340, baseAtk: 11, baseDef: 7, baseSpd: 2 },
  { emoji: '🦬', name: 'Bison', tier: 2, baseHp: 330, baseAtk: 12, baseDef: 8, baseSpd: 2 },
  // Tier 2 — Great Beasts
  { emoji: '🐻‍❄️', name: 'Polar Bear', tier: 3, baseHp: 320, baseAtk: 14, baseDef: 7, baseSpd: 2 },
  { emoji: '🐻', name: 'Bear', tier: 3, baseHp: 300, baseAtk: 13, baseDef: 6, baseSpd: 2 },
  { emoji: '🦁', name: 'Lion', tier: 3, baseHp: 280, baseAtk: 15, baseDef: 5, baseSpd: 3 },
  { emoji: '🐯', name: 'Tiger', tier: 3, baseHp: 270, baseAtk: 16, baseDef: 5, baseSpd: 3 },
  { emoji: '🐅', name: 'Tiger', tier: 3, baseHp: 265, baseAtk: 17, baseDef: 5, baseSpd: 3 },
  { emoji: '🐆', name: 'Leopard', tier: 4, baseHp: 250, baseAtk: 16, baseDef: 4, baseSpd: 4 },
  { emoji: '🦈', name: 'Shark', tier: 4, baseHp: 260, baseAtk: 18, baseDef: 3, baseSpd: 4 },
  { emoji: '🐊', name: 'Crocodile', tier: 4, baseHp: 290, baseAtk: 14, baseDef: 8, baseSpd: 2 },
  { emoji: '🦖', name: 'T-Rex', tier: 4, baseHp: 310, baseAtk: 20, baseDef: 6, baseSpd: 3 },
  { emoji: '🦕', name: 'Sauropod', tier: 4, baseHp: 350, baseAtk: 12, baseDef: 10, baseSpd: 1 },
  // Tier 3 — Large Mammals
  { emoji: '🐪', name: 'Camel', tier: 5, baseHp: 240, baseAtk: 10, baseDef: 6, baseSpd: 2 },
  { emoji: '🐫', name: 'Two-Hump Camel', tier: 5, baseHp: 245, baseAtk: 10, baseDef: 7, baseSpd: 2 },
  { emoji: '🦙', name: 'Llama', tier: 5, baseHp: 200, baseAtk: 9, baseDef: 5, baseSpd: 3 },
  { emoji: '🐎', name: 'Horse', tier: 5, baseHp: 220, baseAtk: 11, baseDef: 4, baseSpd: 4 },
  { emoji: '🫎', name: 'Moose', tier: 5, baseHp: 250, baseAtk: 12, baseDef: 6, baseSpd: 3 },
  { emoji: '🦌', name: 'Deer', tier: 5, baseHp: 180, baseAtk: 8, baseDef: 3, baseSpd: 5 },
  { emoji: '🦓', name: 'Zebra', tier: 5, baseHp: 200, baseAtk: 9, baseDef: 4, baseSpd: 4 },
  { emoji: '🐂', name: 'Ox', tier: 6, baseHp: 260, baseAtk: 11, baseDef: 8, baseSpd: 2 },
  { emoji: '🐄', name: 'Cow', tier: 6, baseHp: 230, baseAtk: 8, baseDef: 6, baseSpd: 2 },
  { emoji: '🐏', name: 'Ram', tier: 6, baseHp: 190, baseAtk: 10, baseDef: 5, baseSpd: 3 },
  { emoji: '🐑', name: 'Sheep', tier: 6, baseHp: 150, baseAtk: 6, baseDef: 4, baseSpd: 2 },
  { emoji: '🐐', name: 'Goat', tier: 6, baseHp: 160, baseAtk: 8, baseDef: 4, baseSpd: 3 },
  { emoji: '🦘', name: 'Kangaroo', tier: 6, baseHp: 210, baseAtk: 12, baseDef: 4, baseSpd: 5 },
  // Tier 4 — Mid Predators & Primates
  { emoji: '🦍', name: 'Gorilla', tier: 7, baseHp: 240, baseAtk: 14, baseDef: 6, baseSpd: 3 },
  { emoji: '🦧', name: 'Orangutan', tier: 7, baseHp: 220, baseAtk: 12, baseDef: 5, baseSpd: 3 },
  { emoji: '🐒', name: 'Monkey', tier: 7, baseHp: 160, baseAtk: 9, baseDef: 3, baseSpd: 5 },
  { emoji: '🐵', name: 'Monkey', tier: 7, baseHp: 155, baseAtk: 8, baseDef: 3, baseSpd: 5 },
  { emoji: '🐺', name: 'Wolf', tier: 7, baseHp: 200, baseAtk: 13, baseDef: 4, baseSpd: 4 },
  { emoji: '🦊', name: 'Fox', tier: 7, baseHp: 170, baseAtk: 10, baseDef: 3, baseSpd: 5 },
  { emoji: '🦝', name: 'Raccoon', tier: 7, baseHp: 150, baseAtk: 9, baseDef: 3, baseSpd: 5 },
  { emoji: '🐗', name: 'Boar', tier: 8, baseHp: 190, baseAtk: 11, baseDef: 5, baseSpd: 3 },
  { emoji: '🐖', name: 'Pig', tier: 8, baseHp: 175, baseAtk: 8, baseDef: 4, baseSpd: 2 },
  { emoji: '🦡', name: 'Badger', tier: 8, baseHp: 165, baseAtk: 10, baseDef: 5, baseSpd: 4 },
  { emoji: '🦨', name: 'Skunk', tier: 8, baseHp: 140, baseAtk: 7, baseDef: 3, baseSpd: 4 },
  { emoji: '🦦', name: 'Otter', tier: 8, baseHp: 145, baseAtk: 8, baseDef: 3, baseSpd: 5 },
  { emoji: '🦫', name: 'Beaver', tier: 8, baseHp: 155, baseAtk: 9, baseDef: 4, baseSpd: 3 },
  // Tier 5 — Small Mammals
  { emoji: '🐼', name: 'Panda', tier: 9, baseHp: 200, baseAtk: 10, baseDef: 6, baseSpd: 2 },
  { emoji: '🐨', name: 'Koala', tier: 9, baseHp: 130, baseAtk: 6, baseDef: 4, baseSpd: 2 },
  { emoji: '🦥', name: 'Sloth', tier: 9, baseHp: 140, baseAtk: 5, baseDef: 5, baseSpd: 1 },
  { emoji: '🐷', name: 'Pig', tier: 9, baseHp: 150, baseAtk: 7, baseDef: 3, baseSpd: 2 },
  { emoji: '🐽', name: 'Pig Nose', tier: 9, baseHp: 120, baseAtk: 5, baseDef: 2, baseSpd: 3 },
  { emoji: '🐇', name: 'Rabbit', tier: 9, baseHp: 110, baseAtk: 6, baseDef: 2, baseSpd: 6 },
  { emoji: '🐰', name: 'Rabbit', tier: 9, baseHp: 105, baseAtk: 5, baseDef: 2, baseSpd: 6 },
  { emoji: '🦔', name: 'Hedgehog', tier: 10, baseHp: 100, baseAtk: 7, baseDef: 6, baseSpd: 3 },
  { emoji: '🐿', name: 'Chipmunk', tier: 10, baseHp: 90, baseAtk: 5, baseDef: 2, baseSpd: 7 },
  { emoji: '🦇', name: 'Bat', tier: 10, baseHp: 85, baseAtk: 6, baseDef: 2, baseSpd: 7 },
  { emoji: '🐀', name: 'Rat', tier: 10, baseHp: 80, baseAtk: 6, baseDef: 2, baseSpd: 6 },
  { emoji: '🐁', name: 'Mouse', tier: 10, baseHp: 70, baseAtk: 5, baseDef: 1, baseSpd: 7 },
  { emoji: '🐭', name: 'Mouse', tier: 10, baseHp: 65, baseAtk: 4, baseDef: 1, baseSpd: 7 },
  { emoji: '🐹', name: 'Hamster', tier: 10, baseHp: 60, baseAtk: 4, baseDef: 2, baseSpd: 6 },
  // Tier 6 — Birds
  { emoji: '🦃', name: 'Turkey', tier: 11, baseHp: 130, baseAtk: 8, baseDef: 3, baseSpd: 3 },
  { emoji: '🦅', name: 'Eagle', tier: 11, baseHp: 150, baseAtk: 12, baseDef: 3, baseSpd: 5 },
  { emoji: '🦉', name: 'Owl', tier: 11, baseHp: 120, baseAtk: 9, baseDef: 3, baseSpd: 4 },
  { emoji: '🦢', name: 'Swan', tier: 11, baseHp: 110, baseAtk: 7, baseDef: 3, baseSpd: 3 },
  { emoji: '🦩', name: 'Flamingo', tier: 11, baseHp: 100, baseAtk: 6, baseDef: 2, baseSpd: 4 },
  { emoji: '🦚', name: 'Peacock', tier: 11, baseHp: 105, baseAtk: 7, baseDef: 3, baseSpd: 4 },
  { emoji: '🦜', name: 'Parrot', tier: 11, baseHp: 95, baseAtk: 7, baseDef: 2, baseSpd: 5 },
  { emoji: '🐧', name: 'Penguin', tier: 11, baseHp: 115, baseAtk: 7, baseDef: 4, baseSpd: 3 },
  { emoji: '🦆', name: 'Duck', tier: 11, baseHp: 85, baseAtk: 5, baseDef: 2, baseSpd: 4 },
  { emoji: '🪿', name: 'Goose', tier: 11, baseHp: 100, baseAtk: 8, baseDef: 3, baseSpd: 4 },
  { emoji: '🐦', name: 'Bird', tier: 12, baseHp: 75, baseAtk: 5, baseDef: 1, baseSpd: 6 },
  { emoji: '🐦‍⬛', name: 'Black Bird', tier: 12, baseHp: 80, baseAtk: 6, baseDef: 2, baseSpd: 6 },
  { emoji: '🕊', name: 'Dove', tier: 12, baseHp: 60, baseAtk: 3, baseDef: 1, baseSpd: 5 },
  { emoji: '🐔', name: 'Chicken', tier: 12, baseHp: 90, baseAtk: 5, baseDef: 2, baseSpd: 3 },
  { emoji: '🐓', name: 'Rooster', tier: 12, baseHp: 95, baseAtk: 7, baseDef: 2, baseSpd: 4 },
  { emoji: '🐣', name: 'Hatching Chick', tier: 12, baseHp: 50, baseAtk: 3, baseDef: 1, baseSpd: 4 },
  { emoji: '🐤', name: 'Baby Chick', tier: 12, baseHp: 45, baseAtk: 2, baseDef: 1, baseSpd: 5 },
  { emoji: '🐥', name: 'Front Chick', tier: 12, baseHp: 40, baseAtk: 2, baseDef: 1, baseSpd: 5 },
  { emoji: '🦤', name: 'Dodo', tier: 12, baseHp: 110, baseAtk: 6, baseDef: 3, baseSpd: 2 },
  // Tier 7 — Reptiles & Amphibians
  { emoji: '🐍', name: 'Snake', tier: 13, baseHp: 100, baseAtk: 10, baseDef: 2, baseSpd: 5 },
  { emoji: '🦎', name: 'Lizard', tier: 13, baseHp: 80, baseAtk: 7, baseDef: 3, baseSpd: 6 },
  { emoji: '🐢', name: 'Turtle', tier: 14, baseHp: 120, baseAtk: 5, baseDef: 10, baseSpd: 1 },
  { emoji: '🐸', name: 'Frog', tier: 14, baseHp: 70, baseAtk: 6, baseDef: 2, baseSpd: 6 },
  // Tier 8 — Marine Life
  { emoji: '🐳', name: 'Spouting Whale', tier: 15, baseHp: 400, baseAtk: 10, baseDef: 6, baseSpd: 2 },
  { emoji: '🐬', name: 'Dolphin', tier: 15, baseHp: 180, baseAtk: 9, baseDef: 3, baseSpd: 6 },
  { emoji: '🦭', name: 'Seal', tier: 15, baseHp: 160, baseAtk: 8, baseDef: 4, baseSpd: 4 },
  { emoji: '🐙', name: 'Octopus', tier: 15, baseHp: 140, baseAtk: 9, baseDef: 3, baseSpd: 5 },
  { emoji: '🦑', name: 'Squid', tier: 15, baseHp: 130, baseAtk: 10, baseDef: 2, baseSpd: 6 },
  { emoji: '🪼', name: 'Jellyfish', tier: 15, baseHp: 90, baseAtk: 8, baseDef: 1, baseSpd: 4 },
  { emoji: '🦞', name: 'Lobster', tier: 15, baseHp: 110, baseAtk: 9, baseDef: 5, baseSpd: 3 },
  { emoji: '🦀', name: 'Crab', tier: 16, baseHp: 100, baseAtk: 8, baseDef: 6, baseSpd: 3 },
  { emoji: '🦐', name: 'Shrimp', tier: 16, baseHp: 60, baseAtk: 5, baseDef: 2, baseSpd: 5 },
  { emoji: '🐡', name: 'Blowfish', tier: 16, baseHp: 80, baseAtk: 7, baseDef: 4, baseSpd: 3 },
  { emoji: '🐠', name: 'Tropical Fish', tier: 16, baseHp: 55, baseAtk: 4, baseDef: 1, baseSpd: 6 },
  { emoji: '🐟', name: 'Fish', tier: 16, baseHp: 50, baseAtk: 3, baseDef: 1, baseSpd: 5 },
  { emoji: '🐚', name: 'Spiral Shell', tier: 16, baseHp: 40, baseAtk: 2, baseDef: 8, baseSpd: 1 },
  { emoji: '🦪', name: 'Oyster', tier: 16, baseHp: 45, baseAtk: 2, baseDef: 7, baseSpd: 1 },
  // Tier 9 — Insects & Micro
  { emoji: '🦋', name: 'Butterfly', tier: 17, baseHp: 50, baseAtk: 3, baseDef: 1, baseSpd: 8 },
  { emoji: '🐌', name: 'Snail', tier: 17, baseHp: 55, baseAtk: 2, baseDef: 6, baseSpd: 1 },
  { emoji: '🪲', name: 'Beetle', tier: 17, baseHp: 45, baseAtk: 5, baseDef: 5, baseSpd: 3 },
  { emoji: '🐞', name: 'Lady Beetle', tier: 17, baseHp: 40, baseAtk: 4, baseDef: 4, baseSpd: 4 },
  { emoji: '🐛', name: 'Bug', tier: 17, baseHp: 35, baseAtk: 3, baseDef: 1, baseSpd: 5 },
  { emoji: '🦗', name: 'Cricket', tier: 17, baseHp: 38, baseAtk: 4, baseDef: 1, baseSpd: 7 },
  { emoji: '🐝', name: 'Honeybee', tier: 17, baseHp: 35, baseAtk: 5, baseDef: 1, baseSpd: 8 },
  { emoji: '🦟', name: 'Mosquito', tier: 17, baseHp: 25, baseAtk: 4, baseDef: 0, baseSpd: 9 },
  { emoji: '🪰', name: 'Fly', tier: 18, baseHp: 28, baseAtk: 3, baseDef: 0, baseSpd: 9 },
  { emoji: '🪳', name: 'Cockroach', tier: 18, baseHp: 42, baseAtk: 4, baseDef: 3, baseSpd: 6 },
  { emoji: '🕷', name: 'Spider', tier: 18, baseHp: 48, baseAtk: 6, baseDef: 2, baseSpd: 6 },
  { emoji: '🦂', name: 'Scorpion', tier: 18, baseHp: 55, baseAtk: 8, baseDef: 3, baseSpd: 5 },
  { emoji: '🪱', name: 'Worm', tier: 18, baseHp: 30, baseAtk: 2, baseDef: 1, baseSpd: 3 },
  { emoji: '🐜', name: 'Ant', tier: 18, baseHp: 25, baseAtk: 3, baseDef: 2, baseSpd: 7 },
  { emoji: '🦠', name: 'Microbe', tier: 18, baseHp: 20, baseAtk: 2, baseDef: 0, baseSpd: 10 },
];

/** Pacify target per animal. 110 × 250 ≈ 27.5k fights (~150–300h at idle pace). */
const KILLS_PER_ANIMAL = 250;

/** Start small; unlock the next pair only after the current set is fully pacified. */
const UNLOCK_START_COUNT = 2;
const UNLOCK_BATCH_SIZE = 2;

const TIER_NAMES = {
  1: 'The Savannah Gates',
  2: 'Titan Plains',
  3: 'Predator Ridge',
  4: 'Apex Den',
  5: 'Hoof & Horn',
  6: 'Grazing Grounds',
  7: 'Jungle Canopy',
  8: 'Primate Path',
  9: 'Critter Corner',
  10: 'Burrow Lane',
  11: 'Aviary Heights',
  12: 'Nest Row',
  13: 'Reptile House',
  14: 'Amphibian Hollow',
  15: 'Aquarium Depths',
  16: 'Shell Shoals',
  17: 'Insect Wing',
  18: 'The Final Peace',
};

const AVATARS = ['🧑', '🧔', '👩', '👨', '👴', '👵', '🧒'];

function getAnimalStats(index, playerLevel = 1) {
  const animal = ANIMALS[index];
  if (!animal) return null;
  // 18 zones: late tiers hit much harder / tankier than the old 9-tier curve.
  const tierMult = 1 + animal.tier * 0.12;
  const level = Math.max(1, playerLevel || 1);

  // Softer soft-caps — early bugs can still punish underleveled players.
  const maxSpd = Math.min(animal.baseSpd, 3 + Math.floor(level / 2));
  const maxAtk = Math.floor(8 + level * 2.5);
  const rawAtk = Math.floor(animal.baseAtk * tierMult * 1.1);

  return {
    ...animal,
    hp: Math.floor(animal.baseHp * tierMult * 1.2),
    maxHp: Math.floor(animal.baseHp * tierMult * 1.2),
    atk: Math.min(rawAtk, maxAtk),
    def: Math.floor(animal.baseDef * tierMult * 1.15),
    spd: Math.max(1, maxSpd),
  };
}

const RARITY_CONFIG = {
  common: { label: 'Common', weight: 60, xpMultiplier: 1, goldMultiplier: 1 },
  uncommon: { label: 'Uncommon', weight: 25, xpMultiplier: 1.35, goldMultiplier: 1.25 },
  rare: { label: 'Rare', weight: 10, xpMultiplier: 2, goldMultiplier: 1.75 },
  legendary: { label: 'Legendary', weight: 3, xpMultiplier: 4, goldMultiplier: 3 },
};

const LEGENDARY_ANIMALS = new Set([0, 2, 16, 17, 84]);
const RARE_ANIMALS = new Set([1, 4, 8, 10, 11, 12, 14, 15, 22, 31, 32, 44, 58, 63, 64, 76, 85, 86, 104, 105]);

function getAnimalRarity(animalIndex) {
  if (LEGENDARY_ANIMALS.has(animalIndex)) return 'legendary';
  if (RARE_ANIMALS.has(animalIndex)) return 'rare';
  if (animalIndex < 45 || animalIndex % 4 === 0) return 'uncommon';
  return 'common';
}

function getXpReward(animalIndex, killCount) {
  const difficulty = ANIMALS.length - animalIndex;
  const rarity = RARITY_CONFIG[getAnimalRarity(animalIndex)];
  // Slower XP so upgrades lag behind the long pacify grind.
  return Math.floor((4 + difficulty * 0.85 + killCount * 0.04) * rarity.xpMultiplier);
}

function getGoldReward(animalIndex) {
  const difficulty = ANIMALS.length - animalIndex;
  const rarity = RARITY_CONFIG[getAnimalRarity(animalIndex)];
  return Math.floor((3 + difficulty * 0.28) * rarity.goldMultiplier);
}
