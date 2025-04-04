// import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";

import { BuildOptions, createRsbuild, defineConfig, mergeRsbuildConfig, } from "@rsbuild/core";
import { build, loadConfig as loadConfigLib, defineConfig as defineConfigLib, } from "@rslib/core"
import { loadConfig } from '@rsbuild/core';
import { rsConfigBaseConstructor } from "../rsConfigBaseConstructor";

export interface EpmBuildOptions extends BuildOptions {
  config?: string
}

export async function buildByRsbuild({ config, ...options }: EpmBuildOptions) {
  // 加载 `rsbuild.config.*` 配置文件
  // console.log(config, "configPath");
  const { content } = await loadConfig({ path: config });
  // console.log(content, "content");
  // return
  const rsbuild = await createRsbuild({
    // @ts-ignore
    rsbuildConfig: mergeRsbuildConfig(defineConfig(rsConfigBaseConstructor), content),
  });
  rsbuild.build(options)
}

export async function buildByRslib({ config, ...options }: EpmBuildOptions) {
  // 加载 `rsbuild.config.*` 配置文件
  const { content } = await loadConfigLib({ path: config });
  // @ts-ignore
  build(mergeRsbuildConfig(await defineConfigLib(rsConfigBaseConstructor)(), content), options)
}