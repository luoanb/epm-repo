import { SrcModuleInfo, windowsPathToLinuxPath, ModuleItem } from "module-ctrl";
import { buildOnePlatForm } from "./bundle";
import { dts } from "./dts";
import path from "path";
import { Exception } from "exception";

export interface BuildOptions {
  watch: boolean;
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
      contentMsg: `项目名：${it.packageInfo.name}，源码：${entryInfo.input.src}`,
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

  function fillEntryByModuleItem(it: ModuleItem) {
    SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
      (entryInfo) => {
        dtsEntry.push({
          in: windowsPathToLinuxPath(
            path.join(it.src, entryInfo.input.src),
            true
          ),
          out: getOutName(it, entryInfo, "ts"),
        });
        if (it.packageInfo.platform == "web") {
          webEntry.push({
            in: windowsPathToLinuxPath(
              path.join(it.src, entryInfo.input.src),
              true
            ),
            out: getOutName(it, entryInfo, "js"),
          });
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
  await buildOnePlatForm({
    entryPoints: webEntry,
    platform: "browser",
    format: "esm",
    outdir: "./",
    watch: option.watch,
  });
  await buildOnePlatForm({
    entryPoints: nodeEntry,
    platform: "node",
    format: "cjs",
    outdir: "./",
    watch: option.watch,
  });

  // 仅build模式生成d.th
  if (!option.watch || option.dts) {
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
