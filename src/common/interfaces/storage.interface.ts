export interface IStorage {
    uploadFile(file: Express.Multer.File, bucket: string): Promise<string>;
    downloadFile(fileName: string, bucket: string): Promise<Buffer>;
    deleteFile(fileName: string, bucket: string): Promise<void>;
  }
  