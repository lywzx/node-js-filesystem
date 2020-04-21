import { statSync, accessSync, constants, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

/**
 * check director is symbolic link
 * @param {string} dir
 */
export function isSymbolicLink(dir: string): boolean {
  const dirStat = statSync(dir);
  return dirStat.isSymbolicLink();
}

/**
 * check dir is directory
 * @param {string} dir
 */
export function isDir(dir: string): boolean {
  const dirStat = statSync(dir);
  return dirStat.isDirectory();
}

/**
 * check directory is readable
 *
 * @param {string} dir
 */
export function isReadable(dir: string): boolean {
  try {
    accessSync(dir, constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param dir
 * @param mode
 * @param recursive
 */
export function mkDir(dir: string, mode?: number, recursive = true) {
  if (mode === undefined) {
    mode = 0x1ff ^ process.umask();
  }
  const pathsCreated = [],
    pathsFound = [];

  let cDir = dir;
  while (true) {
    try {
      const stats = statSync(cDir);

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
    mkdirSync(currentFound, mode);
    pathsCreated.push(currentFound);
  }

  return pathsCreated;
}


export function fileExists(path: string) {

}
