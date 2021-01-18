import { PathPrefixer } from '../../src/libs/path-prefixer';
import { expect } from 'chai';

describe('PathPrefixer test', () => {
  it('path_prefixing_with_a_prefix', function () {
    const prefixer = new PathPrefixer('prefix');
    const prefixedPath = prefixer.prefixPath('some/path.txt');
    expect('prefix/some/path.txt').to.be.eq(prefixedPath);
  });

  it('path_stripping_with_a_prefix', function () {
    const prefixer = new PathPrefixer('prefix');
    const strippedPath = prefixer.stripPrefix('prefix/some/path.txt');
    expect('some/path.txt').to.be.eq(strippedPath);
  });

  it('path_stripping_is_reversable', function () {
    const prefixer = new PathPrefixer('prefix');
    const strippedPath = prefixer.stripPrefix('prefix/some/path.txt');
    expect('prefix/some/path.txt').to.be.eq(prefixer.prefixPath(strippedPath));
    const prefixedPath = prefixer.prefixPath('some/path.txt');
    expect('some/path.txt').to.be.eq(prefixer.stripPrefix(prefixedPath));
  });

  it('prefixing_without_a_prefix', function () {
    const prefixer = new PathPrefixer('');

    let path = prefixer.prefixPath('path/to/prefix.txt');
    expect('path/to/prefix.txt').to.be.eq(path);

    path = prefixer.prefixPath('/path/to/prefix.txt');
    expect('path/to/prefix.txt').to.be.eq(path);
  });

  it('prefixing_for_a_directory', function () {
    const prefixer = new PathPrefixer('/prefix');

    let path = prefixer.prefixDirectoryPath('something');
    expect('/prefix/something/').to.be.eq(path);
    path = prefixer.prefixDirectoryPath('');
    expect('/prefix/').to.be.eq(path);
  });

  it('prefixing_for_a_directory_without_a_prefix', function () {
    const prefixer = new PathPrefixer('');

    let path = prefixer.prefixDirectoryPath('something');
    expect('something/').to.be.eq(path);
    path = prefixer.prefixDirectoryPath('');
    expect('').to.be.eq(path);
  });

  it('stripping_a_directory_prefix', function () {
    const prefixer = new PathPrefixer('/something/');

    let path = prefixer.stripDirectoryPrefix('/something/this/');
    expect('this').to.be.eq(path);
    path = prefixer.stripDirectoryPrefix('/something/and-this\\');
    expect('and-this').to.be.eq(path);
  });
});
