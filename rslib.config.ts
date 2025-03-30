import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { defineConfig } from "@rslib/core";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import path from "path";
import { PluginModulesOutput } from "./src/PluginModulesOutput";
import { RegRspackPlugins } from "./src/RegRspackPlugins";
import { PluginRspackModulesOutput } from "./src/PluginRspackModulesOutput";
import { PluginResolveSrc } from "./src/PluginResolveSrc";

export default defineConfig(async () => {
  const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const swapDtsDistpath = "./node_modules/._dist_dts";
  return {
    source: {
      tsconfigPath: "./tsconfig.json",
      entry: {
        "epm-repo_cuurent": "./src/index.ts",
      },
    },
    plugins: [
      pluginNodePolyfill(),
      PluginModulesOutput(),
      PluginResolveSrc(),
      RegRspackPlugins(
        new PluginRspackModulesOutput(moduleMap, swapDtsDistpath)
      ),
    ],
    output: {
      target: "node",
    },
    mode: "production",
    lib: [
      {
        format: "cjs",
        syntax: "es2015",
        dts: {
          bundle: true,
          distPath: swapDtsDistpath,
        },
      },
    ],
  };
});
