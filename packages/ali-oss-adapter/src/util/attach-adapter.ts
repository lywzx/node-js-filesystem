import { Filesystem } from '@filesystem/core';
import { AliOssFilesystemAdapter } from '../ali-oss-filesystem.adapter';

Filesystem.adapter('ali-oss', AliOssFilesystemAdapter);
