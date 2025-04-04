import { buildOnePlatForm } from ".";
import { test } from "vitest"

test("js build base", async () => {
  buildOnePlatForm({
    isBin: true,
    platform: "node",
    format: "cjs",
    outdir: "./",
    entryPoints: [
      {
        in: './src/build/bundle/index.ts',
        out: './build.common',
      }
    ]
  })
})