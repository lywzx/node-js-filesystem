import { bindErrorConstructor } from '../util/exception.util';
import { FilesystemException } from './filesystem.exception';

export class PathTraversalDetectedException extends FilesystemException {
  /**
   * @var string
   */
  private _path = '';

  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, PathTraversalDetectedException);
  }

  public path(): string {
    return this._path;
  }

  static forPath(path: string): PathTraversalDetectedException {
    const e = new PathTraversalDetectedException(`Path traversal detected: ${path}`);
    e._path = path;

    return e;
  }
}
