# `@filesystem/nestjs`

nodejs filesystem use for nestjs framework.

## Install

```bash
npm i @filesystem/core @filesystem/nestjs // or yarn add @filesystem/core @filesystem/nestjs
```

## Usage

```typescript
import {
    NestFilesystemModule,
} from '@filesystem/nestjs';
import { 
    Filesystem,
} from '@filesystem/core';
import {
    join,
} from 'path';
import { Injectable } from '@nestjs/common';

@Module({
    imports: [
        NestFilesystemModule.register({
            adapter: 'local',
            root: join(__dirname, '../../storage'),
        })
    ],
    providers: [AppService]
})
export class AppModule {
}

@Injectable()
export class AppService {
    constructor(protected readonly filesystem: Filesystem) {
    }
    
    read(file: string) {
        return this.filesystem.read(file);
    }
}
```
