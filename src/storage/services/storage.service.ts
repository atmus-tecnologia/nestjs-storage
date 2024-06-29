import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorage } from '../../common/interfaces/storage.interface';
import { AwsS3Adapter } from '../adapters/aws-s3.adapter';
import { GcpStorageAdapter } from '../adapters/gcp-storage.adapter';
import { AzureBlobAdapter } from '../adapters/azure-blob.adapter';
import { LocalStorageAdapter } from '../adapters/local-storage.adapter';

@Injectable()
export class StorageService implements IStorage {
  private storageAdapter: IStorage;

  constructor(
    private configService: ConfigService,
    private awsS3Adapter: AwsS3Adapter,
    private gcpStorageAdapter: GcpStorageAdapter,
    private azureBlobAdapter: AzureBlobAdapter,
    private localStorageAdapter: LocalStorageAdapter,
  ) {
    const provider = this.configService.get<string>('storage.provider');
    switch (provider) {
      case 'aws':
        this.storageAdapter = this.awsS3Adapter;
        break;
      case 'gcp':
        this.storageAdapter = this.gcpStorageAdapter;
        break;
      case 'azure':
        this.storageAdapter = this.azureBlobAdapter;
        break;
      case 'local':
        this.storageAdapter = this.localStorageAdapter;
        break;
      default:
        throw new Error('Invalid storage provider');
    }
  }

  uploadFile(file: Express.Multer.File, bucket?: string): Promise<string> {
    return this.storageAdapter.uploadFile(file, bucket);
  }

  downloadFile(fileName: string, bucket?: string): Promise<Buffer> {
    return this.storageAdapter.downloadFile(fileName, bucket);
  }

  deleteFile(fileName: string, bucket?: string): Promise<void> {
    return this.storageAdapter.deleteFile(fileName, bucket);
  }
}
