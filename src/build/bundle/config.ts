import { BuildOptions } from "esbuild";

export const config: BuildOptions = {
  bundle: true,
  platform: "node",
  write: true,
  external: [
    "esbuild"
  ]
}