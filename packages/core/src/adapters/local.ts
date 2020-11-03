import { createReadStream, createWriteStream, ReadStream, realpathSync } from 'fs';
import filter from 'lodash/filter';
import isBuffer from 'lodash/isBuffer';
import merge from 'lodash/merge';
import toPairs from 'lodash/toPairs';
import padStart from 'lodash/padStart';
import { dirname, sep } from 'path';
import { format } from 'util';
import { FileVisible } from '../enum';
import { NotSupportedException, UnReadableFileException } from '../exceptions';
import {
  AdapterInterface,
  FileWithMimetypeInterface,
  FileWithVisibilityInterface,
  PathStatsInterface,
} from '../interfaces';
import {
  DirType,
  ListContentInfo,
  ReadFileResult,
  ReadStreamResult,
  UpdateConfig,
  UpdateFileResult,
  VisibilityConfig,
  WriteConfig,
  WriteStreamConfig,
} from '../types/local-adpater.types';
import {
  getDirectoryIterator,
  getRecursiveDirectoryIterator,
  isDir,
  isDirSync,
  isReadable,
  isReadableSync,
  isSymbolicLinkSync,
  mkDir,
  mkDirSync,
  normalizeDirname,
  rmDir,
} from '../util';
import { defer } from '../util/promise-defer.util';
import { getType, guessMimeType } from '../util/util';
import { AbstractAdapter } from './abstract-adapter';
import { copyFile, readFile, writeFile, rename, unlink, stat, lstat, chmod, pathExists } from '../util/fs-extra.util';

export class Local extends AbstractAdapter implements AdapterInterface {
  /**
   * 0001
   * @var number
   */
  static SKIP_LINKS = 1;

  /**
   * 0002
   * @var number
   */
  static DISALLOW_LINKS = 2;

  /**
   * @var array
   */
  protected static permissions = {
    file: {
      [FileVisible.VISIBILITY_PUBLIC]: 0o644,
      [FileVisible.VISIBILITY_PRIVATE]: 0o600,
    },
    dir: {
      [FileVisible.VISIBILITY_PUBLIC]: 0o755,
      [FileVisible.VISIBILITY_PRIVATE]: 0o700,
    },
  };

  /**
   * @var string
   */
  protected pathSeparator = sep;

  /**
   * @var array
   */
  protected permissionMap: any;

  /**
   * @var string
   */
  protected writeFlags: string;

  /**
   * @var number
   */
  private linkHandling: number;

  /**
   * Constructor.
   *
   * @param {string} root
   * @param {number} writeFlags
   * @param {number} linkHandling
   * @param {object} permissions
   *
   * @throws LogicException
   */
  public constructor(
    root: string,
    writeFlags = 'w',
    linkHandling = Local.DISALLOW_LINKS,
    permissions?: Record<string, unknown>
  ) {
    super();
    try {
      root = isSymbolicLinkSync(root) ? realpathSync(root) : root;
    } catch (e) {}
    this.permissionMap = merge({}, Local.permissions, permissions);
    this.ensureDirectorySync(root);

    if (!isDirSync(root) || !isReadableSync(root)) {
      throw new Error(`The root path ${root} is not readable.`);
    }

    this.setPathPrefix(root);
    this.writeFlags = writeFlags;
    this.linkHandling = linkHandling;
  }

  /**
   * Ensure the root directory exists.
   *
   * @param {string} root root directory path
   *
   * @return void
   *
   * @throws Exception in case the root directory can not be created
   */
  protected ensureDirectorySync(root: string) {
    if (!isDirSync(root)) {
      let err;
      try {
        mkDirSync(root, this.permissionMap['dir']['public']);
      } catch (e) {
        err = e;
      }

      if (!isDirSync(root)) {
        const errorMessage = err?.message || '';
        throw new Error(format('Impossible to create the root directory "%s". %s', root, errorMessage));
      }
    }
  }

  /**
   * Ensure the root directory exists.
   *
   * @param {string} root root directory path
   *
   * @return void
   *
   * @throws Exception in case the root directory can not be created
   */
  protected async ensureDirectory(root: string) {
    if (!(await isDir(root))) {
      let err;
      try {
        await mkDir(root);
      } catch (e) {
        err = e;
      }

      if (!isDir(root)) {
        const errorMessage = err?.message || '';
        throw new Error(format('Impossible to create the root directory "%s". %s', root, errorMessage));
      }
    }
  }

  /**
   * @inheritdoc
   */
  public async has(path: string) {
    const location = this.applyPathPrefix(path);

    return pathExists(location);
  }

  /**
   * @inheritdoc
   */
  public async write(
    path: string,
    contents: string | Buffer,
    config: WriteConfig | undefined = { visibility: FileVisible.VISIBILITY_PUBLIC }
  ) {
    const location = this.applyPathPrefix(path);
    await this.ensureDirectory(dirname(location));
    const visibility = config?.visibility || FileVisible.VISIBILITY_PUBLIC;

    const options: any = {
      flag: config?.flag || this.writeFlags,
      mode: this.permissionMap['file'][visibility],
    };

    if (config?.encoding) {
      options.encoding = config.encoding;
    }

    await writeFile(location, contents, options);

    const type = 'file';

    // read file size
    const result: any = {
      contents,
      type,
      size: Buffer.byteLength(contents),
      path,
      visibility: visibility,
    };

    return result;
  }

  /**
   * @inheritdoc
   */
  public async writeStream(
    path: string,
    resource: ReadStream,
    config: WriteStreamConfig | null = { visibility: FileVisible.VISIBILITY_PUBLIC }
  ) {
    const location = this.applyPathPrefix(path);
    await this.ensureDirectory(dirname(location));
    const visibility = config?.visibility || FileVisible.VISIBILITY_PUBLIC;

    const option: any = {
      flags: config?.flags || this.writeFlags,
      mode: this.permissionMap['file'][visibility],
    };

    if (config?.encoding) {
      option.encoding = config.encoding;
    }

    const writeStream = createWriteStream(location, option);

    resource.pipe(writeStream);

    const df = defer();

    writeStream.once('finish', () => {
      df.resolve();
    });

    writeStream.once('error', (err) => {
      df.reject(err);
    });

    return df.promise.then(() => ({
      type: 'file',
      path,
      visibility,
    }));
  }

  /**
   * @inheritdoc
   */
  public readStream(path: string): ReadStreamResult {
    const location = this.applyPathPrefix(path);
    const stream = createReadStream(location);

    return {
      type: 'file',
      path,
      stream,
    };
  }

  /**
   * @inheritdoc
   */
  public updateStream(
    path: string,
    resource: ReadStream,
    config: WriteStreamConfig | null = { visibility: FileVisible.VISIBILITY_PUBLIC }
  ) {
    return this.writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public async update(
    path: string,
    contents: string | Buffer,
    config: UpdateConfig | null = { visibility: FileVisible.VISIBILITY_PUBLIC }
  ): Promise<UpdateFileResult | false> {
    const location = this.applyPathPrefix(path);
    const visibility = config?.visibility || FileVisible.VISIBILITY_PUBLIC;

    const options: any = {
      flag: config?.flag || this.writeFlags,
      mode: this.permissionMap['file'][visibility],
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
  public async read(path: string): Promise<ReadFileResult | false> {
    const location = this.applyPathPrefix(path);

    let contents;
    try {
      contents = await readFile(location);
    } catch (e) {
      return false;
    }

    return {
      type: 'file',
      path,
      contents,
    };
  }

  /**
   * @inheritdoc
   */
  public async rename(path: string, newPath: string) {
    const location = this.applyPathPrefix(path);
    const destination = this.applyPathPrefix(newPath);
    const parentDirectory = this.applyPathPrefix(normalizeDirname(dirname(newPath)));
    await this.ensureDirectory(parentDirectory);

    try {
      await rename(location, destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  public async copy(path: string, newPath: string) {
    const location = this.applyPathPrefix(path);
    const destination = this.applyPathPrefix(newPath);
    await this.ensureDirectory(dirname(destination));

    try {
      await copyFile(location, destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  public async delete(path: string) {
    const location = this.applyPathPrefix(path);

    try {
      await unlink(location);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  public async listContents(directory = '', recursive = false): Promise<ListContentInfo[]> {
    const result: ListContentInfo[] = [];
    const location = this.applyPathPrefix(directory);

    if (!(await isDir(location))) {
      return [];
    }

    const iterator = recursive ? await getRecursiveDirectoryIterator(location) : await getDirectoryIterator(location);

    for (const file of iterator) {
      const path = this.getFilePath(file);

      if (/(^|\/|\\)\.{1,2}$/.test(path)) {
        continue;
      }

      const fileInfo = this.normalizeFileInfo(file);
      result.push(fileInfo as ListContentInfo);
    }

    return filter(result);
  }

  /**
   * @inheritdoc
   */
  public async getMetadata(path: string): Promise<ListContentInfo | undefined> {
    const location = this.applyPathPrefix(path);
    const stats = await stat(location);

    return this.normalizeFileInfo({
      path: location,
      stats,
    });
  }

  /**
   * @inheritdoc
   */
  public async getSize(path: string): Promise<ListContentInfo> {
    return this.getMetadata(path) as any;
  }

  /**
   * @inheritdoc
   */
  public async getMimetype(path: string): Promise<FileWithMimetypeInterface> {
    const location = this.applyPathPrefix(path);

    const mimetype = await guessMimeType(location);

    return {
      path,
      type: 'file',
      mimetype,
    };
  }

  /**
   * @inheritdoc
   */
  public getTimestamp(path: string) {
    return this.getMetadata(path);
  }

  /**
   * @inheritdoc
   */
  public async getVisibility(path: string): Promise<FileWithVisibilityInterface> {
    const location = this.applyPathPrefix(path);
    const stats = await lstat(location);
    const mode = stats.mode;
    const vb = mode & 0o1777;
    const visibility = padStart(vb.toString(8), 4, '0');

    const permissions = toPairs(this.permissionMap[stats.isDirectory() ? 'dir' : 'file']);

    for (const [key, permission] of permissions) {
      if (permission === vb) {
        return {
          path,
          visibility: key,
        };
      }
    }

    return {
      path,
      visibility,
    };
  }

  /**
   * @inheritdoc
   */
  public async setVisibility(path: string, visibility: FileVisible | string) {
    const location = this.applyPathPrefix(path);
    const type = (await isDir(location)) ? 'dir' : 'file';

    try {
      await chmod(location, this.permissionMap[type][visibility]);
    } catch (e) {
      return false;
    }

    return {
      path,
      visibility,
    };
  }

  /**
   * @inheritdoc
   */
  public async createDir(
    dirname: string,
    config: VisibilityConfig | null = { visibility: FileVisible.VISIBILITY_PUBLIC }
  ) {
    const location = this.applyPathPrefix(dirname);
    const mode = this.permissionMap['dir'][config?.visibility || FileVisible.VISIBILITY_PUBLIC];

    let mkdirResult;
    try {
      mkdirResult = await mkDir(location, mode);
    } catch (e) {
      return false;
    }

    if (mkdirResult) {
      return {
        type: 'dir',
        path: dirname,
      } as DirType;
    }

    return false;
  }

  /**
   * @inheritdoc
   */
  public async deleteDir(dirname: string) {
    const location = this.applyPathPrefix(dirname);

    if (!(await isDir(location))) {
      return false;
    }

    const contents = await getRecursiveDirectoryIterator(location);

    for (const file of contents) {
      await this.guardAgainstUnreadableFileInfo(file);
      // in js not need this code
      // await this.deleteFileInfoObject(file);
    }

    return rmDir(location);
  }

  /**
   * @param {PathStatsInterface} file
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
  protected normalizeFileInfo(file: PathStatsInterface) {
    if (!file.stats.isSymbolicLink()) {
      return this.mapFileInfo(file);
    }

    if (this.linkHandling & Local.DISALLOW_LINKS) {
      throw NotSupportedException.forLink(file.path);
    }
  }

  /**
   * Get the normalized path from a SplFileInfo object.
   *
   * @param {PathStatsInterface} file
   *
   * @return string
   */
  protected getFilePath(file: PathStatsInterface) {
    const location = file.path;
    const path = this.removePathPrefix(location);

    return path.replace(/\\/g, '/').replace(/^\/|\/$/, '');
  }

  /**
   * @param {PathStatsInterface} file
   *
   * @return array
   */
  protected mapFileInfo(file: PathStatsInterface) {
    return {
      type: getType(file.stats),
      path: file.path,
      timestamp: file.stats.mtimeMs,
      size: file.stats.size,
    };
  }

  /**
   * @param {PathStatsInterface} file
   *
   * @throws UnreadableFileException
   */
  protected async guardAgainstUnreadableFileInfo(file: PathStatsInterface) {
    if (!(await isReadable(file.path))) {
      throw new UnReadableFileException(file.path);
    }
  }
}
