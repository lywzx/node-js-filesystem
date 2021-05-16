import { IFilesystemReader } from './filesystem-reader';
import { IFilesystemWriter } from './filesystem-writer';

export interface IFilesystemOperator extends IFilesystemReader, IFilesystemWriter {}
