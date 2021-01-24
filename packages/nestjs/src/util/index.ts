import { IFilesystemModuleOptions, IFilesystemSingleModuleOptions, NestFilesystemOptions } from '../interfaces';
import { Filesystem, IFilesystemAdapter } from '@filesystem/core';
import { Type } from '@nestjs/common';

/**
 * build single filesystem to multiple
 */
export function transformOptionsToMultiple(options: NestFilesystemOptions): IFilesystemModuleOptions {
  if ('default' in options && 'disks' in options) {
    return options;
  }
  return {
    default: 'default',
    disks: {
      default: options,
    },
  };
}

/**
 * generate inject token
 */
export function generateInjectToken(diskName?: string): string | Type<any> {
  if (diskName) {
    return `__$$nest_js_filesystem_disk_${diskName}$$`;
  }
  return Filesystem;
}

/**
 *
 * @param option
 */
export function buildFileSystem(option: IFilesystemSingleModuleOptions<any>): Filesystem {
  let adapter: IFilesystemAdapter | undefined;
  if ('adapter' in option && option.adapter) {
    const typeAdapter = Filesystem.adapter(option.adapter);
    if (!typeAdapter) {
      throw new Error(`can not find adapter by name: ${option.adapter}`);
    }
    let adapterArgs = [];
    if (typeof option.createAdapterArgs === 'function') {
      adapterArgs = option.createAdapterArgs();
    }
    if (option.root) {
      adapterArgs.unshift(option.root);
    }
    adapter = new typeAdapter(...adapterArgs);
  } else if (typeof option.createAdapter === 'function') {
    adapter = option.createAdapter();
  }

  if (!adapter) {
    throw new Error('adapter is created!');
  }
  return new Filesystem(adapter);
}
