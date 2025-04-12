import { BuildOptions } from "esbuild";
export interface EpmBuildOptions {
  esbuild?: BuildOptions;
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
