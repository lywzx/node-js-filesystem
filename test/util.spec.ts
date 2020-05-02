import { isDir, mkDir, rmDir } from '../src/util';
import { join } from 'path';
import { expect } from 'chai';

describe('unit test', function (): void {
  describe('test fs sync unit', function () {
    it('should test dir', async function () {
      this.timeout(2000);

      const dir = join(__dirname, 'aaaa');

      await mkDir(dir);

      expect(await isDir(dir)).to.be.eq(true);

      await rmDir(dir);
    });
  });
});
