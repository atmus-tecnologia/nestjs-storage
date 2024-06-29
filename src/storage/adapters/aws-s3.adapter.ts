import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { IStorage } from '../../common/interfaces/storage.interface';

@Injectable()
export class AwsS3Adapter implements IStorage {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
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

  async uploadFile(file: Express.Multer.File, bucket?: string): Promise<string> {
    const params = {
      Bucket: bucket || this.bucket,
      Key: file.originalname,
      Body: file.buffer,
    };
    await this.s3.send(new PutObjectCommand(params));
    return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
  }

  async downloadFile(fileName: string, bucket?: string): Promise<Buffer> {
    const params = {
      Bucket: bucket || this.bucket,
      Key: fileName,
    };
    const { Body } = await this.s3.send(new GetObjectCommand(params));
    return this.streamToBuffer(Body as Readable);
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
