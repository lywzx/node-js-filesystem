import { createReadStream, createWriteStream, ReadStream, Stats, WriteStream } from 'fs';
import isBuffer from 'lodash/isBuffer';
import padStart from 'lodash/padStart';
import { dirname, sep } from 'path';
import { Visibility } from '../enum';
import { NotSupportedException, UnReadableFileException } from '../exceptions';
import { IPathStats } from '../interfaces';
import {
  IVisibilityConfig,
  IWriteConfig,
  IWriteStreamConfig,
  ListContentInfo,
  UpdateConfig,
  UpdateFileResult,
} from '../types/local-adpater.types';
import {
  getDirectoryIterator,
  getRecursiveDirectoryIterator,
  isDir,
  isDirSync,
  isFile,
  isReadable,
  mkDir,
  mkDirSync,
  rmDir,
} from '../util';
import { defer } from '../util/promise-defer.util';
import { guessMimeType } from '../util/util';
import { chmod, copyFile, lstat, pathExists, readFile, rename, stat, unlink, writeFile } from '../util/fs-extra.util';
import { IFilesystemAdapter, IReadFileOptions } from '../interfaces/filesystem-adapter';
import { IVisibilityConverter } from '../interfaces/visibility-converter';
import { IMimeTypeDetector } from '../interfaces/mime-type-detector';
import { PathPrefixer } from '../libs/path-prefixer';
import { FInfoMimeTypeDetector } from '../libs/f-info-mime-type-detector';
import { UnableToCreateDirectoryException } from '../exceptions/unable-to-create-directory.exception';
import { PortableVisibilityConverter } from '../libs/UnixVisibility/portable-visibility-converter';
import { OPTION_DIRECTORY_VISIBILITY, OPTION_VISIBILITY } from '../constant';
import { UnableToDeleteFileException } from '../exceptions/unable-to-delete-file.exception';
import { UnableToSetVisibilityException } from '../exceptions/unable-to-set-visibility.exception';
import { UnableToReadFileException } from '../exceptions/unable-to-read-file.exception';
import { IStorageAttributes } from '../interfaces/storage-attributes.interface';
import { FileAttributes } from '../libs/file-attributes';
import { UnableToRetrieveMetadataException } from '../exceptions/unable-to-retrieve-metadata.exception';
import { RequireOne } from '../interfaces/types';
import { UnableToCopyFileException } from '../exceptions/unable-to-copy-file.exception';
import { UnableToMoveFileException } from '../interfaces/unable-to-move-file.exception';
import { Readable } from 'stream';
import { UnableToWriteFileException } from '../exceptions/unable-to-write-file.exception';
import { SymbolicLinkEncounteredException } from '../exceptions/symbolic-link-encountered.exception';

/**
 * local filesystem adapter
 */
export class LocalFilesystemAdapter implements IFilesystemAdapter {
  /**
   * 0001
   * @var number
   */
  static SKIP_LINKS = 0o0001;

  /**
   * 0002
   * @var number
   */
  static DISALLOW_LINKS = 0o0002;

  /**
   * @var string
   */
  protected pathSeparator = sep;

  /**
   * @protected PathPrefixer
   */
  protected prefixer: PathPrefixer;

  /**
   * Constructor.
   *
   * @param {string} root
   * @param {IVisibilityConverter} _visibility
   * @param {number} writeFlags
   * @param {number} linkHandling
   * @param {IMimeTypeDetector} mimeTypeDetector
   *
   * @throws LogicException
   */
  public constructor(
    root: string,
    protected readonly _visibility: IVisibilityConverter = new PortableVisibilityConverter(),
    protected writeFlags = 'w',
    private linkHandling = LocalFilesystemAdapter.DISALLOW_LINKS,
    protected mimeTypeDetector: IMimeTypeDetector = new FInfoMimeTypeDetector()
  ) {
    this.prefixer = new PathPrefixer(root, sep);
    this.ensureDirectorySync(root, this._visibility.defaultForDirectories());
  }

  fileExists(path: string): Promise<boolean> {
    return isFile(this.prefixer.prefixPath(path));
  }

  /**
   * Ensure the root directory exists.
   *
   * @param {string} root root directory path
   * @param {visibility} visibility control
   * @return void
   *
   * @throws Exception in case the root directory can not be created
   */
  protected ensureDirectorySync(root: string, visibility: number) {
    if (!isDirSync(root)) {
      let err;
      try {
        mkDirSync(root, visibility);
      } catch (e) {
        err = e;
      }

      if (!isDirSync(root)) {
        const errorMessage = err?.message || '';
        throw UnableToCreateDirectoryException.atLocation(root, errorMessage);
      }
    }
  }

  /**
   * Ensure the root directory exists.
   *
   * @param {string} root root directory path
   * @param {number} visibility path mode
   * @return void
   *
   * @throws Exception in case the root directory can not be created
   */
  protected async ensureDirectoryExists(root: string, visibility?: number) {
    if (!(await isDir(root))) {
      let err;
      try {
        await mkDir(root, visibility);
      } catch (e) {
        err = e;
      }

      if (!(await isDir(root))) {
        const errorMessage = err?.message || '';
        throw UnableToCreateDirectoryException.atLocation(root, errorMessage);
      }
    }
  }

  /**
   * resolve directory visibility
   * @param visibility
   * @protected
   */
  protected resolveDirectoryVisibility(visibility?: Visibility): number {
    return visibility ? this._visibility.forDirectory(visibility) : this._visibility.defaultForDirectories();
  }

  /**
   * @inheritdoc
   */
  /*
  public async has(path: string) {
    const location = this.prefixer.prefixPath(path);

    return pathExists(location);
  }
*/

  /**
   * @inheritdoc
   */
  public async write(
    path: string,
    contents: string | Buffer,
    config: IWriteConfig = { visibility: Visibility.PUBLIC }
  ) {
    const location = this.prefixer.prefixPath(path);
    await this.ensureDirectoryExists(
      dirname(location),
      this.resolveDirectoryVisibility(config[OPTION_DIRECTORY_VISIBILITY] as Visibility | undefined)
    );
    const visibility = (config[OPTION_VISIBILITY] || Visibility.PUBLIC) as Visibility;

    const options: any = {
      flag: config?.flag || this.writeFlags,
      mode: this._visibility.forFile(visibility as Visibility),
    };

    if (config?.encoding) {
      options.encoding = config.encoding;
    }

    try {
      if (options.mode && (await this.fileExists(path))) {
        // 需要更改文件的权限，再更新内容
        await this.setPermissions(location, options.mode);
      }
      await writeFile(location, contents, options);
    } catch (e) {
      throw UnableToWriteFileException.atLocation(path, e.message, e);
    }
  }

  /**
   * @inheritdoc
   */
  public async writeStream(
    path: string,
    resource: Readable,
    config: IWriteStreamConfig = { visibility: Visibility.PUBLIC }
  ) {
    const location = this.prefixer.prefixPath(path);
    await this.ensureDirectoryExists(
      dirname(location),
      this.resolveDirectoryVisibility(config[OPTION_DIRECTORY_VISIBILITY] as Visibility | undefined)
    );
    const visibility = (config[OPTION_VISIBILITY] || Visibility.PUBLIC) as Visibility;

    const option: any = {
      flags: config?.flags || this.writeFlags,
      mode: this._visibility.forFile(visibility),
    };

    if (config?.encoding) {
      option.encoding = config.encoding;
    }

    const df = defer<void>();

    const writeStream = createWriteStream(location, option);

    resource.pipe(writeStream);

    writeStream.once('finish', () => {
      df.resolve();
    });

    writeStream.once('error', (err: Error) => {
      df.reject(UnableToWriteFileException.atLocation(location, err.message, err));
    });

    return df.promise;
  }

  /**
   * @inheritdoc
   */
  public async readStream(path: string, config?: any): Promise<ReadStream> {
    const location = this.prefixer.prefixPath(path);

    const readStream = createReadStream(location, config);

    const df = defer<ReadStream>();

    readStream.once('error', (e) => {
      df.reject(UnableToReadFileException.fromLocation(path, e.message, e));
    });

    setTimeout(() => {
      df.resolve(readStream);
    }, 0);

    return df.promise;
  }

  /**
   * @inheritdoc
   */
  public updateStream(
    path: string,
    resource: ReadStream,
    config: IWriteStreamConfig = { visibility: Visibility.PUBLIC }
  ) {
    return this.writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public async update(
    path: string,
    contents: string | Buffer,
    config: UpdateConfig | null = { visibility: Visibility.PUBLIC }
  ): Promise<UpdateFileResult | false> {
    const location = this.prefixer.prefixPath(path);
    const visibility = config?.visibility || Visibility.PUBLIC;

    const options: any = {
      flag: config?.flag || this.writeFlags,
      mode: this._visibility.forFile(visibility as Visibility),
    };

    if (config?.encoding) {
      options.encoding = config.encoding;
    }
    try {
      await writeFile(location, contents, options);
    } catch (e) {
      return false;
    }

    const result: UpdateFileResult = {
      type: 'file',
      path,
      contents,
      size: Buffer.byteLength(contents),
    };

    if (config?.mimetype) {
      result.mimetype = await guessMimeType(path, isBuffer(contents) ? (contents as Buffer) : undefined);
    }

    return result;
  }

  /**
   * @inheritdoc
   */
  public async read(path: string, config?: IReadFileOptions): Promise<Buffer | string> {
    const location = this.prefixer.prefixPath(path);

    try {
      return await readFile(location, config);
    } catch (e) {
      throw UnableToReadFileException.fromLocation(path, e.message, e);
    }
  }

  /**
   * @inheritdoc
   */
  public async move(path: string, newPath: string) {
    const location = this.prefixer.prefixPath(path);
    const destination = this.prefixer.prefixPath(newPath);
    const parentDirectory = this.prefixer.prefixPath(dirname(newPath));
    await this.ensureDirectoryExists(parentDirectory);

    try {
      await rename(location, destination);
    } catch (e) {
      throw UnableToMoveFileException.fromLocationTo(path, newPath, e);
    }
  }

  /**
   * @inheritdoc
   */
  public async copy(path: string, newPath: string, config?: { [OPTION_DIRECTORY_VISIBILITY]?: Visibility }) {
    const location = this.prefixer.prefixPath(path);
    const destination = this.prefixer.prefixPath(newPath);
    await this.ensureDirectoryExists(
      dirname(destination),
      this.resolveDirectoryVisibility(config ? config[OPTION_DIRECTORY_VISIBILITY] : undefined)
    );

    try {
      await copyFile(location, destination);
    } catch (e) {
      throw UnableToCopyFileException.fromLocationTo(location, destination, e);
    }
  }

  /**
   * @inheritdoc
   */
  public async delete(path: string) {
    const location = this.prefixer.prefixPath(path);

    if (!(await pathExists(location))) {
      return;
    }

    try {
      await unlink(location);
    } catch (e) {
      throw UnableToDeleteFileException.atLocation(path, e.message);
    }
  }

  /**
   * @inheritdoc
   */
  public async listContents(directory = '', recursive = false): Promise<IStorageAttributes[]> {
    const result: IStorageAttributes[] = [];
    const location = this.prefixer.prefixPath(directory);

    if (!(await isDir(location))) {
      return [];
    }

    const iterator = recursive ? await getRecursiveDirectoryIterator(location) : await getDirectoryIterator(location);

    for (const file of iterator) {
      if (file.stats.isSymbolicLink()) {
        if (this.linkHandling & LocalFilesystemAdapter.SKIP_LINKS) {
          continue;
        }
        throw SymbolicLinkEncounteredException.atLocation(file.path);
      }

      const path = this.getFilePath(file);

      if (/(^|\/|\\)\.{1,2}$/.test(path)) {
        continue;
      }

      const fileInfo = this.normalizeFileInfo(file);
      if (fileInfo) {
        result.push(fileInfo);
      }
    }

    return result;
  }

  /**
   * @inheritdoc
   */
  public async getMetadata(path: string): Promise<ListContentInfo | undefined> {
    const location = this.prefixer.prefixPath(path);
    const stats = await stat(location);

    return this.normalizeFileInfo({
      path: location,
      stats,
    });
  }

  /**
   * @inheritdoc
   */
  public async fileSize(path: string): Promise<RequireOne<FileAttributes, 'fileSize'>> {
    const location = this.prefixer.prefixPath(path);

    let stats: Stats | undefined, err: Error | undefined;
    try {
      stats = await stat(location);
    } catch (e) {
      err = e;
    }
    if (stats && stats.isFile()) {
      return new FileAttributes(path, stats.size) as RequireOne<FileAttributes, 'fileSize'>;
    }

    throw UnableToRetrieveMetadataException.fileSize(path, err?.message, err);
  }

  /**
   * @inheritdoc
   * @param path
   */
  public async lastModified(path: string): Promise<RequireOne<FileAttributes, 'lastModified'>> {
    const location = this.prefixer.prefixPath(path);

    try {
      const stats = await stat(location);
      return new FileAttributes(path, undefined, undefined, stats.ctimeMs) as RequireOne<
        FileAttributes,
        'lastModified'
      >;
    } catch (e) {
      throw UnableToRetrieveMetadataException.lastModified(path, e.message);
    }
  }

  /**
   * @inheritdoc
   */
  public async mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>> {
    const location = this.prefixer.prefixPath(path);

    let mimetype, err: Error | undefined;
    try {
      mimetype = await this.mimeTypeDetector.detectMimeType(location);
    } catch (e) {
      err = e;
    }

    if (!mimetype || err) {
      throw UnableToRetrieveMetadataException.mimeType(path, err?.message, err);
    }

    return new FileAttributes(path, undefined, undefined, undefined, mimetype as string) as RequireOne<
      FileAttributes,
      'mimeType'
    >;
  }

  /**
   * @inheritdoc
   */
  public async visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>> {
    const location = this.prefixer.prefixPath(path);
    let mode: number;

    try {
      const stats = await lstat(location);
      mode = stats.mode;
    } catch (e) {
      throw UnableToRetrieveMetadataException.create(path, e.message, e);
    }
    const vb = mode & 0o1777;
    const newMode = parseInt(padStart(vb.toString(8), 4, '0'), 8);
    const visibility = this._visibility.inverseForFile(newMode);

    return new FileAttributes(path, undefined, visibility) as RequireOne<FileAttributes, 'visibility'>;
  }

  /**
   * @inheritdoc
   */
  public async setVisibility(path: string, visibility: Visibility | string) {
    const location = this.prefixer.prefixPath(path);
    const mode = (await isDir(location))
      ? this._visibility.forDirectory(visibility as Visibility)
      : this._visibility.forFile(visibility as Visibility);

    await this.setPermissions(location, mode);
  }

  /**
   * @inheritdoc
   */
  public async createDirectory(dirname: string, config: IVisibilityConfig = { visibility: Visibility.PUBLIC }) {
    const location = this.prefixer.prefixPath(dirname);
    const visibility = (config[OPTION_DIRECTORY_VISIBILITY] ||
      config[OPTION_VISIBILITY] ||
      Visibility.PUBLIC) as Visibility;
    const permission = this.resolveDirectoryVisibility(visibility);

    if (await isDir(location)) {
      await this.setPermissions(location, permission);
      return;
    }

    try {
      await mkDir(location, permission);
    } catch (e) {
      throw UnableToCreateDirectoryException.atLocation(location, e.message);
    }
  }

  /**
   * @inheritdoc
   */
  public async deleteDirectory(dirname: string) {
    const location = this.prefixer.prefixPath(dirname);

    if (!(await isDir(location))) {
      return;
    }

    const contents = await getRecursiveDirectoryIterator(location);

    for (const file of contents) {
      await this.guardAgainstUnreadableFileInfo(file);
      // in js not need this code
      // await this.deleteFileInfoObject(file);
    }

    return rmDir(location).then(() => void 0);
  }

  /**
   * @param {IPathStats} file
   */
  /*protected async deleteFileInfoObject(file: PathStatsInterface) {
    switch (getType(file.stats)) {
      case 'dir': {
        await this.deleteDir(file.path);
        break;
      }
      case 'file':
      case 'link': {
        await this.delete(file.path);
        break;
      }
    }
  }*/

  /**
   * Normalize the file info.
   *
   * @param {Dirent} file
   *
   * @return array|void
   *
   * @throws NotSupportedException
   */
  protected normalizeFileInfo(file: IPathStats) {
    if (!file.stats.isSymbolicLink()) {
      return this.mapFileInfo(file);
    }

    if (this.linkHandling & LocalFilesystemAdapter.DISALLOW_LINKS) {
      throw NotSupportedException.forLink(file.path);
    }
  }

  /**
   * Get the normalized path from a SplFileInfo object.
   *
   * @param {IPathStats} file
   *
   * @return string
   */
  protected getFilePath(file: IPathStats) {
    const location = file.path;
    const path = this.prefixer.stripPrefix(location);

    return path.replace(/\\/g, '/').replace(/^\/|\/$/, '');
  }

  /**
   * @param {IPathStats} file
   *
   * @return array
   */
  protected mapFileInfo(file: IPathStats): FileAttributes {
    return new FileAttributes(
      this.prefixer.stripPrefix(file.path),
      file.stats.size,
      file.stats.isFile()
        ? this._visibility.inverseForFile(file.stats.mode)
        : this._visibility.inverseForDirectory(file.stats.mode),
      file.stats.ctimeMs,
      undefined,
      {}
    );
    /*return {
      type: getType(file.stats),
      path: file.path,
      lastModified: file.stats.mtimeMs,
      fileSize: file.stats.size,
      isDir: file.stats.isDirectory(),
      isFile: file.stats.isFile(),
      visibility: ,
    };*/
  }

  /**
   * @param {IPathStats} file
   *
   * @throws UnreadableFileException
   */
  protected async guardAgainstUnreadableFileInfo(file: IPathStats) {
    if (!(await isReadable(file.path))) {
      throw new UnReadableFileException(file.path);
    }
  }

  private async setPermissions(location: string, visibility: number): Promise<void> {
    try {
      await chmod(location, visibility);
    } catch (e) {
      throw UnableToSetVisibilityException.atLocation(this.prefixer.stripPrefix(location), e.message, e);
    }
  }
}
