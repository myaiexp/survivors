import * as esbuild from 'esbuild';
import fs from 'fs';

const isWatch = process.argv.includes('--watch');

// Copy index.html to dist
fs.mkdirSync('dist', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/game.js',
  sourcemap: true,
  target: 'es2020',
  format: 'iife',
  minify: !isWatch,
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  await ctx.serve({ servedir: 'dist', port: 8080 });
  console.log('Dev server running at http://localhost:8080');
} else {
  await esbuild.build(config);
  console.log('Build complete → dist/game.js');
}
