import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { IDownloadedFile, IFile, IStorage } from '../../common/interfaces/storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorage {
  private readonly baseDirectory: string;
  private readonly _writeFile = util.promisify(fs.writeFile);
  private readonly _readFile = util.promisify(fs.readFile);
  private readonly _deleteFile = util.promisify(fs.unlink);
  private readonly _mkdir = util.promisify(fs.mkdir);

  constructor(private configService: ConfigService) {
    this.baseDirectory = this.configService.get<string>('storage.local.directory');
    if (!fs.existsSync(this.baseDirectory)) {
      fs.mkdirSync(this.baseDirectory, { recursive: true });
    }
  }

  async uploadFile(file: IFile): Promise<string> {
    const filePath = path.join(this.baseDirectory, file.path);
    const dirPath = path.dirname(filePath);

    // ** Check if the directory path exists, if not, create it
    if (!fs.existsSync(dirPath)) await this._mkdir(dirPath, { recursive: true });

    await this._writeFile(filePath, file.buffer);
    return filePath;
  }

  async downloadFile(pathToFile: string): Promise<IDownloadedFile> {
    try {
        const filePath = path.join(this.baseDirectory, pathToFile);
        const buffer = await this._readFile(filePath);
        const mimetype = require('mime-types').lookup(pathToFile) || 'application/octet-stream';

        return {
            name: path.basename(pathToFile),
            mimetype,
            buffer
        };
    } catch (error) {
        console.error(`Error reading local file ${pathToFile}:`, error);
        throw new Error('Failed to download file.');
    }
}

  async deleteFile(pathToFile: string): Promise<void> {
    const filePath = path.join(this.baseDirectory, pathToFile);
    await this._deleteFile(filePath);
  }
}
