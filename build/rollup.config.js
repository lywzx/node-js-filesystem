import { createEntries } from './rollup-base.config';
import { flatten } from 'lodash';
const { entries, packages } = require('./config');

export default flatten(packages.map((pkg) => createEntries(entries, pkg, '')));
