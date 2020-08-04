const { run } = require('./build');
const { entries, packages } = require('./config');
const lodash = require('lodash');
const path = require('path');

run(
  'rollup.config.js',
  lodash.flatten(
    packages
      .map((pkg) => entries
        .filter((entry) => {
          return checkEnterIsGenerate(pkg, entry);
        })
        .map((entry) => {
          return path.join(__dirname, '../packages', pkg.dir, entry.file);
        })
  )
));

function checkEnterIsGenerate(pkg, entry) {
  const only = lodash.get(pkg, 'onlyModule.only');
  const browser = lodash.get(pkg, 'onlyModule.browser');
  if (only && only.length) {
    if (lodash.includes(only, entry.format)) {
      if (entry.browser === true ) {
        if (!(typeof browser === "undefined" || browser)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  return true;
}
