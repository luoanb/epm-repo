import { readdir } from "fs/promises";
import fs, { statSync } from "fs";
import path from "path";
import fse from "fs-extra/esm";
import { Exception } from "exception";
import { moduleCtrl } from "./ModuleCtrl";

/**
 * 将项目内的所有src_module从node_modules复制到src_modules
 * @param projectPath
 * @returns
 */
export const cpModulesToSrc = async (projectPath: string) => {
  const sourcePath = path.join(projectPath, "node_modules");
  const files = await readdir(sourcePath);
  // todo 还有@rsbuild/code 类似的包无法被正常识别复制
  const cpExecs = files.map(async (p) => {
    const packPath = path.join(sourcePath, p);
    if (await moduleCtrl.isSrcModule(packPath)) {
      const targetPath = path.join(
        projectPath,
        moduleCtrl.SRC_MODULES,
        getLastFolderName(packPath)
      );
      // 已存在的跳过
      if (fs.existsSync(targetPath)) {
        return Promise.resolve();
      }
      return await cpModule(sourcePath, targetPath);
      // return await cpy(`${packPath}/**`, targetPath)
    } else {
      return Promise.resolve();
    }
  });
  return Promise.all(cpExecs);
};

function getLastFolderName(filePath: string): string {
  const sta = statSync(filePath);
  if (sta.isDirectory()) {
    return path.basename(filePath);
  } else {
    return path.basename(path.dirname(filePath));
  }
}

/**
 * 将项目的指定模块复制到src_modules
 * @param projectPath 项目地址
 * @param moduleName 模块名称
 */
export const cpSpecificSrcmodule = async (
  projectPath: string,
  moduleName: string
) => {
  const sourcePath = path.join(projectPath, "node_modules", moduleName);
  try {
    if (await moduleCtrl.isSrcModule(sourcePath)) {
      const targetPath = path.join(
        projectPath,
        moduleCtrl.SRC_MODULES,
        getLastFolderName(sourcePath)
      );
      // 已存在的跳过
      if (fs.existsSync(sourcePath)) {
        // return Promise.resolve()
        Exception.throw("1002", { contentMsg: moduleName });
      }
      return await cpModule(sourcePath, targetPath);
    }
  } catch (error) {
    console.log("error", error);

    Exception.throw("1001", { contentMsg: moduleName, error });
  }
};

export const cpModule = async (sourcePath: string, targetPath: string) => {
  await fse.copy(sourcePath, targetPath, {
    filter: (src) => {
      const rsrc = path.relative(sourcePath, src);
      return !(
        rsrc.startsWith("node_modules\\") || rsrc.startsWith("node_modules/")
      );
    },
    dereference: true,
  });
};
