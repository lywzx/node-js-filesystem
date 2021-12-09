/**
 * @type import('@lywzx/rollup-build-script/interfaces/package-option').IRollupConfig
 */
module.exports = {
  ts: true,
  dts: true,
  tsconfigOverride: {
    include: ["src"],
    exclude: ["test"],
    compilerOptions: {
      "module": "ES6",
    }
  },
  externalEachOther: true,
  external: [
    'ali-oss',
    '@nestjs/core',
    '@nestjs/common',
    'lodash',
    'basic-ftp',
    'ssh2-sftp-client'
  ],
  inputPrefix: 'src',
  workspace: ['packages'],
  outputGlobals: {
    'ali-oss': 'OSS',
  }
}
