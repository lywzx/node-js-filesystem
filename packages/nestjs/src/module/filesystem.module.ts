import { DynamicModule, Module } from '@nestjs/common';
import { FilesystemService } from '../services';
import { NEST_FILESYSTEM_MODULE_OPTIONS } from '../constant';
import { INestFilesystemModuleAsyncOptions, NestFilesystemOptions } from '../interfaces';
import { transformOptionsToMultiple } from '../util';

@Module({
  providers: [FilesystemService],
  exports: [FilesystemService],
})
export class FilesystemModule {
  static register(options: NestFilesystemOptions): DynamicModule {
    const newOptions = transformOptionsToMultiple(options);
    return {
      module: this,
      providers: [
        {
          provide: NEST_FILESYSTEM_MODULE_OPTIONS,
          useValue: newOptions,
        },
      ],
      exports: [],
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
    return {
      module: this,
      imports: [...(options.imports || [])],
    };
  }
}
