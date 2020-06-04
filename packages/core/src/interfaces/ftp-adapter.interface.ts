import { AccessOptions } from 'basic-ftp';

// ftp adapter config
export interface FtpAdapterConstructorConfigInterface extends AccessOptions {
  timeout?: number;
}
