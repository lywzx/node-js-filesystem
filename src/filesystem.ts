import { stream } from 'file-type';
import { ReadStream } from 'fs';
import { createDeflateRaw } from 'zlib';
import { CanOverwriteFiles } from './adapters/can-overwrite-files';
import { FileVisible } from './enum';
import {
  FileExistsException,
  FileNotFoundException,
  InvalidArgumentException,
  RootViolationException,
} from './exceptions';
import { Handler } from './handler';
import { AdapterInterface, FilesystemAbstract, FileWithMimetypeInterface, PluginInterface } from './interfaces';
import { FilesystemConfigInterface } from './interfaces';
import { ReadFileResult } from './types/local-adpater.types';
import { isReadableStream, normalizeRelativePath } from './util/util';
import { get } from 'lodash';

export class Filesystem implements FilesystemAbstract {
  public constructor(protected adapter: AdapterInterface, protected config: FilesystemConfigInterface | null = null) {}

  /**
   * get default config
   * @param key
   * @param defaultValue
   */
  protected getConfig(key: string, defaultValue?: any) {
    return get(this.config, key, defaultValue);
  }

  /**
   * Get the Adapter.
   *
   * @return AdapterInterface adapter
   */
  public getAdapter() {
    return this.adapter;
  }

  /**
   * @inheritdoc
   */
  public async has(path: string) {
    path = normalizeRelativePath(path);

    return (path || '').length === 0 ? false : this.getAdapter().has(path);
  }

  /**
   * @inheritdoc
   */
  public async write(path: string, contents: string | Buffer, config: any) {
    path = normalizeRelativePath(path);
    await this.assertAbsent(path);
    config = this.prepareConfig(config);

    return this.getAdapter().write(path, contents, config);
  }

  /**
   * @inheritdoc
   */
  public async writeStream(path: string, resource: ReadStream, config: any = {}) {
    if (!isReadableStream(resource)) {
      throw new InvalidArgumentException('writeStream expects argument #2 to be a valid readStream.');
    }
    path = normalizeRelativePath(path);
    await this.assertAbsent(path);
    config = this.prepareConfig(config);

    // TODO: rewindStream

    return this.getAdapter().writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public async put(path: string, contents: string | Buffer, config: any) {
    path = normalizeRelativePath(path);
    config = this.prepareConfig(config);

    if (!(this.getAdapter() instanceof CanOverwriteFiles) && (await this.has(path))) {
      return !!(await this.getAdapter().update(path, contents, config));
    }

    return !!(await this.getAdapter().write(path, contents, config));
  }

  /**
   * @inheritdoc
   */
  public async putStream(path: string, resource: ReadStream, config: any) {
    if (!isReadableStream(resource)) {
      throw new InvalidArgumentException('writeStream expects argument #2 to be a valid readStream.');
    }
    path = normalizeRelativePath(path);
    config = this.prepareConfig(config);

    // TODO: rewindStream

    if (!(this.getAdapter() instanceof CanOverwriteFiles) && (await this.has(path))) {
      return !!(await this.getAdapter().updateStream(path, resource, config));
    }

    return !!(await this.getAdapter().writeStream(path, resource, config));
  }

  /**
   * @inheritdoc
   */
  public async readAndDelete(path: string) {
    path = normalizeRelativePath(path);
    this.assertPresent(path);
    const contents = await this.read(path);

    if (contents === false) {
      return false;
    }
    await this.delete(path);

    return contents;
  }

  /**
   * @inheritdoc
   */
  public async update(path: string, contents: string | Buffer, config: any) {
    path = normalizeRelativePath(path);
    config = this.prepareConfig(config);

    await this.assertPresent(path);

    return !!(await this.getAdapter().update(path, contents, config));
  }

  /**
   * @inheritdoc
   */
  public async updateStream(path: string, resource: ReadStream, config: any) {
    if (!isReadableStream(resource)) {
      throw new InvalidArgumentException('writeStream expects argument #2 to be a valid readStream.');
    }
    path = normalizeRelativePath(path);
    config = this.prepareConfig(config);
    await this.assertPresent(path);

    // TODO: rewindStream

    return !!(await this.getAdapter().updateStream(path, resource, config));
  }

  /**
   * @inheritdoc
   */
  public async read(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    let result;
    if (!(result = await this.getAdapter().read(path))) {
      return false;
    }

    return (result as ReadFileResult).contents;
  }

  /**
   * @inheritdoc
   */
  public async readStream(path: string) {
    path = normalizeRelativePath(path);

    await this.assertPresent(path);

    let result;
    if (!(result = await this.getAdapter().readStream(path))) {
      return false;
    }

    return result.stream;
  }

  /**
   * @inheritdoc
   */
  public async rename(path: string, newPath: string) {
    path = normalizeRelativePath(path);
    newPath = normalizeRelativePath(newPath);

    await this.assertPresent(path);
    await this.assertAbsent(newPath);

    return this.getAdapter().rename(path, newPath);
  }

  /**
   * @inheritdoc
   */
  public async copy(path: string, newPath: string) {
    path = normalizeRelativePath(path);
    newPath = normalizeRelativePath(newPath);

    await this.assertPresent(path);
    await this.assertAbsent(newPath);

    return this.getAdapter().copy(path, newPath);
  }

  /**
   * @inheritdoc
   */
  public async delete(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    return this.getAdapter().delete(path);
  }

  /**
   * @inheritdoc
   */
  public deleteDir(dirname: string) {
    dirname = normalizeRelativePath(dirname);

    if (dirname === '') {
      throw new RootViolationException('Root directories can not be deleted.');
    }

    return this.getAdapter().deleteDir(dirname);
  }

  /**
   * @inheritdoc
   */
  public async createDir(dirname: string, config: any) {
    dirname = normalizeRelativePath(dirname);
    config = this.prepareConfig(config);

    return !!(await this.getAdapter().createDir(dirname, config));
  }

  /**
   * @inheritdoc
   */
  public async listContents(directory = '', recursive = false) {
    directory = normalizeRelativePath(directory);

    const contents = await this.getAdapter().listContents(directory, recursive);

    // todo complete
    /*$directory = Util::normalizePath($directory);
  $contents = this.getAdapter()->listContents($directory, $recursive);

  return (new ContentListingFormatter($directory, $recursive, this.config->get('case_sensitive', true)))
->formatListing($contents);*/
  }

  /**
   * @inheritdoc
   */
  public async getMimetype(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    let contents: FileWithMimetypeInterface;
    if (
      !(contents = await this.getAdapter().getMimetype(path)) &&
      !('mimetype' in contents) &&
      !(contents as FileWithMimetypeInterface).mimetype
    ) {
      return false;
    }

    return contents.mimetype as string;
  }

  /**
   * @inheritdoc
   */
  public async getTimestamp(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    let contents;
    if (!(contents = await this.getAdapter().getTimestamp(path)) && !('timestamp' in contents) && !contents.timestamp) {
      return false;
    }

    return contents.timestamp;
  }

  /**
   * @inheritdoc
   */
  public async getVisibility(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    let contents: any;
    if (
      !(contents = await this.getAdapter().getVisibility(path)) &&
      !('visibility' in contents) &&
      !contents.visibility
    ) {
      return false;
    }

    return contents.visibility;
  }

  /**
   * @inheritdoc
   */
  public async getSize(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    let contents: any;
    if (!(contents = await this.getAdapter().getSize(path)) && !('size' in contents) && !contents.size) {
      return false;
    }

    return contents.size;
  }

  /**
   * @inheritdoc
   */
  public async setVisibility(path: string, visibility: FileVisible | string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    return !!(await this.getAdapter().setVisibility(path, visibility));
  }

  /**
   * @inheritdoc
   */
  public async getMetadata(path: string) {
    path = normalizeRelativePath(path);
    await this.assertPresent(path);

    return this.getAdapter().getMetadata(path);
  }

  /**
   * @inheritdoc
   */
  public get(path: string, $handler = null) {
    path = normalizeRelativePath(path);

    /*$path = Util::normalizePath($path);

  if ( ! $handler) {
    $metadata = this.getMetadata($path);
    $handler = ($metadata && $metadata['type'] === 'file') ? new File($this, $path) : new Directory($this, $path);
  }

  $handler->setPath($path);
  $handler->setFilesystem($this);

  return $handler;*/
  }

  /**
   * Assert a file is present.
   *
   * @param {string} path path to file
   *
   * @throws FileNotFoundException
   *
   * @return void
   */
  public async assertPresent(path: string) {
    if (this.getConfig('disable_asserts', false) === false && !(await this.has(path))) {
      throw new FileNotFoundException(path);
    }
  }

  /**
   * Assert a file is absent.
   *
   * @param {string} path path to file
   *
   * @throws FileExistsException
   *
   * @return void
   */
  public async assertAbsent(path: string) {
    if (this.getConfig('disable_asserts', false) === false && (await this.has(path))) {
      throw new FileExistsException(path);
    }
  }

  protected prepareConfig(config: any) {
    return config;
  }
}
