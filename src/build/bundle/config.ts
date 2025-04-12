import { BuildOptions } from "esbuild";
import { pluginRename } from "./pluginRename";
import path from "path";
export const bundleConfig: BuildOptions = {
  bundle: true,
  platform: "node",
  write: false,
  external: [
    "esbuild",
    "@microsoft/api-extractor",
    "@craftamap/esbuild-plugin-html",
  ],
  plugins: [
    pluginRename({
      rename: async (file) => {
        return path.extname(file.path) == ".js"
          ? file.path.slice(0, -3)
          : file.path;
      },
    }),
  ],
};
