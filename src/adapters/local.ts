import { createReadStream, createWriteStream, ReadStream, realpathSync, writeFileSync } from 'fs';
import { format } from 'util';
import { FileVisible } from '../enum';
import { UnReadableFileException } from '../exceptions';
import { NotSupportedException } from '../exceptions/not-supported.exception';
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
  UpdateFileResult,
  WriteConfig,
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
import {
  chmodPromisify,
  copyFilePromisify,
  existsPromisify,
  readFilePromisify,
  renamePromisify,
  statPromisify,
  unlinkPromisify,
  writeFilePromisify,
} from '../util/fs-promisify';
import { defer } from '../util/promise-defer.util';
import { FileType, getType, guessFileMimetype } from '../util/util';
import { AbstractAdapter } from './abstract-adapter';
import { merge, filter } from 'lodash';
import { dirname, sep } from 'path';

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
      [FileVisible.VISIBILITY_PUBLIC]: '0644',
      [FileVisible.VISIBILITY_PRIVATE]: '0600',
    },
    dir: {
      [FileVisible.VISIBILITY_PUBLIC]: '0755',
      [FileVisible.VISIBILITY_PRIVATE]: '0700',
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
  public constructor(root: string, writeFlags = 'w', linkHandling = 6, permissions?: object) {
    super();
    root = isSymbolicLinkSync(root) ? realpathSync(root) : root;
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

    return existsPromisify(location);
  }

  /**
   * @inheritdoc
   */
  public async write(path: string, contents: string, config?: WriteConfig) {
    const location = this.applyPathPrefix(path);
    await this.ensureDirectory(dirname(location));

    await writeFilePromisify(location, contents, {
      flag: this.writeFlags,
    });

    const type = 'file';

    // read file size
    const result: any = {
      contents,
      type,
      size: 1999,
      path,
      visibility: undefined,
    };
    const visibility = config?.visibility;
    if (visibility) {
      result.visibility = visibility;
      await this.setVisibility(path, visibility);
    }

    return result;
  }

  /**
   * @inheritdoc
   */
  public async writeStream(path: string, resource: ReadStream, config?: any) {
    const location = this.applyPathPrefix(path);
    await this.ensureDirectory(dirname(location));

    const writeStream = createWriteStream(location);

    resource.pipe(writeStream);

    const df = defer();

    writeStream.once('finish', () => {
      df.resolve();
    });

    writeStream.once('error', (err) => {
      df.reject(err);
    });

    /*$stream = fopen(location, 'w+b');

    if ( ! $stream || stream_copy_to_stream($resource, $stream) === false || ! fclose($stream)) {
      return false;
    }

    $type = 'file';
    $result = compact('type', 'path');

    if ($visibility = $config.get('visibility')) {
      this.setVisibility(path, $visibility);
      $result['visibility'] = $visibility;
    }

    return $result;*/

    return df.promise.then(() => this.getMetadata(path));
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
  public updateStream(path: string, resource: ReadStream, config: any) {
    return this.writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public async update(path: string, contents: string, config: any): Promise<UpdateFileResult | false> {
    const location = this.applyPathPrefix(path);

    try {
      await writeFilePromisify(location, contents, this.writeFlags);
    } catch (e) {
      return false;
    }

    const type = 'file';

    // TODO 添加size的内容
    return {
      type,
      path,
      contents,
      size: 1,
      mimetype: '',
    };
  }

  /**
   * @inheritdoc
   */
  public async read(path: string): Promise<ReadFileResult | false> {
    const location = this.applyPathPrefix(path);

    let contents;
    try {
      contents = await readFilePromisify(location);
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
      await renamePromisify(location, destination);
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
      await copyFilePromisify(location, destination);
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
      await unlinkPromisify(location);
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
    const stats = await statPromisify(location);

    return this.normalizeFileInfo({
      path: location,
      stats,
    });
  }

  /**
   * @inheritdoc
   */
  public async getSize(path: string): Promise<number> {
    const meta = await this.getMetadata(path);
    return (meta as ListContentInfo).size;
  }

  /**
   * @inheritdoc
   */
  public async getMimetype(path: string): Promise<FileWithMimetypeInterface> {
    const location = this.applyPathPrefix(path);
    const mimetype = await guessFileMimetype(location);

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
    const stats = await statPromisify(location);
    const visibility = FileVisible.VISIBILITY_PRIVATE;
    // TODO need add some code
    /*$permissions = octdec(substr(sprintf('%o', fileperms(location)), -4));
    const type = await isDir(location) ? 'dir' : 'file';

    foreach (this.permissionMap[type] as $visibility => $visibilityPermissions) {
    if ($visibilityPermissions == $permissions) {
        return compact('path', 'visibility');
      }
    }

    $visibility = substr(sprintf('%o', fileperms(location)), -4);

    return compact('path', 'visibility');*/
    return {
      path,
      visibility,
    };
  }

  /**
   * @inheritdoc
   */
  public async setVisibility(path: string, visibility: FileVisible) {
    const location = this.applyPathPrefix(path);
    const type = isDir(location) ? 'dir' : 'file';

    try {
      await chmodPromisify(location, this.permissionMap[type][visibility]);
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
  public async createDir(dirname: string, config?: any) {
    const location = this.applyPathPrefix(dirname);

    const mkdirResult = await mkDir(location);

    if (mkdirResult) {
      return {
        type: 'dir',
        path: dirname,
      } as DirType;
    }

    return false;

    /*$location = this.applyPathPrefix(dirname);
    $umask = umask(0);
    $visibility = $config.get('visibility', 'public');
    $return = ['path' : $dirname, 'type' : 'dir'];

    if ( ! is_dir($location)) {
      if (false === @mkdir($location, this.permissionMap['dir'][$visibility], true)
        || false === is_dir($location)) {
        $return = false;
      }
    }

    umask($umask);

    return $return;*/
  }

  /**
   * @inheritdoc
   */
  public async deleteDir(dirname: string) {
    const location = this.applyPathPrefix(dirname);

    if (!(await isDir(location))) {
      return false;
    }

    return rmDir(location);
  }

  /**
   * @param {PathStatsInterface} file
   */
  protected async deleteFileInfoObject(file: PathStatsInterface) {
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
  }

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
      throw new NotSupportedException('not support for link');
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
      throw new UnReadableFileException(`file ${file.path} unreadable`);
    }
  }
}
