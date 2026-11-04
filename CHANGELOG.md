# Changelog

Notable changes are recorded here. Versions follow Semantic Versioning.

## [2.0.0](https://github.com/atmus-tecnologia/nestjs-storage/releases/tag/v2.0.0) - 2026-11-04

### Breaking changes

- Require Node.js 22.12+ and NestJS 11 or 12; NestJS 10 is no longer supported.
- Updated upstream SDK majors may change types, defaults and resource behavior. See [MIGRATION.md](MIGRATION.md).

### Changes

- Upgrade AWS, Azure, Google Cloud Storage and MIME dependencies; support NestJS 11/12.
- Block local path traversal, absolute keys and existing symbolic link descendants.
- Remove eager local directory creation when using a cloud provider.
- Preserve content type on cloud uploads and register GCP stream listeners before writing.
- Allow AWS default credential providers when explicit static credentials are absent.
- Export storageConfig by name and make bucket arguments optional in IStorage.
- Propagate original local filesystem errors, including ENOENT.
- Replace copied documentation with package-specific installation, configuration, API and migration examples.
- Add offline regression tests, clean TypeScript builds, package-consumer validation, CI and an opt-in OIDC npm publishing workflow.
- Remove obsolete lint/release tooling, duplicate runtime peers and the shell-only deploy script.
- Publish only compiled JavaScript, declarations, source maps, documentation and license.

## 1.0.2

Previous published release. Detailed changes were not recorded.

## 1.0.0 (2024-06-29)
