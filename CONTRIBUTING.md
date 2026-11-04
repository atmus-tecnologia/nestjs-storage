# Contributing

Use Node.js 22.12+ and npm. Fork the repository, create a branch and run:

```sh
npm ci
npm run check
```

`check` type-checks, runs offline regression tests, creates the npm archive and
installs it in a temporary consumer. No API credentials or paid requests are needed.
CI also runs on Node 22/24 and NestJS 11/12. Add a regression test for behavior changes.
Describe changes and migration impact in CHANGELOG.md and MIGRATION.md.
Never commit credentials or real customer data. Open a pull request with validation results.

## Releases (maintainers)

1. Update package.json and package-lock.json with `npm version <major|minor|patch> --no-git-tag-version`.
2. Add a dated CHANGELOG entry and any required migration notes. Run `npm run check`.
3. Commit, create `v<version>`, push the commit and tag, and create a GitHub Release.
4. Publish locally with `npm login` and `npm publish --access public`, or run
   **Publish to npm** with the existing tag after configuring npm Trusted Publishing.

For Trusted Publishing, configure this GitHub organization/repository, workflow
`publish.yml`, environment `npm` in the package's npm settings. The workflow uses
OIDC and provenance; it does not store an npm token. Configure the GitHub `npm`
environment before running it. Creating a GitHub Release alone does not publish to npm.
Verify `npm view <package> version` after publication; never overwrite published versions.
