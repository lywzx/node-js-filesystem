import { ReadStream } from 'fs';

export interface ReadInterface {
  /**
   * Check whether a file exists.
   *
   * @param {string} path
   * @returns {boolean}
   */
  has(path: string): Promise<boolean>;

  /**
   * Read a file.
   * @param {string} path  file path
   * @returns {false|Array<any>}
   */
  read(path: string): Promise<false | Array<any>>;

  /**
   * Read a file as a stream.
   * @param path string
   * @return ReadStream|false
   */
  readStream(path: string): Promise<ReadStream>;

  /**
   * List contents of a directory.
   * @param {string} directory
   * @param {boolean} recursive
   * @returns {Array}
   */
  listContents(directory: string, recursive: boolean): Promise<Array<any>>;

  /**
   * Get all the meta data of a file or directory.
   *
   * @param {string} path
   * @returns {false|object}
   */
  getMetadata(path: string): Promise<object>;

  /**
   * Get the size of a file.
   *
   * @param {string} path
   *
   * @returns {Array| false}
   */
  getSize(path: string): Promise<Array<any>>;

  /**
   * Get the mimetype of a file.
   *
   * @param path
   *
   * @returns {array|false}
   */
  getMimetype(path: string): Promise<string>;

  /**
   * Get the last modified time of a file as a timestamp.
   *
   * @param {string} path
   *
   * @returns {number | false}
   */
  getTimestamp(path: string): Promise<number>;

  /**
   * Get the visibility of a file.
   * @param {string} path
   *
   * @returns {object|false}
   */
  getVisibility(path: string): Promise<object | false>;
}
