const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const pkg = require('../package.json');
// Validate the real archive, then install it in an isolated consumer.
const dir = mkdtempSync(join(tmpdir(), 'atmus-package-'));
const npmCli = process.env.npm_execpath;
assert(npmCli, 'Run this check through npm run test:package');
const run = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8' });
try {
  const [packed] = JSON.parse(run(['pack', '--json', '--pack-destination', dir], join(__dirname, '..')));
  const files = packed.files.map(f => f.path);
  for (const file of ['dist/index.js', 'dist/index.d.ts', 'README.md', 'CHANGELOG.md', 'MIGRATION.md', 'LICENSE']) assert(files.includes(file), file);
  assert(!files.some(f => /(^|\/)(test|node_modules|src)\//.test(f) || f.endsWith('.tgz') || f.includes('.env')));
  run(['init', '-y'], dir);
  run(['install', '--ignore-scripts', '--no-audit', '--no-fund', join(dir, packed.filename), '@types/node@22'], dir);
  execFileSync(process.execPath, ['-e', `require('${pkg.name}')`], { cwd: dir, stdio: 'pipe' });
  execFileSync(process.execPath, ['--input-type=module', '-e', `import * as pkg from '${pkg.name}'; if (!Object.keys(pkg).length) process.exit(1)`], { cwd: dir, stdio: 'pipe' });
  const fixture = readFileSync(join(__dirname, '../test/consumer.cts'), 'utf8');
  for (const ext of ['cts', 'mts']) writeFileSync(join(dir, 'consumer.' + ext), fixture);
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--module', 'NodeNext', '--target', 'ES2022', 'consumer.cts', 'consumer.mts'], { cwd: dir, stdio: 'pipe' });
  assert(existsSync(join(dir, 'node_modules', ...pkg.name.split('/'), 'dist/index.d.ts')));
  console.log(`Verified ${packed.filename}: archive, CJS/ESM imports and TypeScript consumers`);
} finally { rmSync(dir, { recursive: true, force: true }); }
