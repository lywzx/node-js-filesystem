import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { IFilesystemModuleOptions, IFilesystemSingleModuleOptions } from './file-system-module-options';

/**
 * filesystem options
 */
export type NestFilesystemOptions = IFilesystemModuleOptions | IFilesystemSingleModuleOptions<any>;

/**
 * Interface describing a `CacheOptionsFactory`.  Providers supplying configuration
 * options for the Cache module must implement this interface.
 *
 * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
 *
 * @publicApi
 */
export interface IFilesystemModuleOptionsFactory {
  createDiskOptions(): Promise<NestFilesystemOptions> | NestFilesystemOptions;
}

/**
 * Options for dynamically configuring the Cache module.
 *
 * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
 *
 * @publicApi
 */
export interface INestFilesystemModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Injection token resolving to an existing provider. The provider must implement
   * the `CacheOptionsFactory` interface.
   */
  useExisting?: Type<IFilesystemModuleOptionsFactory>;
  /**
   * Injection token resolving to a class that will be instantiated as a provider.
   * The class must implement the `CacheOptionsFactory` interface.
   */
  useClass?: Type<IFilesystemModuleOptionsFactory>;
  /**
   * Function returning options (or a Promise resolving to options) to configure the
   * cache module.
   */
  useFactory?: (...args: any[]) => Promise<NestFilesystemOptions> | NestFilesystemOptions;
  /**
   * Dependencies that a Factory may inject.
   */
  inject?: any[];
  extraProviders?: Provider[];
}
