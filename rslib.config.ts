import { rsConfigBaseConstructor, swapDtsDistpath } from "./src/rsConfigBaseConstructor"
import { defineConfig } from "@rslib/core";

// @ts-ignore
export default defineConfig(async () => {
  return {
    ...  await rsConfigBaseConstructor(),
    lib: [
      {
        format: "cjs",
        syntax: "es2015",
        dts: {
          bundle: true,
          distPath: swapDtsDistpath,
        },
      },
    ],
  }
})