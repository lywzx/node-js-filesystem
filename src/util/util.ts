import { Stats } from 'fs';
import { Magic, MAGIC_MIME_TYPE } from 'mmmagic';

export type FileType = 'file' | 'dir' | 'link';
/**
 * read file type
 * @param stats
 */
export function getType(stats: Stats): FileType {
  if (stats.isSymbolicLink()) {
    return 'link';
  } else if (stats.isDirectory()) {
    return 'dir';
  } else {
    return 'file';
  }
}

/**
 * guess file mimetype
 * @param path
 */
export function guessFileMimetype(path: string): Promise<string> {
  const mg = new Magic(MAGIC_MIME_TYPE);

  return new Promise((resolve, reject) => {
    mg.detectFile(path, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
