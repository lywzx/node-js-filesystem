// @ts-nocheck

import {
  FileAttributes,
  IFilesystemAdapter,
  IReadFileOptions,
  IStorageAttributes,
  PathPrefixer,
  RequireOne,
  Visibility,
} from '@filesystem/core';
import { Readable } from 'stream';
import { ReadStream } from 'fs';

export class FtpFilesystemAdapter implements IFilesystemAdapter {
  copy(source: string, destination: string, config?: Record<string, any>): Promise<void> {
    return Promise.resolve(undefined);
  }

  createDirectory(path: string, config?: Record<string, any>): Promise<void> {
    return Promise.resolve(undefined);
  }

  delete(path: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteDirectory(path: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  fileExists(path: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  fileSize(path: string): Promise<RequireOne<FileAttributes, 'fileSize'>> {
    return Promise.resolve(undefined);
  }

  getPathPrefix(): PathPrefixer {
    return undefined!;
  }

  lastModified(path: string): Promise<RequireOne<FileAttributes, 'lastModified'>> {
    return Promise.resolve(undefined);
  }

  listContents(path: string, deep: boolean): Promise<IStorageAttributes[]> {
    return Promise.resolve([]);
  }

  mimeType(path: string): Promise<RequireOne<FileAttributes, 'mimeType'>> {
    return Promise.resolve(undefined);
  }

  move(source: string, destination: string, config?: Record<string, any>): Promise<void> {
    return Promise.resolve(undefined);
  }

  read(path: string, config?: IReadFileOptions): Promise<string | Buffer> {
    return Promise.resolve(undefined);
  }

  readStream(path: string, config?: Record<string, any>): Promise<ReadStream> {
    return Promise.resolve(undefined);
  }

  setVisibility(path: string, visibility: Visibility): Promise<void> {
    return Promise.resolve(undefined);
  }

  visibility(path: string): Promise<RequireOne<FileAttributes, 'visibility'>> {
    return Promise.resolve(undefined);
  }

  write(path: string, contents: string | Buffer, config?: Record<string, any>): Promise<void> {
    return Promise.resolve(undefined);
  }

  writeStream(path: string, resource: Readable, config?: Record<string, any>): Promise<void> {
    return Promise.resolve(undefined);
  }
}
