import { FilesystemAbstract } from './filesystem.abstract';

export interface PluginInterface {
  /**
   * Get the method name.
   *
   * @return string
   */
  getMethod(): string;

  /**
   * Set the Filesystem object.
   *
   * @param {FilesystemAbstract} filesystem
   */
  setFilesystem(filesystem: FilesystemAbstract): void;
}
