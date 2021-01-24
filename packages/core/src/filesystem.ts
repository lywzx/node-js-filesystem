import { Visibility } from './enum';
import { IFilesystemOperator, IFilesystemConfig, IFilesystemAdapter } from './interfaces';
import { isReadableStream } from './util/util';
import get from 'lodash/get';
import { WhitespacePathNormalizer } from './libs';
import { InvalidStreamProvidedException } from './exceptions';
import { Readable } from 'stream';
import { Type } from '@nestjs/common';

/**
 * filesystem manager
 */
export class Filesystem implements IFilesystemOperator {
  static LIST_SHALLOW = false;
  static LIST_DEEP = true;

  /**
   * adapter map
   * @private
   */
  private static _adapter: {
    [s: string]: Type<IFilesystemAdapter>;
  } = {};

  public constructor(
    protected adapter: IFilesystemAdapter,
    protected config: IFilesystemConfig = {},
    protected pathNormalizer = new WhitespacePathNormalizer()
  ) {}

  /**
   * get default config
   * @param key
   * @param defaultValue
   */
  protected getConfig(key: keyof IFilesystemConfig, defaultValue?: any) {
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

  public fileExists(location: string): Promise<boolean> {
    return this.adapter.fileExists(this.pathNormalizer.normalizePath(location));
  }

  /**
   * @inheritdoc
   */
  public async write(path: string, contents: string | Buffer, config?: any) {
    return this.getAdapter().write(this.pathNormalizer.normalizePath(path), contents, config);
  }

  /**
   * @inheritdoc
   */
  public async writeStream(path: string, resource: Readable, config?: Record<string, any>) {
    if (!isReadableStream(resource)) {
      throw new InvalidStreamProvidedException('writeStream expects argument #2 to be a valid readStream.');
    }
    path = this.pathNormalizer.normalizePath(path);
    config = this.prepareConfig(config);

    // TODO: rewindStream

    return this.getAdapter().writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public read(path: string, config?: any) {
    return this.getAdapter().read(this.pathNormalizer.normalizePath(path), config);
  }

  /**
   * @inheritdoc
   */
  public readStream(path: string, config?: any) {
    return this.getAdapter().readStream(this.pathNormalizer.normalizePath(path), config);
  }

  /**
   * @inheritdoc
   */
  public copy(path: string, newPath: string, config?: any) {
    return this.getAdapter().copy(
      this.pathNormalizer.normalizePath(path),
      this.pathNormalizer.normalizePath(newPath),
      config
    );
  }

  /**
   * @inheritdoc
   */
  public async delete(path: string) {
    return this.getAdapter().delete(this.pathNormalizer.normalizePath(path));
  }

  /**
   * @inheritdoc
   */
  public deleteDirectory(dirname: string) {
    return this.getAdapter().deleteDirectory(this.pathNormalizer.normalizePath(dirname));
  }

  /**
   * @inheritdoc
   */
  public createDirectory(dirname: string, config?: any) {
    config = this.prepareConfig(config);

    return this.getAdapter().createDirectory(this.pathNormalizer.normalizePath(dirname), this.prepareConfig(config));
  }

  /**
   * @inheritdoc
   */
  public async listContents(directory = '', recursive = Filesystem.LIST_DEEP) {
    return this.getAdapter().listContents(this.pathNormalizer.normalizePath(directory), recursive);
  }

  /**
   * @inheritdoc
   */
  public async mimeType(path: string) {
    return (await this.getAdapter().mimeType(this.pathNormalizer.normalizePath(path))).mimeType;
  }

  /**
   * @inheritdoc
   */
  public async lastModified(path: string) {
    return (await this.getAdapter().lastModified(this.pathNormalizer.normalizePath(path))).lastModified;
  }

  /**
   * @inheritdoc
   */
  public async visibility(path: string) {
    return (await this.getAdapter().visibility(this.pathNormalizer.normalizePath(path))).visibility;
  }

  /**
   * @inheritdoc
   */
  public async fileSize(path: string) {
    return (await this.getAdapter().fileSize(this.pathNormalizer.normalizePath(path))).fileSize;
  }

  /**
   * @inheritdoc
   */
  public setVisibility(path: string, visibility: Visibility | string) {
    return this.getAdapter().setVisibility(this.pathNormalizer.normalizePath(path), visibility as Visibility);
  }

  /**
   * @inheritdoc
   */
  /*public get(path: string, $handler = null) {
    path = normalizeRelativePath(path);

    $path = Util::normalizePath($path);

  if ( ! $handler) {
    $metadata = this.getMetadata($path);
    $handler = ($metadata && $metadata['type'] === 'file') ? new File($this, $path) : new Directory($this, $path);
  }

  $handler->setPath($path);
  $handler->setFilesystem($this);

  return $handler;
  }*/

  public move(source: string, destination: string, config?: Record<string, any>): Promise<void> {
    return this.getAdapter().move(
      this.pathNormalizer.normalizePath(source),
      this.pathNormalizer.normalizePath(destination),
      this.prepareConfig(config)
    );
  }

  protected prepareConfig(config?: any) {
    return config;
  }

  static adapter(): { [s: string]: Type<IFilesystemAdapter> };
  static adapter(name: string): Type<IFilesystemAdapter> | void;
  static adapter(name: string, adapter: Type<IFilesystemAdapter>): void;
  static adapter(
    name?: string,
    adapter?: Type<IFilesystemAdapter>
  ): { [s: string]: Type<IFilesystemAdapter> } | Type<IFilesystemAdapter> | void {
    if (!name && !adapter) {
      return this._adapter;
    }
    if (name && adapter) {
      this._adapter[name] = adapter;
    }
    if (name && !adapter) {
      return this._adapter[name];
    }
  }
}
