import { IMimeTypeDetector } from '@filesystem/core';
import * as Stream from 'stream';

export class AliOssMimeTypeDetector implements IMimeTypeDetector {
  detectMimeType(path: string, contents?: string | Buffer | Stream): Promise<string | void> {
    return Promise.resolve(undefined);
  }

  detectMimeTypeFromBuffer(contents: string | Buffer | Stream): Promise<string | void> {
    return Promise.resolve(undefined);
  }

  detectMimeTypeFromFile(path: string): Promise<string | void> {
    return Promise.resolve(undefined);
  }

  detectMimeTypeFromPath(path: string): string | void {
    return undefined;
  }
}
