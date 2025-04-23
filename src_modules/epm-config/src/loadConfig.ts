import { getRootDirname } from "module-ctrl";
import path from "path";
import { build } from "esbuild";
import { EpmBuildOptions } from "./defineConfig";
import { pathToFileURL } from "url";

/**
 * 加载用户配置文件
 * @param configName 根目录下的配置文件名称
 * @returns
 */
export const loadConfig = async (configName = "epm.config.ts") => {
  const url = path.join(getRootDirname(), configName);
  const res = await build({
    entryPoints: [url],
    format: "esm",
    bundle: true,
    write: true,
    minify: true,
    treeShaking: true,
    platform: "node",
    outfile: "./node_modules/.epm_cache/epm.config.js",
  });
  if (!res.outputFiles?.length) {
    return null;
  }
  const moduleUrl = pathToFileURL(res.outputFiles[0].path).href;
  return (await import(moduleUrl).then((m) => m.default)) as EpmBuildOptions;
};
