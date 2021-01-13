import { IPathNormalizer } from '../interfaces/path/path-normalizer';

export class WhitespacePathNormalizer implements IPathNormalizer {
  normalizePath(path: string): string {
    //path = path.replace(/\\\\/g, '/');
    /*path = this.removeFunkyWhiteSpace(path);

    return this.normalizeRelativePath(path);*/
    return path;
  }
}
