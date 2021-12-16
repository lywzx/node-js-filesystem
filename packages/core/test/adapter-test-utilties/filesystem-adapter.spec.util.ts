import { expect, use } from 'chai';
import getStream from 'get-stream';
import { join } from 'path';
import { Readable, Stream } from 'stream';
import {
  OPTION_VISIBILITY,
  IFilesystemAdapter,
  EVisibility,
  UnableToReadFileException,
  UnableToRetrieveMetadataException,
  UnableToSetVisibilityException,
  UnableToMoveFileException,
} from '@filesystem/core';
import * as fsExtra from '../../src/util/fs-extra.util';
import { stream_with_contents } from '../test-util';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

export function filesystemAdapterSpecUtil<T extends IFilesystemAdapter>(
  root: string,
  getAdapter: (root?: string) => T,
  skip: Array<'mimetype'> = []
) {
  // const runScenario = () => {};

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
    expect(contents).to.be.eq('contents');
  });

  it('writing_a_file_with_a_stream', async function () {
    const adapter = getAdapter(root);

    const writeContent = 'contents';
    const stream = stream_with_contents(writeContent);
    const file = 'file.txt';
    await adapter.write(file, writeContent);

    await adapter.writeStream(file, stream);
    stream.destroy();

    expect(await adapter.fileExists(file)).to.be.true;
    expect(await adapter.read(file, { encoding: 'utf8' })).to.be.eq(writeContent);
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
      await adapter.write(path, 'contents');
      const content = await adapter.read(path, { encoding: 'utf8' });
      expect(content).to.be.eq('contents', desc);
    }
  });

  it('writing_a_file_with_an_empty_stream', async function () {
    const adapter = getAdapter();
    const stream = stream_with_contents('');
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
    await adapter.write('path.txt', 'contents', { visibility: EVisibility.PUBLIC });

    await adapter.write('path.txt', 'new contents', { visibility: EVisibility.PRIVATE });

    const contents = await adapter.read('path.txt', { encoding: 'utf8' });

    expect('new contents').to.be.eq(contents);
    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(EVisibility.PRIVATE);
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
    expect(list).to.have.length.within(1, 2);

    // Order of entries is not guaranteed
    const [fileIndex, directoryIndex] = list[0].isFile ? [0, 1] : [1, 0];

    expect('some/0-path.txt').to.be.eq(list[fileIndex].path);
    expect(list[fileIndex].isFile).to.be.true;

    // oss may not support directory
    if (list.length === 2) {
      expect('some/1-nested').to.be.eq(list[directoryIndex].path);
      expect(list[directoryIndex].isDir).to.be.true;
    }
  });

  it('listing_contents_recursive', async function () {
    const adapter = getAdapter();

    await adapter.createDirectory('path');
    await adapter.write('path/file.txt', 'string');

    const listing = await adapter.listContents('', true);
    /** @var StorageAttributes[] $items */
    /** oss may not be show direcotry */
    expect(listing).to.have.length.within(1, 2);
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
      [OPTION_VISIBILITY]: EVisibility.PUBLIC,
    });

    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(EVisibility.PUBLIC);

    await adapter.setVisibility('path.txt', EVisibility.PRIVATE);

    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(EVisibility.PRIVATE);

    await adapter.setVisibility('path.txt', EVisibility.PUBLIC);
    expect((await adapter.visibility('path.txt')).visibility).to.be.eq(EVisibility.PUBLIC);
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

  if (!skip.includes('mimetype')) {
    it('fetching_unknown_mime_type_of_a_file', async function () {
      const adapter = getAdapter();

      await givenWeHaveAnExistingFile(
        adapter,
        'unknown-mime-type.md5',
        await fsExtra.readFile(join(root, '../unknown-mime-type.md5'))
      );

      await expect(adapter.mimeType('unknown-mime-type.md5')).to.be.rejectedWith(UnableToRetrieveMetadataException);
    });
  }

  it('listing_a_toplevel_directory', async function () {
    const adapter = getAdapter();

    await givenWeHaveAnExistingFile(adapter, 'path1.txt');
    await givenWeHaveAnExistingFile(adapter, 'path2.txt');

    const list = await adapter.listContents('', true);
    expect(list).to.be.length(2);
  });

  it('writing_and_reading_with_streams', async function () {
    const writeStream = stream_with_contents('contents');
    const adapter = getAdapter();

    await adapter.writeStream('path.txt', writeStream);

    expect(writeStream instanceof Readable).to.be.true;
    writeStream.destroy();

    const readStream = await adapter.readStream('path.txt');

    expect(readStream instanceof Stream).to.be.true;
    expect(await getStream(readStream)).to.be.eq('contents');
    readStream.destroy();
  });

  it('setting_visibility_on_a_file_that_does_not_exist', async function () {
    await expect(getAdapter().setVisibility('path.txt', EVisibility.PRIVATE)).to.be.rejectedWith(
      UnableToSetVisibilityException
    );
  });

  it('copying_a_file', async function () {
    const adapter = getAdapter();
    await adapter.write('source.txt', 'contents to be copied', {
      [OPTION_VISIBILITY]: EVisibility.PUBLIC,
    });
    await adapter.copy('source.txt', 'destination.txt');

    expect(await adapter.fileExists('source.txt')).to.be.true;
    expect(await adapter.fileExists('destination.txt')).to.be.true;
    expect((await adapter.visibility('destination.txt')).visibility).to.be.eq(EVisibility.PUBLIC);
    expect(await adapter.read('destination.txt', { encoding: 'utf8' })).to.be.eq('contents to be copied');
  });

  it('copying_a_file_again', async function () {
    const adapter = getAdapter();
    await adapter.write('source.txt', 'contents to be copied', { [OPTION_VISIBILITY]: EVisibility.PUBLIC });
    await adapter.copy('source.txt', 'destination.txt');

    expect(await adapter.fileExists('source.txt')).to.be.true;
    expect(await adapter.fileExists('destination.txt')).to.be.true;
    expect((await adapter.visibility('destination.txt')).visibility).to.be.eq(EVisibility.PUBLIC);
    expect(await adapter.read('destination.txt', { encoding: 'utf8' })).to.be.eq('contents to be copied');
  });

  it('moving_a_file', async function () {
    const adapter = getAdapter();
    await adapter.write('source.txt', 'contents to be copied', { [OPTION_VISIBILITY]: EVisibility.PUBLIC });
    await adapter.move('source.txt', 'destination.txt');
    expect(await adapter.fileExists('source.txt')).to.be.eq(
      false,
      'After moving a file should no longer exist in the original location.'
    );
    expect(await adapter.fileExists('destination.txt')).to.be.eq(
      true,
      'After moving, a file should be present at the new location.'
    );
    expect((await adapter.visibility('destination.txt')).visibility).to.be.eq(EVisibility.PUBLIC);
    expect(await adapter.read('destination.txt', { encoding: 'utf8' })).to.be.eq('contents to be copied');
  });

  it('reading_a_file_that_does_not_exist', async function () {
    await expect(getAdapter().read('path.txt')).to.be.rejectedWith(UnableToReadFileException);
  });

  it('moving_a_file_that_does_not_exist', async function () {
    await expect(getAdapter().move('source.txt', 'destination.txt')).to.be.rejectedWith(UnableToMoveFileException);
  });

  it('trying_to_delete_a_non_existing_file', async function () {
    const adapter = getAdapter();

    await adapter.delete('path.txt');
    const fileExists = await adapter.fileExists('path.txt');

    expect(fileExists).to.be.false;
  });

  it('checking_if_files_exist', async function () {
    const adapter = getAdapter();

    const fileExistsBefore = await adapter.fileExists('some/path.txt');
    await adapter.write('some/path.txt', 'contents');
    const fileExistsAfter = await adapter.fileExists('some/path.txt');

    expect(fileExistsBefore).to.be.false;
    expect(fileExistsAfter).to.be.true;
  });

  it('fetching_last_modified', async function () {
    const adapter = getAdapter();
    await adapter.write('path.txt', 'contents');

    const attributes = await adapter.lastModified('path.txt');

    expect(attributes).to.be.haveOwnProperty('lastModified');
    expect(attributes.lastModified).to.be.an('number');
    expect(Math.abs(attributes.lastModified - Date.now())).to.be.within(0, 5000);
  });

  it('failing_to_read_a_non_existing_file_into_a_stream', async function () {
    await expect(getAdapter().readStream('something.txt')).to.be.rejectedWith(UnableToReadFileException);
  });

  it('failing_to_read_a_non_existing_file', async function () {
    await expect(getAdapter().readStream('something.txt')).to.be.rejectedWith(UnableToReadFileException);
  });

  it('creating_a_directory', async function () {
    const adapter = getAdapter();

    await adapter.createDirectory('path');

    // Creating a directory should be idempotent.
    await adapter.createDirectory('path');

    const list = await adapter.listContents('', false);
    expect(list).to.be.length(1);
    /** @var DirectoryAttributes $directory */
    const directory = list[0];
    expect(directory).to.be.instanceOf(Object);
    // $this->assertInstanceOf(DirectoryAttributes::class, $directory);
    expect(list[0].path).to.be.eq('path');
  });

  it('copying_a_file_with_collision', async function () {
    const adapter = getAdapter();
    await adapter.write('path.txt', 'new contents');
    await adapter.write('new-path.txt', 'contents');

    await adapter.copy('path.txt', 'new-path.txt');
    const contents = await adapter.read('new-path.txt', { encoding: 'utf8' });

    expect(contents).to.be.eq('new contents');
  });
}
