import { defineConfig, mergeRsbuildConfig } from "@rsbuild/core";
import { rsConfigBaseConstructor } from "./src/rsConfigBaseConstructor"
// import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
// import NodePolyfillPlugin from "node-polyfill-webpack-plugin"
// @ts-ignore
export default defineConfig(async () => {
  const base = await rsConfigBaseConstructor()
  return {
    ...base,
    // tools: {
    //   ...base.tools,
    //   rspack: {
    //     ...base.tools.rspack,
    //     plugins: [
    //       // ...base.tools.rspack?.plugins || []
    //       // new NodePolyfillPlugin()
    //     ]
    //   }
    // },
    // plugins: [...base.plugins, pluginNodePolyfill()]
  }
})