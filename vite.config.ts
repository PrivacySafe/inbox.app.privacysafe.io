import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

function _resolve(dir: string) {
  return resolve(__dirname, dir);
}

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(config => {
  const isDev = config.mode === 'development';
  // const isProd = mode === 'production'

  const server = {
    port: '3030',
    cors: { origin: '*' },
  };

  const css = {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  };

  const define = { 'process.env': {} };

  const plugins = [vue(), vueDevTools()];

  let optimizeDeps = {};
  if (isDev) {
    optimizeDeps = {
      include: ['vue', 'vue-router', 'pinia', 'lodash', 'dayjs'],
    };
  }

  const build = {
    // reference: https://rollupjs.org/configuration-options/
    rollupOptions: {
      input: {
        main: _resolve('./index.html'),
        'main-mobile': _resolve('./index-mobile.html'),
      },
      output: [
        {
          name: 'main',
          dir: 'app',
        },
        {
          name: 'main-mobile',
          dir: 'app',
        },
      ],
    },
  };

  return {
    server,
    css,
    build,
    define,
    plugins,
    optimizeDeps,
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
        '@': _resolve('./src'),
        '@common': _resolve('./src/common'),
        '@desktop': _resolve('./src/desktop'),
        '@mobile': _resolve('./src/mobile'),
      },
    },
  };
});
