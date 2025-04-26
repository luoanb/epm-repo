import {
  ModuleExport,
  SrcModuleInfo,
  formatLinuxPath,
  getRootDirname,
} from "module-ctrl";
import { wirteJsonFile } from "./utils/JsonFile";
import { promises as fs, existsSync } from "fs";
import path from "path";
import { Exception } from "exception";

const switchByProjectPath = async (
  projectPath: string,
  packageJson: any = null
) => {
  if (!packageJson) {
    packageJson = await SrcModuleInfo.readPackageInfo(projectPath);
  }
  if (!packageJson) {
    Exception.throw("1001", { contentMsg: projectPath });
  }

  const dist = SrcModuleInfo.isNeedBuild(packageJson);
  // 源码模式-> 构建模式 (不能修改源码位置)
  if (!dist) {
    // const mainSrc = SrcModuleInfo.getMainSrc(packageJson);
    packageJson.srcModule = packageJson.srcModule || {};
    // 指定打包入口
    packageJson.srcModule.dist = SrcModuleInfo.getExportsPath(packageJson);
    // 更新导出路径
    packageJson.exports = SrcModuleInfo.getDistExports(packageJson);
    // TODO:　目前只支持 lib 模式
    packageJson.srcModule.buildType = "lib";
  } else {
    // 构建模式-> 源码模式 (不能修改源码位置)　App必须打包
    if (SrcModuleInfo.isMustBuild(packageJson)) {
      return packageJson;
    }
    packageJson.exports = packageJson.srcModule.dist;
    packageJson.srcModule.buildType = false;
  }
  return packageJson;
};

export async function switchModuleDistStatus(
  packageName: string
): Promise<void> {
  const rootDir = getRootDirname();
  const { moduleMap } = await SrcModuleInfo.getCurrentSrcModulesInfo(rootDir);
  const packageInfo = moduleMap[packageName];
  if (!packageInfo) {
    Exception.throw("1001", { contentMsg: packageName });
  }

  const packageJson = await switchByProjectPath(
    packageInfo.src,
    packageInfo.packageInfo
  );

  // 保存更新后的 package.json
  await wirteJsonFile(
    path.join(rootDir, packageInfo.src, "package.json"),
    packageJson,
    2
  );
  console.log(`操作成功)`);
}
