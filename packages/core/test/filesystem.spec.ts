import { expect } from 'chai';
import { join } from 'path';
import { Filesystem, LocalFilesystemAdapter } from '../src';

describe('filesystem test', function () {
  const root = join(__dirname, './files/test-root');
  let adapter: LocalFilesystemAdapter;
  let filesystem: Filesystem;

  before(() => {
    adapter = new LocalFilesystemAdapter(root);
    filesystem = new Filesystem(adapter);
  });

  after(async () => {
    await new LocalFilesystemAdapter(join(root, '..')).deleteDirectory('test-root');
  });

  it('write and reading files', async function () {
    const writeContent = 'contents';
    const path = 'path.txt';
    await filesystem.write(path, writeContent);
    const readContent = (await filesystem.read(path)).toString();
    expect(readContent).to.be.eq(writeContent);
  });
});
