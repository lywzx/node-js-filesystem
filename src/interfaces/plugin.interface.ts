import { FilesystemInterface } from './filesystem.interface';

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
   * @param {FilesystemInterface} filesystem
   */
  setFilesystem(filesystem: FilesystemInterface): void;
}
