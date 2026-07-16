#!/usr/bin/env node
/**
 * Logic-only test runner for Zoo Peace Maker (no browser required).
 * Usage: node scripts/run-tests.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const files = [
  'js/animals.js',
  'js/save.js',
  'js/player.js',
  'js/progression.js',
  'js/test-runner.js',
];

const context = { console, Math, Date, JSON };
vm.createContext(context);

for (const file of files) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(code, context, { filename: file });
}

const ok = context.TestRunner.runLogicTests();
process.exit(ok ? 0 : 1);
