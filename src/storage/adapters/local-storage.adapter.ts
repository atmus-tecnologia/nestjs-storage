import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { IDownloadedFile, IFile, IStorage } from '../../common/interfaces/storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorage {
  private readonly baseDirectory: string;

  constructor(config: ConfigService) {
    this.baseDirectory = path.resolve(config.get<string>('storage.local.directory') || './uploads');
  }

  private async resolveFile(key: string): Promise<string> {
    if (!key || key.includes('\0') || path.isAbsolute(key) || /^[a-z]:/i.test(key) || key.includes('\\')) {
      throw new Error('Storage key must be a relative path using forward slashes');
    }
    const target = path.resolve(this.baseDirectory, key);
    const relative = path.relative(this.baseDirectory, target);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('Storage key must stay inside the storage directory');
    }
    await fs.mkdir(this.baseDirectory, { recursive: true });
    // Reject links/junctions in existing descendants, including the target file.
    let current = this.baseDirectory;
    for (const part of relative.split(path.sep)) {
      current = path.join(current, part);
      try {
        if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Storage keys cannot traverse symbolic links');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
        throw error;
      }
    }
    return target;
  }

  async uploadFile(file: IFile): Promise<string> {
    const target = await this.resolveFile(file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer);
    return target;
  }

  async downloadFile(key: string): Promise<IDownloadedFile> {
    const buffer = await fs.readFile(await this.resolveFile(key));
    const mimetype = require('mime-types').lookup(key) || 'application/octet-stream';
    return { name: path.basename(key), mimetype, buffer };
  }

  async deleteFile(key: string): Promise<void> { await fs.unlink(await this.resolveFile(key)); }
}
