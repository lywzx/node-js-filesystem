import { constants, Stats } from 'fs';
import { dirname, join } from 'path';
import { IPathStats } from '../interfaces';
import { access, lstat, mkdir, readdir, rmdir, stat, unlink } from './fs-extra.util';

/**
 * check director is symbolic link
 * @param {string} dir
 */

export async function isSymbolicLink(dir: string): Promise<boolean> {
  try {
    const dirStat = await lstat(dir);
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
    const dirStat = await lstat(dir);
    return dirStat.isDirectory();
  } catch (e) {}

  return false;
}

/**
 * check is file
 * @param file
 */
export async function isFile(file: string): Promise<boolean> {
  try {
    const dirStat = await lstat(file);
    return dirStat.isFile();
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
    await access(dir, constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param dir
 */
export async function mkDir(dir: string, mode?: number | string): Promise<string[]> {
  if (mode === undefined) {
    mode = 0x1ff ^ process.umask();
  }
  const pathsCreated: string[] = [],
    pathsFound = [];

  let cDir = dir;
  while (true) {
    try {
      const stats = await stat(cDir);

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
    await mkdir(currentFound, mode as any);
    pathsCreated.push(currentFound);
  }

  return pathsCreated;
}

/**
 * read directory content
 * @param path
 */
export async function getRecursiveDirectoryIterator(path: string): Promise<IPathStats[]> {
  const files = await readdir(path);
  const result = await Promise.all(
    files.map((file) => {
      const filePath = join(path, file);
      return lstat(filePath).then((stats: Stats) => {
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
export async function getDirectoryIterator(path: string): Promise<IPathStats[]> {
  const files = await readdir(path);
  return Promise.all(
    files.map((file) => {
      const filePath = join(path, file);
      return lstat(filePath).then((stats: Stats) => {
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
  const files = await readdir(dir);

  for (const file of files) {
    const realPath = join(dir, file);
    const stats = await stat(realPath);

    if (stats.isDirectory()) {
      await rmDir(realPath);
    } else {
      await unlink(realPath);
    }
  }

  await rmdir(dir);
  return true;
}
