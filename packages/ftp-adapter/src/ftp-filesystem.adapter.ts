import {
  DirectoryAttributes,
  EFileType,
  EVisibility,
  FileAttributes,
  FInfoMimeTypeDetector,
  IFilesystemAdapter,
  IMimeTypeDetector,
  IReadFileOptions,
  IStorageAttributes,
  IVisibilityConverter,
  PathPrefixer,
  RequireOne,
  UnableToCopyFileException,
  UnableToCreateDirectoryException,
  UnableToDeleteDirectoryException,
  UnableToDeleteFileException,
  UnableToMoveFileException,
  UnableToRetrieveMetadataException,
} from '@filesystem/core';
import { Readable, Writable } from 'stream';
import { ReadStream } from 'fs';
import { IFtpFilesystemAdapterConfig } from './interfaces';
import { Client, FileInfo } from 'basic-ftp';
import omit from 'lodash/omit';
import { ESystemType } from './constant';
import { ConnectionException } from './exceptions';
import { FtpVisibilityConverter } from './ftp-visibility-converter';
import { dirname } from 'path';
import { defer } from '@filesystem/core/src/util/promise-defer.util';
import sortBy from 'lodash/sortBy';
import { createReadStreamFromWriteStream } from './util';

export class FtpFilesystemAdapter implements IFilesystemAdapter {
  /**
   * client
   * @protected
   */
  protected client: Client;

  /**
   * is connected
   * @protected
   */
  protected isConnected!: boolean;
  /**
   * current system type
   * @protected
   */
  protected systemType!: ESystemType;

  protected prefixer: PathPrefixer;

  constructor(
    protected readonly config: IFtpFilesystemAdapterConfig,
    protected readonly root: string = '',
    protected readonly _visibility: IVisibilityConverter = new FtpVisibilityConverter(),
    protected mimeTypeDetector: IMimeTypeDetector = new FInfoMimeTypeDetector()
  ) {
    this.client = new Client(config.timeout);
    this.prefixer = new PathPrefixer(root);
  }

  protected async connect() {
    if (!this.isConnected || this.client.closed) {
      await this.client.connect(this.config.host, this.config.port);
    }
    try {
      await this.client.access(omit(this.config, ['timeout']));
      const system = await this.client.send('SYST');
      this.setSystemType(system.message.toLowerCase().includes('unix') ? ESystemType.UNIX : ESystemType.WINDOWS);
    } catch (e) {}
    if (this.client.closed) {
      throw new ConnectionException(
        `Could not login with connection: ${this.config.host} :: ${this.config.port}, username: ${this.config.user}`
      );
    }
  }

  /**
   * Set the FTP system type (windows or unix).
   *
   * @param {ESystemType} systemType
   *
   * @return this
   */
  private setSystemType(systemType: ESystemType) {
    this.systemType = systemType;

    return this;
  }

  /**
   * ensure parent directory
   * @param path
   * @param visibility
   * @private
   */
  private ensureParentDirectoryExists(path: string, visibility?: EVisibility) {
    const dir = dirname(path);
    if (dir === '' || dir === '.') {
      return;
    }
    return this.createDirectory(dir);
  }

  public async fetchMetadata(path: string, type?: string): Promise<FileAttributes> {
    await this.connect();
    return {} as any;
    /*const location = this.getPathPrefix().prefixPath(path);
    let err: Error;
    let result;
    try {
      result = await this.client.send(`MLST ${location}`);
    } catch (e) {
      err = e;
    }
    if (empty(result) || count(result) < 3 || substr(result[1], 0, 5) === 'ftpd:') {
      throw UnableToRetrieveMetadataException.create(path, type, err?.message);
    }

    const attributes = this.normalizeObject(result[1], '');

    if (!$attributes instanceof FileAttributes) {
      throw UnableToRetrieveMetadataException.create(
        path,
        type,
        `expected file, (${attributes instanceof DirectoryAttributes ? 'directory found' : 'nothing found'})`
      );
    }

    return $attributes;*/
  }

  /**
   * Normalize a directory listing.
   *
   * @param {object}  listing
   * @param {string} prefix
   *
   * @return array directory listing
   */
  protected async normalizeListing(listing: FileInfo[], prefix = ''): Promise<IStorageAttributes[]> {
    const result: IStorageAttributes[] = [];
    for (const item of listing) {
      result.push(await this.normalizeObject(item, prefix));
    }

    return this.sortListing(result);
  }

  /**
   * Sort a directory listing.
   *
   * @param {IListContentInfo[]} result
   *
   * @return {object} sorted listing
   */
  protected sortListing(result: IStorageAttributes[]) {
    return sortBy(result, 'path');
  }

  /**
   * Normalize a file entry.
   *
   * @param {FileInfo} item
   * @param {string} base
   *
   * @return array normalized file array
   *
   * @throws NotSupportedException
   */
  protected async normalizeObject(item: FileInfo, base: string): Promise<IStorageAttributes> {
    const systemType = this.systemType ?? (await this.detectSystemType(item));
    const type = item.isFile ? EFileType.file : item.isDirectory ? EFileType.dir : EFileType.link;
    const lastModified = item.rawModifiedAt ? new Date(item.rawModifiedAt).getTime() : 0;
    const path = base === '' ? base : `${base.replace(/\/$/, '')}${item.name}`;

    const size = item.size;
    if (type === EFileType.file) {
      return new FileAttributes(
        path,
        size,
        systemType === ESystemType.UNIX ? this._visibility.inverseForFile(item.permissions!) : undefined,
        lastModified
      );
    }

    return new DirectoryAttributes(
      path,
      systemType === ESystemType.UNIX ? this._visibility.inverseForDirectory(item.permissions!) : undefined,
      lastModified
    );

    // throw new NotSupportedException(`The FTP system type '${systemType}' is currently not supported.`);
  }

  /**
   * Get the system type from a listing item.
   *
   * @param {string} item
   *
   * @return string the system type
   */
  protected async detectSystemType(item: FileInfo): Promise<ESystemType> {
    return item.permissions === undefined ? ESystemType.WINDOWS : ESystemType.UNIX;
  }

  protected async listDirectoryContentsRecursive(location: string): Promise<IStorageAttributes[]> {
    return [];
  }

  getPathPrefix(): PathPrefixer {
    return this.prefixer;
  }

  public async copy(source: string, destination: string, config?: Record<string, any>): Promise<void> {
    const sourceLocation = this.getPathPrefix().prefixPath(source);
    const destinationLocation = this.getPathPrefix().prefixPath(destination);
    try {
      const readStream = await this.readStream(sourceLocation);
      await this.client.uploadFrom(readStream, destinationLocation);
    } catch (e) {
      throw UnableToCopyFileException.fromLocationTo(source, destination, e);
    }
  }

  async createDirectory(path: string, config?: Record<string, any>): Promise<void> {
    await this.connect();
    const location = this.getPathPrefix().prefixDirectoryPath(path);
    try {
      await this.client.ensureDir(location);
    } catch (e) {
      throw UnableToCreateDirectoryException.atLocation(path, e?.message);
    }
  }

  async delete(path: string): Promise<void> {
    await this.connect();
    const location = this.getPathPrefix().prefixPath(path);
    try {
      await this.client.remove(location);
    } catch (e) {
      UnableToDeleteFileException.atLocation(path, 'the file still exists');
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    await this.connect();
    const location = this.getPathPrefix().prefixDirectoryPath(path);
    try {
      await this.client.removeDir(location);
    } catch (e) {
      throw UnableToDeleteDirectoryException.atLocation(path, e.message);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await this.fileSize(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  async fileSize(path: string): Promise<RequireOne<FileAttributes, 'fileSize'>> {
    await this.connect();
    const location = this.getPathPrefix().prefixPath(path);
    let size: number | undefined = -1;
    let err: Error | undefined;
    try {
      size = await this.client.size(location);
    } catch (e) {
      err = e;
    }

    if (err || size < 0) {
      throw UnableToRetrieveMetadataException.fileSize(path, err?.message, err);
    }

    return new FileAttributes(path, size!) as RequireOne<FileAttributes, 'fileSize'>;
  }

  public async lastModified(path: string): Promise<RequireOne<FileAttributes, 'lastModified'>> {
    const location = this.prefixer.prefixPath(path);
    let lastModified: number;
    try {
      const result = await this.client.lastMod(location);
      lastModified = result.getTime();
    } catch (e) {
      throw UnableToRetrieveMetadataException.lastModified(path, '', e);
    }
    return new FileAttributes(path, undefined, undefined, lastModified) as RequireOne<FileAttributes, 'lastModified'>;
  }

  public async listContents(path: string, deep: boolean): Promise<IStorageAttributes[]> {
    const location = this.getPathPrefix().prefixDirectoryPath(path);
    if (deep) {
      return this.listDirectoryContentsRecursive(location);
    }

    const list = await this.client.list(location);

    return this.normalizeListing(list);
  }

  async mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>> {
    let mimeType: string | void;
    try {
      const content = await this.read(path);
      mimeType = await this.mimeTypeDetector.detectMimeType(path, content);
    } catch (e) {
      throw UnableToRetrieveMetadataException.mimeType(path, '', e);
    }
    if (mimeType === undefined) {
      throw UnableToRetrieveMetadataException.mimeType(path, 'Unknown.');
    }

    return new FileAttributes(path, undefined, undefined, undefined, mimeType) as RequireOne<
      FileAttributes,
      'mimeType'
    >;
  }

  async move(source: string, destination: string, config?: Record<string, any>): Promise<void> {
    const sourceLocation = this.getPathPrefix().prefixPath(source);
    const destinationLocation = this.getPathPrefix().prefixPath(destination);
    await this.connect();
    try {
      await this.ensureParentDirectoryExists(destination);
      await this.client.rename(sourceLocation, destinationLocation);
    } catch (e) {
      throw UnableToMoveFileException.fromLocationTo(source, destination, e);
    }
  }

  async read(path: string, config?: IReadFileOptions): Promise<string | Buffer> {
    const promiseDefer = defer<any>();
    const client = this.client;
    let result: Buffer | string = new Buffer([]);
    const wS = new Writable({
      autoDestroy: true,
      write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
        if (encoding === 'buffer') {
          if (!result) {
            result = chunk;
          } else {
            result = Buffer.concat([result, chunk]);
          }
        }
        callback(null);
      },
      final(callback: (error?: Error | null) => void) {
        callback();
        promiseDefer.resolve(result);
      },
    });
    try {
      const result = await client.downloadTo(wS, this.getPathPrefix().prefixPath(path));
      if (result.code < 200 || result.code > 300) {
        promiseDefer.reject(new Error(result.message));
      }
    } catch (e) {
      promiseDefer.reject(e);
    }

    const res = await promiseDefer.promise;

    if (config?.encoding != 'binary') {
      return res.toString();
    }

    return res;
  }

  async readStream(path: string, config?: Record<string, any>): Promise<ReadStream> {
    const promiseDefer = defer<any>();
    const client = this.client;
    let result: Buffer | string;
    await this.connect();

    const { from, to } = createReadStreamFromWriteStream();

    await client.downloadTo(from, this.getPathPrefix().prefixPath(path));

    return to;
  }

  async setVisibility(path: string, visibility: EVisibility): Promise<void> {
    await this.connect();
    return Promise.resolve(undefined);
  }

  async visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>> {
    return new FileAttributes(path) as RequireOne<FileAttributes, 'visibility'>;
  }

  async write(path: string, contents: string | Buffer, config?: Record<string, any>): Promise<void> {
    await this.connect();
    const location = this.getPathPrefix().prefixPath(path);
    await this.client.uploadFrom(Readable.from(contents), location);
  }

  async writeStream(path: string, resource: Readable, config?: Record<string, any>): Promise<void> {
    await this.connect();
    const location = this.getPathPrefix().prefixPath(path);
    await this.client.uploadFrom(resource, location);
  }
}
