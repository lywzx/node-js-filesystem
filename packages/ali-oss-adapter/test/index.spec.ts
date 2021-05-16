import { filesystemAdapterSpecUtil } from '@filesystem/core/test/adapter-test-utilties/filesystem-adapter.spec.util';
import { AliOssFilesystemAdapter } from '../src';
import { join } from 'path';
import { aliOssTestRootDir, getAliOssConfig } from './ali-oss.config';

describe('ali-oss adapter test', function (): void {
  this.timeout(10000);

  const aliOssRoot = aliOssTestRootDir;
  const getAdapter = () => new AliOssFilesystemAdapter(getAliOssConfig(), aliOssRoot);

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
