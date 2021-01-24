import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FilesystemService } from '../services';
import { defaultModuleOptions, NEST_FILESYSTEM_MODULE_OPTIONS } from '../constant';
import {
  IFilesystemModuleOptions,
  IFilesystemModuleOptionsFactory,
  INestFilesystemModuleAsyncOptions,
  NestFilesystemOptions,
} from '../interfaces';
import { buildFileSystem, generateInjectToken, transformOptionsToMultiple } from '../util';
import { Filesystem } from '@filesystem/core';

@Module({
  providers: [FilesystemService],
  exports: [],
})
export class NestFilesystemModule {
  static register(options: NestFilesystemOptions = defaultModuleOptions): DynamicModule {
    const newOptions = transformOptionsToMultiple(options);
    const providers = [
      {
        provide: Filesystem,
        useFactory(options: IFilesystemModuleOptions) {
          return buildFileSystem(options.disks[options.default]);
        },
        inject: [NEST_FILESYSTEM_MODULE_OPTIONS],
      },
      {
        provide: generateInjectToken(newOptions.default),
        useExisting: Filesystem,
      },
      {
        provide: NEST_FILESYSTEM_MODULE_OPTIONS,
        useValue: newOptions,
      },
    ];
    return {
      module: this,
      providers: providers,
      exports: providers,
    };
  }

  /**
   * Configure the pdd client dynamically.
   *
   * @param options method for dynamically supplying cache manager configuration
   * options
   *
   * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
   */
  static registerAsync(options: INestFilesystemModuleAsyncOptions): DynamicModule {
    const diskOptions = this.createAsyncOptionsProvider(options);
    if (!diskOptions) {
      throw new Error('filesystem not assign!');
    }
    const providers = [
      diskOptions,
      {
        provide: Filesystem,
        useFactory(options: IFilesystemModuleOptions) {
          return buildFileSystem(options.disks[options.default]);
        },
        inject: [NEST_FILESYSTEM_MODULE_OPTIONS],
      },
    ];

    return {
      module: this,
      providers: [...providers, ...(options.extraProviders || [])],
      imports: [...(options.imports || [])],
      exports: [...providers],
    };
  }

  protected static createAsyncOptionsProvider(options: INestFilesystemModuleAsyncOptions): Provider | void {
    if (options.useFactory) {
      return {
        provide: NEST_FILESYSTEM_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const result = await (options as Required<INestFilesystemModuleAsyncOptions>).useFactory(...args);
          return transformOptionsToMultiple(result);
        },
        inject: options.inject || [],
      };
    }
    if (options.useClass || options.useClass) {
      return {
        provide: NEST_FILESYSTEM_MODULE_OPTIONS,
        useFactory: async (optionsFactory: IFilesystemModuleOptionsFactory) => {
          const result = await optionsFactory.createDiskOptions();
          return transformOptionsToMultiple(result);
        },
        inject: [options.useExisting || options.useClass],
      };
    }
  }
}
