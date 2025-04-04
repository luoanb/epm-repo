import { RsbuildConfig, RsbuildPlugin } from "@rsbuild/core";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import path from "path";

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: T[P] extends (infer U)[]
        ? DeepRequired<U>[]
        : DeepRequired<T[P]>;
    }
  : T;

export const SPLIT_CONST = "_";
export const PluginModulesOutput = () => {
  return {
    name: "modules-output",
    async setup(api) {
      const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
      const entry: Record<string, any> = {};
      for (const key of Object.keys(moduleMap)) {
        const it = moduleMap[key];
        SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
          (entryInfo) => {
            entry[`${it.name}${SPLIT_CONST}${entryInfo.input.name}`] =
              windowsPathToLinuxPath(
                path.join(it.src, entryInfo.input.src),
                true
              );
          }
        );
      }

      // @ts-expect-error
      api.modifyRsbuildConfig((config: DeepRequired<RsbuildConfig>) => {
        config.output.distPath.root = "./";
        config.output.cleanDistPath = false;
        config.source.entry = { ...config.source.entry, ...entry };
      });
    },
  } as RsbuildPlugin;
};
