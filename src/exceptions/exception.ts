import { FileSystemException } from './file-system.exception';

export class Exception extends Error implements FileSystemException {}
