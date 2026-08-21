import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({
  // Relative assets work for any GitHub Pages repository name and for Firebase Hosting.
  base: mode==='production'?'./':'/',
  plugins:[react()],
  test:{environment:'jsdom'},
  build:{chunkSizeWarningLimit:750}
}));
