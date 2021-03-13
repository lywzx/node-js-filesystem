export class PathPrefixer {
  /**
   * ltrim
   */
  static lTrim = /^[\\/]+/;

  /**
   * rtrim
   */
  static rTrim = /[\\/]+$/;

  /**
   * prefix
   * @private string
   */
  protected readonly prefix: string;

  constructor(prefix: string, protected separator: string = '/') {
    this.prefix = prefix.replace(PathPrefixer.rTrim, '');
    if (prefix !== '') {
      this.prefix += separator;
    }
  }

  prefixPath(path: string): string {
    return this.prefix + path.replace(PathPrefixer.lTrim, '');
  }

  stripPrefix(path: string): string {
    /* @var string */
    return path.slice(this.prefix.length);
  }

  stripDirectoryPrefix(path: string): string {
    return this.stripPrefix(path).replace(PathPrefixer.rTrim, '');
  }

  prefixDirectoryPath(path: string): string {
    const prefixedPath = this.prefixPath(path.replace(PathPrefixer.rTrim, ''));

    if (prefixedPath.substr(-1) === this.separator || prefixedPath === '') {
      return prefixedPath;
    }

    return prefixedPath + this.separator;
  }
}
