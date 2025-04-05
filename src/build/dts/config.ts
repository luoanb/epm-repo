import { IConfigFile } from "@microsoft/api-extractor";

export const dtsConfig: Partial<IConfigFile> = {
  compiler: {
    tsconfigFilePath: "./tsconfig.json",
  },
};
