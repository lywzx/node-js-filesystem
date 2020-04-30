import { Stats } from 'fs';

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
