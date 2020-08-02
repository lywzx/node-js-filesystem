const { run } = require('./build');
const { entries, packages } = require('./config');
const lodash = require('lodash');
const path = require('path');

const files = lodash.map(entries, 'file');

run(
  'rollup.config.js',
  lodash.flatten(packages.map((pkg) => files.map((f) => path.join(__dirname, '../packages', pkg.dir, f))))
);
