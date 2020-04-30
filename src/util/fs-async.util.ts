import { constants, Stats } from 'fs';
import { dirname, join } from 'path';
import { PathStatsInterface } from '../interfaces';
import {
  accessPromisify,
  lstatPromisify,
  mkdirPromisify,
  readDirPromisify,
  rmdirPromisify,
  statPromisify,
  unlinkPromisify,
} from './fs-promisify';

/**
 * check director is symbolic link
 * @param {string} dir
 */

export async function isSymbolicLink(dir: string): Promise<boolean> {
  try {
    const dirStat = await lstatPromisify(dir);
    return dirStat.isSymbolicLink();
  } catch (e) {
    return false;
  }
}

/**
 * check dir is directory
 * @param {string} dir
 */
export async function isDir(dir: string): Promise<boolean> {
  try {
    const dirStat = await lstatPromisify(dir);
    return dirStat.isDirectory();
  } catch (e) {}

  return false;
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
export async function mkDir(dir: string, mode?: number): Promise<string[]> {
  if (mode === undefined) {
    mode = 0x1ff ^ process.umask();
  }
  const pathsCreated: string[] = [],
    pathsFound = [];

  let cDir = dir;
  while (true) {
    try {
      const stats = await statPromisify(cDir);

      if (stats.isDirectory()) {
        break;
      }

      throw new Error('Unable to create directory at ' + cDir);
    } catch (e) {
      if (e.code === 'ENOENT') {
        pathsFound.push(cDir);
        cDir = dirname(cDir);
      } else {
        throw e;
      }
    }
  }

  for (let i = pathsFound.length - 1; i > -1; i--) {
    const currentFound = pathsFound[i];
    await mkdirPromisify(currentFound, mode);
    pathsCreated.push(currentFound);
  }

  return pathsCreated;
}

/**
 * read directory content
 * @param path
 */
export async function getRecursiveDirectoryIterator(path: string): Promise<PathStatsInterface[]> {
  const files = await readDirPromisify(path);
  const result = await Promise.all(
    files.map((file) => {
      const filePath = join(path, file);
      return lstatPromisify(filePath).then((stats: Stats) => {
        return {
          stats,
          path: filePath,
        };
      });
    })
  );

  for (const item of result) {
    if (item.stats.isDirectory()) {
      result.push(...(await getRecursiveDirectoryIterator(item.path)));
    }
  }

  return result;
}

/**
 * read directory content
 * @param path
 */
export async function getDirectoryIterator(path: string): Promise<PathStatsInterface[]> {
  const files = await readDirPromisify(path);
  return Promise.all(
    files.map((file) => {
      const filePath = join(path, file);
      return lstatPromisify(filePath).then((stats: Stats) => {
        return {
          stats,
          path: filePath,
        };
      });
    })
  );
}

/**
 * remove directory and files
 * @param dir
 */
export async function rmDir(dir: string): Promise<boolean> {
  const files = await readDirPromisify(dir);

  try {
    for (const file of files) {
      const realPath = join(dir, file);
      const stats = await statPromisify(realPath);

      if (stats.isDirectory()) {
        await rmDir(realPath);
      } else {
        await unlinkPromisify(realPath);
      }
    }

    await rmdirPromisify(dir);
    return true;
  } catch (e) {
    return false;
  }
}
