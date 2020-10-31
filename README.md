# About Node Js Filesystem


[![Build Status](https://img.shields.io/travis/lywzx/node-js-filesystem/master.svg)](https://travis-ci.org/lywzx/node-js-filesystem)
[![codecov](https://codecov.io/gh/lywzx/node-js-filesystem/branch/master/graph/badge.svg)](https://codecov.io/gh/lywzx/node-js-filesystem)
[![NPM version](https://img.shields.io/npm/v/@filesystem/core.svg?style=flat-square)](https://www.npmjs.com/package/@filesystem/core)
[![NPM downloads](https://img.shields.io/npm/dm/@filesystem/core.svg?style=flat-square)](https://www.npmjs.com/package/@filesystem/core)
[![Known Vulnerabilities](https://snyk.io/test/github/lywzx/node-js-filesystem/badge.svg?targetFile=package.json)](https://snyk.io/test/github/lywzx/node-js-filesystem?targetFile=package.json)
[![License](https://img.shields.io/npm/l/js-filesystem.svg?sanitize=true)](https://www.npmjs.com/package/js-filesystem)
[![Dependency Status](https://david-dm.org/lywzx/node-js-filesystem.svg)](https://david-dm.org/lywzx/node-js-filesystem)
[![devDependencies Status](https://david-dm.org/lywzx/node-js-filesystem/dev-status.svg)](https://david-dm.org/lywzx/node-js-filesystem?type=dev)

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
@filesystem/nestjs          | doing       | NestJs Module



