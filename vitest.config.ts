import path from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const elementPlusResolver = ElementPlusResolver({ importStyle: false })

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0')
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: false,
      resolvers: [elementPlusResolver]
    }),
    Components({
      dirs: ['src/components'],
      dts: false,
      resolvers: [elementPlusResolver]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@views': path.resolve(dirname, 'src/views'),
      '@imgs': path.resolve(dirname, 'src/assets/images'),
      '@icons': path.resolve(dirname, 'src/assets/icons'),
      '@utils': path.resolve(dirname, 'src/utils'),
      '@stores': path.resolve(dirname, 'src/store'),
      '@styles': path.resolve(dirname, 'src/assets/styles')
    }
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/'
      }
    },
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
})
