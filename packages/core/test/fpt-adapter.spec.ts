import { Ftp } from '../src/adapters';

describe('ftp adapter test', function () {
  this.timeout(1000);

  it('should test', async function () {
    const adp = new Ftp({
      host: 'v0.ftp.upyun.com',
      port: 21,
      user: 'yang/sc-storage',
      password: 'sdfsifs2sfI',
    });

    await adp.login();
    const result = await adp.listContents('/user/js/tinymce/lang/');
    const res = await adp.read('/user/js/tinymce/lang/zh_CN.js');
    debugger;
  });
});
