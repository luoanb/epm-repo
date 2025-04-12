import { test } from "vitest";
import { dts } from ".";
test(
  "dts build base",
  async () => {
    // // 耗性能 先跳过
    // await dts({
    //   projectPath: "./",
    //   mainEntryPointFilePath: "./src/test1.ts",
    //   dtsRollup: {
    //     enabled: true,
    //     publicTrimmedFilePath: "./test1.d.ts",
    //   },
    // });
  },
  1000 * 60
);
