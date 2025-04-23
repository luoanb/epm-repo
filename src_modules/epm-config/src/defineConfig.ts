import { BuildOptions, ServeOptions } from "esbuild";

export interface WebOptions {
  /**
   * 静态资源的目录
   * @default '/'
   */
  baseUrl?: string;
}

export interface EpmBuildOptions {
  /**
   * esbuild配置
   */
  esbuild?: BuildOptions;
  /**
   * esbuild服务器配置
   */
  serveOptions?: ServeOptions;
  /**
   * WebApp配置
   */
  web?: WebOptions;
}

export type EpmBuildOptionsType =
  | EpmBuildOptions
  | (() => EpmBuildOptions)
  | (() => Promise<EpmBuildOptions>);

export const defineConfig = async (config: EpmBuildOptionsType) => {
  if (typeof config === "function") {
    const result = await config();
    return result;
  }
  return config;
};
