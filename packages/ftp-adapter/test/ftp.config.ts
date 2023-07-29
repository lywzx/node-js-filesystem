import { join } from 'path';
import { isReadableSync } from '@filesystem/core/src/util';
import * as dotenv from 'dotenv';

const envPath = join(__dirname, '../../../.env');
if (isReadableSync(envPath)) {
  dotenv.config({
    path: envPath,
  });
}

/**
 * ali oss test root dir
 */
export const ftpRootConfig = process.env.REMOTE_FILESYSTEM_ROOT_DIR || 'root/dir';

export const getFtpConfig = () => {
  return {
    host: process.env.FTP_HOST,
    port: parseInt(process.env.FTP_PORT || '21', 10),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
  };
};
