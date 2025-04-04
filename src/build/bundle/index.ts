import * as esbuild from "esbuild"
import { config } from "./config"
export interface BuildOnePlatFormOptions extends esbuild.BuildOptions {
  /** 是否时可执行脚本 */
  isBin?: boolean
  watch?: boolean
  serve?: boolean
  custom?: boolean
}
export async function buildOnePlatForm({ isBin, banner, watch, serve, custom, ...options }: BuildOnePlatFormOptions) {
  const ctx = await esbuild.context({
    ...config,
    banner: {
      ...banner,
      js: isBin ? `#!/usr/bin/env node` : banner?.js || '',
    },
    ...options
  })
  if (watch) {
    ctx.watch()
  } else if (serve) {
    ctx.serve()
  } else if (custom) {
    return ctx
  } else {
    ctx.dispose()
  }
}

