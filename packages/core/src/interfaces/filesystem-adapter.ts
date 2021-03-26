import { ReadStream } from 'fs';
import { Visibility } from '../enum';
import { FileAttributes, PathPrefixer } from '../libs';
import { IStorageAttributes } from './storage-attributes.interface';
import { RequireOne } from './types';
import { Readable } from 'stream';
import { OPTION_DIRECTORY_VISIBILITY, OPTION_VISIBILITY } from '../constant';

/**
 * directory or file visibility
 */
export interface IFilesystemVisibility {
  /**
   * file or directory default visibility
   */
  [OPTION_VISIBILITY]?: Visibility | string;
  /**
   * directory default visibility
   */
  [OPTION_DIRECTORY_VISIBILITY]?: Visibility | string;
}

/**
 * read file option
 */
export interface IReadFileOptions {
  /**
   * read file encoding
   */
  encoding?: BufferEncoding;
  /**
   *
   */
  flag?: string;
}

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
  write(path: string, contents: string | Buffer, config?: IFilesystemVisibility): Promise<void>;

  /**
   * @param path
   * @param resource {Readable}
   * @param config
   * @throws UnableToWriteFile
   * @throws FilesystemException
   */
  writeStream(path: string, resource: Readable, config?: IFilesystemVisibility): Promise<void>;

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
  createDirectory(path: string, config?: IFilesystemVisibility): Promise<void>;

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
