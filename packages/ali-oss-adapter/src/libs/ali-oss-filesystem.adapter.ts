import OSS, { Options } from 'ali-oss';

export class AliOssFilesystemAdapter {
  public client: OSS;

  constructor(protected options: Options) {
    this.client = new OSS(options);
  }
}
