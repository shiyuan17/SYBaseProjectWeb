import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0')
  },
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: 'src/types/import/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      dirs: ['src/components'],
      dts: 'src/types/import/components.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    ElementPlus({
      useSource: true
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
  server: {
    port: 5173
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@styles/core/el-light.scss" as *;
          @use "@styles/core/mixin.scss" as *;
        `
      }
    }
  }
})
