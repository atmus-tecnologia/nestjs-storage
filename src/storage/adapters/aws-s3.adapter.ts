import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { IDownloadedFile, IFile, IStorage } from '../../common/interfaces/storage.interface';
import * as path from 'path';

@Injectable()
export class AwsS3Adapter implements IStorage {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('storage.provider');
    if (provider === 'aws') {
      const awsConfig = this.configService.get('storage.aws');
      this.s3 = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
      });
      this.bucket = awsConfig.bucket;
    }
  }

  async uploadFile(file: IFile, bucket?: string): Promise<string> {
    const params = {
      Bucket: bucket || this.bucket,
      Key: file.path,
      Body: file.buffer,
    };
    await this.s3.send(new PutObjectCommand(params));
    return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
  }

  async downloadFile(fileName: string, bucket?: string): Promise<IDownloadedFile> {
    try {
        const params = {
            Bucket: bucket || this.bucket,
            Key: fileName,
        };
        const { Body, ContentType } = await this.s3.send(new GetObjectCommand(params));
        const buffer = await this.streamToBuffer(Body as Readable);

        return {
            name: path.basename(fileName),
            mimetype: ContentType || 'application/octet-stream',
            buffer
        };
    } catch (error) {
        console.error(`Error downloading file ${fileName} from AWS S3:`, error);
        throw new Error('Failed to download file.');
    }
}

  async deleteFile(fileName: string, bucket?: string): Promise<void> {
    const params = {
      Bucket: bucket || this.bucket,
      Key: fileName,
    };
    await this.s3.send(new DeleteObjectCommand(params));
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
