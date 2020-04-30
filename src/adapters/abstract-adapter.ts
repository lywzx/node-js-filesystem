export abstract class AbstractAdapter {
  /**
   * @var string|undefined path prefix
   */
  protected pathPrefix: string | undefined;

  /**
   * @var string
   */
  protected pathSeparator = '/';

  /**
   * Set the path prefix.
   *
   * @param {string} prefix
   *
   * @return void
   */
  public setPathPrefix(prefix: string) {
    prefix = prefix.toString();

    if (prefix === '') {
      this.pathPrefix = '';
      return;
    }

    this.pathPrefix = prefix.replace(/[\\/]+$/, '') + this.pathSeparator;
  }

  /**
   * Get the path prefix.
   *
   * @return string path prefix or null if pathPrefix is empty
   */
  public getPathPrefix() {
    return this.pathPrefix;
  }

  /**
   * Prefix a path.
   *
   * @param {string} path
   *
   * @return string prefixed path
   */
  public applyPathPrefix(path: string) {
    return this.getPathPrefix() + path.replace(/^[\\/]+/, '');
  }

  /**
   * Remove a path prefix.
   *
   * @param {string} path
   *
   * @return string path without the prefix
   */
  public removePathPrefix(path: string) {
    return path.substr(this.getPathPrefix()?.length || 0);
  }
}
