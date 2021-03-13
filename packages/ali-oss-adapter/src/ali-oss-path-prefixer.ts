import { PathPrefixer } from '@filesystem/core';

export class AliOssPathPrefixer extends PathPrefixer {
  constructor(prefix: string, protected separator: string = '/') {
    super(prefix.replace(AliOssPathPrefixer.lTrim, ''), separator);
  }

  stripPrefix(path: string): string {
    return super.stripPrefix(path.replace(AliOssPathPrefixer.lTrim, ''));
  }
}
