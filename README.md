# @atmus/nestjs-storage

A unified NestJS interface for file uploads, downloads and deletion using local files, AWS S3, Google Cloud Storage or Azure Blob Storage.

## Installation

```sh
npm install @atmus/nestjs-storage@2.0.0 @nestjs/common @nestjs/config reflect-metadata rxjs
```

Use NestJS 11/12 and @nestjs/config 4/12. See [MIGRATION.md](MIGRATION.md) before upgrading from 1.x.

## Configuration

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '@atmus/nestjs-storage';

@Module({
  imports: [ConfigModule.forRoot(), StorageModule],
})
export class AppModule {}
```

Set only the environment variables for your selected provider:

| STORAGE_PROVIDER | Configuration |
| --- | --- |
| local (default) | LOCAL_STORAGE_DIRECTORY (default ./uploads) |
| aws | AWS_REGION, AWS_BUCKET; optional AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY, otherwise default SDK credential chain |
| gcp | GCP_BUCKET; optional GCP_PROJECT_ID and GCP_KEY_FILENAME, otherwise application default credentials |
| azure | AZURE_CONNECTION_STRING, AZURE_CONTAINER_NAME |

Provision buckets/containers before use. The library does not create cloud buckets, set ACLs or serve HTTP routes. Keep secrets out of source control.

Example local environment:

```dotenv
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIRECTORY=./uploads
```

## Usage

```ts
import { Injectable } from '@nestjs/common';
import { StorageService } from '@atmus/nestjs-storage';

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async example() {
    const key = 'reports/example.txt';
    await this.storage.uploadFile({
      path: key,
      mimetype: 'text/plain',
      buffer: Buffer.from('Hello'),
    });
    const file = await this.storage.downloadFile(key);
    await this.storage.deleteFile(key);
    return file;
  }
}
```

| Method | Result |
| --- | --- |
| uploadFile(file: IFile, bucket?: string) | Promise<string>: local absolute path, S3/Azure URL or gs:// URI |
| downloadFile(key: string, bucket?: string) | Promise<IDownloadedFile>: name, mimetype, buffer |
| deleteFile(key: string, bucket?: string) | Promise<void> |

The optional second argument overrides the cloud bucket/container; local storage ignores it. Always use the relative object key for subsequent operations, not the upload result. Returned URLs do not guarantee anonymous access; S3 URLs are not presigned.

Local keys use forward slashes and must stay within the configured directory. Absolute paths, traversal and existing symbolic link/junction descendants are rejected. Keep the directory under application ownership; checks do not protect against another local process racing to replace directories. Local missing-file errors retain their original code, such as ENOENT.

Uploads and downloads are buffered in memory; apply file-size limits in your application. Validate permissions and MIME types before accepting untrusted uploads. Cloud downloads retain the existing generic download-error behavior; upload/delete errors propagate from the SDK.

Public exports: StorageModule, StorageService, IStorage, IFile, IDownloadedFile, storageConfig, AwsS3Adapter, GcpStorageAdapter, AzureBlobAdapter and LocalStorageAdapter.

## Compatibility and development

Requires **Node.js 22.12+**, **NestJS 11 or 12**, RxJS 7.8+ and reflect-metadata 0.2.2+.
The package ships CommonJS JavaScript, TypeScript declarations and source maps. Modern Node supports loading NestJS 12's ESM dependencies; use a compatible NodeNext/Node20 TypeScript configuration in consuming applications.

```sh
npm ci
npm run check
```

Checks include offline regression tests and installation of the actual npm archive in an isolated consumer. CI covers Node 22/24 and Nest 11/12. No real API credentials are used by the test suite. Live provider behavior must be validated in your application.

See [CHANGELOG.md](CHANGELOG.md), [MIGRATION.md](MIGRATION.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for release history, breaking changes and publication instructions. Licensed under [MIT](LICENSE).
