import { defineConfig } from "@rslib/core";
import { SrcModuleInfo } from "module-ctrl";

export default defineConfig(async () => {
  const modulesInfo = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const configInfoMap = Object.keys(modulesInfo.moduleMap).map((key) => {
    const packageInfo = modulesInfo.moduleMap[key].packageInfo;
    return {
      packageInfo,
      config: SrcModuleInfo.getBuildConfigByPkgInfo(packageInfo),
    };
  });

  return {
    source: {
      // entry,
    },
    lib: [
      {
        format: "esm",
        syntax: "es2021",
        dts: {
          bundle: true,
        },
      },
    ],
  };
});
