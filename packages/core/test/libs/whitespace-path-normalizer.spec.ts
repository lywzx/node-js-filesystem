import { expect } from 'chai';
import { WhitespacePathNormalizer } from '../../src/libs/whitespace-path-normalizer';

const validatePathProvide = [
  ['.', ''],
  ['/path/to/dir/.', 'path/to/dir'],
  ['/dirname/', 'dirname'],
  ['dirname/..', ''],
  ['dirname/../', ''],
  ['dirname./', 'dirname.'],
  ['dirname/./', 'dirname'],
  ['dirname/.', 'dirname'],
  ['./dir/../././', ''],
  ['/something/deep/../../dirname', 'dirname'],
  ['00004869/files/other/10-75..stl', '00004869/files/other/10-75..stl'],
  ['/dirname//subdir///subsubdir', 'dirname/subdir/subsubdir'],
  ['dirname\\\\subdir\\\\\\subsubdir', 'dirname/subdir/subsubdir'],
  ['\\\\some\\shared\\\\drive', 'some/shared/drive'],
  ['C:\\dirname\\\\subdir\\\\\\subsubdir', 'C:/dirname/subdir/subsubdir'],
  ['C:\\\\dirname\\subdir\\\\subsubdir', 'C:/dirname/subdir/subsubdir'],
  ['example/path/..txt', 'example/path/..txt'],
  ['\\example\\path.txt', 'example/path.txt'],
  ['\\example\\..\\path.txt', 'path.txt'],
  ['some\0/path.txt', 'some/path.txt'],
];

const notValidatePathProvide = [
  ['something/../../../hehe'],
  ['/something/../../..'],
  ['..'],
  ['something\\..\\..'],
  ['\\something\\..\\..\\dirname'],
];

describe('WhitespacePathNormalizer test', () => {
  let normalizer: WhitespacePathNormalizer;

  before(() => {
    normalizer = new WhitespacePathNormalizer();
  });

  it('#path_normalizing', () => {
    validatePathProvide.forEach(([input, toExcept]) => {
      const result = normalizer.normalizePath(input);
      const double = normalizer.normalizePath(result);
      expect(result).to.be.equal(toExcept);
      expect(double).to.be.equal(toExcept);
    });
  });

  it('#path_normalizing shoud throw exception', function () {
    notValidatePathProvide.forEach(([input]) => {
      expect(() => normalizer.normalizePath(input)).to.throw();
    });
  });
});
