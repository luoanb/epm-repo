import { RsbuildConfig, RsbuildPlugin } from "@rsbuild/core";
import { Filename } from "@rspack/core";
import { ModuleMap, SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import path from "path";

type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: T[P] extends (infer U)[]
        ? DeepRequired<U>[]
        : DeepRequired<T[P]>;
    }
  : T;

export const SPLIT_CONST = "_";
const isProd = process.env.NODE_ENV === "production";
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
        // 开发模式构建
        const devDefaultFilename = {
          html: ".html",
          js: ".js",
          css: ".css",
          svg: ".[contenthash:8].svg",
          font: ".[contenthash:8][ext]",
          image: ".[contenthash:8][ext]",
          media: ".[contenthash:8][ext]",
          assets: ".[contenthash:8][ext]",
        };

        // 生产模式构建
        const prodDefaultFilename = {
          html: ".html",
          // @ts-ignore
          js: config.output.target === "node" ? ".js" : ".[contenthash:8].js",
          css: ".[contenthash:8].css",
          svg: ".[contenthash:8].svg",
          font: ".[contenthash:8][ext]",
          image: ".[contenthash:8][ext]",
          media: ".[contenthash:8][ext]",
          assets: ".[contenthash:8][ext]",
        };
        console.log("hahahah");

        const getFileName = (
          pathData: any,
          type: keyof typeof prodDefaultFilename
        ) => {
          const getName = (
            type: keyof typeof prodDefaultFilename,
            projectName: string,
            name: string
          ) => {
            return isProd
              ? `${projectName}/${name}.${prodDefaultFilename[type]}`
              : `${projectName}/${name}.${devDefaultFilename[type]}`;
          };

          const [projectName, ...other] =
            pathData.chunk.name.split(SPLIT_CONST);
          const fileId = other.join(SPLIT_CONST);
          // console.log(pathData);
          // console.log("-------------");

          // console.log(projectName, moduleMap, "------------");

          const files = SrcModuleInfo.getBuildConfigByPkgInfo(
            moduleMap[projectName].packageInfo
          );

          console.log("fileId", fileId);
          console.log("files", files);
          console.log("-------------");

          return getName(
            type,
            `${SrcModuleInfo.SRC_MODULES}/${projectName}`,
            // todo 怎么区分不同的导出路径
            // 怎么导出不同格式包
            files.find((i) => i.input.name == fileId)?.output.import
          );
        };
        const filename: Record<string, Filename> = {
          js: (pathData) => getFileName(pathData, "js"),
          css: (pathData) => getFileName(pathData, "css"),
          svg: (pathData) => getFileName(pathData, "svg"),
          font: (pathData) => getFileName(pathData, "font"),
          image: (pathData) => getFileName(pathData, "image"),
          media: (pathData) => getFileName(pathData, "media"),
          assets: (pathData) => getFileName(pathData, "assets"),
        };

        config.source.entry = { ...config.source.entry, ...entry };
        // 插件于rslib不能兼容
        // @ts-ignore
        config.output.filename = filename;
        config.output.distPath.root = "./dist";
        config.output.cleanDistPath = "auto";
      });
      // api.onAfterBuild(({ isFirstCompile, stats, environments }) => {
      //   console.log("-----onAfterBuild");
      //   console.log(Object.keys(stats?.toJson(null) || {}), isFirstCompile);
      //   console.log("--end---onAfterBuild");
      // });
    },
  } as RsbuildPlugin;
};
