import { ReadInterface } from './read.interface';
import { Stream } from 'stream';
import { FileVisible } from '../enum';

export interface AdapterInterface extends ReadInterface {
  /**
   * Write a new file.
   *
   * @param {string} path
   * @param {string} contents
   * @param {Config} config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  write(path: string, contents: string, config: any): Array<any> | false;
  /**
   * Write a new file using a stream.
   *
   * @param {string}   path
   * @param {Stream}   resource
   * @param {any}      config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  writeStream(path: string, resource: Stream, config: any): object | false;

  /**
   * Update a file.
   *
   * @param {string} path
   * @param {string} contents
   * @param {any} config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  update(path: string, contents: string, config: any): object | false;

  /**
   * Update a file using a stream.
   *
   * @param {string} path
   * @param {Stream} resource
   * @param {any} config
   *
   * @returns {object | false} false on failure file meta data on success
   */
  updateStream(path: string, resource: Stream, config: any): object | false;

  /**
   * Rename a file.
   *
   * @param {string} path
   * @param {string} newPath
   *
   * @returns {boolean}
   */
  rename(path: string, newPath: string): boolean;

  /**
   * Copy a file.
   *
   * @param {string} path
   * @param {string} newPath
   *
   * @returns {boolean}
   */
  copy(path: string, newPath: string): boolean;

  /**
   * Delete a file.
   *
   * @param {string} path
   *
   * @returns {boolean}
   */
  delete(path: string): boolean;

  /**
   * Delete a directory.
   *
   * @param {string} dirname
   *
   * @return {boolean}
   */
  deleteDir(dirname: string): boolean;

  /**
   * Create a directory.
   *
   * @param {string} dirname directory name
   * @param {any} config
   *
   * @returns {array|false}
   */
  createDir(dirname: string, config: any): boolean;

  /**
   * Set the visibility for a file.
   *
   * @param {string} path
   * @param {FileVisible} visibility
   *
   * @return array|false file meta data
   */
  setVisibility(path: string, visibility: FileVisible): object | false;
}
