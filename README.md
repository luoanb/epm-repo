# Epm Repo

Es Module Publish Cli

提供一个新的资源分发思路：我们不再对打包的制品进行分发，而是直接分发源码。仅在最后制成具体 App 时才进行最后的打包。

# 模块规范

```json
// SrcModule规范
// package.json
{
  "platform": "node", // "web" | "node" 平台类型，可选值为 "web" 或 "node"
  "srcModule": {
    "isRoot": true, // 是否是根目录，布尔值
    "buildType": false, //  false | "lib" | "web-app" 构建类型，"web-app" 会注入 HTML，默认值为 false（不需要打包）,目前仅支持'web'|false
    "outputDir": "./dist", // 默认输出路径，用于指定创建导出文件时的默认配置，默认值为 "./dist"
    "srcDir": "./src", // 源代码目录路径，用于指定创建导出文件时的默认配置，默认值为 "./src"
    "dist": {
      ".": "./index.ts", // 主入口文件路径
      "./Xxx": "./xx.ts" // 其他导出文件路径
    },
    // 未实现, 源码仓库和版本管理
    "repo": {
      "origin": {
        "remote": "xxx", // 远程仓库地址
        "modulePath": "./", // 模块路径
        "vcs": "git", // 版本控制系统类型
        "versions": {
          "1.0.0": "67f66bc7069d7" // 版本号与对应的提交哈希值
        }
      }
    },
    "curentRepo": "origin", // 当前使用的仓库名称
    "versions": ["1.0.0"] // 可用的版本列表
  }
}
```

# 新特性

1. 库的使用者可以方便的对源码进行定制，对开源更友好。
2. 应用级别开发者不再因为要集成各种不同的分发制品而烦恼。
3. 库开发者也不需要考虑考虑制品问题，库的分发是唯一的，即 ES 模块，附加当代 build 工具所支持的其他各种资源，但是会统一。

# 语法支持

- jsx
- files
- js
- css/scss/sass

# 指令

```

Commands:
bin.cjs init 初始化：解析源模块并更新依赖关系
bin.cjs cp 复制源码库到 src_modules
bin.cjs updateInfo 更新 src_modules 依赖信息
bin.cjs updateTsconfig 更新 src_modules 模块的导入别名
bin.cjs shell 执行终端指令
bin.cjs build 打包
bin.cjs createSubModule <projectName> 创建子模块 [aliases: csm]
bin.cjs createExportFile <filetName> 创建可导出文件 [aliases: cf]

```

## 执行平台

| 平台     | 完成情况 |
| -------- | -------- |
| Web      | ✓        |
| Node     | ✓        |
| 小程序   | x        |
| 快应用   | x        |
| 跨端 App | x        |
| ES 通用  | x        |

## 源码格式支持

| 文件格式 | 完成情况 |
| -------- | -------- |
| TS       | ✓        |
| TSX      | x        |
| CSS      | x        |
| SVG      | x        |
| HTML     | x        |
| VUE      | x        |
| file     | x        |

## 内与外

底层技术是成熟，只是过于驳杂了，给模块开发者太多负担。所以项目的重点不是技术有多先进，而是对于开发者是否更简洁。

- 仅支持 pnpm（个人业余精力有限，无力做大而全的项目）
- 仅支持 typescript
- tsconfig.json 能否内置

  - 对打包的影响(打包可以在打包指令里定制 tsconfig)
  - 对 IDE 的影响(IDE 在 tsconfig 不外显的情况下，怎么做到智能类型提示支持，可能需要往插件方向考虑)
  - 外显的情况下，可在库里内置 tsconfig 基础配置（不同平台，不同版本），然后在项目 tsconfig 中再进一步继承

- 执行平台决定范围
  - 底层 API 功能（types）
  - output format

# 底层技术

项目底层基于 esbuild

目前发现 esbuild 仅可用于快速构建 Javascript 或 Typescript（生成 d.ts 也表现得很吃力），当应用场景脱离 JavaScript 范畴拓展到 HTML 时，他的插件机制和构建机制都表现得很吃力。

当构建 HTML 时，可能不是说以它为主，以插件形式支持 HTML,而是自行处理 HTML,提取出它能处理的资源来给去构建。
