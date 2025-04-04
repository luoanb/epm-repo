import { SrcModuleInfo, windowsPathToLinuxPath, ModuleItem } from "module-ctrl";
import { buildOnePlatForm } from "./bundle";
import { dts } from "./dts";
import path from "path";
import { Exception } from "exception";

function getName(...paths: string[]) {
  return windowsPathToLinuxPath(path.join(...paths), true);
}

const getOutName = (it: ModuleItem, entryInfo: any, type: 'js' | 'ts' = "js") => {
  const libName = it.packageInfo.platform == 'web' ? entryInfo.output.import : entryInfo.output.require
  const dtsName = entryInfo.output.types
  if (!libName) {
    return Exception.throw("1004", { contentMsg: `项目名：${it.packageInfo.name}，源码：${entryInfo.input.src}` })
  }
  if (it.isRoot) {
    return type == "js" ? libName : dtsName
  }
  return getName(SrcModuleInfo.SRC_MODULES, it.name, type == "js" ? libName : dtsName)
}

export const build = async () => {
  const { moduleMap: moduleList } =
    await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const webEntry: any[] = [];
  const nodeEntry: any[] = []
  const dtsEntry: any[] = []
  for (const key of Object.keys(moduleList)) {
    const it = moduleList[key];
    SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
      (entryInfo) => {
        dtsEntry.push({
          in: windowsPathToLinuxPath(path.join(it.src, entryInfo.input.src), true),
          out: getOutName(it, entryInfo, 'ts')
        })
        if (it.packageInfo.platform == 'web') {
          webEntry.push({
            in: windowsPathToLinuxPath(path.join(it.src, entryInfo.input.src), true),
            out: getOutName(it, entryInfo, 'js')
          })

        } else {
          nodeEntry.push({
            in: windowsPathToLinuxPath(path.join(it.src, entryInfo.input.src), true),
            out: getOutName(it, entryInfo, 'js')
          })
        }

      }
    );
  }
  console.log("webEntry", webEntry);
  console.log("nodeEntry", nodeEntry);
  console.log("dtsEntry", dtsEntry);

  await buildOnePlatForm({ entryPoints: webEntry, platform: "browser", format: 'esm', outdir: "./", })
  await buildOnePlatForm({ entryPoints: nodeEntry, platform: "node", format: "cjs", outdir: "./", })
  // await dts({mainEntryPointFilePath:dts})
  await Promise.all(dtsEntry.map(file => dts({
    projectPath: "./",
    mainEntryPointFilePath: file.in, dtsRollup: {
      enabled: true,
      publicTrimmedFilePath: file.out
    }
  })))
}