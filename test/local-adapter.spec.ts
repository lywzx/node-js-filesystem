import { Local } from '../src/adapters/local';
import { join } from 'path';
import { expect } from 'chai';

describe('local adapter test', function (): void {
  this.timeout(5000);

  it('test relative roots are supported', function () {
    new Local(join(__dirname, 'files/../files'));
  });

  describe('local adapter methods', function () {
    let adapter: Local;

    beforeEach(function () {
      const root = join(__dirname, 'files/');
      adapter = new Local(root);
    });

    describe('#has()', function () {
      it('test has with dir', async function () {
        const testDir = '0';

        await adapter.createDir(testDir);

        const hasDir = await adapter.has(testDir);

        expect(hasDir).to.be.equal(true);

        await adapter.deleteDir(testDir);
      });

      it('test has with file', async function () {
        const testFile = 'file.txt';

        await adapter.write(testFile, 'content');

        expect(await adapter.has(testFile)).to.be.eq(true);

        await adapter.delete(testFile);
      });
    });

    describe('#write()', function () {});

    describe('#writeStream', function () {});

    describe('#readStream', function () {});

    describe('#updateStream', function () {});

    describe('#update', function () {});

    describe('#read', function () {});

    describe('#rename', function () {});

    describe('#copy', function () {});

    describe('#delete', function () {});

    describe('#listContents', function () {});

    describe('#getMetadata', function () {});

    describe('#getSize', function () {});

    describe('#getMimetype', function () {});

    describe('#getTimestamp', function () {});

    describe('#getVisibility', function () {});

    describe('#setVisibility', function () {});

    describe('#createDir', function () {});

    describe('#deleteDir', function () {});
  });
});
