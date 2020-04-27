import { mkDir } from '../src/util';
import { join } from 'path';

describe('unit test', function (): void {
  describe('test fs sync unit', function () {
    it('should test dir', async function () {
      this.timeout(2000);

      await mkDir(join(__dirname, 'aaaa'));

    });
  });
});
