import { defineConfig } from "@rsbuild/core";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { SrcModuleInfo } from "module-ctrl";

export default defineConfig(async function () {
  const { moduleList } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const modulesInfo = await Promise.all(
    Object.keys(moduleList).map(async (moduleName) => {
      // return
      const mdInfo = await SrcModuleInfo.readPackageInfo(
        moduleList[moduleName].fileUrl
      );
      return mdInfo;
    })
  );
  const entry = {};
  modulesInfo
    .filter((i) => {
      return !!i && i.srcModule?.build;
    })
    .forEach((info) => {
      // entry;
      console.log("info", info);
    });

  return {
    tools: {
      rspack: {
        ignoreWarnings: [() => true],
      },
    },
    plugins: [
      pluginNodePolyfill(),
      // {
      //   name: "modules-output",
      //   setup(api) {
      //     api.modifyBundlerChain((chain) => {
      //       // 遍历所有入口
      //       // chain.entryPoints.forEach((entry, name) => {
      //       //   // // 根据入口名称动态修改输出路径
      //       //   // entry.values.forEach((value) => {
      //       //   //   if (name === "app1") {
      //       //   //     chain.output.path("dist/custom-folder-for-app1");
      //       //   //   } else if (name === "app2") {
      //       //   //     chain.output.path("dist/custom-folder-for-app2");
      //       //   //   }
      //       //   // });
      //       //   console.log(entry.values);
      //       // });
      //     });
      //   },
      // },
    ],
    // environments
    source: {
      entry: {
        index: "./src/index.ts",
      },
    },
    mode: "production",
    output: {
      target: "node",
    },
  };
});
