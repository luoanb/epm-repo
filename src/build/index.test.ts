import { test } from "vitest"
import { build } from "."

test("build base", async () => {
  await build()
}, { timeout: 1000 * 60 })