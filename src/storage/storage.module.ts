import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import storageConfig from '../config/storage.config';
import { AwsS3Adapter } from './adapters/aws-s3.adapter';
import { GcpStorageAdapter } from './adapters/gcp-storage.adapter';
import { AzureBlobAdapter } from './adapters/azure-blob.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { StorageService } from './services/storage.service';


@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [
    AwsS3Adapter,
    GcpStorageAdapter,
    AzureBlobAdapter,
    LocalStorageAdapter,
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
