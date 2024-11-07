import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';
import { IDownloadedFile, IFile, IStorage } from '../../common/interfaces/storage.interface';
import * as path from 'path';

@Injectable()
export class AzureBlobAdapter implements IStorage {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('storage.provider');
    if (provider === 'azure') {
      const azureConfig = this.configService.get('storage.azure');
      this.blobServiceClient = BlobServiceClient.fromConnectionString(azureConfig.connectionString);
      this.containerName = azureConfig.containerName;
    }
  }

  async uploadFile(file: IFile, containerName?: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(file.path);
    await blockBlobClient.uploadData(file.buffer);
    return blockBlobClient.url;
  }

  async downloadFile(pathToFile: string, containerName?: string): Promise<IDownloadedFile> {
    try {
        const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(pathToFile);
        const downloadBlockBlobResponse = await blockBlobClient.download();
        const buffer = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

        return {
            name: path.basename(pathToFile),
            mimetype: downloadBlockBlobResponse.contentType || 'application/octet-stream',
            buffer
        };
    } catch (error) {
        console.error(`Error downloading file ${pathToFile}:`, error);
        throw new Error('Failed to download file.');
    }
}

  async deleteFile(pathToFile: string, containerName?: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName || this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(pathToFile);
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
