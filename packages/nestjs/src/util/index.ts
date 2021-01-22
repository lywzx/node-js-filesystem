import { IFilesystemModuleOptions, NestFilesystemOptions } from '../interfaces';

/**
 * build single filesystem to multiple
 */
export function transformOptionsToMultiple(options: NestFilesystemOptions): IFilesystemModuleOptions {
  if ('defaultStorage' in options && 'storages' in options) {
    return options;
  }
  return {
    defaultStorage: 'default',
    storages: {
      default: options,
    },
  };
}
