import { Filesystem } from '../filesystem';
import { LocalFilesystemAdapter } from './local-filesystem-adapter';

Filesystem.adapter('local', LocalFilesystemAdapter);
