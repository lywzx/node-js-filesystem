import { expect, use } from 'chai';
import { join } from 'path';
import {
  Filesystem,
  LocalFilesystemAdapter,
  InvalidStreamProvidedException,
  DirectoryAttributes,
  FileAttributes,
} from '@filesystem/core';
import chaiAsPromised from 'chai-as-promised';
import { stream_with_contents } from './test-util';
import { ReadStream } from 'fs';
import getStream from 'get-stream';

use(chaiAsPromised);

describe('filesystem test', function () {
  const root = join(__dirname, './files/test-root');
  let adapter: LocalFilesystemAdapter;
  let filesystem: Filesystem;

  beforeEach(() => {
    adapter = new LocalFilesystemAdapter(root);
    filesystem = new Filesystem(adapter);
  });

  afterEach(async () => {
    await new LocalFilesystemAdapter(join(root, '..')).deleteDirectory('test-root');
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

    expect(readStream).to.be.instanceOf(ReadStream);
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

  it('creating_a_directory', async function () {
    await filesystem.createDirectory('here');

    const directoryAttrs = await filesystem.listContents('');
    expect(directoryAttrs[0]).to.be.instanceOf(DirectoryAttributes);
    expect(directoryAttrs[0].path).to.be.eq('here');
  });

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
    expect(lastModified > Date.now() - 30).to.be.true;
    expect(lastModified < Date.now() + 30).to.be.true;
  });

  it('fetching_mime_type', async function () {
    /*await filesystem.write('path.txt', 'contents');

    $mimeType = await filesystem.mimeType('path.txt');

    $this->assertEquals('text/plain', $mimeType);*/
  });

  it('fetching_file_size', async function () {
    /*await filesystem.write('path.txt', 'contents');

    $fileSize = await filesystem.fileSize('path.txt');

    $this->assertEquals(8, $fileSize);*/
  });

  it('ensuring_streams_are_rewound_when_writing', async function () {
    /* $writeStream = stream_with_contents('contents');
    fseek($writeStream, 4);

    await filesystem.writeStream('path.txt', $writeStream);
    $contents = await filesystem.read('path.txt');

    $this->assertEquals('contents', $contents);*/
  });

  it('setting_visibility', async function () {
    /*await filesystem.write('path.txt', 'contents');

    await filesystem.setVisibility('path.txt', Visibility::PUBLIC);
    $publicVisibility = await filesystem.visibility('path.txt');

    await filesystem.setVisibility('path.txt', Visibility::PRIVATE);
    $privateVisibility = await filesystem.visibility('path.txt');

    $this->assertEquals(Visibility::PUBLIC, $publicVisibility);
    $this->assertEquals(Visibility::PRIVATE, $privateVisibility);*/
  });

  it('protecting_against_path_traversals', async function () {
    /*const fns = [
      function (FilesystemOperator $filesystem) {
        $filesystem->delete('../path.txt');
      },
    function (FilesystemOperator $filesystem) {
      $filesystem->deleteDirectory('../path');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->createDirectory('../path');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->read('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->readStream('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->write('../path.txt', 'contents');
    },
    function (FilesystemOperator $filesystem) {
      $stream = stream_with_contents('contents');
      try {
        $filesystem->writeStream('../path.txt', $stream);
      } finally {
        fclose($stream);
      }
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->listContents('../path');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->fileExists('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->mimeType('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->fileSize('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->lastModified('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->visibility('../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->setVisibility('../path.txt', Visibility::PUBLIC);
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->copy('../path.txt', 'path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->copy('path.txt', '../path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->move('../path.txt', 'path.txt');
    },
    function (FilesystemOperator $filesystem) {
      $filesystem->move('path.txt', '../path.txt');
    }
    ];
    
    
    $this->expectException(PathTraversalDetected::class);
    $scenario($this->filesystem);*/
  });
});
