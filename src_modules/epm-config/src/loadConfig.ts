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
    format: "cjs", // esm 总是有各种问题:无法判断是由于历史包袱过多还是Node对esm支持不够完善
    bundle: true,
    write: true,
    minify: true,
    treeShaking: true,
    metafile: true,
    platform: "node",
    external: ["/node_modules/*"],
    outfile: "./node_modules/.epm_cache/epm.config.js",
  });
  console.log(res.metafile);
  const moduleUrl = pathToFileURL(
    "./node_modules/.epm_cache/epm.config.js"
  ).href;
  return (await import(moduleUrl).then((m) => {
    return m.default?.default;
  })) as EpmBuildOptions;
};
