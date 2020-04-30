import { Local } from '../src/adapters/local';
import { join, sep } from 'path';
import { expect } from 'chai';
import { uniqueId } from 'lodash';
import { NotSupportedException } from '../src/exceptions';
import { ListContentInfo, ReadFileResult } from '../src/types/local-adpater.types';
import { isDir, isSymbolicLink, mkDir } from '../src/util';
import { ReadStream } from 'fs';
import { platform } from 'os';
import { realpathPromisify, symlinkPromisify, unlinkPromisify, writeFilePromisify } from '../src/util/fs-promisify';

function generateTestFile(prefix = '') {
  return `${prefix}file_${uniqueId()}.txt`;
}

describe('local adapter test', function (): void {
  let adapter: Local;
  let root: string;

  beforeEach(function () {
    root = join(__dirname, 'files/');
    adapter = new Local(root);
  });

  this.timeout(5000);

  describe('test link', function () {
    it('test constructor with link', async function () {
      if (platform() === 'win32') {
        // File permissions not supported on Windows.
        return this.skip();
      }

      const target = join(__dirname, 'files/');
      const link = __dirname + sep + 'link_to_files';
      await symlinkPromisify(target, link);

      const adp = new Local(link);
      expect(target, adp.getPathPrefix());
      await unlinkPromisify(link);
    });

    it('test links are deleted during delete dir', async function () {
      await mkDir(root + 'subdir');
      const original = root + 'original.txt';
      const link = root + 'subdir/link.txt';
      await writeFilePromisify(original, 'something');
      await symlinkPromisify(original, link);
      const adp = new Local(root, 'w', Local.SKIP_LINKS);

      expect(await isSymbolicLink(link)).to.be.eq(true);

      await adp.deleteDir('subdir');

      expect(await isSymbolicLink(link)).to.be.eq(false);
    });
  });

  it('test relative roots are supported', function () {
    new Local(join(__dirname, 'files/../files'));
  });

  describe('local adapter methods', function () {
    describe('#has()', function () {
      it('test has with dir', async function () {
        const testDir = '0';

        await adapter.createDir(testDir);

        const hasDir = await adapter.has(testDir);

        expect(hasDir).to.be.equal(true);

        await adapter.deleteDir(testDir);
      });

      it('test has with file', async function () {
        const testFile = generateTestFile();

        await adapter.write(testFile, 'content');

        expect(await adapter.has(testFile)).to.be.eq(true);

        await adapter.delete(testFile);
      });
    });

    //describe('#write()', function () {});

    describe('#writeStream', function () {
      it('test write stream', async function () {
        const temp = generateTestFile('dir/');
        await adapter.write(temp, 'dummy');
        const readStream = adapter.readStream(temp);
        const target = generateTestFile('dir/');
        await adapter.writeStream(target, readStream.stream);

        expect(await adapter.has(target)).to.be.eq(true);

        const result = (await adapter.read(target)) as ReadFileResult;

        expect(result.contents.toString()).to.be.eq('dummy');

        await adapter.deleteDir('dir');
      });
    });

    describe('#readStream', function () {
      it('test read stream', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, 'contents');

        const result = adapter.readStream(fileName);

        expect(result).to.be.an('object').to.haveOwnProperty('type', 'file');

        expect(result).to.haveOwnProperty('path');

        expect(result).to.haveOwnProperty('stream');

        expect(result.stream).to.be.instanceOf(ReadStream);

        await adapter.delete(fileName);
      });
    });

    describe('#updateStream', function () {
      it('test update stream', async function () {
        const fileName = generateTestFile();
        const tmpFile = generateTestFile();

        await adapter.write(fileName, 'initial');

        await adapter.write(tmpFile, 'dummy');

        const readStream = adapter.readStream(tmpFile);
        await adapter.updateStream(fileName, readStream.stream);

        expect(await adapter.has(fileName)).to.be.eq(true);

        await adapter.delete(tmpFile);

        await adapter.delete(fileName);
      });
    });

    /*describe('#update', function () {
      it('test update method', function () {

      });
    });*/

    /*describe('#read', function () {

    });*/

    describe('#rename', function () {
      it('test rename to none existing directory', async function () {
        const fileName = generateTestFile();
        const dir = `${uniqueId()}`;
        const targetFileName = generateTestFile(dir + '/');
        await adapter.write(fileName, 'contents');

        expect(await isDir(adapter.applyPathPrefix(dir))).to.be.eq(false);

        expect(await adapter.rename(fileName, targetFileName)).to.be.eq(true);

        await adapter.deleteDir(dir);
      });
    });

    describe('#copy', function () {
      it('test copy', async function () {
        await adapter.write('file.ext', 'content');

        expect(await adapter.copy('file.ext', 'new.ext'));

        expect(await adapter.has('new.ext'));

        await adapter.delete('new.ext');

        await adapter.delete('file.ext');
      });
    });

    describe('#delete', function () {
      it('should delete exists file return true', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, 'contents');

        expect(await adapter.delete(fileName)).to.be.eq(true);
      });

      it('should delete not exitst file return false', async function () {
        expect(await adapter.delete('missing.txt')).to.be.eq(false);
      });
    });

    describe('#listContents', function () {
      it('test stream wrappers are supported', async function () {
        if (platform() === 'win32') {
          return this.skip();
        }

        const adp = adapter;
        //const adp = new Local(`file://${root}`);

        expect(await adp.listContents()).to.length(1);
      });

      it('test listing none existing directory', async function () {
        expect(await adapter.listContents('nonexisting/directory')).to.eql([]);
      });

      it('test list content one file', async function () {
        const fileName = generateTestFile('dirname/');

        await adapter.write(fileName, 'contents');

        const content = await adapter.listContents('dirname', false);

        expect(content).lengthOf(1);

        expect(content[0]).haveOwnProperty('type');

        await adapter.deleteDir('dirname');
      });

      it('test list contents recursive', async function () {
        await adapter.write('dirname1/dirname/file.txt', 'contents');
        await adapter.write('dirname1/dirname/others.txt', 'contents');

        const contents = await adapter.listContents('dirname1', true);

        expect(contents).lengthOf(3);

        await adapter.deleteDir('dirname1');
      });

      it('test link caused Unsupported Exception', async function () {
        const origin = adapter.applyPathPrefix('link_test/original.txt');
        const link = adapter.applyPathPrefix('link_test/link.txt');

        await adapter.write('link_test/original.txt', 'something');

        await symlinkPromisify(origin, link, 'file');

        try {
          await adapter.listContents('link_test');
          throw new Error('any error msg');
        } catch (e) {
          expect(e.name).to.be.eq(NotSupportedException.name);
        }

        await adapter.deleteDir('link_test');
      });

      it('test link is skipped', async function () {
        const origin = adapter.applyPathPrefix('link_test_1/original.txt');
        const link = adapter.applyPathPrefix('link_test_1/link.txt');

        await adapter.write('link_test_1/original.txt', 'something');

        await symlinkPromisify(origin, link, 'file');

        const adp = new Local(root, 'w', Local.SKIP_LINKS);

        const contents = await adp.listContents('link_test_1');

        expect(contents).lengthOf(1);

        await adp.deleteDir('link_test_1');
      });
    });

    // describe('#getMetadata', function () {});

    describe('#getSize', function () {
      it('test get size', async function () {
        const fileName = generateTestFile('get_size_test/');
        await adapter.write(fileName, '1234');

        const result = await adapter.getSize(fileName);

        expect(result).to.be.instanceOf(Object);

        expect(result).haveOwnProperty('size');

        expect(result.size).to.be.eq(4);

        await adapter.deleteDir('get_size_test');
      });
    });

    describe('#getMimetype', function () {
      it('test mimetype fallback on extension', async function () {
        const mimetype = ((await adapter.getMimetype('test-image.png')) as any)['mimetype'];

        expect('image/png').eq(mimetype);
      });
    });

    describe('#getTimestamp', function () {
      it('test get timestamp', async function () {
        const fileName = generateTestFile();

        await adapter.write(fileName, '1234');

        const result = await adapter.getTimestamp(fileName);

        expect(result).to.be.instanceOf(Object);

        expect(result).haveOwnProperty('timestamp');

        expect((result as ListContentInfo).timestamp).to.be.an('number');

        await adapter.delete(fileName);
      });
    });

    describe('#getVisibility', function () {});

    describe('#setVisibility', function () {});

    describe('#createDir', function () {
      it('test create zero dir', async function () {
        await adapter.createDir('0');

        expect(await isDir(adapter.applyPathPrefix('0'))).to.be.eq(true);

        await adapter.deleteDir('0');
      });

      it('test create dir failed', async function () {
        const dirname = '\\ss\\//!@?S%^@\\ssfail.plz';

        expect(await adapter.createDir(dirname)).to.be.eq(false);
      });
    });

    describe('#deleteDir', function () {
      it('test adapter delete dir ', async function () {
        await adapter.write('nested/dir/path.txt', 'contents');

        expect(await isDir(join(__dirname, 'files/nested/dir'))).to.be.eq(true);

        await adapter.deleteDir('nested');

        expect(await adapter.has('nested/dir/path.txt')).to.be.eq(false);

        expect(await isDir(join(__dirname, 'files/nested/dir'))).to.be.eq(false);
      });
    });

    describe('#prefix', function () {
      it('test null prefix', async function () {
        const loc = new Local(join(__dirname, 'files'));
        loc.setPathPrefix('');

        const path = join('some', 'path.ext');

        expect(loc.applyPathPrefix(path)).to.be.eq(path);

        expect(loc.removePathPrefix(path)).to.be.eq(path);
      });

      it('test windows prefix', async function () {
        const path = `some${sep}path.ext`;
        let expected = `c:${sep}${path}`;

        const adp = new Local(root);

        adp.setPathPrefix('c:/');

        let prefixed = adp.applyPathPrefix(path);

        expect(expected).to.be.eq(prefixed);

        expect(path, adp.removePathPrefix(prefixed));

        expected = 'c:\\\\some\\dir' + sep + path;
        adp.setPathPrefix('c:\\\\some\\dir\\');

        prefixed = adp.applyPathPrefix(path);
        expect(expected).to.be.eq(prefixed);
        expect(path, adp.removePathPrefix(prefixed));
      });

      it('test get path prefix', async function () {
        expect(await realpathPromisify(root)).to.be.eq(await realpathPromisify(adapter.getPathPrefix() as string));
      });
    });
  });
});
