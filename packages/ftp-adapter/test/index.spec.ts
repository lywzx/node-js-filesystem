import { filesystemAdapterSpecUtil } from '@filesystem/core/test/adapter-test-utilties/filesystem-adapter.spec.util';
import { FtpFilesystemAdapter } from '../src';
import { join } from 'path';
import { ftpRootConfig, getFtpConfig } from './ftp.config';

describe('ftp adapter test', function (): void {
  this.timeout(10000);

  const aliOssRoot = ftpRootConfig;
  const getAdapter = () => new FtpFilesystemAdapter(getFtpConfig(), aliOssRoot);

  beforeEach(async function () {
    try {
      await getAdapter().deleteDirectory('');
    } catch (e) {}
  });

  afterEach(async function () {
    try {
      await getAdapter().deleteDirectory('');
    } catch (e) {}
  });

  filesystemAdapterSpecUtil(join(__dirname, '../../core/test/files/test-root'), getAdapter, ['mimetype']);
});
