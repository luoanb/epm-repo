import { defineConfig } from "@rsbuild/core";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import { PluginModulesOutput } from "./src/PluginModulesOutput";
import { RegRspackPlugins } from "./src/RegRspackPlugins";
import { PluginRspackModulesOutput } from "./src/PluginRspackModulesOutput";
import path from "path";

const SPLIT_CONST = "_";
export default defineConfig(async function () {
  const { moduleMap: moduleList } =
    await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const entry = {};
  for (const key of Object.keys(moduleList)) {
    const it = moduleList[key];
    SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
      (entryInfo) => {
        entry[`${it.name}${SPLIT_CONST}${entryInfo.input.name}`] =
          windowsPathToLinuxPath(path.join(it.src, entryInfo.input.src), true);
      }
    );
  }

  return {
    tools: {
      rspack: {
        ignoreWarnings: [() => true],
      },
    },
    plugins: [
      pluginNodePolyfill(),
      PluginModulesOutput(),
      RegRspackPlugins(new PluginRspackModulesOutput(moduleList, "./dist")),
    ],
    // environments
    source: {
      entry,
    },
    mode: "production",
    output: {
      target: "node",
    },
  };
});
