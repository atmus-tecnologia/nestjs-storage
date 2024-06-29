import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { IStorage } from '../../common/interfaces/storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorage {
  private readonly baseDirectory: string;
  private readonly _writeFile = util.promisify(fs.writeFile);
  private readonly _readFile = util.promisify(fs.readFile);
  private readonly _deleteFile = util.promisify(fs.unlink);

  constructor(private configService: ConfigService) {
    this.baseDirectory = this.configService.get<string>('storage.local.directory');
    if (!fs.existsSync(this.baseDirectory)) {
      fs.mkdirSync(this.baseDirectory, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filePath = path.join(this.baseDirectory, file.originalname);
    await this._writeFile(filePath, file.buffer);
    return filePath;
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.baseDirectory, fileName);
    return this._readFile(filePath);
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.baseDirectory, fileName);
    await this._deleteFile(filePath);
  }
}
