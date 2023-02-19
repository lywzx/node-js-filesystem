import { createReadStreamFromWriteStream } from '../../src/util';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('ftp adapter test', function (): void {
  it('should', async function () {
    const { from, to } = createReadStreamFromWriteStream();

    const promise = new Promise((resolve, reject) => {
      let result = '';
      to.on('data', (data) => {
        result += data;
      });
      to.on('end', () => {
        resolve(result);
      });
    });

    from.write('aaaa');
    from.write('bbbb');
    from.end();

    const result = await promise;
    expect(result).to.be.eq('aaaabbbb');
  });
});
