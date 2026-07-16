import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'webhooks/index': 'src/webhooks/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    target: 'node18',
    outDir: 'dist',
    external: [],
    noExternal: [],
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.js' : '.cjs',
      };
    },
    esbuildOptions(options) {
      options.conditions = ['import', 'module', 'require', 'default'];
    },
  },
]);
