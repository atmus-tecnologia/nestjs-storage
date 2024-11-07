import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { IDownloadedFile, IFile, IStorage } from '../../common/interfaces/storage.interface';
import * as path from 'path';

@Injectable()
export class GcpStorageAdapter implements IStorage {
  private storage: Storage;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('storage.provider');
    if (provider === 'gcp') {
      const gcpConfig = this.configService.get('storage.gcp');
      this.storage = new Storage({
        projectId: gcpConfig.projectId,
        keyFilename: gcpConfig.keyFilename,
      });
      this.bucket = gcpConfig.bucket;
    }
  }

  async uploadFile(file: IFile, bucket?: string): Promise<string> {
    const bucketRef = this.storage.bucket(bucket || this.bucket);
    const blob = bucketRef.file(file.path);
    const blobStream = blob.createWriteStream();

    blobStream.end(file.buffer);

    await new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
    });

    return `gs://${bucket || this.bucket}/${file.path}`;
  }

  async downloadFile(pathToFile: string, bucket?: string): Promise<IDownloadedFile> {
    try {
        const bucketRef = this.storage.bucket(bucket || this.bucket);
        const fileRef = bucketRef.file(pathToFile);
        const [fileBuffer] = await fileRef.download();
        const [metadata] = await fileRef.getMetadata();

        return {
            name: path.basename(pathToFile),
            mimetype: metadata.contentType || 'application/octet-stream',
            buffer: fileBuffer
        };
    } catch (error) {
        console.error(`Error downloading file ${pathToFile} from GCP:`, error);
        throw new Error('Failed to download file.');
    }
}

  async deleteFile(pathToFile: string, bucket?: string): Promise<void> {
    const bucketRef = this.storage.bucket(bucket || this.bucket);
    const fileRef = bucketRef.file(pathToFile);
    await fileRef.delete();
  }
}
