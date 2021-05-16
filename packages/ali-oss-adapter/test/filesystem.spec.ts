import { use } from 'chai';
import { join } from 'path';
import chaiAsPromised from 'chai-as-promised';
import { filesystemTestCode } from '@filesystem/core/test/adapter-test-utilties/filesystem.spec.util';
import { AliOssFilesystemAdapter } from '../src';
import { aliOssTestRootDir, getAliOssConfig } from './ali-oss.config';

use(chaiAsPromised);

describe('filesystem use ali oss test', function () {
  this.timeout(10000);

  const root = join(__dirname, '../../core/test/files/test-root');
  filesystemTestCode(() => new AliOssFilesystemAdapter(getAliOssConfig(), aliOssTestRootDir), root, ['dir']);
});
