import { ReadStream } from 'fs';
import { DirType } from '../types/local-adpater.types';
import { ReadAbstract } from './read.abstract';
import { Stream } from 'stream';
import { FileType, FileVisible } from '../enum';

/**
 * write method response
 */
export type AdapterWriteResultType = {
  path: string;
  contents: string | Buffer;
  type: FileType;
  size: number;
  visibility: FileVisible | string;
};

export abstract class AdapterInterface extends ReadAbstract {
  /**
   * Write a new file.
   *
   * @param {string} path
   * @param {string} contents
   * @param {Config} config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  public abstract write(path: string, contents: string | Buffer, config: any): Promise<AdapterWriteResultType | false>;
  /**
   * Write a new file using a stream.
   *
   * @param {string}   path
   * @param {ReadStream} resource
   * @param {any}      config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  public abstract writeStream(path: string, resource: ReadStream, config: any): Promise<any | false>;

  /**
   * Update a file.
   *
   * @param {string} path
   * @param {string} contents
   * @param {any} config   Config object
   *
   * @return array|false false on failure file meta data on success
   */
  public abstract update(
    path: string,
    contents: string | Buffer,
    config: any
  ): Promise<Record<string, unknown> | false>;

  /**
   * Update a file using a stream.
   *
   * @param {string} path
   * @param {Stream} resource
   * @param {any} config
   *
   * @returns {object | false} false on failure file meta data on success
   */
  public abstract updateStream(path: string, resource: Stream, config: any): Promise<any | false>;

  /**
   * Rename a file.
   *
   * @param {string} path
   * @param {string} newPath
   *
   * @returns {boolean}
   */
  public abstract rename(path: string, newPath: string): Promise<boolean>;

  /**
   * Copy a file.
   *
   * @param {string} path
   * @param {string} newPath
   *
   * @returns {boolean}
   */
  public abstract copy(path: string, newPath: string): Promise<boolean>;

  /**
   * Delete a file.
   *
   * @param {string} path
   *
   * @returns {boolean}
   */
  public abstract delete(path: string): Promise<boolean>;

  /**
   * Delete a directory.
   *
   * @param {string} dirname
   *
   * @return {boolean}
   */
  public abstract deleteDir(dirname: string): Promise<boolean>;

  /**
   * Create a directory.
   *
   * @param {string} dirname directory name
   * @param {any} config
   *
   * @returns {array|false}
   */
  public abstract createDir(dirname: string, config: any): Promise<DirType | false>;

  /**
   * Set the visibility for a file.
   *
   * @param {string} path
   * @param {FileVisible} visibility
   *
   * @return array|false file meta data
   */
  public abstract setVisibility(path: string, visibility: FileVisible | string): Promise<object | false>;
}
