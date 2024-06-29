import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { IStorage } from '../../common/interfaces/storage.interface';

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

  async uploadFile(file: Express.Multer.File, bucket?: string): Promise<string> {
    const bucketRef = this.storage.bucket(bucket || this.bucket);
    const blob = bucketRef.file(file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.end(file.buffer);

    await new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
    });

    return `gs://${bucket || this.bucket}/${file.originalname}`;
  }

  async downloadFile(fileName: string, bucket?: string): Promise<Buffer> {
    const bucketRef = this.storage.bucket(bucket || this.bucket);
    const fileRef = bucketRef.file(fileName);
    const [fileBuffer] = await fileRef.download();
    return fileBuffer;
  }

  async deleteFile(fileName: string, bucket?: string): Promise<void> {
    const bucketRef = this.storage.bucket(bucket || this.bucket);
    const fileRef = bucketRef.file(fileName);
    await fileRef.delete();
  }
}
