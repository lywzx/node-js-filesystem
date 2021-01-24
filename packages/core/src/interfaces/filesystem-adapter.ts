import { ReadStream } from 'fs';
import { Visibility } from '../enum';
import { FileAttributes, PathPrefixer } from '../libs';
import { IStorageAttributes } from './storage-attributes.interface';
import { RequireOne } from './types';
import { Readable } from 'stream';

export interface IFilesystemAdapter {
  /**
   * get current path prefix
   */
  getPathPrefix(): PathPrefixer;

  /**
   * @throws FilesystemException
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * @throws UnableToWriteFile
   * @throws FilesystemException
   */
  write(path: string, contents: string | Buffer, config?: Record<string, any>): Promise<void>;

  /**
   * @param resource {Readable}
   *
   * @throws UnableToWriteFile
   * @throws FilesystemException
   */
  writeStream(path: string, resource: Readable, config?: Record<string, any>): Promise<void>;

  /**
   * @throws UnableToReadFile
   * @throws FilesystemException
   */
  read(path: string, config?: IReadFileOptions): Promise<string | Buffer>;

  /**
   * @return resource
   *
   * @throws UnableToReadFile
   * @throws FilesystemException
   */
  readStream(path: string, config?: Record<string, any>): Promise<ReadStream>;

  /**
   * @throws UnableToDeleteFile
   * @throws FilesystemException
   */
  delete(path: string): Promise<void>;

  /**
   * @throws UnableToDeleteDirectory
   * @throws FilesystemException
   */
  deleteDirectory(path: string): Promise<void>;

  /**
   * @throws UnableToCreateDirectory
   * @throws FilesystemException
   */
  createDirectory(path: string, config?: Record<string, any>): Promise<void>;

  /**
   * @throws InvalidVisibilityProvided
   * @throws FilesystemException
   */
  setVisibility(path: string, visibility: Visibility): Promise<void>;

  /**
   * @throws UnableToRetrieveMetadata
   * @throws FilesystemException
   */
  visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>>;

  /**
   * @throws UnableToRetrieveMetadata
   * @throws FilesystemException
   */
  mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>>;

  /**
   * @throws UnableToRetrieveMetadata
   * @throws FilesystemException
   */
  lastModified(path: string): Promise<RequireOne<FileAttributes, 'lastModified'>>;

  /**
   * @throws UnableToRetrieveMetadata
   * @throws FilesystemException
   */
  fileSize(path: string): Promise<RequireOne<FileAttributes, 'fileSize'>>;

  /**
   * @return iterable<StorageAttributes>
   *
   * @throws FilesystemException
   */
  listContents(path: string, deep: boolean): Promise<IStorageAttributes[]>;

  /**
   * @throws UnableToMoveFile
   * @throws FilesystemException
   */
  move(source: string, destination: string, config?: Record<string, any>): Promise<void>;

  /**
   * @throws UnableToCopyFile
   * @throws FilesystemException
   */
  copy(source: string, destination: string, config?: Record<string, any>): Promise<void>;
}

export interface IReadFileOptions {
  encoding?: BufferEncoding | null;
  flag?: string;
}
