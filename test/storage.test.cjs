require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { Readable, Writable } = require('node:stream');
const { Test } = require('@nestjs/testing');
const { ConfigModule } = require('@nestjs/config');
const { StorageModule, StorageService, LocalStorageAdapter, AwsS3Adapter, AzureBlobAdapter, GcpStorageAdapter } = require('../dist');

test('Nest module stores, downloads and deletes a file with environment configuration', async t => {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'atmus-storage-'));
  const previous = { provider: process.env.STORAGE_PROVIDER, directory: process.env.LOCAL_STORAGE_DIRECTORY };
  process.env.STORAGE_PROVIDER = 'local'; process.env.LOCAL_STORAGE_DIRECTORY = dir;
  t.after(async () => {
    for (const [key, value] of [['STORAGE_PROVIDER', previous.provider], ['LOCAL_STORAGE_DIRECTORY', previous.directory]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await fs.rm(dir, { recursive: true, force: true });
  });
  const context = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), StorageModule] }).compile();
  try {
    const service = context.get(StorageService);
    await service.uploadFile({ path: 'nested/test.txt', buffer: Buffer.from('hello'), mimetype: 'text/plain' });
    const file = await service.downloadFile('nested/test.txt');
    assert.equal(file.buffer.toString(), 'hello'); assert.equal(file.mimetype, 'text/plain');
    await service.deleteFile('nested/test.txt');
    await assert.rejects(() => service.downloadFile('nested/test.txt'), { code: 'ENOENT' });
  } finally { await context.close(); }
});

test('local adapter blocks traversal, absolute keys and symbolic link descendants', async t => {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'atmus-path-'));
  const outside = await fs.mkdtemp(path.join(tmpdir(), 'atmus-outside-'));
  t.after(async () => { await fs.rm(dir, { recursive: true, force: true }); await fs.rm(outside, { recursive: true, force: true }); });
  const service = new LocalStorageAdapter({ get: () => dir });
  for (const key of ['../secret', '/absolute', 'C:/secret', '..\\secret', '', '.', 'a/../../secret', '\0bad']) {
    await assert.rejects(() => service.uploadFile({ path: key, buffer: Buffer.from('bad'), mimetype: 'text/plain' }));
    await assert.rejects(() => service.downloadFile(key));
    await assert.rejects(() => service.deleteFile(key));
  }
  await fs.symlink(outside, path.join(dir, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(() => service.uploadFile({ path: 'linked/secret', buffer: Buffer.from('bad'), mimetype: 'text/plain' }), /symbolic links/);
  assert.deepEqual(await fs.readdir(outside), []);
});

test('cloud adapter contracts preserve keys, content type and binary data with fake SDK transports', async () => {
  const file = { path: 'nested/a.txt', buffer: Buffer.from('hello'), mimetype: 'text/plain' };
  const config = { get: key => key === 'storage.provider' ? 'local' : undefined };
  const s3 = new AwsS3Adapter(config); s3.bucket = 'bucket';
  const commands = [];
  s3.s3 = { send: async command => { commands.push(command.input); return { Body: Readable.from([file.buffer]), ContentType: file.mimetype }; } };
  await s3.uploadFile(file); assert.equal(commands[0].ContentType, file.mimetype);
  assert.equal((await s3.downloadFile(file.path)).buffer.toString(), 'hello');
  await s3.deleteFile(file.path, 'override'); assert.equal(commands.at(-1).Bucket, 'override');

  let uploadOptions;
  const azure = new AzureBlobAdapter(config); azure.containerName = 'container';
  azure.blobServiceClient = { getContainerClient: () => ({ getBlockBlobClient: () => ({
    url: 'https://example.invalid/a', uploadData: async (_, options) => { uploadOptions = options; },
    download: async () => ({ readableStreamBody: Readable.from([file.buffer]), contentType: file.mimetype }), delete: async () => {},
  }) }) };
  await azure.uploadFile(file); assert.equal(uploadOptions.blobHTTPHeaders.blobContentType, file.mimetype);
  assert.equal((await azure.downloadFile(file.path)).buffer.toString(), 'hello'); await azure.deleteFile(file.path);

  let metadata;
  const gcp = new GcpStorageAdapter(config); gcp.bucket = 'bucket';
  gcp.storage = { bucket: () => ({ file: () => ({
    createWriteStream: options => { metadata = options.metadata; return new Writable({ write: (_, __, cb) => cb() }); },
    download: async () => [file.buffer], getMetadata: async () => [{ contentType: file.mimetype }], delete: async () => {},
  }) }) };
  assert.equal(await gcp.uploadFile(file), 'gs://bucket/nested/a.txt');
  assert.equal(metadata.contentType, file.mimetype);
  assert.equal((await gcp.downloadFile(file.path)).buffer.toString(), 'hello'); await gcp.deleteFile(file.path);
});

test('unknown provider fails at startup', () => {
  assert.throws(() => new StorageService({ get: () => 'unknown' }), /Invalid storage provider/);
});
