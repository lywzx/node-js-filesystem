import {
  DirectoryAttributes,
  FileAttributes,
  IFilesystemAdapter,
  IFilesystemVisibility,
  IMimeTypeDetector,
  IReadFileOptions,
  IStorageAttributes,
  IVisibilityConverter,
  OPTION_DIRECTORY_VISIBILITY,
  OPTION_VISIBILITY,
  PathPrefixer,
  RequireOne,
  UnableToMoveFileException,
  UnableToReadFileException,
  UnableToRetrieveMetadataException,
  UnableToSetVisibilityException,
  EVisibility,
} from '@filesystem/core';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import get from 'lodash/get';
import map from 'lodash/map';
import omit from 'lodash/omit';
import set from 'lodash/set';
import { getFileLastModifiedFromRes, getFileMimeTypeFromRes, getFileSizeFromRes, promiseToBoolean } from './util';
import { AliOssVisibilityConverter } from './ali-oss-visibility-converter';
import { AliOssMimeTypeDetector } from './ali-oss-mime-type-detector';
import OSS from 'ali-oss';
import { AliOssPathPrefixer } from './ali-oss-path-prefixer';

export class AliOssFilesystemAdapter implements IFilesystemAdapter {
  public client: OSS;

  public prefixer: PathPrefixer;

  constructor(
    protected options: OSS.Options,
    protected root: string,
    protected readonly _visibility: IVisibilityConverter = new AliOssVisibilityConverter(),
    protected mimeTypeDetector: IMimeTypeDetector = new AliOssMimeTypeDetector()
  ) {
    this.prefixer = new AliOssPathPrefixer(root, '/');
    this.client = new OSS(options);
  }

  /**
   * ali oss base head request
   * @param path
   * @param method
   * @protected
   */
  protected clientHeadBase(path: string, method: 'lastModified' | 'visibility' | 'fileSize' | 'mimeType') {
    return this.client
      .head(this.prefixer.prefixPath(path))
      .then((result) => {
        return new FileAttributes(
          path,
          getFileSizeFromRes(result),
          undefined,
          getFileLastModifiedFromRes(result),
          getFileMimeTypeFromRes(result)
        ) as RequireOne<FileAttributes, 'mimeType'>;
      })
      .catch((res) => {
        throw UnableToRetrieveMetadataException[method](path, res?.code, res);
      });
  }

  public async copy(source: string, destination: string, config?: OSS.CopyObjectOptions): Promise<void> {
    await this.client.copy(this.prefixer.prefixPath(destination), this.prefixer.prefixPath(source), config);
  }

  public async createDirectory(path: string, config?: IFilesystemVisibility & OSS.PutObjectOptions): Promise<void> {
    await this.client.put(this.prefixer.prefixPath(path), Buffer.from(''), config).then(
      (response) => {
        return get(response, 'res.statusCode') === 200;
      },
      () => false
    );
  }

  public async delete(path: string, options?: OSS.RequestOptions): Promise<void> {
    await this.client.delete(this.prefixer.prefixPath(path), options);
  }

  public async deleteDirectory(path: string): Promise<void> {
    while (true) {
      const allFiles = await this.listContents(path, true);
      if (allFiles.length) {
        await this.client.deleteMulti(map(allFiles, (i) => this.prefixer.prefixPath(i.path)));
      } else {
        break;
      }
    }
  }

  public async fileExists(path: string): Promise<boolean> {
    return promiseToBoolean(this.client.head(this.prefixer.prefixPath(path)));
  }

  public fileSize(path: string) {
    return this.clientHeadBase(path, 'fileSize') as Promise<RequireOne<FileAttributes, 'fileSize'>>;
  }

  /**
   * @param path
   */
  public lastModified(path: string) {
    return this.clientHeadBase(path, 'fileSize') as Promise<RequireOne<FileAttributes, 'lastModified'>>;
  }

  /**
   *
   * @param path
   * @param deep
   */
  public async listContents(path: string, deep = false): Promise<IStorageAttributes[]> {
    return this.client
      .list(
        {
          prefix: this.prefixer.prefixDirectoryPath(path),
          delimiter: deep ? undefined : '/',
          'max-keys': 1000,
        },
        {}
      )
      .then((response) => {
        return map(response.objects, (obj) => {
          const isFile = !/\/$/.test(obj.name);

          return isFile
            ? new FileAttributes(
                this.prefixer.stripPrefix(obj.name),
                obj.size,
                undefined,
                new Date(obj.lastModified).getTime(),
                undefined,
                obj
              )
            : new DirectoryAttributes(
                this.prefixer.stripPrefix(obj.name),
                undefined,
                new Date(obj.lastModified).getTime()
              );
        });
      });
  }

  public mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>> {
    return this.clientHeadBase(path, 'mimeType');
  }

  public async move(source: string, destination: string, config?: OSS.CopyObjectOptions): Promise<void> {
    let needClean = false;
    const prefixSource = this.prefixer.prefixPath(source);
    const prefixDestionation = this.prefixer.prefixPath(destination);
    let err: UnableToMoveFileException | undefined;
    try {
      await this.client.copy(prefixDestionation, prefixSource, config);
      needClean = true;
      await this.client.delete(prefixSource);
    } catch (e) {
      err = UnableToMoveFileException.fromLocationTo(source, destination, e);
    }
    try {
      if (needClean) {
        await this.client.delete(prefixSource);
      }
    } catch (e) {}
    if (err) {
      throw err;
    }
  }

  public async read(path: string, config?: IReadFileOptions): Promise<string | Buffer> {
    return this.client
      .get(this.prefixer.prefixPath(path))
      .then((result) => {
        if (config) {
          return (result.content as Buffer).toString(config?.encoding);
        }
        return result.content;
      })
      .catch((res) => {
        throw UnableToReadFileException.fromLocation(path, res?.code, res);
      });
  }

  public async readStream(path: string, config?: OSS.GetStreamOptions): Promise<ReadStream> {
    return this.client
      .getStream(this.prefixer.prefixPath(path), config)
      .then((result) => result.stream)
      .catch((res) => {
        throw UnableToReadFileException.fromLocation(path, res?.code, res);
      });
  }

  public async setVisibility(path: string, visibility: EVisibility): Promise<void> {
    await this.client
      .putACL(this.prefixer.prefixPath(path), this._visibility.forFile(visibility) as OSS.ACLType)
      .catch((res) => {
        throw UnableToSetVisibilityException.atLocation(path, res?.code, res);
      });
  }

  public async visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>> {
    const result = await this.client.getACL(this.prefixer.prefixPath(path)).catch((res) => {
      throw UnableToRetrieveMetadataException.visibility(path, res?.code, res);
    });
    return new FileAttributes(path, undefined, this._visibility.inverseForFile(result.acl)) as RequireOne<
      FileAttributes,
      'visibility'
    >;
  }

  public async write(
    path: string,
    contents: string | Buffer,
    config?: IFilesystemVisibility & OSS.PutObjectOptions
  ): Promise<void> {
    const content = typeof contents === 'string' ? Buffer.from(contents) : contents;
    const options = {
      ...omit(config, [OPTION_VISIBILITY, OPTION_DIRECTORY_VISIBILITY]),
    };
    // set alioss visible
    if (config && config[OPTION_VISIBILITY]) {
      set(options, 'headers.x-oss-object-acl', this._visibility.forFile(config[OPTION_VISIBILITY] as EVisibility));
    }
    await this.client.put(this.prefixer.prefixPath(path), content, options);
    return Promise.resolve(undefined);
  }

  public async writeStream(
    path: string,
    resource: Readable,
    config?: IFilesystemVisibility & OSS.PutStreamOptions
  ): Promise<void> {
    await this.client.putStream(this.prefixer.prefixPath(path), resource, config);
  }

  getPathPrefix(): PathPrefixer {
    return this.prefixer;
  }
}
