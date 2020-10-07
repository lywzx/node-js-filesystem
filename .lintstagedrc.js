#!/usr/bin/env node
const path = require('path');

module.exports = {
  '*.{ts,tsx}': [
    'prettier --write',
    'eslint --fix'
  ],
  '*.spec.ts': (files) => `mocha --require ts-node/register --require tsconfig-paths/register ${files.map((file) => path.relative(__dirname, file)).join(' ')} --colors`,
};
