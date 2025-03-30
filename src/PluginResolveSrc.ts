import { RsbuildPlugin, RsbuildConfig } from "@rsbuild/core";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import path from "path";

import { DeepRequired } from "./PluginModulesOutput";
/**
 * 使用别名让打包时可以统一指向源码而不是package.json里配置的路径
 * @returns
 */
export const PluginResolveSrc = () => {
  return {
    name: "PluginResolveSrc",
    async setup(api) {
      const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
      const alias: Record<string, any> = {};
      for (const key of Object.keys(moduleMap)) {
        const it = moduleMap[key];
        SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
          (entryInfo) => {
            alias[
              `${windowsPathToLinuxPath(
                path.join(it.name, entryInfo.input.key)
              )}$`
            ] = windowsPathToLinuxPath(
              path.join(it.src, entryInfo.input.src),
              true
            );
          }
        );
      }
      // @ts-expect-error
      api.modifyRsbuildConfig((config: DeepRequired<RsbuildConfig>) => {
        config.resolve.alias = alias;
      });
    },
  } as RsbuildPlugin;
};
