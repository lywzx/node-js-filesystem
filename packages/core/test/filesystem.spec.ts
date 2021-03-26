import { use } from 'chai';
import { join } from 'path';
import { LocalFilesystemAdapter } from '@filesystem/core';
import chaiAsPromised from 'chai-as-promised';
import { filesystemTestCode } from './adapter-test-utilties/filesystem.spec.util';

use(chaiAsPromised);

describe('filesystem test', function () {
  const root = join(__dirname, './files/test-root');
  filesystemTestCode(() => new LocalFilesystemAdapter(root), root);
});
