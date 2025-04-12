import { buildOnePlatForm } from ".";
import { test } from "vitest";

test("js build base", async () => {
  await buildOnePlatForm({
    isBin: true,
    platform: "node",
    format: "cjs",
    outdir: "./",
    entryPoints: [
      {
        in: "./src/test1.ts",
        out: "./dist/test1.js",
      },
    ],
  });
});
