import * as esbuild from "esbuild"
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

export interface PluginRenameOptions {
  rename(fileInfo: esbuild.OutputFile): Promise<string>,
  /** 是否写入文件 默认: true */
  write?: boolean
}

async function writeFileBuffer(url: string, data: any) {
  const controller = new AbortController();
  const { signal } = controller;
  if (!existsSync(path.dirname(url))) {
    mkdirSync(path.dirname(url))
  }
  return await writeFile(url, data, { signal })
}


/**
 * 重命名输出文件
 * @description 需要将esbuild设置为{write: false}
 * @param options.rename 定制名称方法
 * @returns 
 */
export const pluginRename = ({ rename, write }: PluginRenameOptions) => {
  return {
    name: "pluginRename",
    setup(build) {
      build.onEnd((res) => {
        res.outputFiles?.forEach(async (file) => {
          const newPath = await rename(file)
          if (write) {
            await writeFileBuffer(newPath, file.contents)
          } else {
            console.log(`${file.path}:${newPath}`);
          }
        });
      })
    },
  } satisfies esbuild.Plugin
}