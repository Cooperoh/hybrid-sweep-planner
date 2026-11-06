import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const webRoot = fileURLToPath(new URL('../web/', import.meta.url));
const sharedModules = path.resolve(process.env.SHARED_NODE_MODULES || 'D:/Node/node_modules');
const manifest = JSON.parse(readFileSync(path.join(webRoot, 'package.json'), 'utf8'));

// Fail before building or testing if the shared versions differ from the project pins.
for (const name of ['vite', 'three']) {
  const expected = manifest.dependencies?.[name] ?? manifest.devDependencies?.[name];
  const packageFile = path.join(sharedModules, name, 'package.json');
  const actual = JSON.parse(readFileSync(packageFile, 'utf8')).version;
  if (actual !== expected) {
    throw new Error(`${name}: project requires ${expected}, shared version is ${actual}. Check ${packageFile}.`);
  }
}

const isCommand = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCommand) {
  const viteEntry = path.join(sharedModules, 'vite/bin/vite.js');
  const commands = {
    build: [viteEntry, 'build', '--configLoader', 'native'],
    dev: [viteEntry, '--configLoader', 'native', '--host', '127.0.0.1'],
    test: ['--import', import.meta.url, '--test', path.join(webRoot, 'test-playback.mjs')],
  };
  const args = commands[process.argv[2]];
  if (!args) throw new Error('Usage: node scripts/shared-node.mjs <build|dev|test> [options]');
  const result = spawnSync(process.execPath, [...args, ...process.argv.slice(3)], {
    cwd: webRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  // Preload for node --test: use Three's own ESM exports, including three/addons/*.
  const threePackage = pathToFileURL(path.join(sharedModules, 'three/package.json')).href;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'three' || specifier.startsWith('three/')) {
        return nextResolve(specifier, { ...context, parentURL: threePackage });
      }
      return nextResolve(specifier, context);
    },
  });
}
