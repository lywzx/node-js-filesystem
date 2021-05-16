import { Readable } from 'stream';
import { Visibility } from '../enum';

export interface IFilesystemWriter {
  /**
   * @throws UnableToWriteFile
   * @throws FilesystemException
   */
  write(path: string, content: string | Buffer, config?: Record<string, any>): Promise<void>;

  /**
   * @param mixed $contents
   *
   * @throws UnableToWriteFile
   * @throws FilesystemException
   */
  writeStream(path: string, contents: Readable, config?: Record<string, any>): Promise<void>;

  /**
   * @throws UnableToSetVisibility
   * @throws FilesystemException
   */
  setVisibility(path: string, visibility: Visibility): Promise<void>;

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
  createDirectory(path: string, config?: Record<string, any>): void;

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
