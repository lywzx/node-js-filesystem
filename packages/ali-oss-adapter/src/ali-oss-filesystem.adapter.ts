import OSS, {
  ACLType,
  CopyObjectOptions,
  GetStreamOptions,
  Options,
  PutObjectOptions,
  PutStreamOptions,
  RequestOptions,
} from 'ali-oss';
import {
  DirectoryAttributes,
  FileAttributes,
  IFilesystemAdapter,
  IMimeTypeDetector,
  IStorageAttributes,
  IVisibilityConverter,
  PathPrefixer,
  RequireOne,
  Visibility,
} from '@filesystem/core';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import get from 'lodash/get';
import map from 'lodash/map';
import { promiseToBoolean } from './util';
import { AliOssVisibilityConverter } from './ali-oss-visibility-converter';
import { AliOssMimeTypeDetector } from './ali-oss-mime-type-detector';

export class AliOssFilesystemAdapter implements IFilesystemAdapter {
  public client: OSS;

  public prefixer: PathPrefixer;

  constructor(
    protected options: Options,
    protected root: string,
    protected readonly _visibility: IVisibilityConverter = new AliOssVisibilityConverter(),
    protected mimeTypeDetector: IMimeTypeDetector = new AliOssMimeTypeDetector()
  ) {
    this.prefixer = new PathPrefixer(root, '/');
    this.client = new OSS(options);
  }

  public async copy(source: string, destination: string, config?: CopyObjectOptions): Promise<void> {
    await this.client.copy(destination, source, config);
  }

  public async createDirectory(path: string, config?: PutObjectOptions): Promise<void> {
    await this.client.put(this.prefixer.prefixPath(path), new Buffer(''), config).then(
      (response) => {
        return get(response, 'res.statusCode') === 200;
      },
      () => false
    );
  }

  public async delete(path: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(this.prefixer.prefixPath(path), options);
  }

  public async deleteDirectory(path: string): Promise<void> {
    await this.client.delete(this.prefixer.prefixPath(path));
  }

  public async fileExists(path: string): Promise<boolean> {
    return promiseToBoolean(this.client.head(this.prefixer.prefixPath(path)));
  }

  public async fileSize(path: string): Promise<RequireOne<FileAttributes, 'fileSize'>> {
    const result = await this.client.head(this.prefixer.prefixPath(path));
    return new FileAttributes(path, result.res.size, undefined, undefined, undefined) as RequireOne<
      FileAttributes,
      'fileSize'
    >;
  }

  /**
   * @param path
   */
  public async lastModified(path: string): Promise<RequireOne<FileAttributes, 'lastModified'>> {
    const result = await this.client.head(this.prefixer.prefixPath(path));
    const date = get(result, 'res.headers.last-modified');
    if (date) {
      return new FileAttributes(path, undefined, undefined, date) as RequireOne<FileAttributes, 'lastModified'>;
    }
    throw new Error('');
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
          prefix: path,
          delimiter: deep ? '/' : '',
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

  public async mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>> {
    const result = await this.client.head(this.prefixer.prefixPath(path));

    return new FileAttributes(path, result.res.size, undefined, get(result, 'res.headers.last-modified')) as RequireOne<
      FileAttributes,
      'mimeType'
    >;
  }

  public async move(source: string, destination: string, config?: CopyObjectOptions): Promise<void> {
    let needClean = false;
    try {
      await this.client.copy(destination, source, config);
      needClean = true;
      await this.client.delete(source);
    } catch (e) {}
    try {
      if (needClean) {
        await this.client.delete(source);
      }
    } catch (e) {}
  }

  public async read(path: string): Promise<string | Buffer> {
    return this.client.get(this.prefixer.prefixPath(path)).then((result) => {
      return result.content;
    });
  }

  public async readStream(path: string, config?: GetStreamOptions): Promise<ReadStream> {
    return this.client.getStream(this.prefixer.prefixPath(path), config).then((result) => result.stream);
  }

  public async setVisibility(path: string, visibility: Visibility): Promise<void> {
    // 'public-read-write' | 'public-read' | 'private'
    const realVisibility = {
      public: 'public-read-write',
      private: 'private',
    }[visibility];
    await this.client.putACL(this.prefixer.prefixPath(path), realVisibility as ACLType);
  }

  public async visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>> {
    const result = await this.client.getACL(this.prefixer.prefixPath(path));
    return new FileAttributes(path, undefined, Visibility.PUBLIC) as RequireOne<FileAttributes, 'visibility'>;
  }

  public async write(path: string, contents: string | Buffer, config?: PutObjectOptions): Promise<void> {
    await this.client.put(this.prefixer.prefixPath(path), contents, config);
    return Promise.resolve(undefined);
  }

  public async writeStream(path: string, resource: Readable, config?: PutStreamOptions): Promise<void> {
    await this.client.putStream(this.prefixer.prefixPath(path), resource, config);
  }

  getPathPrefix(): PathPrefixer {
    return this.prefixer;
  }
}
