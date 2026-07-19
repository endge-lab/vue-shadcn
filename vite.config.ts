import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'shadcn-vue',
      formats: ['es'],
      fileName: () => 'shadcn-vue.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        '@endge/core',
        '@endge/utils',
        '@endge/ui-vue',
        '@lucide/vue',
        '@tanstack/vue-table',
        'sortablejs',
        'vue',
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css'))
            return 'shadcn-vue.css'

          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      rollupTypes: false,
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      include: ['src'],
      exclude: ['vite.config.ts', 'vitest.config.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
