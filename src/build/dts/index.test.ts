import { test } from "vitest"
import { dts } from "."
test("dts build base", async () => {
  await dts({
    projectPath: "./",
    mainEntryPointFilePath: "./src/test1.ts",
    dtsRollup: {
      enabled: true,
      publicTrimmedFilePath: "./test1.d.ts"
    }
  })
})