import {
  Extractor,
  ExtractorConfig,
  IConfigFile,
} from "@microsoft/api-extractor";
import { dtsConfig } from "./config";
import { Shell } from "../../utils/Shell";
import path from "path";
import { cwd } from "process";
import { moduleCtrl } from "module-ctrl";
export interface DtsOptions extends IConfigFile {
  /** 根路径 默认cwd() */
  root?: string;
  /** 项目路径 默认 "./" */
  projectPath?: string;
  showVerboseMessages?: boolean;
  overrideTsconfig?: any;
}

/**
 * 单文件dts生成
 * @param param0
 * @returns
 */
export const dts = async ({
  root = cwd(),
  projectPath = "",
  mainEntryPointFilePath,
  showVerboseMessages,
  projectFolder,
  overrideTsconfig,
  ...options
}: DtsOptions) => {
  const packageJson = await moduleCtrl.readPackageInfo(projectPath);
  if (!packageJson) {
    return;
  }

  const outDir = `._dist_dts/${mainEntryPointFilePath}`; // 必须在node_modules之外,负责不会被api-extractor扫描到

  await Shell.exec(
    `npx tsc ${mainEntryPointFilePath} --module es2015  --moduleResolution bundler --esModuleInterop --declaration  --emitDeclarationOnly  --outDir ${outDir}`
  ); // 每个声明独立空间，不然有重名风险

  const aburl = path.join(
    root,
    outDir,
    path.basename(
      mainEntryPointFilePath.replace(
        path.extname(mainEntryPointFilePath),
        ".d.ts"
      )
    )
  );

  console.log("d.ts:", aburl);
  const config = ExtractorConfig.prepare({
    configObject: {
      ...dtsConfig,
      ...options,
      projectFolder: path.join(root, projectPath), // 必须绝对路径
      mainEntryPointFilePath: aburl,
      compiler: {
        tsconfigFilePath: path.join(root, projectPath, "./tsconfig.json"),
        overrideTsconfig,
      },
    },
    configObjectFullPath: undefined,
    packageJsonFullPath: path.join(root, projectPath, "./package.json"),
    // @ts-expect-error name不包含在string?
    packageJson: packageJson,
  });
  return Extractor.invoke(config, { showVerboseMessages, localBuild: false })
    ?.succeeded;
};
