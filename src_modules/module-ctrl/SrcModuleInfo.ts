import { readdir, stat, readFile } from "fs/promises";
import path from "path";
import {
  depKeys,
  windowsPathToLinuxPath,
} from "./updatePackageInfoForSrcModule";
import { Cache_Createor } from "./Cache_Createor";

import fs, { statSync } from "fs";
type PackageInfo = Record<string, any>;

type ModuleItem = {
  name: string;
  src: string;
  version: string;
};

type ModuleDeps = Record<string, Array<string>>;
type ModuleMap = Record<string, ModuleItem>;

// // SrcModule规范
// const pinfo = {
//   srcModule: {
//     repo: {
//       origin: {
//         remote: "xxx",
//         modulePath: "./",
//         vcs: "git",
//         versions: {
//           "1.0.0": "67f66bc7069d7",
//         },
//       },
//     },
//     curentRepo: "origin",
//     versions: ["1.0.0"],
//   },
// };

/**
 * SrcModule信息查询
 */
export class SrcModuleInfo {
  static getCurrentSrcModulesInfo = async (projectPath: string) => {
    // 缓存仅当前会话有效
    packageInfoCache.clean();
    const srcModulesDir = "src_modules";
    const formatPathUtil = this.formatPath_Creator(projectPath);
    const moduleList = await getSrcModuleList(
      path.join(projectPath, srcModulesDir),
      formatPathUtil.toWrite
    );
    const dependencies = await getDependenciesStatus(
      path.join(projectPath, srcModulesDir),
      moduleList
    );
    const projectPackInfo = await packageInfoCache.getValue(projectPath);
    if (projectPackInfo) {
      getDependencieByPackageInfo(dependencies, projectPackInfo, moduleList);
    }
    return { moduleList, dependencies };
  };
  /**
   * 【工厂函数】创建一个函数：获取到指定路径的相对路径
   * @param projectPath
   * @returns
   */
  static formatPath_Creator = (projectPath: string) => {
    return {
      toWrite: (src: string) =>
        windowsPathToLinuxPath(path.relative(projectPath, src), true),
      toSystem: (relativeSrc: string) => path.join(projectPath, relativeSrc),
    };
  };
  static isNodeModule = async (filePath: string) => {
    return (
      (await stat(filePath)).isDirectory() &&
      fs.existsSync(path.join(filePath, "package.json"))
    );
  };

  static isSrcModule = async (filePath: string) => {
    const isNM = await this.isNodeModule(filePath);
    if (!isNM) {
      return false;
    }
    const data = await this.readPackageInfo(filePath);
    if (typeof data === "boolean") {
      return data;
    }
    return !!data.srcModule;
  };
  /**
   * 返回node_nodules的package信息, 如果不是node_modules则返回false
   * @param projectPath 项目文件夹
   * @returns
   */
  static readPackageInfo = async (projectPath: string) => {
    const isNM = await SrcModuleInfo.isNodeModule(projectPath);
    if (!isNM) {
      return false;
    }
    const strData = await readFile(
      path.join(projectPath, "package.json"),
      "utf-8"
    );
    try {
      const data = JSON.parse(strData);
      return data as Record<string, any>;
    } catch (error) {
      return false;
    }
  };

  /**
   * 是否为无修改包,仅对已经是源代码的资源进行判断
   * @param packagePath 包路径
   * @returns
   */
  static isCleanPackage = async (packagePath: string) => {
    return true;
  };
}

/** package.json 数据缓冲池 */
const packageInfoCache = Cache_Createor(SrcModuleInfo.readPackageInfo);

/** 模块列表 */
const getSrcModuleList = async (
  srcModulesPath: string,
  formatSrc?: (src: string) => string
) => {
  const files = await readdir(srcModulesPath);
  const srcModules: ModuleMap = {};
  for (const f of files) {
    const mf = path.join(srcModulesPath, f);
    const info = await packageInfoCache.getValue(mf);
    if (info && info.isSrcModule) {
      srcModules[info.name] = {
        src: formatSrc ? formatSrc(mf) : mf,
        version: info.version,
        name: info.name,
      };
    }
  }
  return srcModules;
};

/**
 * 根据packageInfo获取srcmodule依赖项
 * @param moduleDeps 存储依赖项变量
 * @param packInfo package.json data
 * @param srcModules src_modules
 * @returns
 */
function getDependencieByPackageInfo(
  moduleDeps: ModuleDeps,
  packInfo: PackageInfo,
  srcModules: ModuleMap
) {
  const name = packInfo.name;
  for (const depKey of depKeys) {
    const deps = packInfo[depKey];
    for (const depName of Object.keys(deps)) {
      if (srcModules[depName]) {
        if (!moduleDeps[name]) {
          moduleDeps[name] = [];
        }
        moduleDeps[name].push(depName);
      }
    }
  }
  return moduleDeps;
}

/** 获取依赖关系 */
const getDependenciesStatus = async (
  srcModulesPath: string,
  moduleList: ModuleMap
) => {
  const files = await readdir(srcModulesPath);
  const moduleDeps: ModuleDeps = {};
  for (const f of files) {
    const mf = path.join(srcModulesPath, f);
    const info = await packageInfoCache.getValue(mf);
    if (info) {
      getDependencieByPackageInfo(moduleDeps, info, moduleList);
    }
  }
  return moduleDeps;
};
