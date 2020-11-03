import { Stream } from 'stream';
import { FileVisible } from '../enum';
import { PluginNotFoundException } from '../exceptions';
import { Handler } from '../handler';
import { ListContentInfo } from '../types/local-adpater.types';
import { AdapterWriteResultType } from './adapter.interface';
import { PluginInterface } from './plugin.interface';

export abstract class FilesystemAbstract {
  /**
   * @var array
   */
  protected plugins: any = {};

  /**
   * Check whether a file exists.
   *
   * @param {string} path
   *
   * @return {boolean}0.
   */
  public abstract async has(path: string): Promise<boolean>;

  /**
   * Read a file.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {string|false} The file contents or false on failure.
   */
  public abstract async read(path: string): Promise<false | string | Buffer>;

  /**
   * Retrieves a read-stream for a path.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {Stream|false} The path resource or false on failure.
   */
  public abstract async readStream(path: string): Promise<Stream | false>;

  /**
   * List contents of a directory.
   *
   * @param {string} directory The directory to list.
   * @param {boolean}recursive Whether to list recursively.
   *
   * @return array A list of file metadata.
   */
  public abstract async listContents(directory: string, recursive: boolean): Promise<ListContentInfo[]>;

  /**
   * Get a file's metadata.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {Promise<array|undefined>} The file metadata or false on failure.
   */
  public abstract async getMetadata(path: string): Promise<ListContentInfo | undefined>;

  /**
   * Get a file's size.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {number|false} The file size or false on failure.
   */
  public abstract async getSize(path: string): Promise<number | false>;

  /**
   * Get a file's mime-type.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {Promise<string|false>} The file mime-type or false on failure.
   */
  public abstract async getMimetype(path: string): Promise<string | false>;

  /**
   * Get a file's timestamp.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {string|false} The timestamp or false on failure.
   */
  public abstract async getTimestamp(path: string): Promise<number | false>;

  /**
   * Get a file's visibility.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {FileVisible|false} The visibility (public|private) or false on failure.
   */
  public abstract async getVisibility(path: string): Promise<FileVisible | false>;

  /**
   * Write a new file.
   *
   * @param {string} path     The path of the new file.
   * @param {string | Buffer} contents The file contents.
   * @param {object}  config   An optional configuration array.
   *
   * @throws FileExistsException
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract write(path: string, contents: string | Buffer, config: any): Promise<false | AdapterWriteResultType>;

  /**
   * Write a new file using a stream.
   *
   * @param {string} path     The path of the new file.
   * @param {Stream} resource The file handle.
   * @param {any}    config   An optional configuration array.
   *
   * @throws InvalidArgumentException If $resource is not a file handle.
   * @throws FileExistsException
   *
   * @return bool True on success, false on failure.
   */
  public abstract async writeStream(path: string, resource: Stream, config?: any): Promise<boolean>;

  /**
   * Update an existing file.
   *
   * @param {string} path     The path of the existing file.
   * @param {string} contents The file contents.
   * @param {object} config   An optional configuration array.
   *
   * @throws FileNotFoundException
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract async update(path: string, contents: string, config?: any): Promise<boolean>;

  /**
   * Update an existing file using a stream.
   *
   * @param {string} path     The path of the existing file.
   * @param {Stream} resource The file handle.
   * @param {object} config   An optional configuration array.
   *
   * @throws InvalidArgumentException If resource is not a file handle.
   * @throws FileNotFoundException
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract async updateStream(path: string, resource: Stream, config: any): Promise<boolean>;

  /**
   * Rename a file.
   *
   * @param {string} path    Path to the existing file.
   * @param {string} newPath The new path of the file.
   *
   * @throws FileExistsException   Thrown if newPath exists.
   * @throws FileNotFoundException Thrown if path does not exist.
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract async rename(path: string, newPath: string): Promise<boolean>;

  /**
   * Copy a file.
   *
   * @param {string} path    Path to the existing file.
   * @param {string} newPath The new path of the file.
   *
   * @throws FileExistsException   Thrown if `newPath` exists.
   * @throws FileNotFoundException Thrown if `path` does not exist.
   *
   * @return {Promise<boolean>>} True on success, false on failure.
   */
  public abstract async copy(path: string, newPath: string): Promise<boolean>;

  /**
   * Delete a file.
   *
   * @param {string} path
   *
   * @throws FileNotFoundException
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract async delete(path: string): Promise<boolean>;

  /**
   * Delete a directory.
   *
   * @param {string} dirname
   *
   * @throws RootViolationException Thrown if $dirname is empty.
   *
   * @return {Promise<boolean>} True on success, false on failure.
   */
  public abstract async deleteDir(dirname: string): Promise<boolean>;

  /**
   * Create a directory.
   *
   * @param {string} dirname The name of the new directory.
   * @param {object}  config  An optional configuration array.
   *
   * @return {boolean} True on success, false on failure.
   */
  public abstract async createDir(dirname: string, config?: object): Promise<boolean>;

  /**
   * Set the visibility for a file.
   *
   * @param {string} path       The path to the file.
   * @param {FileVisible|string} visibility One of 'public' or 'private'.
   *
   * @throws FileNotFoundException
   *
   * @return {boolean} True on success, false on failure.
   */
  public abstract async setVisibility(path: string, visibility: FileVisible | string): Promise<boolean>;

  /**
   * Create a file or update if exists.
   *
   * @param {string} path     The path to the file.
   * @param {string} contents The file contents.
   * @param {object} config   An optional configuration array.
   *
   * @return {boolean} True on success, false on failure.
   */
  public abstract async put(path: string, contents: string, config?: object): Promise<boolean>;

  /**
   * Create a file or update if exists.
   *
   * @param {string}   path     The path to the file.
   * @param {Stream} resource The file handle.
   * @param {object}   config   An optional configuration array.
   *
   * @throws InvalidArgumentException Thrown if $resource is not a resource.
   *
   * @return {boolean} True on success, false on failure.
   */
  public abstract async putStream(path: string, resource: Stream, config?: object): Promise<boolean>;

  /**
   * Read and delete a file.
   *
   * @param {string} path The path to the file.
   *
   * @throws FileNotFoundException
   *
   * @return {string|false} The file contents, or false on failure.
   */
  public abstract async readAndDelete(path: string): Promise<false | string | Buffer>;

  /**
   * Get a file/directory handler.
   *
   * @deprecated
   *
   * @param {string}  path    The path to the file.
   * @param {Handler} handler An optional existing handler to populate.
   *
   * @return Handler Either a file or directory handler.
   */
  // public abstract async get(path: string, handler: Handler): Promise<Handler>;

  /**
   * Register a plugin.
   *
   * @param {PluginInterface} plugin The plugin to register.
   *
   * @return $this
   */
  public addPlugin(plugin: PluginInterface): FilesystemAbstract {
    return this;
  }

  /**
   * Find a specific plugin.
   *
   * @param {string} method
   *
   * @throws PluginNotFoundException
   *
   * @return PluginInterface
   */
  protected findPlugin(method: string) {
    if (!(method in this.plugins)) {
      throw new PluginNotFoundException(method);
    }
    return this.plugins[method];
  }
}
