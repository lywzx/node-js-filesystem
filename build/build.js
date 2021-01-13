const fs = require('fs');
const chalk = require('chalk');
const execa = require('execa');
const { gzipSync } = require('zlib');
const { compress } = require('brotli');
const lodash = require('lodash');
const path = require('path');
const argv = require('minimist')(process.argv);

async function run(config, files) {
  await cleanDir(files);
  await build(config);
  checkAllSizes(files);
}

async function cleanDir(files) {
  const rmDirs = lodash.uniq(files.map((dirs) => {
    const outDirs = path.dirname(dirs);
    return outDirs.replace('packages', argv.dist || 'dist');
  }));
  await execa('rimraf', rmDirs);
}

async function build(config) {
  await execa('node', ['--max_old_space_size=8192', 'node_modules/rollup/dist/bin/rollup', '-c', 'build/' + config, ...process.argv.slice(2)], { stdio: 'inherit' })
}

function checkAllSizes(files) {
  console.log()
  files.map((f) => checkSize(f))
  console.log()
}

function checkSize(file) {
  const targetFile = file.replace('packages', argv.dist || 'dist');
  const f = fs.readFileSync(targetFile)
  const minSize = (f.length / 1024).toFixed(2) + 'kb'
  const gzipped = gzipSync(f)
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
  const compressed = compress(f)
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
  console.log(
    `${chalk.gray(
      chalk.bold(targetFile)
    )} size:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  )
}

module.exports = { run }
