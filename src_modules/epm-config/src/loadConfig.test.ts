import { test } from "vitest";
import { loadConfig } from "./loadConfig";
import path from "path";
test("loadConfig", async () => {
  const res = await loadConfig();
  console.log(res);
  console.log(path.basename("./src/index.ts"));
});
