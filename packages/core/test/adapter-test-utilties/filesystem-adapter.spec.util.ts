import { expect } from 'chai';
import { IFilesystemAdapter } from '../../src/interfaces/filesystem-adapter';
import { Visibility } from '../../src';
import { Readable } from 'stream';
import { readFile } from '../../src/util/fs-extra.util';
import { join } from 'path';
import getStream from 'get-stream';
import { OPTION_VISIBILITY } from '../../src/constant';
import { UnableToRetrieveMetadataException } from '../../src/exceptions/unable-to-retrieve-metadata.exception';
import * as fsExtra from '../../src/util/fs-extra.util';

export function filesystemAdapterSpecUtil(root: string, getAdapter: (root?: string) => IFilesystemAdapter) {
  const runScenario = () => {};

  const givenWeHaveAnExistingFile = (
    adapter: IFilesystemAdapter,
    path: string,
    contents: string | Buffer = 'contents',
    config?: any
  ) => {
    return adapter.write(path, contents, config);
  };

  it('writing_and_reading_with_string', async function () {
    const adapter = getAdapter(root);
    await adapter.write('path.txt', 'contents');
    const fileExists = await adapter.fileExists('path.txt');
    const contents = await adapter.read('path.txt', { encoding: 'utf8' });

    expect(fileExists).to.be.true;
    expect(contents).to.be.eq(contents);
  });

  it('writing_a_file_with_a_stream', async function () {
    const adapter = getAdapter(root);

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

  it('writing_and_reading_files_with_special_path', async function () {
    const adapter = await getAdapter();
    const validateArr: [string, string][] = [
      ['a path with square brackets in filename 1', 'some/file[name].txt'],
      ['a path with square brackets in filename 2', 'some/file[0].txt'],
      ['a path with square brackets in filename 3', 'some/file[10].txt'],
      ['a path with square brackets in dirname 1', 'some[name]/file.txt'],
      ['a path with square brackets in dirname 2', 'some[0]/file.txt'],
      ['a path with square brackets in dirname 3', 'some[10]/file.txt'],
      ['a path with curly brackets in filename 1', 'some/file{name}.txt'],
      ['a path with curly brackets in filename 2', 'some/file{0}.txt'],
      ['a path with curly brackets in filename 3', 'some/file{10}.txt'],
      ['a path with curly brackets in dirname 1', 'some{name}/filename.txt'],
      ['a path with curly brackets in dirname 2', 'some{0}/filename.txt'],
      ['a path with curly brackets in dirname 3', 'some{10}/filename.txt'],
      ['a path with space in dirname', 'some dir/filename.txt'],
      ['a path with space in filename', 'somedir/file name.txt'],
    ];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const [desc, path] of new Map(validateArr).entries()) {
      console.log(desc);
      await adapter.write(path, 'contents');
      const content = await adapter.read(path, { encoding: 'utf8' });
      expect(content).to.be.eq('contents');
    }
  });

  it('writing_a_file_with_an_empty_stream', async function () {
    const adapter = getAdapter();
    const stream = new Readable({
      // eslint-disable-next-line no-unused-vars
      read(size: number) {
        this.push('');
        this.push(null);
      },
    });
    await adapter.writeStream('path.txt', stream);

    const fileExists = await adapter.fileExists('path.txt');

    expect(fileExists).to.be.true;

    const contents = await adapter.read('path.txt', { encoding: 'utf8' });
    expect(contents).to.be.eq('');
  });

  it('reading_a_file', async function () {
    const adapter = getAdapter();
    await adapter.write('path.txt', 'contents');
    const contents = await adapter.read('path.txt', { encoding: 'utf8' });
    expect(contents).to.be.eq('contents');
  });

  it('reading_a_file_with_a_stream', async function () {
    const adapter = getAdapter();
    await adapter.write('path.txt', 'contents');
    const readStream = await adapter.readStream('path.txt');

    expect(readStream instanceof Readable).to.be.true;
    expect(await getStream(readStream)).to.be.eq('contents');
  });

  it('overwriting_a_file', async function () {
    const adapter = getAdapter();
    await adapter.write('path.txt', 'contents', { visibility: Visibility.PUBLIC });

    await adapter.write('path.txt', 'new contents', { visibility: Visibility.PRIVATE });

    const contents = await adapter.read('path.txt', { encoding: 'utf8' });

    expect('new contents').to.be.eq(contents);
    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(Visibility.PRIVATE);
  });

  it('deleting_a_file', async function () {
    const adapter = getAdapter();
    await givenWeHaveAnExistingFile(adapter, 'path.txt', 'contents');

    await adapter.delete('path.txt');
    const fileExists = await adapter.fileExists('path.txt');
    expect(fileExists).to.be.false;
  });

  it('listing_contents_shallow', async function () {
    const adapter = getAdapter();
    await givenWeHaveAnExistingFile(adapter, 'some/0-path.txt', 'contents');
    await givenWeHaveAnExistingFile(adapter, 'some/1-nested/path.txt', 'contents');

    const list = await adapter.listContents('some', false);
    /** @var StorageAttributes[] $items */
    expect(list).to.be.length(2);

    // Order of entries is not guaranteed
    const [fileIndex, directoryIndex] = list[0].isFile ? [0, 1] : [1, 0];

    expect('some/0-path.txt').to.be.eq(list[fileIndex].path);
    expect('some/1-nested').to.be.eq(list[directoryIndex].path);
    expect(list[fileIndex].isFile).to.be.true;
    expect(list[directoryIndex].isDir).to.be.true;
  });

  it('listing_contents_recursive', async function () {
    const adapter = getAdapter();

    await adapter.createDirectory('path');
    await adapter.write('path/file.txt', 'string');

    const listing = await adapter.listContents('', true);
    /** @var StorageAttributes[] $items */
    expect(listing).to.be.length(2);
  });

  it('fetching_file_size', async function () {
    const adapter = getAdapter();
    await givenWeHaveAnExistingFile(adapter, 'path.txt', 'contents');

    const attr = await adapter.fileSize('path.txt');
    expect(attr.fileSize).to.be.eq(8);
  });

  it('setting_visibility', async function () {
    const adapter = getAdapter();
    await givenWeHaveAnExistingFile(adapter, 'path.txt', 'contents', {
      [OPTION_VISIBILITY]: Visibility.PUBLIC,
    });

    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(Visibility.PUBLIC);

    await adapter.setVisibility('path.txt', Visibility.PRIVATE);

    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(Visibility.PRIVATE);

    await adapter.setVisibility('path.txt', Visibility.PUBLIC);
    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(Visibility.PUBLIC);
  });

  it('fetching_file_size_of_a_directory', async function () {
    const adapter = getAdapter();
    await adapter.createDirectory('path');
    await expect(adapter.fileSize('path/')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('fetching_file_size_of_non_existing_file', async function () {
    const adapter = getAdapter();

    await expect(adapter.fileSize('non-existing-file.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('fetching_last_modified_of_non_existing_file', async function () {
    const adapter = getAdapter();

    await expect(adapter.lastModified('non-existing-file.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('fetching_visibility_of_non_existing_file', async function () {
    const adapter = getAdapter();

    await expect(adapter.visibility('non-existing-file.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('fetching_the_mime_type_of_an_svg_file', async function () {
    const adapter = getAdapter();

    await adapter.write('flysystem.svg', await fsExtra.readFile(join(root, '../flysystem.svg')));
    expect((await adapter.mimeType('flysystem.svg')).mimeType).to.be.eq('image/svg+xml');
  });

  it('fetching_mime_type_of_non_existing_file', async function () {
    const adapter = getAdapter();

    await expect(adapter.mimeType('non-existing-file.txt')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('fetching_unknown_mime_type_of_a_file', async function () {
    const adapter = getAdapter();

    await givenWeHaveAnExistingFile(
      adapter,
      'unknown-mime-type.md5',
      await fsExtra.readFile(join(root, '../unknown-mime-type.md5'))
    );

    await expect(adapter.mimeType('unknown-mime-type.md5')).to.be.rejectedWith(UnableToRetrieveMetadataException);
  });

  it('listing_a_toplevel_directory', async function () {
    const adapter = getAdapter();

    await givenWeHaveAnExistingFile(adapter, 'path1.txt');
    await givenWeHaveAnExistingFile(adapter, 'path2.txt');

    const list = await adapter.listContents('.', true);
    expect(list).to.be.length(2);
  });

  it('writing_and_reading_with_streams', function () {
    /*$writeStream = stream_with_contents('contents');
    $adapter = $this->adapter();

    $adapter->writeStream('path.txt', $writeStream, new Config());
    if (is_resource($writeStream)) {
      fclose($writeStream);
    };
    $readStream = $adapter->readStream('path.txt');

    $this->assertIsResource($readStream);
    $contents = stream_get_contents($readStream);
    fclose($readStream);
    $this->assertEquals('contents', $contents);*/
  });

  it('setting_visibility_on_a_file_that_does_not_exist', function () {
    /* $this->expectException(UnableToSetVisibility::class);

    $this->runScenario(function () {
      $this->adapter()->setVisibility('path.txt', Visibility::PRIVATE);
    });*/
  });

  it('copying_a_file', function () {
    /*$adapter = $this->adapter();
    $adapter->write(
      'source.txt',
      'contents to be copied',
      new Config([Config::OPTION_VISIBILITY => Visibility::PUBLIC])
  );

    $adapter->copy('source.txt', 'destination.txt', new Config());

    $this->assertTrue($adapter->fileExists('source.txt'));
    $this->assertTrue($adapter->fileExists('destination.txt'));
    $this->assertEquals(Visibility::PUBLIC, $adapter->visibility('destination.txt')->visibility());
    $this->assertEquals('contents to be copied', $adapter->read('destination.txt'));*/
  });

  it('copying_a_file_again', function () {
    /*$adapter = $this->adapter();
    $adapter->write(
      'source.txt',
      'contents to be copied',
      new Config([Config::OPTION_VISIBILITY => Visibility::PUBLIC])
  );

    $adapter->copy('source.txt', 'destination.txt', new Config());

    $this->assertTrue($adapter->fileExists('source.txt'));
    $this->assertTrue($adapter->fileExists('destination.txt'));
    $this->assertEquals(Visibility::PUBLIC, $adapter->visibility('destination.txt')->visibility());
    $this->assertEquals('contents to be copied', $adapter->read('destination.txt'));*/
  });

  it('moving_a_file', function () {
    /*$adapter = $this->adapter();
    $adapter->write(
      'source.txt',
      'contents to be copied',
      new Config([Config::OPTION_VISIBILITY => Visibility::PUBLIC])
  );
    $adapter->move('source.txt', 'destination.txt', new Config());
    $this->assertFalse(
      $adapter->fileExists('source.txt'),
      'After moving a file should no longer exist in the original location.'
    );
    $this->assertTrue(
      $adapter->fileExists('destination.txt'),
      'After moving, a file should be present at the new location.'
    );
    $this->assertEquals(Visibility::PUBLIC, $adapter->visibility('destination.txt')->visibility());
    $this->assertEquals('contents to be copied', $adapter->read('destination.txt'));*/
  });

  it('reading_a_file_that_does_not_exist', function () {
    /*$this->expectException(UnableToReadFile::class);

    $this->runScenario(function () {
      $this->adapter()->read('path.txt');
    });*/
  });

  it('moving_a_file_that_does_not_exist', function () {
    /*$this->expectException(UnableToMoveFile::class);

    $this->runScenario(function () {
      $this->adapter()->move('source.txt', 'destination.txt', new Config());
    });*/
  });

  it('trying_to_delete_a_non_existing_file', function () {
    /*$adapter = $this->adapter();

    $adapter->delete('path.txt');
    $fileExists = $adapter->fileExists('path.txt');

    $this->assertFalse($fileExists);*/
  });

  it('checking_if_files_exist', function () {
    /* $adapter = $this->adapter();

    $fileExistsBefore = $adapter->fileExists('some/path.txt');
    $adapter->write('some/path.txt', 'contents', new Config());
    $fileExistsAfter = $adapter->fileExists('some/path.txt');

    $this->assertFalse($fileExistsBefore);
    $this->assertTrue($fileExistsAfter);*/
  });

  it('fetching_last_modified', function () {
    /* $adapter = $this->adapter();
    $adapter->write('path.txt', 'contents', new Config());

    $attributes = $adapter->lastModified('path.txt');

    $this->assertInstanceOf(FileAttributes::class, $attributes);
    $this->assertIsInt($attributes->lastModified());
    $this->assertTrue($attributes->lastModified() > time() - 30);
    $this->assertTrue($attributes->lastModified() < time() + 30);*/
  });

  it('failing_to_read_a_non_existing_file_into_a_stream', function () {
    /*$this->expectException(UnableToReadFile::class);

    $this->adapter()->readStream('something.txt');*/
  });

  it('failing_to_read_a_non_existing_file', function () {
    /*$this->expectException(UnableToReadFile::class);

    $this->adapter()->readStream('something.txt');*/
  });

  it('creating_a_directory', function () {
    /*$adapter = $this->adapter();

    $adapter->createDirectory('path', new Config());

    // Creating a directory should be idempotent.
    $adapter->createDirectory('path', new Config());

    $contents = iterator_to_array($adapter->listContents('', false));
    $this->assertCount(1, $contents, $this->formatIncorrectListingCount($contents));
    /!** @var DirectoryAttributes $directory *!/
    $directory = $contents[0];
    $this->assertInstanceOf(DirectoryAttributes::class, $directory);
    $this->assertEquals('path', $directory->path());*/
  });

  it('copying_a_file_with_collision', function () {
    /*$adapter = $this->adapter();
    $adapter->write('path.txt', 'new contents', new Config());
    $adapter->write('new-path.txt', 'contents', new Config());

    $adapter->copy('path.txt', 'new-path.txt', new Config());
    $contents = $adapter->read('new-path.txt');

    $this->assertEquals('new contents', $contents);*/
  });
}
