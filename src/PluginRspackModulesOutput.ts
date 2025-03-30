import type { Compiler, RspackPluginInstance } from "@rspack/core";
import { mkdirSync, readdirSync, renameSync, existsSync } from "fs";
import { ModuleMap, SrcModuleInfo, windowsPathToLinuxPath } from "module-ctrl";
import { SPLIT_CONST } from "./PluginModulesOutput";
import path from "path";
import { Exception } from "../src_modules/exception";

const PLUGIN_NAME = "PluginRspackModulesOutput";

export class PluginRspackModulesOutput implements RspackPluginInstance {
  constructor(private moduleMap: ModuleMap, private swapDtsDistpath: string) {}
  getName(...paths: string[]) {
    return windowsPathToLinuxPath(path.join(...paths), true);
  }
  isJS(name: string) {
    return ["js", "mjs", "cjs", "ts", "tsx", "jsx", "mts", "cts"].includes(
      path.extname(name)
    );
  }

  getNameWithoutExt(fileId: string) {
    return fileId.replace(path.extname(fileId), "");
  }
  getDtsNameWithoutExt(fileId: string) {
    let name = fileId.replace(path.extname(fileId), "");
    return (name = name.replace(path.extname(name), ""));
  }

  getFileName(oldName: string, type: "ts" | "js") {
    const [projectName, ...other] = oldName.split(SPLIT_CONST);
    const fileId = other.join(SPLIT_CONST);

    const cuurent = this.moduleMap[projectName];

    // 找不到项目信息，原样返回
    if (!cuurent) {
      return oldName;
    }

    const files = SrcModuleInfo.getBuildConfigByPkgInfo(cuurent.packageInfo);

    const outputValue = files.find(
      (i) =>
        i.input.name ==
        (type == "ts"
          ? this.getDtsNameWithoutExt(fileId)
          : this.getNameWithoutExt(fileId))
    );

    if (!outputValue) {
      // js文件强制验证
      if (this.isJS(fileId)) {
        return Exception.throw("1004", {
          contentMsg: JSON.stringify({
            name: cuurent.packageInfo.name,
            srcDist: fileId,
          }),
        });
      }
      // 找不到时文件路径保持
      return fileId;
    }

    if (cuurent.isRoot) {
      return this.getName(
        type == "js"
          ? outputValue?.output.import || outputValue?.output.require
          : outputValue.output.types
      );
    }
    return this.getName(
      SrcModuleInfo.SRC_MODULES,
      projectName,
      type == "js"
        ? outputValue?.output.import || outputValue?.output.require
        : outputValue.output.types
    );
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
      const getFileName = (name: string) => this.getFileName(name, "js");
      const files = compilation.getAssets();
      files.forEach((file) => {
        if (!existsSync(path.dirname(file.name))) {
          mkdirSync(path.dirname(file.name));
        }
        compilation.renameAsset(file.name, getFileName(file.name));
      });
    });
    compiler.hooks.afterDone.tap(PLUGIN_NAME, () => {
      const getDtsFileName = (name: string) => this.getFileName(name, "ts");
      readdirSync(this.swapDtsDistpath)
        .filter((fileName) => fileName.endsWith("d.ts"))
        .forEach((url) => {
          const name = getDtsFileName(url);
          const srcUrl = path.join(this.swapDtsDistpath, url);
          if (!existsSync(path.dirname(srcUrl))) {
            mkdirSync(path.dirname(srcUrl));
          }
          renameSync(srcUrl, name);
        });
    });
  }
}
