import {
  SrcModuleInfo,
  windowsPathToLinuxPath,
  getRootDirname,
} from "module-ctrl";
import { wirteJsonFile } from "./utils/JsonFile";
import { promises as fs } from "fs";
import path from "path";
import { Exception } from "exception";

export async function createExportFile(
  fileName: string,
  dist: boolean = false
): Promise<void> {
  const rootDir = getRootDirname();
  const packageJson = await SrcModuleInfo.readPackageInfo(rootDir);

  if (!packageJson) {
    Exception.throw("1000", { contentMsg: rootDir });
  }

  // 确保 packageJson.srcModule 存在
  packageJson.srcModule = packageJson.srcModule || {};
  const srcDir = packageJson.srcModule.srcDir || "src";
  const outputDir = packageJson.srcModule.outputDir || "dist";

  // 使用 path 拼接路径
  const filePath = path.join(rootDir, srcDir, `${fileName}.ts`);
  const relativePath = windowsPathToLinuxPath(
    path.join("./", outputDir, `${fileName}${dist ? ".js" : ".ts"}`),
    true
  );

  // 创建文件
  await fs.writeFile(filePath, "", "utf-8");

  if (dist) {
    packageJson.srcModule.dist = packageJson.srcModule.dist || {};
    packageJson.srcModule.dist[fileName] = windowsPathToLinuxPath(
      path.join(srcDir, `${fileName}.ts`),
      true
    );
    packageJson.exports[fileName] = {
      import: relativePath,
      require: relativePath.replace(".js", ".cjs"),
      types: relativePath.replace(".js", ".d.ts"),
    };
  } else {
    packageJson.exports[fileName] = relativePath;
  }

  // 保存更新后的 package.json
  await wirteJsonFile(path.join(rootDir, "package.json"), packageJson, 2);
  console.log(`创建文件 ${filePath} 成功`);
}
