import { defineConfig } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
export default defineConfig({
  plugins: [pluginNodePolyfill()],
  source: {
    entry: {
      index: "./src/index.ts"
    }
  },
  output: {
    target: "node"
  }
});
