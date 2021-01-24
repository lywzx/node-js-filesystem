import { IFilesystemAdapter, IPathNormalizer, IPortableVisibilityObj } from '@filesystem/core';
import { Type } from '@nestjs/common';

/**
 * multiple mode config
 */
export interface IFilesystemModuleOptions {
  /**
   * default storage name
   */
  default: string;
  /**
   * storage file config detail
   */
  disks: {
    [s: string]: IFilesystemSingleModuleOptions<any>;
  };
}

/**
 * single config example
 */
export interface IFilesystemSingleModuleOptions<T extends IFilesystemAdapter> {
  /**
   * use any adapter
   */
  adapter?: 'local' | 'ali-oss' | 'ftp' | 'memory' | string;

  /**
   * generate adapter args
   */
  createAdapterArgs?: () => ConstructorParameters<Type<T>>;

  /**
   * create adapter by self
   */
  createAdapter?: () => T;

  /**
   * directory root
   */
  root: string;

  /**
   * visibility config
   */
  visibility?: IPortableVisibilityObj;

  /**
   * path normalizer
   */
  pathNormalizer?: IPathNormalizer;
}
