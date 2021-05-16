import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FilesystemService } from '../services';
import {
  IFilesystemModuleOptionsFactory,
  INestFilesystemModuleAsyncOptions,
  NestFilesystemOptions,
} from '../interfaces';
import { generateAllDiskProviders, transformOptionsToMultiple } from '../util';
import keys from 'lodash/keys';
import { defaultModuleOptions, NEST_FILESYSTEM_MODULE_OPTIONS } from '../constant';

@Module({
  providers: [FilesystemService],
  exports: [],
})
export class NestFilesystemModule {
  static register(options: NestFilesystemOptions = defaultModuleOptions): DynamicModule {
    const newOptions = transformOptionsToMultiple(options);
    const configProviders = {
      provide: NEST_FILESYSTEM_MODULE_OPTIONS,
      useValue: newOptions,
    };
    const allDiskProviders = generateAllDiskProviders(keys(newOptions.disks));
    return {
      module: this,
      providers: [configProviders, ...allDiskProviders],
      exports: [...allDiskProviders],
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
    const imports = options.imports || [];
    const extraProviders = options.extraProviders || [];

    const configProvider = this.createAsyncOptionsProvider(options);

    const exportsProviders: Provider[] = generateAllDiskProviders(options.availableDisks);
    const providers: Provider[] = [];

    if (configProvider) {
      providers.push(configProvider);
    }

    return {
      module: this,
      providers: [...providers, ...extraProviders, ...exportsProviders],
      imports: imports,
      exports: [...exportsProviders],
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
    if (options.useClass) {
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
