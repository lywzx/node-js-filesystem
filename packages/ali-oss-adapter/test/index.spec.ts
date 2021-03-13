import { filesystemAdapterSpecUtil } from '@filesystem/core/test/adapter-test-utilties/filesystem-adapter.spec.util';
import { AliOssFilesystemAdapter } from '../src';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { isReadableSync } from '@filesystem/core/src/util';

describe('ali-oss adapter test', function (): void {
  before(() => {
    const envPath = join(__dirname, '../../../.env');
    if (isReadableSync(envPath)) {
      dotenv.config({
        path: envPath,
      });
    }
  });

  const aliOssRoot = 'base/test';
  const getAdapter = () =>
    new AliOssFilesystemAdapter(
      {
        region: process.env.ALI_OSS_ORIGIN || 'oss-cn-beijing',
        accessKeyId: process.env.ALI_ACCESS_KEY_ID || '',
        accessKeySecret: process.env.ALI_ACCESS_KEY_SECERT || '',
        bucket: process.env.ALI_OSS_BUCKET || '',
        endpoint: process.env.ALI_OSS_ENDPOINT || 'oss-cn-beijing.aliyuncs.com',
        // tslint:disable-next-line:max-line-length
        // OSS 外网节点或自定义外部域名//'endpoint_internal' : '<internal endpoint [OSS内网节点] 如：oss-cn-shenzhen-internal.aliyuncs.com>', // v2.0.4 新增配置属性，如果为空，则默认使用 endpoint 配置(由于内网上传有点小问题未解决，请大家暂时不要使用内网节点上传，正在与阿里技术沟通中)
        // 'cdnDomain'     : '<CDN domain, cdn域名>', // 如果isCName为true, getUrl会判断cdnDomain是否设定来决定返回的url，如果cdnDomain未设置，则使用endpoint来生成url，否则使用cdn
        cname: process.env.ALI_IS_USE_CONFIG_CDN === 'true',
        // 是否在OSS内网
        internal: process.env.ALI_IS_INTERNAL === 'true',
      },
      aliOssRoot
    );

  beforeEach(async function () {
    try {
      await getAdapter().deleteDirectory('');
    } catch (e) {}
  });

  afterEach(async function () {
    try {
      await getAdapter().deleteDirectory('');
    } catch (e) {}
  });

  describe('baseFilesystemSpecUtil', function () {
    filesystemAdapterSpecUtil(join(__dirname, '../../core/test/files/test-root'), getAdapter);
  });
});
