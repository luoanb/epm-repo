// import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import { PluginModulesOutput } from "./plugin/PluginModulesOutput";
import { RegRspackPlugins } from "./plugin/RegRspackPlugins";
import { PluginRspackModulesOutput } from "./rspackPlugin/PluginRspackModulesOutput";
import path from "path";
import { PluginResolveSrc } from "./plugin/PluginResolveSrc";

/** 用于多模块拆分 */
export const SPLIT_CONST = "_";
/** 指定用于缓存d.ts的文件夹 */
export const swapDtsDistpath = "./node_modules/._dist_dts";

export const rsConfigBaseConstructor = async () => {
  const { moduleMap: moduleList } =
    await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const entry: Record<string, any> = {};
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
    resolve: {
      dedupe: ['@rsbuild/core', '@rslib/core', "@rspack/core"],
    },
    tools: {
      rspack: {
        ignoreWarnings: [() => true],
      },
    },
    plugins: [
      // pluginNodePolyfill(),
      PluginModulesOutput(),
      PluginResolveSrc(),
      RegRspackPlugins(
        new PluginRspackModulesOutput(moduleList, swapDtsDistpath)
      ),
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
};