# Migrating from 1.0.2 to 2.0.0

This is a breaking release. Upgrade Node.js to 22.12+ and NestJS to 11 or 12 before installing it. Keep @nestjs/common and @nestjs/core on the same major. CommonJS consumers can load the package on supported Node releases; ESM consumers can use named imports. TypeScript consumers should use a modern NodeNext or Node20 module configuration compatible with require(esm) when consuming NestJS 12.

Use NestJS 11/12 and @nestjs/config 4 or 12. SDKs are now AWS S3 3, Azure Blob 12 and Google Cloud Storage 8. Review provider upgrade notes if your application also imports their types directly.

StorageModule and StorageService retain their names. The optional bucket/container argument is now reflected in IStorage. `storageConfig` is a named export from the package root.

Local keys must be relative paths using forward slashes, such as `invoices/123.pdf`. Absolute paths, traversal outside the configured directory, empty keys and existing symbolic link/junction descendants are rejected for upload/download/delete. Pass the same key to all operations; do not pass the absolute upload result back to downloadFile. Original local filesystem errors now propagate (for example ENOENT).

Keep the configured directory under application ownership: path checks are not a security boundary against another local process replacing directories concurrently. Cloud object ACLs and authentication are still managed by your application/provider. MIME metadata now reflects IFile.mimetype on all cloud uploads. Static AWS credentials are optional when a default credential chain (for example an IAM role) is available.

Run your application's integration tests before rollout. This repository's tests use offline transports; they do not establish live-provider or production behavior.
