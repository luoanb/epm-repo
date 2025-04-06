import { test, expect } from "vitest";
import { getFilePath } from "./pathUtil";
test("pathUtil", () => {
  expect(getFilePath(import.meta)).toBe(
    "E:\\workspace\\epm-repo\\src_modules\\create-epm\\pathUtil.test.ts"
  );
});
