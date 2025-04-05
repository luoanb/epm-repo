import * as esbuild from "esbuild"
import { bundleConfig } from "./config"

export interface BuildOnePlatFormOptions extends esbuild.BuildOptions {
  /** 是否时可执行脚本 */
  isBin?: boolean
  watch?: boolean
  serve?: boolean
  custom?: boolean
}
export async function buildOnePlatForm({ isBin, banner, watch, serve, custom, ...options }: BuildOnePlatFormOptions) {
  const ctx = await esbuild.context({
    ...bundleConfig,
    banner: {
      ...banner,
      js: isBin ? `#!/usr/bin/env node` : banner?.js || '',
    },
    ...options
  })
  if (watch) {
    ctx.watch()
    return ctx
  } else if (serve) {
    ctx.serve()
    return ctx
  } else if (custom) {
    return ctx
  } else {
    await ctx.rebuild()
    return ctx
  }
}

