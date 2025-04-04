import { BuildOptions } from "esbuild";

export const bundleConfig: BuildOptions = {
  bundle: true,
  platform: "node",
  write: false,
  external: [
    "esbuild"
  ]
}