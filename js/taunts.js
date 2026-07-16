/**
 * Per-animal taunts — 10 lines each, localized via i18n templates.
 */
function getAnimalTaunts(animalIndex) {
  const animal = ANIMALS[animalIndex];
  if (!animal) return ['…'];

  const name = animalName(animal.name);
  const emoji = animal.emoji;
  const templates = I18N.taunts[I18N.current] || I18N.taunts.en;
  const start = animalIndex % templates.length;
  const taunts = [];
  for (let i = 0; i < 10; i++) {
    const template = templates[(start + i * 3) % templates.length];
    taunts.push(template.replaceAll('{emoji}', emoji).replaceAll('{name}', name));
  }
  return taunts;
}

function getRandomTaunt(animalIndex) {
  const taunts = getAnimalTaunts(animalIndex);
  return taunts[Math.floor(Math.random() * taunts.length)];
}
