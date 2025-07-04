import { moduleCtrl, formatLinuxPath, ModuleItemV1 } from "module-ctrl";
import { buildOnePlatForm } from "./bundle";
import { dts } from "./dts";
import path from "path";
import { Exception } from "exception";
import { loadConfig } from "../utils/loadConfig";
import { pluginRename } from "./bundle/pluginRename";
import { HtmlBuild } from "./html";

// TODO cache 缓存优化

export interface BuildOptions {
  watch: boolean;
  serve: boolean;
  projectNames?: string[];
  all?: boolean;
  dts?: boolean;
}

function getName(...paths: string[]) {
  return formatLinuxPath(path.join(...paths), true);
}

export const getOutName = (
  it: ModuleItemV1,
  entryInfo: any,
  type: "cjs" | "mjs" | "ts" = "cjs"
) => {
  const libName =
    type == "mjs" ? entryInfo.output.import : entryInfo.output.require;
  const dtsName = entryInfo.output.types;
  if (!libName) {
    return Exception.throw("1004", {
      contentMsg: `项目名：${it.packageInfo.name}，请检查源码 ${entryInfo.input.src} 所对应的导出配置`,
    });
  }
  if (it.isRoot) {
    return type == "ts" ? dtsName : libName;
  }
  return getName(
    moduleCtrl.SRC_MODULES,
    it.name,
    type == "ts" ? dtsName : libName
  );
};

export const build = async (option: BuildOptions) => {
  const { moduleMap: moduleList } = await moduleCtrl.srcModulesInfo;
  const webEntry: any[] = [];
  const webEntryMjs: any[] = [];
  const nodeEntry: any[] = [];
  const nodeEntryMjs: any[] = [];
  const dtsEntry: any[] = [];
  const htmlEntry: any[] = [];

  function fillEntryByModuleItem(it: ModuleItemV1) {
    moduleCtrl.getBuildConfigByPkgInfo(it.packageInfo).forEach((entryInfo) => {
      // 所有的dts都需要打包（isNeedBuild）
      // 非lib不打包dts（buildType）
      if (it.packageInfo.srcModule?.buildType != "web-app") {
        dtsEntry.push({
          ...it,
          esEntry: {
            in: formatLinuxPath(
              path.join(it.url.url, entryInfo.input.src),
              true
            ),
            out: getOutName(it, entryInfo, "ts"),
          },
        });
      }
      // 源码库无需打包
      if (!moduleCtrl.isNeedBuild(it.packageInfo)) {
        return;
      }
      const inPath = formatLinuxPath(
        path.join(it.url.url, entryInfo.input.src || ""),
        true
      );

      if (it.packageInfo.platform == "web") {
        if (it.packageInfo.srcModule?.buildType == "web-app") {
          const servedir = formatLinuxPath(
            path.join(it.url.url, moduleCtrl.getOutputDir(it.packageInfo)),
            true
          );
          htmlEntry.push({
            inputHtmlPath: formatLinuxPath(
              path.join(it.url.url, "index.html"),
              true
            ),
            outHtmlPath: "index.html", // 直接输出到{servedir}/index.html
            servedir,
          });
        } else {
          webEntry.push({
            in: inPath,
            out: getOutName(it, entryInfo, "cjs"),
          });
          webEntryMjs.push({
            in: formatLinuxPath(
              path.join(it.url.url, entryInfo.input.src),
              true
            ),
            out: getOutName(it, entryInfo, "mjs"),
          });
        }
      } else {
        nodeEntry.push({
          in: inPath,
          out: getOutName(it, entryInfo, "cjs"),
        });
        nodeEntryMjs.push({
          in: inPath,
          out: getOutName(it, entryInfo, "mjs"),
        });
      }
    });
  }

  if (!moduleList) {
    return Exception.throw("1000", { contentMsg: "未获取到模块列表" });
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
    else if ((option.watch || option.serve) && !option.all) {
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
  // console.log(config, "config");
  const serveOptions = config?.serveOptions;

  const allPromise: Promise<any>[] = [];
  if (webEntry?.length) {
    allPromise.push(
      buildOnePlatForm({
        ...config?.esbuild,
        serveOptions: serveOptions,
        entryPoints: webEntry,
        platform: "browser",
        format: "cjs",
        outdir: "./",
        plugins: [
          ...(config?.esbuild?.plugins || []),
          pluginRename({
            rename: async (file) => {
              return path.extname(file.path) == ".js"
                ? file.path.slice(0, -3)
                : file.path;
            },
            write: true, // config?.esbuild?.write,
          }),
        ],
        watch: option.watch,
        serve: false, // lib模式默认不支持serve
      })
    );
  }
  if (webEntryMjs?.length) {
    allPromise.push(
      buildOnePlatForm({
        ...config?.esbuild,
        serveOptions: serveOptions,
        entryPoints: webEntryMjs,
        platform: "browser",
        format: "esm",
        outdir: "./",
        plugins: [
          ...(config?.esbuild?.plugins || []),
          pluginRename({
            rename: async (file) => {
              return path.extname(file.path) == ".js"
                ? file.path.slice(0, -3)
                : file.path;
            },
            write: true, // config?.esbuild?.write,
          }),
        ],
        watch: option.watch,
        serve: false, // lib模式默认不支持serve
      })
    );
  }
  if (nodeEntry?.length) {
    allPromise.push(
      buildOnePlatForm({
        ...config?.esbuild,
        serveOptions: serveOptions,
        entryPoints: nodeEntry,
        platform: "node",
        format: "cjs",
        outdir: "./",
        watch: option.watch,
        serve: false,
        plugins: [
          ...(config?.esbuild?.plugins || []),
          pluginRename({
            rename: async (file) => {
              return path.extname(file.path) == ".js"
                ? file.path.slice(0, -3)
                : file.path;
            },
            write: true, // config?.esbuild?.write,
          }),
        ],
      })
    );
  }
  if (nodeEntryMjs?.length) {
    allPromise.push(
      buildOnePlatForm({
        ...config?.esbuild,
        serveOptions: serveOptions,
        entryPoints: nodeEntryMjs,
        platform: "node",
        format: "esm",
        outdir: "./",
        watch: option.watch,
        serve: false,
        plugins: [
          ...(config?.esbuild?.plugins || []),
          pluginRename({
            rename: async (file) => {
              return path.extname(file.path) == ".js"
                ? file.path.slice(0, -3)
                : file.path;
            },
            write: true, // config?.esbuild?.write,
          }),
        ],
      })
    );
  }

  // console.log("config", config);

  allPromise.push(
    ...htmlEntry?.map((entry) => {
      return HtmlBuild({
        ...config?.esbuild,
        path: entry.inputHtmlPath,
        serveOptions: { ...serveOptions, servedir: entry.servedir }, // 每个服务独立的目录
        platform: "browser",
        format: "esm",
        outdir: entry.servedir, // 每个HTML打包独立的输出目录
        watch: option.watch,
        serve: option.serve,
        bundle: true,
        write: true,
        plugins: config?.esbuild?.plugins,
      });
    })
  );

  Promise.all(allPromise);

  // 仅显示设置需要dts才生成dts(dts太耗时了)
  if (option.dts) {
    console.log("d.ts声明生成中");

    dts({
      moduleMap: moduleList,
    });

    // // TODO 依赖顺序处理

    // const rootEntry: any[] = [];
    // const otherEntry = dtsEntry.filter(({ esEntry: item }) => {
    //   if (item.in.indexOf("src_modules") == -1) {
    //     rootEntry.push(item);
    //     return false;
    //   }
    //   return true;
    // });

    // await Promise.all(
    //   otherEntry.map(({ esEntry: file, src }) =>
    //     dts({
    //       projectPath: src,
    //       mainEntryPointFilePath: file.in,
    //       bundledPackages: [...Object.keys(moduleList)], //未打包的dts需要提前打包
    //       dtsRollup: {
    //         enabled: true,
    //         untrimmedFilePath: file.out,
    //       },
    //       // overrideTsconfig: {
    //       //   compilerOptions: {
    //       //     paths: paths,
    //       //   },
    //       // },
    //     })
    //   )
    // );
    // await Promise.all(
    //   rootEntry.map(({ esEntry: file, src }) =>
    //     dts({
    //       projectPath: src,
    //       mainEntryPointFilePath: file.in,
    //       bundledPackages: [...Object.keys(moduleList)], //未打包的dts需要提前打包
    //       dtsRollup: {
    //         enabled: true,
    //         untrimmedFilePath: file.out,
    //       },
    //       // overrideTsconfig: {
    //       //   compilerOptions: {
    //       //     paths: paths,
    //       //   },
    //       // },
    //     })
    //   )
    // );
  }
};
