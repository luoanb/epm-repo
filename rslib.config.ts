import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { defineConfig } from "@rslib/core";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import path from "path";
import { PluginModulesOutput } from "./src/PluginModulesOutput";
import { RegRspackPlugins } from "./src/RegRspackPlugins";
import { PluginRspackModulesOutput } from "./src/PluginRspackModulesOutput";

export default defineConfig(async () => {
  const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const swapDtsDistpath = "./dist";
  return {
    source: {
      tsconfigPath: "./tsconfig.json",
      entry: {
        "epm-repo_cuurent": "./src/index.ts",
      },
    },
    plugins: [
      // pluginNodePolyfill(),
      PluginModulesOutput(),
      RegRspackPlugins(
        new PluginRspackModulesOutput(moduleMap, swapDtsDistpath)
      ),
    ],
    lib: [
      {
        format: "esm",
        syntax: "es2021",
        dts: {
          bundle: true,
          distPath: swapDtsDistpath,
        },
      },
    ],
  };
});
