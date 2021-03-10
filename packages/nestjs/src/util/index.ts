import { IFilesystemModuleOptions, IFilesystemSingleModuleOptions, NestFilesystemOptions } from '../interfaces';
import { Filesystem, IFilesystemAdapter } from '@filesystem/core';
import { Type, Provider } from '@nestjs/common';
import map from 'lodash/map';
import { NEST_FILESYSTEM_MODULE_OPTIONS } from '../constant';
import { ModuleRef } from '@nestjs/core';

/**
 * build single filesystem to multiple
 */
export function transformOptionsToMultiple(options: NestFilesystemOptions): IFilesystemModuleOptions {
  if ('default' in options && 'disks' in options) {
    return options;
  }
  return {
    disks: {
      default: options,
    },
    default: 'default',
  };
}

/**
 * 创建服务提供者
 * @param allDiskName
 */
export function generateAllDiskProviders(allDiskName: string[]): Provider[] {
  const providers: Provider[] = map(allDiskName, (diskName) => {
    return {
      provide: generateInjectToken(diskName),
      inject: [NEST_FILESYSTEM_MODULE_OPTIONS],
      useFactory: (option: IFilesystemModuleOptions) => {
        const currentDiskOptions = option.disks[diskName];
        return buildFileSystem(currentDiskOptions);
      },
    };
  });

  providers.push({
    provide: Filesystem,
    inject: [NEST_FILESYSTEM_MODULE_OPTIONS, ModuleRef, ...map(providers, 'provide')],
    useFactory: (option: IFilesystemModuleOptions, moduleRef: ModuleRef) => {
      const defaultDisk = option.default;
      return moduleRef.get(generateInjectToken(defaultDisk), {
        strict: true,
      });
    },
  });

  return providers;
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
export function buildFileSystem(option: IFilesystemSingleModuleOptions<any>): Filesystem<IFilesystemAdapter> {
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
    if (typeof option.root !== 'undefined') {
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
