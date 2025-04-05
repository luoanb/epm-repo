import { test } from "vitest"
import { build } from "."

test("build base: 基础打包", { timeout: 1000 * 60 }, async () => {
  await build({ watch: false, all: false, projectNames: [] })
},)

// test("build base: 监听模式:根项目", { timeout: 1000 * 60 }, async () => {
//   await build({ watch: true, all: false, projectNames: [] })
// },)

// test("build base: 监听模式:publish项目", { timeout: 1000 * 60 }, async () => {
//   await build({ watch: true, all: false, projectNames: ['publish'] })
// },)

// test("build base: build模式:publish项目", { timeout: 1000 * 60 }, async () => {
//   await build({ watch: true, all: false, projectNames: ['publish'] })
// },)