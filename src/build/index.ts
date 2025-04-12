import { SrcModuleInfo, windowsPathToLinuxPath, ModuleItem } from "module-ctrl";
import { buildOnePlatForm } from "./bundle";
import { dts } from "./dts";
import path from "path";
import { Exception } from "exception";
import { loadConfig } from "../utils/loadConfig";
import { WebAppHtmlPlugin } from "../build/bundle/WebAppHtmlPlugin";

export interface BuildOptions {
  watch: boolean;
  serve: boolean;
  projectNames?: string[];
  all?: boolean;
  dts?: boolean;
}

function getName(...paths: string[]) {
  return windowsPathToLinuxPath(path.join(...paths), true);
}

const getOutName = (
  it: ModuleItem,
  entryInfo: any,
  type: "js" | "ts" = "js"
) => {
  const libName =
    it.packageInfo.platform == "web"
      ? entryInfo.output.import
      : entryInfo.output.require;
  const dtsName = entryInfo.output.types;
  if (!libName) {
    return Exception.throw("1004", {
      contentMsg: `项目名：${it.packageInfo.name}，请检查源码 ${entryInfo.input.src} 所对应的导出配置`,
    });
  }
  if (it.isRoot) {
    return type == "js" ? libName : dtsName;
  }
  return getName(
    SrcModuleInfo.SRC_MODULES,
    it.name,
    type == "js" ? libName : dtsName
  );
};

export const build = async (option: BuildOptions) => {
  const { moduleMap: moduleList } =
    await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const webEntry: any[] = [];
  const nodeEntry: any[] = [];
  const dtsEntry: any[] = [];
  const htmlEntry: any[] = [];

  function fillEntryByModuleItem(it: ModuleItem) {
    SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
      (entryInfo) => {
        // 非lib不打包dts
        if (it.packageInfo.srcModule?.buildType != "web-app") {
          dtsEntry.push({
            in: windowsPathToLinuxPath(
              path.join(it.src, entryInfo.input.src),
              true
            ),
            out: getOutName(it, entryInfo, "ts"),
          });
        }
        if (it.packageInfo.platform == "web") {
          if (it.packageInfo.srcModule?.buildType == "web-app") {
            htmlEntry.push({
              esEntry: {
                in: windowsPathToLinuxPath(
                  path.join(it.src, entryInfo.input.src),
                  true
                ),
                out: getOutName(it, entryInfo, "js"),
              },
              inputHtmlPath: path.join(
                it.src,
                SrcModuleInfo.getOutputDir(it.packageInfo),
                "index.html"
              ),
              outHtmlPath: path.join(it.src, "index.html"),
            });
          } else {
            webEntry.push({
              in: windowsPathToLinuxPath(
                path.join(it.src, entryInfo.input.src),
                true
              ),
              out: getOutName(it, entryInfo, "js"),
            });
          }
        } else {
          nodeEntry.push({
            in: windowsPathToLinuxPath(
              path.join(it.src, entryInfo.input.src),
              true
            ),
            out: getOutName(it, entryInfo, "js"),
          });
        }
      }
    );
  }

  for (const key of Object.keys(moduleList)) {
    const it = moduleList[key];
    // 手动指定具体打包项目
    if (option.projectNames?.length) {
      // 仅处理指定项目
      if (option.projectNames.includes(it.name)) {
        fillEntryByModuleItem(it);
      }
    }
    // 或者特定模式(不但要监听模式，且关闭全量打包)
    else if (option.watch && !option.all) {
      // 仅处理根目录
      if (it.isRoot) {
        fillEntryByModuleItem(it);
      }
    }
    // 全量模式
    else {
      fillEntryByModuleItem(it);
    }
  }

  const config = await loadConfig();

  Promise.all([
    buildOnePlatForm({
      ...config?.esbuild,
      entryPoints: webEntry,
      platform: "browser",
      format: "esm",
      outdir: "./",
      watch: option.watch,
      serve: option.serve,
    }),
    buildOnePlatForm({
      ...config?.esbuild,
      entryPoints: nodeEntry,
      platform: "node",
      format: "cjs",
      outdir: "./",
      watch: option.watch,
      serve: option.serve,
    }),
    ...htmlEntry?.map((entry) =>
      buildOnePlatForm({
        ...config?.esbuild,
        entryPoints: [entry],
        platform: "node",
        format: "cjs",
        outdir: "./",
        watch: option.watch,
        serve: option.serve,

        plugins: [
          WebAppHtmlPlugin({
            entryPoint: entry.in,
            inputHtmlPath: entry.inputHtmlPath,
            outHtmlPath: entry.outHtmlPath,
          }),
          ...(config?.esbuild?.plugins || []),
        ],
      })
    ),
  ]);

  // 仅显示设置需要dts才生成dts(dts太耗时了)
  if (option.dts) {
    console.log("d.ts声明生成中");
    // await dts({mainEntryPointFilePath:dts})
    await Promise.all(
      dtsEntry.map((file) =>
        dts({
          projectPath: "./",
          mainEntryPointFilePath: file.in,
          dtsRollup: {
            enabled: true,
            untrimmedFilePath: file.out,
          },
        })
      )
    );
  }
};
