import * as esbuild from "esbuild"
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

async function writeFileBuffer(url: string, data: any) {
  const controller = new AbortController();
  const { signal } = controller;
  if (!existsSync(path.dirname(url))) {
    mkdirSync(path.dirname(url))
  }
  return await writeFile(url, data, { signal })
}

export const pluginRename: esbuild.Plugin = {
  name: "pluginRename",
  setup(build) {
    build.onEnd((res) => {
      console.log("onEnd", res);
      res.outputFiles?.forEach(async (file) => {
        const newPath = path.extname(file.path) == ".js" ? file.path.slice(0, -3) : file.path
        await writeFileBuffer(newPath, file.contents)
      });
    })
  },
}