import { ListContentInfo, ReadFileResult, ReadStreamResult } from '../types/local-adpater.types';
import { FileWithMimetypeInterface } from './path-stats.interface';

export abstract class ReadAbstract {
  /**
   * Check whether a file exists.
   *
   * @param {string} path
   * @returns {boolean}
   */
  public abstract has(path: string): Promise<boolean>;

  /**
   * Read a file.
   * @param {string} path  file path
   * @returns {false|Array<any>}
   */
  public abstract read(path: string): Promise<ReadFileResult | false>;

  /**
   * Read a file as a stream.
   * @param path string
   * @return ReadStream|false
   */
  public abstract readStream(path: string): ReadStreamResult;

  /**
   * List contents of a directory.
   * @param {string} directory
   * @param {boolean} recursive
   * @returns {Array}
   */
  public abstract listContents(directory: string, recursive: boolean): Promise<ListContentInfo[]>;

  /**
   * Get all the meta data of a file or directory.
   *
   * @param {string} path
   * @returns {false|object}
   */
  public abstract getMetadata(path: string): Promise<ListContentInfo | undefined>;

  /**
   * Get the size of a file.
   *
   * @param {string} path
   *
   * @returns {Array| false}
   */
  public abstract getSize(path: string): Promise<ListContentInfo>;

  /**
   * Get the mimetype of a file.
   *
   * @param path
   *
   * @returns {array|false}
   */
  public abstract getMimetype(path: string): Promise<FileWithMimetypeInterface>;

  /**
   * Get the last modified time of a file as a timestamp.
   *
   * @param {string} path
   *
   * @returns {number | false}
   */
  public abstract getTimestamp(path: string): Promise<any>;

  /**
   * Get the visibility of a file.
   * @param {string} path
   *
   * @returns {object|false}
   */
  public abstract getVisibility(path: string): Promise<object | false>;
}
