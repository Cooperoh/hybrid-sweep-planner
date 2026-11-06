import path from 'node:path';

const sharedModules = path.resolve(process.env.SHARED_NODE_MODULES || 'D:/Node/node_modules');
const slash = value => value.replaceAll('\\', '/');

export default {
  cacheDir: path.join(sharedModules, '..', 'cache', 'hybrid-sweep-planner', 'vite'),
  resolve: { alias: [
    { find: /^three$/, replacement: slash(path.join(sharedModules, 'three/build/three.module.js')) },
    { find: /^three\/addons\//, replacement: slash(path.join(sharedModules, 'three/examples/jsm')) + '/' },
  ] },
  server: { proxy: { '/api': 'http://127.0.0.1:8765' } },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 800 },
};
