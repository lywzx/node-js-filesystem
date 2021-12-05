import { getFtpConfig } from './ftp.config';
import { FtpFilesystemAdapter } from '../src';

describe('ftp adapter test', function () {
  this.timeout(500000);

  it('should test', async function () {
    const adp = new FtpFilesystemAdapter(getFtpConfig());

    debugger
    const result = await adp.fetchMetadata('/user/js/tinymce/lang/zh_CN.js111');
    console.log(result);
  });
});
