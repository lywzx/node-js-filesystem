import { Stream } from 'stream';
import { FileVisible } from '../enum';
import { Handler } from '../handler';
import { PluginInterface } from './plugin.interface';

export interface FilesystemInterface {
  /**
   * Check whether a file exists.
   *
   * @param {string} path
   *
   * @return {boolean}
   */
  has(path: string): boolean;

  /**
   * Read a file.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {string|false} The file contents or false on failure.
   */
  read(path: string): string | false;

  /**
   * Retrieves a read-stream for a path.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {Stream|false} The path resource or false on failure.
   */
  readStream(path: string): Stream;

  /**
   * List contents of a directory.
   *
   * @param {string} directory The directory to list.
   * @param {boolean}recursive Whether to list recursively.
   *
   * @return array A list of file metadata.
   */
  listContents(directory: string, recursive: boolean): Array<any>;

  /**
   * Get a file's metadata.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return array|false The file metadata or false on failure.
   */
  getMetadata(path: string): object | false;

  /**
   * Get a file's size.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {number|false} The file size or false on failure.
   */
  getSize(path: string): number | false;

  /**
   * Get a file's mime-type.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {string|false} The file mime-type or false on failure.
   */
  getMimetype(path: string): string | false;

  /**
   * Get a file's timestamp.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {string|false} The timestamp or false on failure.
   */
  getTimestamp(path: string): string | false;

  /**
   * Get a file's visibility.
   *
   * @param {string} path The path to the file.
   *
   * @throws {FileNotFoundException}
   *
   * @return {FileVisible|false} The visibility (public|private) or false on failure.
   */
  getVisibility(path: string): FileVisible | false;

  /**
   * Write a new file.
   *
   * @param {string} path     The path of the new file.
   * @param {string} contents The file contents.
   * @param {array}  config   An optional configuration array.
   *
   * @throws FileExistsException
   *
   * @return bool True on success, false on failure.
   */
  write(path: string, contents: string, config: any): boolean;

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
  writeStream(path: string, resource: Stream, config?: any): boolean;

  /**
   * Update an existing file.
   *
   * @param {string} path     The path of the existing file.
   * @param {string} contents The file contents.
   * @param {object} config   An optional configuration array.
   *
   * @throws FileNotFoundException
   *
   * @return bool True on success, false on failure.
   */
  update(path: string, contents: string, config?: any): boolean;

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
   * @return bool True on success, false on failure.
   */
  updateStream(path: string, resource: Stream, config: any): boolean;

  /**
   * Rename a file.
   *
   * @param {string} path    Path to the existing file.
   * @param {string} newPath The new path of the file.
   *
   * @throws FileExistsException   Thrown if newPath exists.
   * @throws FileNotFoundException Thrown if path does not exist.
   *
   * @return bool True on success, false on failure.
   */
  rename(path: string, newPath: string): boolean;

  /**
   * Copy a file.
   *
   * @param {string} path    Path to the existing file.
   * @param {string} newPath The new path of the file.
   *
   * @throws FileExistsException   Thrown if `newPath` exists.
   * @throws FileNotFoundException Thrown if `path` does not exist.
   *
   * @return bool True on success, false on failure.
   */
  copy(path: string, newPath: string): boolean;

  /**
   * Delete a file.
   *
   * @param {string} path
   *
   * @throws FileNotFoundException
   *
   * @return {boolean} True on success, false on failure.
   */
  delete(path: string): boolean;

  /**
   * Delete a directory.
   *
   * @param {string} dirname
   *
   * @throws RootViolationException Thrown if $dirname is empty.
   *
   * @return bool True on success, false on failure.
   */
  deleteDir(dirname: string): boolean;

  /**
   * Create a directory.
   *
   * @param {string} dirname The name of the new directory.
   * @param {object}  config  An optional configuration array.
   *
   * @return {boolean} True on success, false on failure.
   */
  createDir(dirname: string, config?: object): boolean;

  /**
   * Set the visibility for a file.
   *
   * @param {string} path       The path to the file.
   * @param {FileVisible} visibility One of 'public' or 'private'.
   *
   * @throws FileNotFoundException
   *
   * @return {boolean} True on success, false on failure.
   */
  setVisibility(path: string, visibility: FileVisible): boolean;

  /**
   * Create a file or update if exists.
   *
   * @param {string} path     The path to the file.
   * @param {string} contents The file contents.
   * @param {object} config   An optional configuration array.
   *
   * @return {boolean} True on success, false on failure.
   */
  put(path: string, contents: string, config?: object): boolean;

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
  putStream(path: string, resource: Stream, config?: object): boolean;

  /**
   * Read and delete a file.
   *
   * @param {string} path The path to the file.
   *
   * @throws FileNotFoundException
   *
   * @return {string|false} The file contents, or false on failure.
   */
  readAndDelete(path: string): string | false;

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
  get(path: string, handler: Handler): Handler;

  /**
   * Register a plugin.
   *
   * @param {PluginInterface} plugin The plugin to register.
   *
   * @return $this
   */
  addPlugin(plugin: PluginInterface): FilesystemInterface;
}
