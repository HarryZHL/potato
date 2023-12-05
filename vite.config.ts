import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import dts from 'vite-plugin-dts'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts(),
    ElementPlus({}),
    AutoImport({
      dts: 'types/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],

  resolve: {
    // 设置别名
    alias: {
      '~': path.resolve(__dirname, 'src/styles')
    }
  },

  css: {
    preprocessorOptions: {
      // 引入公用的样式
      scss: {
        additionalData: '@use "~/variable.scss" as *;'
      }
    }
  },

  build: {
    target: 'es2015',
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'potato',
      fileName: (format) => `potato.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue'
        }
      }
    }
  },

  optimizeDeps: {
    // 检测需要预构建的依赖项
    entries: []
  },

  define: {
    __VUE_PROD_DEVTOOLS__: true
  }
})
