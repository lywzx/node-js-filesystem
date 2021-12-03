import { Ftp } from '../src/libs/ftp';
import { getFtpConfig } from './ftp.config';

describe('ftp adapter test', function () {
  this.timeout(500000);

  it('should test', async function () {
    const adp = new Ftp(getFtpConfig());

    await adp.init();
    try {
      const result = await adp.listContents('/upload/ebook');
      console.log('......', result);
    } catch (e) {
      console.log('.......', e);
    }
    const res = await adp.read('/user/js/tinymce/lang/zh_CN.js');
    console.log(res.toString());
  });
});
