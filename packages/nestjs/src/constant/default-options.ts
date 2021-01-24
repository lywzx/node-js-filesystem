import { IFilesystemModuleOptions } from '../interfaces';
import { join } from 'path';

export const defaultModuleOptions: IFilesystemModuleOptions = {
  /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application. Just store away!
    |
    */
  default: process.env.FILESYSTEM_DRIVER || 'local',

  /*
  |--------------------------------------------------------------------------
  | Filesystem Disks
  |--------------------------------------------------------------------------
  |
  | Here you may configure as many filesystem "disks" as you wish, and you
  | may even configure multiple disks of the same driver. Defaults have
  | been setup for each driver as an example of the required options.
  |
  | Supported Drivers: "local", "ftp", "s3", "rackspace"
  |
  */
  disks: {
    local: {
      adapter: 'local',
      root: join(__dirname, '../../storage'),
    },
  },
};
