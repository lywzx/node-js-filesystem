import {
  DirectoryAttributes,
  FileAttributes,
  Filesystem,
  IFilesystemAdapter,
  IFilesystemOperator,
  InvalidStreamProvidedException,
  LocalFilesystemAdapter,
  PathTraversalDetectedException,
  Visibility,
} from '../../src';
import { join } from 'path';
import { expect } from 'chai';
import { stream_with_contents } from '../test-util';
import getStream from 'get-stream';
import { Readable } from 'stream';

/**
 * filesystem test code util
 */
export function filesystemTestCode<T extends IFilesystemAdapter>(
  getAdapter: (root?: string) => T,
  rootLocal: string,
  skip: Array<'dir'> = []
) {
  let adapter: T;
  let filesystem: Filesystem<T>;

  beforeEach(() => {
    adapter = getAdapter();
    filesystem = new Filesystem(adapter);
  });

  afterEach(async () => {
    getAdapter();
    await new LocalFilesystemAdapter(join(rootLocal, '..')).deleteDirectory('test-root');
  });

  it('writing_and_reading_files', async function () {
    const writeContent = 'contents';
    const path = 'path.txt';
    await filesystem.write(path, writeContent);
    const readContent = (await filesystem.read(path)).toString();
    expect(readContent).to.be.eq(writeContent);
  });

  it('trying_to_write_with_an_invalid_stream_arguments', async function () {
    await expect(filesystem.writeStream('path.txt', '' as any)).to.be.rejectedWith(InvalidStreamProvidedException);
  });

  it('writing_and_reading_a_stream', async function () {
    const writeStream = await stream_with_contents('contents');

    await filesystem.writeStream('path.txt', writeStream);
    const readStream = await filesystem.readStream('path.txt');

    expect(readStream).to.be.instanceOf(Readable);
    expect(await getStream(readStream)).to.be.eq('contents');
  });

  it('checking_if_files_exist', async function () {
    await filesystem.write('path.txt', 'contents');

    expect(await filesystem.fileExists('path.txt')).to.be.true;
    expect(await filesystem.fileExists('other.txt')).to.be.false;
  });

  it('deleting_a_file', async function () {
    await filesystem.write('path.txt', 'content');
    await filesystem.delete('path.txt');

    expect(await filesystem.fileExists('path.txt')).to.be.false;
  });

  if (!skip.includes('dir')) {
    it('creating_a_directory', async function () {
      await filesystem.createDirectory('here');

      const directoryAttrs = await filesystem.listContents('');
      expect(directoryAttrs[0]).to.be.instanceOf(DirectoryAttributes);
      expect(directoryAttrs[0].path).to.be.eq('here');
    });

    it('listing_directory_contents', async function () {
      await filesystem.write('dirname/a.txt', 'contents');
      await filesystem.write('dirname/b.txt', 'contents');
      await filesystem.write('dirname/c.txt', 'contents');

      const listing = await filesystem.listContents('', false);

      expect(listing[0]).to.be.instanceOf(DirectoryAttributes);
      expect(listing).to.be.length(1);
    });

    it('listing_directory_contents_recursive', async function () {
      await filesystem.write('dirname/a.txt', 'contents');
      await filesystem.write('dirname/b.txt', 'contents');
      await filesystem.write('dirname/c.txt', 'contents');

      const list = await filesystem.listContents('', true);

      expect(list).to.be.length(4);
      expect(list.every((item) => item instanceof DirectoryAttributes || item instanceof FileAttributes)).to.be.true;
    });
  }

  it('deleting_a_directory', async function () {
    await filesystem.write('dirname/a.txt', 'contents');
    await filesystem.write('dirname/b.txt', 'contents');
    await filesystem.write('dirname/c.txt', 'contents');

    await filesystem.deleteDirectory('dir');

    expect(await filesystem.fileExists('dirname/a.txt')).to.be.true;

    await filesystem.deleteDirectory('dirname');

    expect(await filesystem.fileExists('dirname/a.txt')).to.be.false;
    expect(await filesystem.fileExists('dirname/b.txt')).to.be.false;
    expect(await filesystem.fileExists('dirname/c.txt')).to.be.false;
  });

  it('copying_files', async function () {
    await filesystem.write('path.txt', 'contents');

    await filesystem.copy('path.txt', 'new-path.txt');

    expect(await filesystem.fileExists('path.txt')).to.be.true;
    expect(await filesystem.fileExists('new-path.txt')).to.be.true;
  });

  it('moving_files', async function () {
    await filesystem.write('path.txt', 'contents');

    await filesystem.move('path.txt', 'new-path.txt');

    expect(await filesystem.fileExists('path.txt')).to.be.false;
    expect(await filesystem.fileExists('new-path.txt')).to.be.true;
  });

  it('fetching_last_modified', async function () {
    await filesystem.write('path.txt', 'contents');

    const lastModified = await filesystem.lastModified('path.txt');

    expect(lastModified).to.be.an('number');
    expect(Math.abs(lastModified - Date.now())).to.be.within(0, 5000);
  });

  it('fetching_mime_type', async function () {
    await filesystem.write('path.txt', 'contents');

    const mimeType = await filesystem.mimeType('path.txt');

    expect(mimeType).to.be.eq('text/plain');
  });

  it('fetching_file_size', async function () {
    await filesystem.write('path.txt', 'contents');

    const fileSize = await filesystem.fileSize('path.txt');

    expect(fileSize).to.be.eq(8);
  });

  it('ensuring_streams_are_rewound_when_writing', async function () {
    const writeStream = stream_with_contents('contents');
    // TODO rewind
    // fseek($writeStream, 4);

    await filesystem.writeStream('path.txt', writeStream);
    const contents = await filesystem.read('path.txt', { encoding: 'utf8' });

    expect(contents).to.be.eq('contents');
  });

  it('setting_visibility', async function () {
    await filesystem.write('path.txt', 'contents');

    await filesystem.setVisibility('path.txt', Visibility.PUBLIC);
    const publicVisibility = await filesystem.visibility('path.txt');

    await filesystem.setVisibility('path.txt', Visibility.PRIVATE);
    const privateVisibility = await filesystem.visibility('path.txt');

    expect(publicVisibility).to.be.eq(Visibility.PUBLIC);
    expect(privateVisibility).to.be.eq(Visibility.PRIVATE);
  });

  it('protecting_against_path_traversals', async function () {
    const fns = [
      async function (filesystem: IFilesystemOperator) {
        await filesystem.delete('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.deleteDirectory('../path');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.createDirectory('../path');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.read('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.readStream('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.write('../path.txt', 'contents');
      },
      async function (filesystem: IFilesystemOperator) {
        const stream = stream_with_contents('contents');
        await filesystem.writeStream('../path.txt', stream);
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.listContents('../path');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.fileExists('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.mimeType('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.fileSize('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.lastModified('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.visibility('../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.setVisibility('../path.txt', Visibility.PUBLIC);
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.copy('../path.txt', 'path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.copy('path.txt', '../path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.move('../path.txt', 'path.txt');
      },
      async function (filesystem: IFilesystemOperator) {
        await filesystem.move('path.txt', '../path.txt');
      },
    ];

    for (const fn of fns) {
      await expect(fn(filesystem)).to.be.rejectedWith(PathTraversalDetectedException);
    }
  });
}
