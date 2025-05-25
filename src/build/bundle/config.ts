import { BuildOptions } from "esbuild";
import logPlugin from "./logPlugin";
export const bundleConfig: BuildOptions = {
  bundle: true,
  platform: "node",
  write: false,
  external: ["esbuild", "@microsoft/api-extractor"],
  plugins: [logPlugin],
};
