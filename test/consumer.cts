import { StorageModule, type IStorage, storageConfig } from '@atmus/nestjs-storage';
void StorageModule; void storageConfig;
declare const storage: IStorage;
void storage.downloadFile('test.txt');
