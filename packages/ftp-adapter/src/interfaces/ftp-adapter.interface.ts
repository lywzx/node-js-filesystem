import { AccessOptions } from 'basic-ftp';


/**
 * ftp adapter
 */
export interface IFtpFilesystemAdapterConfig extends AccessOptions {
  timeout?: number;
}
