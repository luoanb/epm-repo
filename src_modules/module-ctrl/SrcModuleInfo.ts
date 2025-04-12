import { readdir, stat, readFile } from "fs/promises";
import path from "path";
import {
  depKeys,
  windowsPathToLinuxPath,
} from "./updatePackageInfoForSrcModule";
import { Cache_Createor } from "./Cache_Createor";

import fs, { existsSync, statSync } from "fs";
import { Exception } from "exception";
type PackageInfo = Record<string, any>;

export type ModuleItem = {
  /** 模块名称 */
  name: string;
  /** 相对路径 */
  src: string;
  /** 版本 */
  version: string;
  /** 文件路径 */
  fileUrl: string;
  /** 完整的package.json信息 */
  packageInfo: Record<string, any>;
  /** 是否时srcmodule */
  isSrcModule: boolean;
  /** 是否是根目录 */
  isRoot?: boolean;
};

export type ModuleDeps = Record<string, Array<string>>;
export type ModuleMap = Record<string, ModuleItem>;

/** SrcModule规范
 const pinfo = {
  platform: "web" | "node",
  srcModule: {
    isRoot: boolean, // 是否是更目录
    buildType: false||"lib" | "web-app", // web-app会注入html, 默认false (不需要打包)
    outputDir: "./dist", // 默认输出路径（用于指定创建导出文件时的默认配置）默认 ./dist，web-app使用路径
    srcDir: "./src", // 默认输出路径（用于指定创建导出文件时的默认配置）默认 ./src
    dist: {
      ".": "./index.ts",
      "./Xxx": "./xx.ts",
    },
    repo: {
      origin: {
        remote: "xxx",
        modulePath: "./",
        vcs: "git",
        versions: {
          "1.0.0": "67f66bc7069d7",
        },
      },
    },
    curentRepo: "origin",
    versions: ["1.0.0"],
  },
};
 */

/**
 * SrcModule信息查询
 */
export class SrcModuleInfo {
  static SRC_MODULES = "src_modules";
  /**
   * 获取项目信息，包含当前项目, 以及SrcModule的子项目
   * @param projectPath
   * @returns
   */
  static getCurrentSrcModulesInfo = async (projectPath: string) => {
    // 缓存仅当前会话有效
    packageInfoCache.clean();
    const srcModulesDir = this.SRC_MODULES;
    const formatPathUtil = this.formatPath_Creator(projectPath);
    const moduleMap = await getSrcModuleList(
      path.join(projectPath, srcModulesDir),
      formatPathUtil.toWrite
    );
    const dependencyMap = await getDependenciesStatus(
      path.join(projectPath, srcModulesDir),
      moduleMap
    );
    const projectPackInfo = await packageInfoCache.getValue(projectPath);
    const info = await getSrcModule(projectPath, formatPathUtil.toWrite);
    moduleMap[info.name] = { ...info, isRoot: true };
    if (projectPackInfo) {
      getDependencieByPackageInfo(dependencyMap, projectPackInfo, moduleMap);
    }
    return { moduleMap, dependencyMap };
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
      existsSync(filePath) &&
      (await stat(filePath)).isDirectory() &&
      fs.existsSync(path.join(filePath, "package.json"))
    );
  };

  /**
   * 判断项目是否为SrcModule
   * @param filePath
   * @returns
   */
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
   * 获取项目是否为SrcModule
   * @param info packageJsonData
   * @returns
   */
  static getIsSrcModuleByPackageInfo = getIsSrcModuleByPackageInfo;

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

  /**
   * 是否需要build
   * @param pkgInfo
   * @returns
   */
  static isNeedBuild = (pkgInfo: false | Record<string, any>) => {
    return pkgInfo && pkgInfo.srcModule?.buildType && pkgInfo.srcModule?.dist;
  };

  /**
   * 获取输出路径
   * @param pkgInfo
   * @returns
   */
  static getOutputDir = (pkgInfo: Record<string, any>) => {
    return pkgInfo.srcModule?.outputDir || "./dist";
  };

  /**
   * 获取Src路径
   * @param pkgInfo
   * @returns
   */
  static getSrcDir = (pkgInfo: Record<string, any>) => {
    return pkgInfo.srcModule?.srcDir || "./src";
  };

  /**
   * 通过pkgInfo 获取模块打包信息
   * @param pkgInfo
   * @returns
   */
  static getBuildConfigByPkgInfo(pkgInfo: Record<string, any>) {
    if (!this.isNeedBuild(pkgInfo)) {
      return [];
    }
    const index = {
      input: {
        name: "cuurent",
        key: ".",
        src: pkgInfo.srcModule.dist["."],
      }, // 输入路径：例如 './index.ts'
      output: {
        import:
          pkgInfo.module || path.join(this.getOutputDir(pkgInfo), "index.mjs"),
        require:
          pkgInfo.main || path.join(this.getOutputDir(pkgInfo), "index.js"),
        types:
          pkgInfo.types || path.join(this.getOutputDir(pkgInfo), "index.d.ts"),
      },
    };
    const ohter = Object.keys(pkgInfo.srcModule.dist)
      .filter((key) => key !== ".")
      .map((key) => {
        const src: string = pkgInfo.srcModule.dist[key];
        const srcName = path.basename(src).replace(path.extname(src), "");
        const input = {
          name: encodeURIComponent(key),
          key,
          src,
        };
        const outName = path.join(this.getOutputDir(pkgInfo), srcName);
        const output = pkgInfo.exports?.[key] || {
          import: outName + ".js",
          require: outName + ".cjs",
          types: outName + ".d.ts",
        };
        return {
          input,
          output,
        };
      });
    return [index].concat(ohter);
  }
}

/** package.json 数据缓冲池 */
const packageInfoCache = Cache_Createor(SrcModuleInfo.readPackageInfo);

const getSrcModule = async (
  mf: string,
  formatSrc?: (src: string) => string
) => {
  const info = await packageInfoCache.getValue(mf);
  if (!info) {
    return Exception.throw("1000", { contentMsg: mf });
  }
  return {
    src: formatSrc ? formatSrc(mf) : mf,
    version: info.version,
    name: info.name,
    fileUrl: mf,
    packageInfo: info,
    isSrcModule: getIsSrcModuleByPackageInfo(info),
  };
};

/**
 * 判断项目是否为SrcModule
 * @param info packageJsonData
 * @returns
 */
function getIsSrcModuleByPackageInfo(info: false | Record<string, any>) {
  const data = info;
  if (typeof data === "boolean") {
    return data;
  }
  return !!data.srcModule;
}

/** 模块列表 */
const getSrcModuleList = async (
  srcModulesPath: string,
  formatSrc?: (src: string) => string
) => {
  if (!existsSync(srcModulesPath)) {
    return {};
  }
  const files = await readdir(srcModulesPath);
  const srcModules: ModuleMap = {};
  for (const f of files) {
    const mf = path.join(srcModulesPath, f);
    const info = await getSrcModule(mf, formatSrc);
    if (info) {
      srcModules[info.name] = info;
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
    const deps = packInfo[depKey] || [];
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
