import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import path from 'path';

// Custom plugin to generate _headers file
function generateHeaders() {
  return {
    name: 'generate-headers',
    buildEnd() {
      const allowedOrigins = process.env.ALLOWED_ORIGINS;
      if (!allowedOrigins) {
        console.log('ALLOWED_ORIGINS not set, skipping dist/_headers generation.');
        return;
      }
      const headers = `/*
  Access-Control-Allow-Origin: ${allowedOrigins}
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Access-Control-Expose-Headers: Content-Length
  Access-Control-Max-Age: 600
`;
      const distDir = path.resolve('dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      fs.writeFileSync(path.join(distDir, '_headers'), headers);
      console.log('Generated dist/_headers with CORS policy:', allowedOrigins);
    }
  };
}

// Static assets will vary depending on the application
const copyConfig = {
  targets: [
    { src: 'node_modules/@webcomponents', dest: 'dist/node_modules' },
    { src: 'src/widget/index.html', dest: 'dist' },
  ],
};

// The main JavaScript bundle for modern browsers that support
// JavaScript modules and other ES2015+ features.
const config = {
  input: 'src/widget/index.ts',
  output: {
    dir: 'dist/',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    copy(copyConfig),
    resolve(),
    typescript({ tsconfig: './tsconfig.widget.json' }),
    generateHeaders(), // <-- Add the plugin here
  ],
  preserveEntrySignatures: false,
};

if (process.env.NODE_ENV !== 'development') {
  config.plugins.push(terser());
}

export default config;