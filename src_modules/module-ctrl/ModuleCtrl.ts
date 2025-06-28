import { readdir, stat, readFile } from "fs/promises";
import path from "path";
import { depKeys, formatLinuxPath } from "./updatePackageInfoForSrcModule";
import fs, { existsSync } from "fs";
import { Exception } from "exception";
import { createUrlState, UrlState } from "./UrlState";
import { CacheCreateor } from "./CacheCreateor";
export type PackageInfo = Record<string, any>;

export interface ModuleExport {
  import?: string;
  require?: string;
  types?: string;
  default?: string;
  node?: string;
}

export type ModuleItemV1 = {
  name: string;
  url: UrlState;
  version: string;
  packageInfo: Record<string, any>;
  isSrcModule: boolean;
  isRoot?: boolean;
};

export type ModuleDepsV1 = Record<string, Array<string>>;
export type ModuleMapV1 = Record<string, ModuleItemV1>;

export interface ModuleCtrlProps {
  /** 项目路径 */
  projectPath: string;
  /** src_modules目录名 */
  srcModulesDir?: string;
}

export function ModuleCtrl(props: ModuleCtrlProps) {
  const { projectPath, srcModulesDir } = props;
  const SRC_MODULES = srcModulesDir || "src_modules";
  const packageInfoCache = CacheCreateor(readPackageInfo);

  const rootPath = createUrlState(projectPath, projectPath);
  async function isNodeModule(modulePath: string) {
    return (
      existsSync(modulePath) &&
      (await stat(modulePath)).isDirectory() &&
      fs.existsSync(path.join(modulePath, "package.json"))
    );
  }

  async function isSrcModule(modulePath: string) {
    const isNM = await isNodeModule(modulePath);
    if (!isNM) return false;
    const data = await packageInfoCache.getValue(modulePath);
    if (typeof data === "boolean") return data;
    return !!data.srcModule;
  }

  function getIsSrcModuleByPackageInfo(info: false | Record<string, any>) {
    if (typeof info === "boolean") return info;
    return !!info.srcModule;
  }

  async function readPackageInfo(projectPath: string) {
    const isNM = await isNodeModule(projectPath);
    if (!isNM) return false;
    const strData = await readFile(
      path.join(projectPath, "package.json"),
      "utf-8"
    );
    try {
      return JSON.parse(strData) as Record<string, any>;
    } catch {
      return false;
    }
  }

  async function isCleanPackage(packagePath: string) {
    return true;
  }

  function isNeedBuild(pkgInfo: false | Record<string, any>) {
    if (!pkgInfo) return false;
    return (
      (pkgInfo.platform == "web" &&
        pkgInfo.srcModule?.buildType == "web-app") ||
      (pkgInfo.srcModule?.buildType && pkgInfo.srcModule?.dist)
    );
  }

  function isMustBuild(pkgInfo: false | Record<string, any>) {
    return pkgInfo && pkgInfo.srcModule?.buildType === "web-app";
  }

  function getOutputDir(pkgInfo: Record<string, any>) {
    return pkgInfo.srcModule?.outputDir || "./dist";
  }

  function getSrcDir(pkgInfo: Record<string, any>) {
    return pkgInfo.srcModule?.srcDir || "./src";
  }

  function getMainSrc(pkgInfo: Record<string, any>): string {
    return pkgInfo.srcModule?.dist?.["."] || pkgInfo.main || pkgInfo.module;
  }

  function getMainExport(pkgInfo: Record<string, any>): string {
    return (
      pkgInfo.exports?.["."] || {
        import: pkgInfo.module || pkgInfo.main,
        require: pkgInfo.main,
        types: pkgInfo.types,
      }
    );
  }

  function getDistExports(packageJson: Record<string, any>) {
    const outputDir = getOutputDir(packageJson);
    const sources = packageJson.srcModule?.dist;
    return Object.keys(sources).reduce((acc, key) => {
      const source = path.join(outputDir, sources[key]);
      const extname = path.extname(source);
      acc[key] = {
        import: formatLinuxPath(source.replace(extname, ".js"), true),
        require: formatLinuxPath(source.replace(extname, ".cjs"), true),
        types: formatLinuxPath(source.replace(extname, ".d.ts"), true),
      };
      return acc;
    }, {} as Record<string, ModuleExport>);
  }

  function getExportModules(pkgInfo: Record<string, any>) {
    return {
      ...pkgInfo.exports,
      ".": getMainExport(pkgInfo),
    };
  }

  function getExportsPath(pkgInfo: Record<string, any>) {
    const ms = getExportModules(pkgInfo);
    const isModule = pkgInfo.type === "module";
    return Object.keys(ms).reduce((acc, key) => {
      const item = ms[key];
      acc[key] =
        (isModule ? item.import : item.require) ||
        item.require ||
        item.import ||
        item.default;
      return acc;
    }, {} as Record<string, string>);
  }

  function getBuildConfigByPkgInfo(pkgInfo: Record<string, any>) {
    const isApp = isMustBuild(pkgInfo);
    const mainSrc = isApp ? "index.html" : getMainSrc(pkgInfo);

    const index = mainSrc
      ? {
          input: {
            name: "cuurent",
            key: ".",
            src: mainSrc,
          },
          output: {
            import:
              pkgInfo.module || path.join(getOutputDir(pkgInfo), "index.mjs"),
            require:
              pkgInfo.main || path.join(getOutputDir(pkgInfo), "index.js"),
            types:
              pkgInfo.types || path.join(getOutputDir(pkgInfo), "index.d.ts"),
          },
        }
      : null;
    const ohter = Object.keys(pkgInfo.srcModule?.dist || {})
      .filter((key) => key !== ".")
      .map((key) => {
        const src: string = pkgInfo.srcModule.dist[key];
        const srcName = path.basename(src).replace(path.extname(src), "");
        const input = {
          name: encodeURIComponent(key),
          key,
          src,
        };
        const outName = path.join(getOutputDir(pkgInfo), srcName);
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
    return index ? [index].concat(ohter) : ohter;
  }

  async function getCurrentSrcModulesInfo() {
    packageInfoCache.clean();
    const srcModulesDir = SRC_MODULES;
    const moduleMap = await getSrcModuleList(
      path.join(projectPath, srcModulesDir)
    );
    const dependencyMap = await getDependenciesStatus(
      path.join(projectPath, srcModulesDir),
      moduleMap
    );
    const projectPackInfo = await packageInfoCache.getValue(projectPath);
    const info = await getSrcModule(projectPath);
    moduleMap[info.name] = { ...info, isRoot: true };
    if (projectPackInfo) {
      getDependencieByPackageInfo(dependencyMap, projectPackInfo, moduleMap);
    }
    console.log("moduleMap:", moduleMap);
    console.log("dependencyMap:", dependencyMap);

    return { moduleMap, dependencyMap };
  }

  async function getSrcModule(mf: string) {
    const info = await packageInfoCache.getValue(mf);
    if (!info) {
      return Exception.throw("1000", { contentMsg: mf });
    }
    return {
      version: info.version,
      name: info.name,
      packageInfo: info,
      isSrcModule: getIsSrcModuleByPackageInfo(info),
      url: rootPath.create(mf),
    };
  }

  async function getSrcModuleList(srcModulesPath: string) {
    if (!existsSync(srcModulesPath)) {
      return {};
    }
    const files = await readdir(srcModulesPath);
    const srcModules: ModuleMapV1 = {};
    for (const f of files) {
      const mf = path.join(srcModulesPath, f);
      const info = await getSrcModule(mf);
      if (info) {
        srcModules[info.name] = info;
      }
    }
    return srcModules;
  }

  function getDependencieByPackageInfo(
    moduleDeps: ModuleDepsV1,
    packInfo: PackageInfo,
    srcModules: ModuleMapV1
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

  async function getDependenciesStatus(
    srcModulesPath: string,
    moduleList: ModuleMapV1
  ) {
    if (!existsSync(srcModulesPath)) {
      return {};
    }
    const files = await readdir(srcModulesPath);
    const moduleDeps: ModuleDepsV1 = {};
    for (const f of files) {
      const mf = path.join(srcModulesPath, f);
      const info = await packageInfoCache.getValue(mf);
      if (info) {
        getDependencieByPackageInfo(moduleDeps, info, moduleList);
      }
    }
    return moduleDeps;
  }

  const srcModulesInfo: {
    moduleMap?: ModuleMapV1;
    dependencyMap?: ModuleDepsV1;
  } = {};

  const init = async () => {
    if (srcModulesInfo?.moduleMap) return;
    let wrap = await getCurrentSrcModulesInfo();
    srcModulesInfo.moduleMap = wrap.moduleMap;
    srcModulesInfo.dependencyMap = wrap.dependencyMap;
    console.log("srcModulesInfo:", srcModulesInfo);
  };

  return {
    SRC_MODULES,
    srcModulesInfo,
    init,
    update: init,
    isNodeModule,
    isSrcModule,
    getIsSrcModuleByPackageInfo,
    readPackageInfo: packageInfoCache.getValue.bind(packageInfoCache),
    isCleanPackage,
    isNeedBuild,
    isMustBuild,
    getOutputDir,
    getSrcDir,
    getMainSrc,
    getMainExport,
    getDistExports,
    getExportModules,
    getExportsPath,
    getBuildConfigByPkgInfo,
  };
}

/**
 * ModuleCtrlInstance 类型
 */
type ModuleCtrlInstance = ReturnType<typeof ModuleCtrl>;

export { type ModuleCtrlInstance };

export const moduleCtrl = ModuleCtrl({ projectPath: process.cwd() });
