import { LocalFilesystemAdapter, Visibility } from '@filesystem/core';
import { abortBucketWorm } from 'ali-oss/lib/common/bucket/abortBucketWorm';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import { uniqueId } from 'lodash';
import { platform } from 'os';
import { join } from 'path';
import { fake, replace, restore } from 'sinon';
import { Readable } from 'stream';
import { SymbolicLinkEncounteredException } from '../../src/exceptions/symbolic-link-encountered.exception';
import { UnableToCopyFileException } from '../../src/exceptions/unable-to-copy-file.exception';
import { UnableToCreateDirectoryException } from '../../src/exceptions/unable-to-create-directory.exception';
import { UnableToDeleteFileException } from '../../src/exceptions/unable-to-delete-file.exception';
import { UnableToRetrieveMetadataException } from '../../src/exceptions/unable-to-retrieve-metadata.exception';
import { UnableToSetVisibilityException } from '../../src/exceptions/unable-to-set-visibility.exception';
import { UnableToWriteFileException } from '../../src/exceptions/unable-to-write-file.exception';
import { UnableToMoveFileException } from '../../src/interfaces/unable-to-move-file.exception';
import { PortableVisibilityConverter } from '../../src/libs/UnixVisibility/portable-visibility-converter';
import { isDir, mkDir, rmDir } from '../../src/util';
import * as fsExtra from '../../src/util/fs-extra.util';
import { lstat, readFile, stat } from '../../src/util/fs-extra.util';

use(chaiAsPromised);

function generateTestFile(prefix = '') {
  return `${prefix}file_${uniqueId()}.txt`;
}

const IS_WINDOWS = platform() === 'win32';

describe('local adapter test', function (): void {
  this.timeout(5000);

  const root = join(__dirname, '../files/test-root');

  beforeEach(async function () {
    try {
      await rmDir(root);
    } catch (e) {
      console.log(e);
    }
  });

  afterEach(async function () {
    try {
      await rmDir(root);
    } catch (e) {
      console.log(e);
    }
  });

  it('creating_a_local_filesystem_creates_a_root_directory', async function () {
    new LocalFilesystemAdapter(root);
    expect(await isDir(root)).to.be.eq(true);
  });

  it('not_being_able_to_create_a_root_directory_results_in_an_exception', function () {
    expect(() => {
      new LocalFilesystemAdapter('/cannot-create/this-directory/');
    }).to.throw(UnableToCreateDirectoryException);
  });

  it('writing_a_file', async function () {
    const writeContent = 'contents';
    const adapter = new LocalFilesystemAdapter(root);

    await adapter.write('/file.txt', writeContent);

    expect(await adapter.fileExists('/file.txt')).to.be.true;

    expect(fs.readFileSync(join(root, './file.txt'), { flag: 'r', encoding: 'utf8' })).to.be.eq(writeContent);
  });

  it('writing_a_file_with_a_stream', async function () {
    const adapter = new LocalFilesystemAdapter(root);

    const writeContent = 'contents';
    const stream = new Readable({
      // eslint-disable-next-line no-unused-vars
      read(size: number) {
        this.push(writeContent);
        this.push(null);
      },
    });
    const file = './file.txt';
    await adapter.write(file, writeContent);

    await adapter.writeStream(file, stream);
    stream.destroy();

    expect(await adapter.fileExists(file)).to.be.true;
    expect(await readFile(join(root, file), { encoding: 'utf8' })).to.be.eq(writeContent);
  });

  it('writing_a_file_with_a_stream_and_visibility', async function () {
    const adapter = new LocalFilesystemAdapter(root);
    const stream = new Readable({
      // eslint-disable-next-line no-unused-vars
      read(size: number) {
        this.push('something');
        this.push(null);
      },
    });
    const filePath = './file.txt';

    await adapter.writeStream(filePath, stream, { visibility: Visibility.PRIVATE });

    expect(await readFile(join(root, filePath), { encoding: 'utf8' })).to.be.eq('something');
    expect((await stat(join(root, filePath))).mode & 0o0777).to.be.eq(0o0600);
  });

  it('writing_a_file_with_visibility', async function () {
    const adapter = new LocalFilesystemAdapter(root, new PortableVisibilityConverter());
    await adapter.write('/file.txt', 'contents', {
      visibility: Visibility.PRIVATE,
    });
    expect(await readFile(join(root, './file.txt'), { encoding: 'utf8' })).to.be.contain('contents');
    expect((await stat(join(root, './file.txt'))).mode & 0o0777).to.be.eq(0o0600);
  });

  it('failing_to_set_visibility', async function () {
    const adapter = new LocalFilesystemAdapter(root);

    await expect(adapter.setVisibility('./file.txt', Visibility.PUBLIC)).to.be.rejectedWith(
      UnableToSetVisibilityException
    );
  });

  it('failing_to_write_a_file', async function () {
    await expect(new LocalFilesystemAdapter('/').write('/cannot-create-a-file-here', 'contents')).to.be.rejectedWith(
      UnableToWriteFileException
    );
  });

  it('failing_to_write_a_file_using_a_stream', async function () {
    const stream = new Readable({
      // eslint-disable-next-line no-unused-vars
      read(size: number) {
        this.push('something');
        this.push(null);
      },
    });
    await expect(new LocalFilesystemAdapter('/').writeStream('/cannot-create-a-file-here', stream)).to.be.rejectedWith(
      UnableToWriteFileException
    );
  });

  it('deleting_a_file', async function () {
    const adapter = new LocalFilesystemAdapter(root);
    await adapter.write('/file.txt', 'contents');
    await adapter.delete('/file.txt');
    expect(await adapter.fileExists('/file.txt')).to.be.false;
  });

  it('deleting_a_file_that_does_not_exist', async function () {
    const adapter = new LocalFilesystemAdapter(root);
    await adapter.delete('/file.txt');
    expect(true).to.be.true;
  });

  it('deleting_a_file_that_cannot_be_deleted', async function () {
    const file = 'here.txt';
    const adapter = new LocalFilesystemAdapter(root);
    replace(fsExtra, 'pathExists', fake.returns(true));
    replace(fsExtra, 'unlink', fake.returns(Promise.reject(new Error('unknown'))));

    await expect(adapter.delete(file)).to.be.rejectedWith(UnableToDeleteFileException);
    restore();
  });

  it('checking_if_a_file_exists', async function () {
    const adapter = new LocalFilesystemAdapter(root);
    await fs.writeFileSync(join(root, './file.txt'), 'contents');
    expect(await adapter.fileExists('./file.txt')).to.be.true;
  });

  it('checking_if_a_file_exists_that_does_not_exsist', async function () {
    const adapter = new LocalFilesystemAdapter(root);
    expect(await adapter.fileExists('/file.txt')).to.be.false;
  });

  describe('#listing_contents', function () {
    it('listing_contents', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('directory/filename.txt', 'content');
      await adapter.write('filename.txt', 'content');
      /** @var Traversable $contentListing */
      const contentListing = await adapter.listContents('/', false);

      expect(contentListing).to.be.length(2);
    });

    it('listing_contents_recursively', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('directory/filename.txt', 'content');
      await adapter.write('filename.txt', 'content');
      /** @var Traversable $contentListing */
      const contentListing = await adapter.listContents('/', true);

      expect(contentListing).to.be.length(3);
    });

    it('listing_a_non_existing_directory', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      /** @var Traversable $contentListing */
      const contentListing = await adapter.listContents('/directory/', false);

      expect(contentListing).to.be.length(0);
    });

    it('listing_directory_contents_with_link_skipping', async function () {
      const adapter = new LocalFilesystemAdapter(root, undefined, 'wx', LocalFilesystemAdapter.SKIP_LINKS);
      await fsExtra.writeFile(join(root, './file.txt'), 'content');
      await fsExtra.symlink(join(root, './file.txt'), join(root, './link.txt'), 'file');

      /** @var Traversable $contentListing */
      const contentListing = await adapter.listContents('/', true);

      expect(contentListing).to.be.length(1);
    });

    it('listing_directory_contents_with_disallowing_links', async function () {
      const adapter = new LocalFilesystemAdapter(root, undefined, 'wx', LocalFilesystemAdapter.DISALLOW_LINKS);
      await fsExtra.writeFile(join(root, './file.txt'), 'content');
      await fsExtra.symlink(join(root, './file.txt'), join(root, './link.txt'), 'file');

      /** @var Traversable $contentListing */
      await expect(adapter.listContents('/', true)).to.be.rejectedWith(SymbolicLinkEncounteredException);
    });
  });

  describe('#deleteDirectory', function () {
    it('deleting_a_directory', async function () {
      const subdir = './directory/subdir';
      const adapter = new LocalFilesystemAdapter(root);
      await mkDir(join(root, subdir), 0o0744);

      expect(await isDir(join(root, subdir))).to.be.true;
      await fsExtra.writeFile(join(root, subdir, 'file.txt'), 'content');
      await fsExtra.symlink(join(root, subdir, 'file.txt'), join(root, subdir, 'link.txt'));

      await adapter.deleteDirectory(subdir);

      expect(await isDir(join(root, subdir))).to.be.false;

      await adapter.deleteDirectory('directory');

      expect(await isDir(join(root, './directory/'))).to.be.false;
    });

    it('deleting_directories_with_other_directories_in_it', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('a/b/c/d/e.txt', 'contents');
      await adapter.deleteDirectory('a/b');

      expect(await isDir(join(root, './a'))).to.be.true;
      expect(await isDir(join(root, './a/b'))).to.be.false;
    });

    it('deleting_a_non_existing_directory', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.deleteDirectory('/non-existing-directory/');
      expect(true).to.be.true;
    });

    it('not_being_able_to_delete_a_directory', async function () {
      /*$this->expectException(UnableToDeleteDirectory::class);

      mock_function('rmdir', false);

      const adapter = new LocalFilesystemAdapter(root);
      await adapter.createDirectory('/etc/');
      await expect().to.be.rejectedWith()
      adapter.deleteDirectory('/etc/');*/
    });

    it('not_being_able_to_delete_a_sub_directory', function () {
      /*$this->expectException(UnableToDeleteDirectory::class);

      mock_function('rmdir', false);

      const adapter = new LocalFilesystemAdapter(root);
      adapter.createDirectory('/etc/subdirectory/', new Config());
      adapter.deleteDirectory('/etc/');*/
    });
  });

  describe('#createDirectory', function () {
    it('creating_a_directory', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.createDirectory('public', { visibility: Visibility.PUBLIC });

      expect(await isDir(join(root, './public'))).to.be.true;
      expect((await lstat(join(root, './public'))).mode & 0o1777).to.be.eq(0o0755);

      await adapter.createDirectory('private', { visibility: Visibility.PRIVATE });
      expect(await isDir(join(root, './private'))).to.be.true;
      expect((await lstat(join(root, './private'))).mode & 0o1777).to.be.eq(0o0700);

      await adapter.createDirectory('also_private', { directory_visibility: Visibility.PRIVATE });
      expect(await isDir(join(root, './also_private'))).to.be.true;
      expect((await lstat(join(root, './also_private'))).mode & 0o1777).to.be.eq(0o0700);
    });

    it('not_being_able_to_create_a_directory', async function () {
      const adapter = new LocalFilesystemAdapter('/');
      await expect(adapter.createDirectory('/something/')).to.be.rejectedWith(UnableToCreateDirectoryException);
    });

    it('creating_a_directory_is_idempotent', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.createDirectory('/something/', { visibility: Visibility.PRIVATE });

      expect((await lstat(join(root, './something'))).mode & 0o1777).to.be.eq(0o0700);

      await adapter.createDirectory('/something/', { visibility: Visibility.PUBLIC });
      expect((await lstat(join(root, './something'))).mode & 0o1777).to.be.eq(0o0755);
    });
  });

  describe('#visibility', function () {
    it('retrieving_visibility', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('public.txt', 'contents', { visibility: Visibility.PUBLIC });
      expect((await adapter.visibility('public.txt')).visibility).to.be.eq(Visibility.PUBLIC);

      await adapter.write('private.txt', 'contents', { visibility: 'private' });
      expect((await adapter.visibility('private.txt')).visibility).to.be.eq(Visibility.PRIVATE);
    });

    it('not_being_able_to_retrieve_visibility', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.visibility('something.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
    });
  });

  describe('#move', function () {
    it('moving_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('first.txt', 'contents');
      expect(await adapter.fileExists('first.txt')).to.be.true;
      await adapter.move('first.txt', 'second.txt');
      expect(await adapter.fileExists('second.txt')).to.be.true;
      expect(await adapter.fileExists('first.txt')).to.be.false;
    });

    it('not_being_able_to_move_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.move('first.txt', 'second.txt')).to.be.rejectedWith(UnableToMoveFileException);
    });
  });

  describe('#copy', function () {
    it('copying_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('first.txt', 'contents');
      await adapter.copy('first.txt', 'second.txt');
      expect(await adapter.fileExists('first.txt')).to.be.true;
      expect(await adapter.fileExists('second.txt')).to.be.true;
    });

    it('not_being_able_to_copy_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.copy('first.txt', 'second.txt')).to.be.rejectedWith(UnableToCopyFileException);
    });
  });

  it('getting_mimetype', function () {
    /*const adapter = new LocalFilesystemAdapter(root);
    adapter.write(
      'flysystem.svg',
      (string) file_get_contents(__DIR__ . '/../AdapterTestUtilities/test_files/flysystem.svg'),
    new Config()
  );
    $this->assertStringStartsWith('image/svg', adapter.mimeType('flysystem.svg')->mimeType());*/
  });

  it('fetching_unknown_mime_type_of_a_file', function () {
    /*$this->useAdapter(new LocalFilesystemAdapter(self::ROOT, null, LOCK_EX, LocalFilesystemAdapter::DISALLOW_LINKS, new ExtensionMimeTypeDetector(new EmptyExtensionToMimeTypeMap())));

    parent::fetching_unknown_mime_type_of_a_file();*/
  });

  it('not_being_able_to_get_mimetype', function () {
    /*$this->expectException(UnableToRetrieveMetadata::class);
    const adapter = new LocalFilesystemAdapter(root);
    adapter.mimeType('flysystem.svg');*/
  });

  it('getting_last_modified', function () {
    /*const adapter = new LocalFilesystemAdapter(root);
    adapter.write('first.txt', 'contents', new Config());
    mock_function('filemtime', $now = time());
    $lastModified = adapter.lastModified('first.txt')->lastModified();
    $this->assertEquals($now, $lastModified);*/
  });

  it('not_being_able_to_get_last_modified', function () {
    /*$this->expectException(UnableToRetrieveMetadata::class);
    const adapter = new LocalFilesystemAdapter(root);
    adapter.lastModified('first.txt');*/
  });

  it('getting_file_size', function () {
    /*const adapter = new LocalFilesystemAdapter(root);
    adapter.write('first.txt', 'contents', new Config());
    $fileSize = adapter.fileSize('first.txt');
    $this->assertEquals(8, $fileSize->fileSize());*/
  });

  it('not_being_able_to_get_file_size', function () {
    /*$this->expectException(UnableToRetrieveMetadata::class);
    const adapter = new LocalFilesystemAdapter(root);
    adapter.fileSize('first.txt');*/
  });

  it('reading_a_file', function () {
    /*const adapter = new LocalFilesystemAdapter(root);
    adapter.write('path.txt', 'contents', new Config());
    $contents = adapter.read('path.txt');
    $this->assertEquals('contents', $contents);*/
  });

  it('not_being_able_to_read_a_file', function () {
    /*$this->expectException(UnableToReadFile::class);
    const adapter = new LocalFilesystemAdapter(root);
    adapter.read('path.txt');*/
  });

  it('reading_a_stream', function () {
    /*const adapter = new LocalFilesystemAdapter(root);
    adapter.write('path.txt', 'contents', new Config());
    $contents = adapter.readStream('path.txt');
    $this->assertIsResource($contents);
    $fileContents = stream_get_contents($contents);
    fclose($contents);
    $this->assertEquals('contents', $fileContents);*/
  });

  it('not_being_able_to_stream_read_a_file', function () {
    /*$this->expectException(UnableToReadFile::class);
    const adapter = new LocalFilesystemAdapter(root);
    adapter.readStream('path.txt');*/
  });

  /*describe('test link', function () {

    it('test constructor with link', async function () {
      if (IS_WINDOWS) {
        // File permissions not supported on Windows.
        return this.skip();
      }

      const target = join(__dirname, 'files/');
      const link = __dirname + sep + 'link_to_files';
      await symlink(target, link);

      const adp = new LocalFilesystemAdapter(link);
      expect(target, adp.getPathPrefix());
      await unlink(link);
    });

    it('test links are deleted during delete dir', async function () {
      await mkDir(root + 'subdir');
      const original = root + 'original.txt';
      const link = root + 'subdir/link.txt';
      await writeFile(original, 'something');
      await symlink(original, link);
      const adp = new LocalFilesystemAdapter(root, 'w', LocalFilesystemAdapter.SKIP_LINKS);

      expect(await isSymbolicLink(link)).to.be.eq(true);

      await adp.deleteDir('subdir');

      expect(await isSymbolicLink(link)).to.be.eq(false);

      await adapter.delete('original.txt');
    });
  });

  it('test relative roots are supported', function () {
    new LocalFilesystemAdapter(join(__dirname, 'files/../files'));
  });

  it('test not writable root', async function () {
    if (IS_WINDOWS) {
      // File permissions not supported on Windows.
      this.skip();
    }
    const rootDir = join(root, 'not-writable');
    try {
      await mkDir(rootDir, 0o000);
      new LocalFilesystemAdapter(rootDir);
    } catch (e) {
      await rmdir(rootDir);
      expect(e.message).to.be.include('readable');
    }
  });

  describe('local adapter methods', function () {
    describe('#has()', function () {
      it('test has with dir', async function () {
        const testDir = '0';

        await adapter.createDir(testDir);

        const hasDir = await adapter.has(testDir);

        expect(hasDir).to.be.equal(true);

        await adapter.deleteDir(testDir);
      });

      it('test has with file', async function () {
        const testFile = generateTestFile();

        await adapter.write(testFile, 'content');

        expect(await adapter.has(testFile)).to.be.eq(true);

        await adapter.delete(testFile);
      });
    });

    //describe('#write()', function () {});

    describe('#writeStream', function () {
      it('test write stream', async function () {
        const temp = generateTestFile('dir/');
        await adapter.write(temp, 'dummy');
        const readStream = adapter.readStream(temp);
        const target = generateTestFile('dir/');
        await adapter.writeStream(target, readStream.stream);

        expect(await adapter.has(target)).to.be.eq(true);

        const result = (await adapter.read(target)) as string;

        expect(result.toString()).to.be.eq('dummy');

        await adapter.deleteDir('dir');
      });
    });

    describe('#readStream', function () {
      it('test read stream', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, 'contents');

        const result = adapter.readStream(fileName);

        expect(result).to.be.an('object').to.haveOwnProperty('type', 'file');

        expect(result).to.haveOwnProperty('path');

        expect(result).to.haveOwnProperty('stream');

        expect(result.stream).to.be.instanceOf(ReadStream);

        await adapter.delete(fileName);
      });
    });

    describe('#updateStream', function () {
      it('test update stream', async function () {
        const fileName = generateTestFile();
        const tmpFile = generateTestFile();

        await adapter.write(fileName, 'initial');

        await adapter.write(tmpFile, 'dummy');

        const readStream = adapter.readStream(tmpFile);
        await adapter.updateStream(fileName, readStream.stream);

        expect(await adapter.has(fileName)).to.be.eq(true);

        await adapter.delete(tmpFile);

        await adapter.delete(fileName);
      });
    });

    describe('#rename', function () {
      it('test rename to none existing directory', async function () {
        const fileName = generateTestFile();
        const dir = `${uniqueId()}`;
        const targetFileName = generateTestFile(dir + '/');
        await adapter.write(fileName, 'contents');

        expect(await isDir(adapter.applyPathPrefix(dir))).to.be.eq(false);

        expect(await adapter.rename(fileName, targetFileName)).to.be.eq(true);

        await adapter.deleteDir(dir);
      });
    });

    describe('#copy', function () {
      it('test copy', async function () {
        await adapter.write('file.ext', 'content');

        expect(await adapter.copy('file.ext', 'new.ext'));

        expect(await adapter.has('new.ext'));

        await adapter.delete('new.ext');

        await adapter.delete('file.ext');
      });
    });

    describe('#delete', function () {
      it('should delete exists file return true', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, 'contents');

        expect(await adapter.delete(fileName)).to.be.eq(true);
      });

      it('should delete not exitst file return false', async function () {
        expect(await adapter.delete('missing.txt')).to.be.eq(false);
      });
    });

    describe('#listContents', function () {
      it('test listing none existing directory', async function () {
        expect(await adapter.listContents('nonexisting/directory')).to.eql([]);
      });

      it('test list content one file', async function () {
        const fileName = generateTestFile('dirname/');

        await adapter.write(fileName, 'contents');

        const content = await adapter.listContents('dirname', false);

        expect(content).lengthOf(1);

        expect(content[0]).haveOwnProperty('type');

        await adapter.deleteDir('dirname');
      });

      it('test list contents recursive', async function () {
        await adapter.write('dirname1/dirname/file.txt', 'contents');
        await adapter.write('dirname1/dirname/others.txt', 'contents');

        const contents = await adapter.listContents('dirname1', true);

        expect(contents).lengthOf(3);

        await adapter.deleteDir('dirname1');
      });

      it('test link caused Unsupported Exception', async function () {
        const origin = adapter.applyPathPrefix('link_test/original.txt');
        const link = adapter.applyPathPrefix('link_test/link.txt');

        await adapter.write('link_test/original.txt', 'something');

        await symlink(origin, link, 'file');

        try {
          await adapter.listContents('link_test');
          throw new Error('any error msg');
        } catch (e) {
          expect(e.name).to.be.eq(NotSupportedException.name);
        }

        await adapter.deleteDir('link_test');
      });

      it('test link is skipped', async function () {
        const origin = adapter.applyPathPrefix('link_test_1/original.txt');
        const link = adapter.applyPathPrefix('link_test_1/link.txt');

        await adapter.write('link_test_1/original.txt', 'something');

        await symlink(origin, link, 'file');

        const adp = new LocalFilesystemAdapter(root, 'w', LocalFilesystemAdapter.SKIP_LINKS);

        const contents = await adp.listContents('link_test_1');

        expect(contents).lengthOf(1);

        await adp.deleteDirectory('link_test_1');
      });
    });

    // describe('#getMetadata', function () {});

    describe('#getSize', function () {
      it('test get size', async function () {
        const fileName = generateTestFile('get_size_test/');
        await adapter.write(fileName, '1234');

        const result = await adapter.getSize(fileName);

        expect(result).to.be.instanceOf(Object);

        expect(result).haveOwnProperty('size');

        expect(result.size).to.be.eq(4);

        await adapter.deleteDir('get_size_test');
      });
    });

    describe('#getMimetype', function () {
      it('test mimetype fallback on extension', async function () {
        const mimetype = ((await adapter.getMimetype('test-image.png')) as any)['mimetype'];

        expect('image/png').eq(mimetype);
      });
    });

    describe('#getTimestamp', function () {
      it('test get timestamp', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, '1234');

        const result = await adapter.getTimestamp(fileName);

        expect(result).to.be.instanceOf(Object);

        expect(result).haveOwnProperty('timestamp');

        expect((result as ListContentInfo).timestamp).to.be.an('number');

        await adapter.delete(fileName);
      });
    });

    describe('test visibility', function () {
      it('test visibility private file', async function () {
        if (IS_WINDOWS) {
          this.skip();
          // Visibility not supported on Windows.
        }

        const fileName = 'private/path.txt';
        await adapter.write(fileName, 'content', { visibility: Visibility.PUBLIC });
        let output = await adapter.getVisibility(fileName);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PUBLIC);

        await adapter.setVisibility(fileName, Visibility.PRIVATE);

        output = await adapter.getVisibility(fileName);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PRIVATE);

        const stats = await stat(adapter.applyPathPrefix(fileName));
        expect(stats.mode & 0o1777).to.be.eq(0o600);

        await adapter.deleteDir('private');
      });

      it('test visibility public file', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          return this.skip();
        }
        const path = 'test_visibility/path.txt';
        await adapter.write(path, 'content', {
          visibility: Visibility.PRIVATE,
        });
        let output = await adapter.getVisibility(path);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PRIVATE);

        await adapter.setVisibility(path, Visibility.PUBLIC);
        output = await adapter.getVisibility(path);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PUBLIC);

        const stats = await stat(adapter.applyPathPrefix(path));
        expect(stats.mode & 0o1777).to.be.eq(0o644);

        await adapter.deleteDir('test_visibility');
      });

      it('test create dir default visibility', async function () {
        if (IS_WINDOWS) {
          // window not support
          return this.skip();
        }

        await adapter.createDir('test-dir');

        const output = await adapter.getVisibility('test-dir');

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PUBLIC);

        await adapter.deleteDir('test-dir');
      });

      it('test visibility public dir', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          this.skip();
        }
        const dir = 'public-dir';
        await adapter.createDir(dir, { visibility: Visibility.PRIVATE });
        let output = await adapter.getVisibility(dir);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PRIVATE);

        await adapter.setVisibility('public-dir', Visibility.PUBLIC);
        output = await adapter.getVisibility('public-dir');
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PUBLIC);

        await adapter.deleteDir('public-dir');
      });

      it('test visibility private dir', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          return this.skip();
        }
        const dir = 'private-dir';
        await adapter.createDir('private-dir', { visibility: Visibility.PUBLIC });
        let output = await adapter.getVisibility(dir);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PUBLIC);

        await adapter.setVisibility(dir, Visibility.PRIVATE);
        output = await adapter.getVisibility(dir);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(Visibility.PRIVATE);

        await adapter.deleteDir('private-dir');
      });

      it('test visibility fail', async function () {
        expect(await adapter.setVisibility('chmod.fail', Visibility.PRIVATE)).to.be.eq(false);
      });

      it('test unknown visibility', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          return this.skip();
        }

        const dir = adapter.applyPathPrefix('subdir');

        await mkdir(dir, 0o750 as any);
        const output = await adapter.getVisibility('subdir');

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq('0750');

        await adapter.deleteDir('subdir');
      });

      it('test customized visibility', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          return this.skip();
        }

        // override a permission mapping
        const permissions = {
          dir: {
            private: 0o770, // private to me and the gang
          },
        };

        const newAdp = new LocalFilesystemAdapter(
          join(root, 'temp'),
          'w',
          LocalFilesystemAdapter.DISALLOW_LINKS,
          permissions
        );

        await newAdp.createDir('private-dir');
        await newAdp.setVisibility('private-dir', Visibility.PRIVATE);

        const output = await newAdp.getVisibility('private-dir');

        expect(output.visibility).to.be.eq(Visibility.PRIVATE);

        const stats = await stat(newAdp.applyPathPrefix('private-dir'));
        expect(stats.mode & 0o1777).to.be.eq(0o770);

        await adapter.deleteDir('temp');
      });

      it('test custom visibility', async function () {
        if (IS_WINDOWS) {
          // Visibility not supported on Windows.
          return this.skip();
        }

        // override a permission mapping
        const permissions = {
          dir: {
            yolo: 0o777, // private to me and the gang
          },
        };

        const newAdp = new LocalFilesystemAdapter(
          join(root, 'temp_custom'),
          'w',
          LocalFilesystemAdapter.DISALLOW_LINKS,
          permissions
        );

        await newAdp.createDir('yolo-dir');
        await newAdp.setVisibility('yolo-dir', 'yolo');

        const output = await newAdp.getVisibility('yolo-dir');
        expect(output.visibility).to.be.eq('yolo');
        const stats = await stat(newAdp.applyPathPrefix('yolo-dir'));
        expect(stats.mode & 0o1777).to.be.eq(0o777);

        await adapter.deleteDir('temp_custom');
      });

      it('test first visibility octet', async function () {
        if (IS_WINDOWS) {
          return this.skip();
        }
        const permissions = {
          file: {
            public: 0o644,
            private: 0o600,
          },
          dir: {
            sticky: 0o1777,
            public: 0o755,
            private: 0o700,
          },
        };

        const newAdp = new LocalFilesystemAdapter(
          join(root, 'first_visibility_octet'),
          'w',
          LocalFilesystemAdapter.DISALLOW_LINKS,
          permissions
        );

        await newAdp.createDir('sticky-dir');
        await newAdp.setVisibility('sticky-dir', 'sticky');

        const output = await newAdp.getVisibility('sticky-dir');
        expect(output.visibility).to.be.eq('sticky');

        const stats = await lstat(newAdp.applyPathPrefix('sticky-dir'));
        expect(stats.mode & 0o1777).to.be.eq(0o1777);

        await adapter.deleteDir('first_visibility_octet');
      });
    });

    // describe('#setVisibility', function () {});

    describe('#createDir', function () {
      it('test create zero dir', async function () {
        await adapter.createDir('0');

        expect(await isDir(adapter.applyPathPrefix('0'))).to.be.eq(true);

        await adapter.deleteDir('0');
      });

      it('test create dir failed', async function () {
        const origin = 'exits_file';

        await adapter.write(origin, '');

        expect(await adapter.createDir(origin)).to.be.eq(false);

        await adapter.delete(origin);
      });
    });

    describe('#deleteDir', function () {
      it('test adapter delete dir ', async function () {
        await adapter.write('nested/dir/path.txt', 'contents');

        expect(await isDir(join(__dirname, 'files/nested/dir'))).to.be.eq(true);

        await adapter.deleteDir('nested');

        expect(await adapter.has('nested/dir/path.txt')).to.be.eq(false);

        expect(await isDir(join(__dirname, 'files/nested/dir'))).to.be.eq(false);
      });
    });

    describe('#prefix', function () {
      it('test null prefix', async function () {
        const loc = new LocalFilesystemAdapter(join(__dirname, 'files'));
        loc.setPathPrefix('');

        const path = join('some', 'path.ext');

        expect(loc.applyPathPrefix(path)).to.be.eq(path);

        expect(loc.removePathPrefix(path)).to.be.eq(path);
      });

      it('test windows prefix', async function () {
        const path = `some${sep}path.ext`;
        let expected = `c:${sep}${path}`;

        const adp = new LocalFilesystemAdapter(root);

        adp.setPathPrefix('c:/');

        let prefixed = adp.applyPathPrefix(path);

        expect(expected).to.be.eq(prefixed);

        expect(path, adp.removePathPrefix(prefixed));

        expected = 'c:\\\\some\\dir' + sep + path;
        adp.setPathPrefix('c:\\\\some\\dir\\');

        prefixed = adp.applyPathPrefix(path);
        expect(expected).to.be.eq(prefixed);
        expect(path, adp.removePathPrefix(prefixed));
      });

      it('test get path prefix', async function () {
        expect(await realpath(root)).to.be.eq(await realpath(adapter.getPathPrefix() as string));
      });

      it('test apply path prefix', function () {
        const newAdp = new LocalFilesystemAdapter(root);
        newAdp.setPathPrefix('');

        expect(newAdp.applyPathPrefix('')).to.be.eq('');
      });
    });
  });*/
});
