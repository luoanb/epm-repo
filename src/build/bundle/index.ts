import * as esbuild from "esbuild";
import { bundleConfig } from "./config";
import path from "path";

export interface BuildOnePlatFormOptions extends esbuild.BuildOptions {
  /** 是否时可执行脚本 */
  isBin?: boolean;
  watch?: boolean;
  serve?: boolean;
  custom?: boolean;
  serveOptions?: esbuild.ServeOptions;
}
export async function buildOnePlatForm({
  isBin,
  banner,
  watch,
  serve,
  custom,
  serveOptions: serveOptionsBase,
  write,
  ...options
}: BuildOnePlatFormOptions) {
  const serveOptions: esbuild.ServeOptions = {
    ...serveOptionsBase,
    servedir: path.resolve(process.cwd(), serveOptionsBase?.servedir || ""),
  };
  const ctx = await esbuild.context({
    ...bundleConfig,
    banner: {
      ...banner,
      js: isBin ? `#!/usr/bin/env node` : banner?.js || "",
    },
    ...options,
    plugins: [...(bundleConfig.plugins || []), ...(options.plugins || [])],
  });
  if (watch) {
    ctx.watch();
    return ctx;
  } else if (serve) {
    await ctx.watch();
    const res = await ctx.serve(serveOptions);
    if (res.hosts && res.port) {
      console.log("-------------------");
      console.log(`Server running at:`);
      res.hosts.forEach((host) => {
        console.log(`   http://${host}:${res.port}`);
      });
      console.log("-------------------");
    }
    return ctx;
  } else if (custom) {
    return ctx;
  } else {
    await ctx.rebuild();
    ctx.dispose();
    return ctx;
  }
}
