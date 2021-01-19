import { LocalFilesystemAdapter, Visibility } from '@filesystem/core';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import { join } from 'path';
import { fake, replace, restore } from 'sinon';
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
import { UnableToReadFileException } from '../../src/exceptions/unable-to-read-file.exception';
import { filesystemAdapterSpecUtil } from '../adapter-test-utilties/filesystem-adapter.spec.util';
import { stream_with_contents } from '../test-util';

use(chaiAsPromised);

describe('local adapter test', function (): void {
  this.timeout(5000);

  const root = join(__dirname, '../files/test-root');

  beforeEach(async function () {
    try {
      await rmDir(root);
    } catch (e) {
      // console.log(e);
    }
  });

  afterEach(async function () {
    try {
      await rmDir(root);
    } catch (e) {
      // console.log(e);
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
    const stream = stream_with_contents('something');
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

  describe('#mimetype', function () {
    it('getting_mimetype', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('flysystem.svg', await fsExtra.readFile(join(root, '../flysystem.svg')));
      expect((await adapter.mimeType('flysystem.svg')).mimeType).to.be.eq('image/svg+xml');
    });

    it('fetching_unknown_mime_type_of_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root, undefined, 'wx', LocalFilesystemAdapter.DISALLOW_LINKS);
      replace((adapter as any).mimeTypeDetector, 'detectMimeType', fake.returns(void 0));
      await expect(adapter.mimeType('unknown-mime-type.md5')).to.be.rejectedWith(UnableToRetrieveMetadataException);
      restore();
    });

    it('not_being_able_to_get_mimetype', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.mimeType('flysystem.svg')).to.be.rejectedWith(UnableToRetrieveMetadataException);
    });
  });

  describe('#lastModified', function () {
    it('getting_last_modified', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('first.txt', 'contents');
      expect((await adapter.lastModified('first.txt')).lastModified).to.be.eq(
        (await fsExtra.lstat(join(root, './first.txt'))).ctimeMs
      );
    });

    it('not_being_able_to_get_last_modified', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.lastModified('first.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
    });
  });

  describe('#fileSize', function () {
    it('getting_file_size', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await adapter.write('first.txt', 'contents');
      const fileSize = (await adapter.fileSize('first.txt')).fileSize;
      expect(fileSize).to.be.eq(8);
    });

    it('not_being_able_to_get_file_size', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.fileSize('first.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
    });
  });

  describe('#read', function () {
    it('not_being_able_to_read_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.read('path.txt')).to.be.rejectedWith(UnableToReadFileException);
    });
  });

  describe('#readStream', function () {
    it('not_being_able_to_stream_read_a_file', async function () {
      const adapter = new LocalFilesystemAdapter(root);
      await expect(adapter.readStream('path.txt')).to.be.rejectedWith(UnableToReadFileException);
    });
  });

  describe('baseFilesystemSpecUtil', function () {
    filesystemAdapterSpecUtil(root, (r?: string) => new LocalFilesystemAdapter(r || root));
  });
});
