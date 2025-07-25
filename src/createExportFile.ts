import { formatLinuxPath, getRootDirname, moduleCtrl } from "module-ctrl";
import { wirteJsonFile } from "./utils/JsonFile";
import { promises as fs, existsSync } from "fs";
import path from "path";
import { Exception } from "exception";

/**
 * 创建一个导出文件，并更新 package.json 中的 exports 字段。
 * @param fileName - 要创建的文件名（不带扩展名）。
 * @returns Promise<void>
 */
export async function createExportFile(fileName: string): Promise<void> {
  const rootDir = getRootDirname();
  const packageJson = await moduleCtrl.readPackageInfo(rootDir);
  const dist = moduleCtrl.isNeedBuild(packageJson);
  if (!packageJson) {
    Exception.throw("1000", { contentMsg: rootDir });
  }

  // 确保 packageJson.srcModule 存在
  packageJson.srcModule = packageJson.srcModule || {};
  const srcDir = moduleCtrl.getSrcDir(packageJson);
  const outputDir = moduleCtrl.getOutputDir(packageJson);

  // 使用 path 拼接路径
  const filePath = path.join(rootDir, srcDir, `${fileName}.ts`);
  const relativePath = formatLinuxPath(
    path.join("./", outputDir, `${fileName}${dist ? ".js" : ".ts"}`),
    true
  );

  // 创建文件
  if (!existsSync(filePath)) {
    await fs.writeFile(filePath, "", "utf-8");
  }

  const rname = formatLinuxPath(fileName, true);
  if (dist) {
    packageJson.srcModule.dist = packageJson.srcModule.dist || {};
    packageJson.srcModule.dist[rname] = formatLinuxPath(
      path.join(srcDir, `${fileName}.ts`),
      true
    );
    packageJson.exports[rname] = {
      types: relativePath.replace(".js", ".d.ts"),
      import: relativePath,
      require: relativePath.replace(".js", ".cjs"),
    };
  } else {
    packageJson.exports[rname] = relativePath;
  }

  // 保存更新后的 package.json
  await wirteJsonFile(path.join(rootDir, "package.json"), packageJson, 2);
  console.log(`创建 ${filePath} 成功`);
}
