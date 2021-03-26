const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv);

const lernaPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../lerna.json')).toString());

const entries = [
  {
    input: 'src/index.ts',
    file: 'index.esm.browser.js',
    format: 'es',
    browser: true,
    transpile: false,
    env: 'development',
  },
  {
    input: 'src/index.ts',
    file: 'index.esm.browser.min.js',
    format: 'es',
    browser: true,
    transpile: false,
    minify: true,
    env: 'production',
  },
  // todo remove transpile
  { input: 'src/index.ts', file: 'index.esm.js', format: 'es', transpile: false, env: 'development' },
  { input: 'src/index.ts', file: 'index.js', format: 'umd', transpile: false, env: 'development' },
  { input: 'src/index.ts', file: 'index.min.js', format: 'umd', transpile: false, minify: true, env: 'production' },
  { input: 'src/index.ts', file: 'index.common.js', format: 'cjs', transpile: false, env: 'development' },
];

const packages = [
  {
    dir: 'core',
    outputName: 'FilesystemCore',
    banner: `/*!
 * @filesystem/core v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`
  },
  {
    dir: 'ali-oss-adapter',
    outputName: 'AliOssAdapter',
    banner: `/*!
 * @filesystem/ali-oss-adapter v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`,
    external: ['ali-oss'],
    globals: {
      'ali-oss': 'OSS',
    }
  },
  {
    dir: 'ftp-adapter',
    outputName: 'FtpAdapter',
    banner: `/*!
 * @filesystem/ftp-adapter v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`
  },
  {
    dir: 'memory-adapter',
    outputName: 'MemoryAdapter',
    banner: `/*!
 * @filesystem/memory-adapter v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`,
    external: ['memfs'],
  },
  {
    dir: 'nestjs',
    outputName: 'FilesystemNestModule',
    banner: `/*!
 * @filesystem/nestjs v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`,
    external: ['@nestjs/core', '@nestjs/common', '@filesystem/core', '@filesystem/ali-oss-adapter'],
    onlyModule: {
      only: ['cjs', 'es'],
      browser: false
    }
  },
  {
    dir: 'sftp-adapter',
    outputName: 'SftpAdapter',
    banner: `/*!
 * @filesystem/sftp-adapter v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`
  },
  {
    dir: 'webdav-adapter',
    outputName: 'WebdavAdapter',
    banner: `/*!
 * @filesystem/webdav-adapter v${lernaPackage.version}
 * (c) ${new Date().getFullYear()} LiuYang
 * @license MIT
 */`
  }
];

module.exports = {
  entries,
  packages: packages.filter((package) => {
    if (argv.only && typeof argv.only === 'string') {
      return argv.only.split(',').includes(package.dir);
    }
    return true;
  }),
};
