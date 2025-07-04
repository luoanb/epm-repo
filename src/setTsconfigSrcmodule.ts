import path from "path";
import { readJsonFile, wirteJsonFile } from "./utils/JsonFile";
import { formatLinuxPath, moduleCtrl } from "module-ctrl";

export async function getSrcmoduleTsconfigPaths(
  type: "src" | "dts" = "src"
): Promise<Record<string, any>> {
  const { moduleMap } = await moduleCtrl.srcModulesInfo;
  const paths: Record<string, any> = {};
  if (moduleMap) {
    for (const key of Object.keys(moduleMap || {})) {
      const it = moduleMap[key];
      moduleCtrl
        .getBuildConfigByPkgInfo(it.packageInfo)
        .forEach((entryInfo) => {
          const out =
            type == "src" ? entryInfo.input.src : entryInfo.output.types;
          const basename = type == "dts" ? path.basename(out) : "";
          paths[`${formatLinuxPath(path.join(it.name, entryInfo.input.key))}`] =
            [formatLinuxPath(path.join(it.url.url, out, basename), true)];
        });
    }
  }
  return paths;
}

/**
 * 用于设置tsconfg别名:tsconfig.srcmodule.json
 */
export async function setTsconfigSrcmodule(projectPath: string): Promise<void> {
  const filePath = path.join(projectPath, "./tsconfig.srcmodule.json");
  let tsconfig = await readJsonFile(filePath);
  const paths: Record<string, any> = await getSrcmoduleTsconfigPaths();
  if (!tsconfig) {
    tsconfig = { compilerOptions: { paths } };
  } else if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = { paths };
  } else {
    tsconfig.compilerOptions.paths = paths;
  }
  return await wirteJsonFile(filePath, tsconfig, 2);
}
