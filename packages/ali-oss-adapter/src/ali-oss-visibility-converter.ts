import { PortableVisibilityConverter, Visibility } from '@filesystem/core';
import { ACLType } from 'ali-oss';
import { PUBLIC_READ, PUBLIC_READ_WRITE } from './constant';

export class AliOssVisibilityConverter extends PortableVisibilityConverter<ACLType> {
  constructor(
    protected readonly filePublic = PUBLIC_READ_WRITE,
    protected readonly filePrivate = PUBLIC_READ,
    protected readonly directoryPublic = PUBLIC_READ_WRITE,
    protected readonly directoryPrivate = PUBLIC_READ,
    protected readonly _defaultForDirectories = Visibility.PUBLIC
  ) {
    super(filePublic, filePrivate, directoryPublic, directoryPrivate, _defaultForDirectories);
  }
}
