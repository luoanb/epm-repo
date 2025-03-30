import path from "path";
import { readJsonFile, wirteJsonFile } from "./utils/JsonFile";
import { SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";

/**
 * 用于设置tsconfg别名:tsconfig.srcmodule.json
 */
export const setTsconfigSrcmodule = async (projectPath: string) => {
  const filePath = path.join(projectPath, "./tsconfig.srcmodule.json");
  let tsconfig = await readJsonFile(filePath);
  const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo("./");
  const paths: Record<string, any> = {};
  for (const key of Object.keys(moduleMap)) {
    const it = moduleMap[key];
    SrcModuleInfo.getBuildConfigByPkgInfo(it.packageInfo).forEach(
      (entryInfo) => {
        paths[
          `${windowsPathToLinuxPath(path.join(it.name, entryInfo.input.key))}`
        ] = [
          windowsPathToLinuxPath(path.join(it.src, entryInfo.input.src), true),
        ];
      }
    );
  }
  if (!tsconfig) {
    tsconfig = { compilerOptions: { paths } };
  } else if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = { paths };
  } else {
    tsconfig.paths = paths;
  }
  return await wirteJsonFile(filePath, tsconfig, 2);
};
