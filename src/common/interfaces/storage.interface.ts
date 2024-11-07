export interface IFile {
  path: string;
  mimetype: string;
  buffer: Buffer;
}

export interface IDownloadedFile {
  name: string;
  mimetype: string;
  buffer: Buffer;
}

export interface IStorage {
  uploadFile(file: IFile, bucket: string): Promise<string>;
  downloadFile(filePath: string, bucket: string): Promise<IDownloadedFile>;
  deleteFile(filePath: string, bucket: string): Promise<void>;
}
