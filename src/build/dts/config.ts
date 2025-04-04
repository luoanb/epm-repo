import { IConfigFile } from "@microsoft/api-extractor";


export const dtsConfig: Partial<IConfigFile> = {
  projectFolder: "./",
  compiler: {
    tsconfigFilePath: "./tsconfig.json"
  }
}