import { createEntries } from './rollup-base.config';
import { flatten, includes, get } from 'lodash';
const { entries, packages } = require('./config');

export default flatten(packages.map((pkg) => {
  const newEntries = entries.filter((entery) => {
    return checkEnterIsGenerate(pkg, entery);
  });

  return createEntries(newEntries, pkg)
}));


function checkEnterIsGenerate(pkg, entry) {
  const only = get(pkg, 'onlyModule.only');
  const browser = get(pkg, 'onlyModule.browser');
  if (only && only.length) {
    if (includes(only, entry.format)) {
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
