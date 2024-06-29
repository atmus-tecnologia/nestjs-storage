import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';
import { IStorage } from '../../common/interfaces/storage.interface';

@Injectable()
export class AzureBlobAdapter implements IStorage {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(private configService: ConfigService) {
    const azureConfig = this.configService.get('storage.azure');
    this.blobServiceClient = BlobServiceClient.fromConnectionString(azureConfig.connectionString);
    this.containerName = azureConfig.containerName;
  }

  async uploadFile(file: Express.Multer.File, containerName?: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(file.originalname);
    await blockBlobClient.uploadData(file.buffer);
    return blockBlobClient.url;
  }

  async downloadFile(fileName: string, containerName?: string): Promise<Buffer> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloaded = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
    return downloaded;
  }

  async deleteFile(fileName: string, containerName?: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.delete();
  }

  private async streamToBuffer(readableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }
}
