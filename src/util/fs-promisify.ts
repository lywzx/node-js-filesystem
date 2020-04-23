import { access, stat, exists, chmod, writeFile, readFile, rename, copyFile, unlink, readdir, mkdir, rmdir } from 'fs';
import { promisify } from 'util';

/**
 * stat promise
 */
export const statPromisify = promisify(stat);
/**
 * access promise
 */
export const accessPromisify = promisify(access);

/**
 * check file or directory is exists
 */
export const existsPromisify = promisify(exists);

/**
 * change file mod
 */
export const chmodPromisify = promisify(chmod);

/**
 * write file promisify
 */
export const writeFilePromisify = promisify(writeFile);

/**
 * read file content
 */
export const readFilePromisify = promisify(readFile);

/**
 * rename file promisify
 */
export const renamePromisify = promisify(rename);

/**
 * copy file promisify
 */
export const copyFilePromisify = promisify(copyFile);

/**
 * unlink file promisify
 */
export const unlinkPromisify = promisify(unlink);

/**
 * read dir files
 */
export const readDirPromisify = promisify(readdir);

/**
 * create dir
 */
export const mkdirPromisify = promisify(mkdir);

/**
 * remove dir
 */
export const rmdirPromisify = promisify(rmdir);
