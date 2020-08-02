import buble from '@rollup/plugin-buble';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import rollupTypescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { uniq, get, isFunction } from 'lodash';

export function createEntries(configs, pkg) {
  return configs.map(c => createEntry(c, pkg));
}

/**
 * 生成对应的external
 * @param pkg
 * @param format
 * @param borwser {boolean}
 * @return {unknown[]}
 */
function makeExternal(pkg, format, borwser) {
  const external = pkg.external || [];
  let targetExternal = get(pkg, `${format}.external`, []);
  if (isFunction(targetExternal)) {
    targetExternal = targetExternal(borwser) || [];
  }
  return uniq([...external, ...targetExternal]);
}

function createEntry(config, pakg) {
  const pkgDir = pakg.dir;
  const pkg = JSON.parse(readFileSync(join(__dirname, '../packages', pkgDir, 'package.json')).toString());
  const c = {
    input: join(__dirname, '../packages', pkgDir, config.input),
    plugins: [
      rollupTypescript({
        tsconfig: join(__dirname, '../packages', pkgDir, 'tsconfig.json'),
        tsconfigOverride: {
          include: ["src"],
          exclude: ["test"],
          compilerOptions: {
            "module": "ES6",
          }
        }
      }),
      json(),
    ],
    output: {
      banner: pakg.banner,
      file: join(__dirname, '../packages', pkgDir, config.file),
      format: config.format,
      globals: pakg.globals || {}
    },
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
    external: makeExternal(pakg, config.format, config.browser)
  };

  if (config.format === 'umd') {
    c.output.name = c.output.name || pakg.outputName;
  }

  c.plugins.push(
    replace({
      __VERSION__: pkg.version,
      __DEV__:
        config.format !== 'umd' && !config.browser
          ? "(process.env.NODE_ENV !== 'production')"
          : config.env !== 'production',
    })
  );

  if (config.transpile !== false) {
    c.plugins.push(
      buble({
        transforms: { generator: false }
      })
    );
  }

  c.plugins.push(
    resolve({
      preferBuiltins: false,
      extensions: ['.ts', '.tsx', '.js', '.mjs']
    })
  );
  c.plugins.push(
    commonjs({
      transformMixedEsModules: true,
      extensions: ['.ts', '.tsx', '.js'],
    })
  );

  if (config.minify) {
    c.plugins.push(terser({ module: config.format === 'es' }));
  }

  return c;
}
