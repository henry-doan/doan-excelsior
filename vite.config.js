import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// React Compiler handles memoization automatically, so components are
// written without useMemo, useCallback or React.memo.
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
