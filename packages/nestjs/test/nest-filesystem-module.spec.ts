import { expect } from 'chai';
import { Test } from '@nestjs/testing';
import { NestFilesystemModule, defaultModuleOptions } from '@filesystem/nestjs';
import { Filesystem } from '@filesystem/core';
import 'reflect-metadata';

describe('nest js filesystem module test util', function () {
  it('should aaaaaaa', async function () {
    const module = await Test.createTestingModule({
      imports: [
        NestFilesystemModule.registerAsync({
          useFactory: () => {
            return defaultModuleOptions;
          },
        }),
      ],
      providers: [],
    }).compile();
    expect(module.get(Filesystem)).to.be.instanceOf(Filesystem);
  });
});
