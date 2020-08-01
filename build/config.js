const entries = [
  {
    input: 'src/index.ts',
    file: 'lib/index.esm.browser.js',
    format: 'es',
    browser: true,
    transpile: false,
    env: 'development',
  },
  {
    input: 'src/index.ts',
    file: 'lib/index.esm.browser.min.js',
    format: 'es',
    browser: true,
    transpile: false,
    minify: true,
    env: 'production',
  },
  // todo remove transpile
  { input: 'src/index.ts', file: 'lib/index.esm.js', format: 'es', transpile: false, env: 'development' },
  { input: 'src/index.ts', file: 'lib/index.js', format: 'umd', transpile: false, env: 'development' },
  { input: 'src/index.ts', file: 'lib/index.min.js', format: 'umd', transpile: false, minify: true, env: 'production' },
  { input: 'src/index.ts', file: 'lib/index.common.js', format: 'cjs', transpile: false, env: 'development' },
];

const packages = [
  'core'
];

module.exports = {
  entries,
  packages,
};
