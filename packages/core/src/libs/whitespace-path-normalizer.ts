import { IPathNormalizer } from '../interfaces/path/path-normalizer';
import { isEmpty } from 'lodash';

/**
 * path white space remove
 */
export class WhitespacePathNormalizer implements IPathNormalizer {
  private removeFunkyWhiteSpace(path: string): string {
    // Remove unprintable characters and invalid unicode characters.
    // We do this check in a loop, since removing invalid unicode characters
    // can lead to new characters being created.
    const reg = /\p{C}+|^\.\//u;
    while (reg.test(path)) {
      path = path.replace(reg, '');
    }

    return path;
  }

  private normalizeRelativePath(path: string): string {
    const parts: string[] = [];

    for (const part of path.split('/')) {
      switch (part) {
        case '':
        case '.':
          break;

        case '..':
          if (isEmpty(parts)) {
            throw new Error(`Path traversal detected: ${path}`);
            // throw PathTraversalDetected::forPath($path);
          }
          parts.pop();
          break;

        default:
          parts.push(part);
          break;
      }
    }

    return parts.join('/');
  }

  normalizePath(path: string): string {
    path = path.replace(/\\/g, '/');
    path = this.removeFunkyWhiteSpace(path);

    return this.normalizeRelativePath(path);
  }
}
