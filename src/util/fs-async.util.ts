import { constants, Stats } from 'fs';
import { PathStatsInterface } from '../interfaces';
import { accessPromisify, readDirPromisify, statPromisify } from './fs-promisify';

/**
 * check director is symbolic link
 * @param {string} dir
 */

export async function isSymbolicLink(dir: string): Promise<boolean> {
  const dirStat = await statPromisify(dir);
  return dirStat.isSymbolicLink();
}

/**
 * check dir is directory
 * @param {string} dir
 */
export async function isDir(dir: string): Promise<boolean> {
  const dirStat = await statPromisify(dir);
  return dirStat.isDirectory();
}

/**
 * check directory is readable
 *
 * @param {string} dir
 */
export async function isReadable(dir: string): Promise<boolean> {
  try {
    await accessPromisify(dir, constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param dir
 */
export async function mkDir(dir: string): Promise<boolean> {
  return true;
}

/**
 * read directory content
 * @param path
 */
export async function getRecursiveDirectoryIterator(path: string): Promise<PathStatsInterface[]> {
  const files = await readDirPromisify(path);
  return Promise.all(
    files.map(file =>
      statPromisify(file).then((stats: Stats) => {
        return {
          stats,
          path: file,
        };
      })
    )
  );
}

/**
 * read directory content
 * @param path
 */
export async function getDirectoryIterator(path: string): Promise<PathStatsInterface[]> {
  const files = await readDirPromisify(path);
  return Promise.all(
    files.map(file =>
      statPromisify(file).then((stats: Stats) => {
        return {
          stats,
          path: file,
        };
      })
    )
  );
}
