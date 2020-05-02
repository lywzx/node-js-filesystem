import { expect } from 'chai';
import { ReadStream } from 'fs';
import { mkdir, realpath, stat, symlink, unlink, writeFile } from 'fs-extra';
import { uniqueId } from 'lodash';
import { platform } from 'os';
import { join, sep } from 'path';
import { Local } from '../src/adapters/local';
import { FileVisible } from '../src/enum';
import { NotSupportedException } from '../src/exceptions';
import { ListContentInfo, ReadFileResult } from '../src/types/local-adpater.types';
import { isDir, isSymbolicLink, mkDir } from '../src/util';

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
      await symlink(target, link);

      const adp = new Local(link);
      expect(target, adp.getPathPrefix());
      await unlink(link);
    });

    it('test links are deleted during delete dir', async function () {
      await mkDir(root + 'subdir');
      const original = root + 'original.txt';
      const link = root + 'subdir/link.txt';
      await writeFile(original, 'something');
      await symlink(original, link);
      const adp = new Local(root, 'w', Local.SKIP_LINKS);

      expect(await isSymbolicLink(link)).to.be.eq(true);

      await adp.deleteDir('subdir');

      expect(await isSymbolicLink(link)).to.be.eq(false);

      await adapter.delete('original.txt');
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

        await symlink(origin, link, 'file');

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

        await symlink(origin, link, 'file');

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

    describe('test visibility', function () {
      it('test visibility private file', async function () {
        if (platform() === 'win32') {
          this.skip();
          // Visibility not supported on Windows.
        }

        const fileName = 'private/path.txt';
        await adapter.write(fileName, 'content', { visibility: FileVisible.VISIBILITY_PUBLIC });
        let output = await adapter.getVisibility(fileName);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PUBLIC);

        await adapter.setVisibility(fileName, FileVisible.VISIBILITY_PRIVATE);

        output = await adapter.getVisibility(fileName);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PRIVATE);

        const stats = await stat(adapter.applyPathPrefix(fileName));
        expect(stats.mode & 0o777).to.be.eq(0o600);
      });

      it('test visibility public file', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          return this.skip();
        }
        const path = 'test_visibility/path.txt';
        await adapter.write(path, 'content', {
          visibility: FileVisible.VISIBILITY_PRIVATE,
        });
        let output = await adapter.getVisibility(path);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PRIVATE);

        await adapter.setVisibility(path, FileVisible.VISIBILITY_PUBLIC);
        output = await adapter.getVisibility(path);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PUBLIC);

        const stats = await stat(adapter.applyPathPrefix(path));
        expect(stats.mode & 0o777).to.be.eq(0o644);
      });

      it('test create dir default visibility', async function () {
        if (platform() === 'win32') {
          // window not support
          return this.skip();
        }

        await adapter.createDir('test-dir');

        const output = await adapter.getVisibility('test-dir');

        expect(output).to.be.an('object');

        expect(output).haveOwnProperty('visibility');

        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PUBLIC);
      });

      it('test visibility public dir', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          this.skip();
        }
        const dir = 'public-dir';
        await adapter.createDir(dir, { visibility: FileVisible.VISIBILITY_PRIVATE });
        let output = await adapter.getVisibility(dir);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PRIVATE);

        await adapter.setVisibility('public-dir', FileVisible.VISIBILITY_PUBLIC);
        output = await adapter.getVisibility('public-dir');
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PUBLIC);
      });

      it('test visibility private dir', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          return this.skip();
        }
        const dir = 'private-dir';
        await adapter.createDir('private-dir', { visibility: FileVisible.VISIBILITY_PUBLIC });
        let output = await adapter.getVisibility(dir);
        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PUBLIC);

        await adapter.setVisibility(dir, FileVisible.VISIBILITY_PRIVATE);
        output = await adapter.getVisibility(dir);

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PRIVATE);
      });

      it('test visibility fail', async function () {
        expect(await adapter.setVisibility('chmod.fail', FileVisible.VISIBILITY_PRIVATE)).to.be.eq(false);
      });

      it('test unknown visibility', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          return this.skip();
        }

        const dir = adapter.applyPathPrefix('subdir');

        await mkdir(dir, 0o750 as any);
        const output = await adapter.getVisibility('subdir');

        expect(output).to.be.an('object');
        expect(output).haveOwnProperty('visibility');
        expect(output.visibility).to.be.eq('0750');
      });

      it('test customized visibility', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          return this.skip();
        }

        // override a permission mapping
        const permissions = {
          dir: {
            private: 0o770, // private to me and the gang
          },
        };

        const newAdp = new Local(join(root, 'temp'), 'w', Local.DISALLOW_LINKS, permissions);

        await newAdp.createDir('private-dir');
        await newAdp.setVisibility('private-dir', FileVisible.VISIBILITY_PRIVATE);

        const output = await newAdp.getVisibility('private-dir');

        expect(output.visibility).to.be.eq(FileVisible.VISIBILITY_PRIVATE);

        const stats = await stat(newAdp.applyPathPrefix('private-dir'));
        expect(stats.mode & 0o777).to.be.eq(0o770);
      });

      it('test custom visibility', async function () {
        if (platform() === 'win32') {
          // Visibility not supported on Windows.
          return this.skip();
        }

        // override a permission mapping
        const permissions = {
          dir: {
            private: 0o777, // private to me and the gang
          },
        };

        const newAdp = new Local(join(root, 'temp_custom'), 'w', Local.DISALLOW_LINKS, permissions);

        await newAdp.createDir('yolo-dir');
        await newAdp.setVisibility('yolo-dir', 'yolo' as any);

        const output = await newAdp.getVisibility('yolo-dir');
        expect(output.visibility).to.be.eq('yolo');
        const stats = await stat(newAdp.applyPathPrefix('private-dir'));
        expect(stats.mode & 0o777).to.be.eq(0o777);
      });

      it('test first visibility octet', async function () {
        if (platform() === 'win32') {
          return this.skip();
        }
        const permissions = {
          file: {
            public: 0o644,
            private: 0o600,
          },
          dir: {
            sticky: 0o1777,
            public: 0o755,
            private: 0o700,
          },
        };

        const newAdp = new Local(join(root, 'first_visibility_octet'), 'w', Local.DISALLOW_LINKS, permissions);

        await newAdp.createDir('sticky-dir');
        await newAdp.setVisibility('sticky-dir', 'sticky');

        const output = await adapter.getVisibility('sticky-dir');
        expect(output.visibility).to.be.eq('sticky');

        const stats = await stat(newAdp.applyPathPrefix('sticky-dir'));
        expect(stats.mode & 0o777).to.be.eq(0o1777);
      });
    });

    // describe('#setVisibility', function () {});

    describe('#createDir', function () {
      it('test create zero dir', async function () {
        await adapter.createDir('0');

        expect(await isDir(adapter.applyPathPrefix('0'))).to.be.eq(true);

        await adapter.deleteDir('0');
      });

      it('test create dir failed', async function () {
        const origin = 'exits_file';

        await adapter.write(origin, '');

        expect(await adapter.createDir(origin)).to.be.eq(false);

        await adapter.delete(origin);
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
        expect(await realpath(root)).to.be.eq(await realpath(adapter.getPathPrefix() as string));
      });

      it('test apply path prefix', function () {
        const newAdp = new Local(root);
        newAdp.setPathPrefix('');

        expect(newAdp.applyPathPrefix('')).to.be.eq('');
      });
    });
  });
});
