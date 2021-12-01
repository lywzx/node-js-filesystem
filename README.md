# About Node Js Filesystem


[![Build Status](https://github.com/lywzx/node-js-filesystem/actions/workflows/npm-ci.yml/badge.svg?branch=master)](https://github.com/lywzx/node-js-filesystem/actions/workflows/npm-ci.yml)
[![codecov](https://codecov.io/gh/lywzx/node-js-filesystem/branch/master/graph/badge.svg)](https://codecov.io/gh/lywzx/node-js-filesystem)
[![NPM version](https://img.shields.io/npm/v/@filesystem/core.svg?style=flat-square)](https://www.npmjs.com/package/@filesystem/core)
[![NPM downloads](https://img.shields.io/npm/dm/@filesystem/core.svg?style=flat-square)](https://www.npmjs.com/package/@filesystem/core)
[![Known Vulnerabilities](https://snyk.io/test/github/lywzx/node-js-filesystem/badge.svg?targetFile=packages/core/package.json)](https://snyk.io/test/github/lywzx/node-js-filesystem?targetFile=package.json)
[![License](https://img.shields.io/npm/l/@filesystem/core.svg?sanitize=true)](https://www.npmjs.com/package/@filesystem/core)

Node js filesystem like php filesystem package [thephpleague/flysystem](https://flysystem.thephpleague.com/)

Flysystem is a filesystem abstraction library for NodeJs. By providing a unified interface for many different filesystems you’re able to swap out filesystems without application wide rewrites.

Using Flysystem can eliminate vendor-lock in, reduce technical debt, and improve the testability of your code.

# Getting Started

## Installation

```bash
# install
yarn add @filesystem/core # or：npm install @filesystem/core --save
```

# Support Adapters

Adapters | Status | Description
---|---|---
@filesystem/ali-oss-adapter | doing       | aliyun oss adapter, support nodejs or browser
@filesystem/ftp-adapter     | doing       | nodejs ftp upload
@filesystem/sftp-adapter    | doing       | sftp adapter
@filesystem/webdav-adapter  | doing       | webdav adapter
@filesystem/memory-adapter  | doing       | memory filesystem adapter
@filesystem/nestjs          | doing       | NestJs Module

# Usage

To safely interact with the filesystem, always wrap the adapter in a Filesystem instance.

```typescript
import { LocalFilesystemAdapter, Filesystem  } from '@filesystem/core';

// SETUP
const adapter = new LocalFilesystemAdapter(rootPath);
const filesystem = Filesystem(adapter);

// USAGE
await filesystem.write($path, $contents);
```
