import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import { dtsConfig } from "./config";
import { Shell } from "../../utils/Shell";
import path from "path";
import { cwd } from "process";
import {
  ModuleItemV1,
  ModuleMapV1,
  moduleCtrl,
  formatLinuxPath,
} from "module-ctrl";
import { copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { it } from "vitest";
import { getOutName } from "..";
export interface DtsOptions {
  /** 根路径 默认cwd() */
  root?: string;
  moduleMap: ModuleMapV1;
  dtsSwapFolder?: string;
}

/**
 * 生成dts
 * @param
 * @returns
 */
export const dts = async ({
  root = cwd(),
  moduleMap,
  dtsSwapFolder = "._dist_dts",
}: DtsOptions) => {
  // 将所有的d.ts文件覆写到._dist_dts,且保留相对路径和package.json, 相对于创建了只有d.ts的项目副本
  const getProjectRelativePath = (projectPath: string) => {
    return formatLinuxPath(path.relative(root, projectPath), true);
  };

  // const it = moduleMap["epm-repo"];
  let dtsInfoList: {
    in: string;
    out: string;
    it: ModuleItemV1;
  }[] = [];

  for (const key of Object.keys(moduleMap)) {
    const it = moduleMap[key];
    moduleCtrl.getBuildConfigByPkgInfo(it.packageInfo).forEach((entryInfo) => {
      dtsInfoList.push({
        in: formatLinuxPath(
          path.join(it.url.fileUrl, entryInfo.input.src),
          true
        ),
        out: getOutName(it, entryInfo, "ts"),
        it,
      });
    });
  }

  /** 模拟项目路径 */
  const mockProject = async (projectPath: string) => {
    const projectRelativePath = path.join(
      dtsSwapFolder,
      getProjectRelativePath(projectPath)
    );
    if (!existsSync(projectRelativePath)) {
      await mkdir(projectRelativePath);
    }
    const cpFiles = [
      "package.json",
      "tsconfig.json",
      "tsconfig.srcmodule.json",
    ];
    console.log(projectRelativePath, projectPath, "projectRelativePath");

    for (const file of cpFiles) {
      if (existsSync(path.join(projectPath, file))) {
        await copyFile(
          path.join(projectPath, file),
          path.join(projectRelativePath, file)
        );
      }
    }
  };

  console.time("dtsStart");
  // for (const info of dtsInfoList) {
  //   const mainEntryPointFilePath = info.in;
  //   // await mockProject();
  //   const outDir = `._dist_dts/${path.dirname(mainEntryPointFilePath)}`; // 必须在node_modules之外,否则不会被api-extractor扫描到
  //   console.time("dts:" + info.in);
  //   await Shell.exec(
  //     `npx tsc ${mainEntryPointFilePath} --module es2015  --moduleResolution bundler --esModuleInterop --declaration  --emitDeclarationOnly  --outDir ${outDir}`
  //   ); // 每个声明独立空间，不然有重名风险
  //   console.timeEnd("dts:" + info.in);
  // }

  await Promise.all(
    dtsInfoList.map(async (info) => {
      const mainEntryPointFilePath = info.in;
      // await mockProject();
      const outDir = `${dtsSwapFolder}/${path.dirname(mainEntryPointFilePath)}`; // 必须在node_modules之外,否则不会被api-extractor扫描到
      console.time("dts:" + info.in);
      await Shell.exec(
        `npx tsc ${mainEntryPointFilePath} --module es2015  --moduleResolution bundler --esModuleInterop --declaration  --emitDeclarationOnly  --outDir ${outDir}`
      ); // 每个声明独立空间，不然有重名风险
      console.timeEnd("dts:" + info.in);
    })
  );

  console.timeEnd("dtsStart");
  console.time("mockProject");
  for (const key of Object.keys(moduleMap)) {
    const it = moduleMap[key];
    await mockProject(it.url.fileUrl);
  }
  console.timeEnd("mockProject");

  await Promise.all(
    dtsInfoList.map(async (info) => {
      const projectRelativePath = path.join(
        dtsSwapFolder,
        getProjectRelativePath(info.it.url.fileUrl)
      );

      // 生成的dts文件路径(未聚合)
      const aburl = path.join(
        root,
        dtsSwapFolder,
        info.in.replace(path.extname(info.in), ".d.ts")
      );

      const config = ExtractorConfig.prepare({
        configObject: {
          ...dtsConfig,
          projectFolder: path.join(root, projectRelativePath), // 必须绝对路径
          bundledPackages: Object.keys(moduleMap), //未打包的dts需要提前打包
          mainEntryPointFilePath: aburl,
          compiler: {
            tsconfigFilePath: path.join(
              root,
              projectRelativePath,
              "./tsconfig.json"
            ),
          },
          dtsRollup: {
            enabled: true,
            // 这里现在时分项目了，所以直接取项目内路径即可
            untrimmedFilePath: formatLinuxPath(
              path.relative(projectRelativePath, info.out),
              true
            ),
          },
        },
        configObjectFullPath: undefined,
        packageJsonFullPath: path.join(
          root,
          projectRelativePath,
          "./package.json"
        ),
        // @ts-expect-error name不包含在string?
        packageJson: info.it.packageInfo,
      });
      return Extractor.invoke(config, {
        showVerboseMessages: true,
        localBuild: false,
      })?.succeeded;
    })
  );
};
