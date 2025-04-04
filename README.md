# Epm Repo

Es Module Publish Cli

提供一个新的资源分发思路：我们不再对打包的制品进行分发，而是直接分发源码。仅在最后制成具体 App 时才进行最后的打包。

`npx esbuild src/build/bundle/index.ts --outfile=build.js --bundle --platform=node --external:esbuild`

# 模块规范

```json
// package.json
{
  "srcModule": {
    "repo": {
      "origin": {
        "remote": "xxx",
        "modulePath": "./",
        "vcs": "git",
        "versions": {
          "1.0.0": "67f66bc7069d7",
        },
      },
    },
    "build":true,
    "curentRepo": "origin",
    "versions": ["1.0.0"],
  },
};
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

| 指令          | 作用           | 备注                                                                                                 |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| init          | 初始化项目     |                                                                                                      |
| updateInfo    | 更新项目信息   |                                                                                                      |
| creat         | 创建一个子模块 | 可选执行平台创建不同平台的项目                                                                       |
| creat-project | 创建项目       | 可能以 create-epm 项目形式提供                                                                       |
| change-repo   | 变更源码地址   |                                                                                                      |
| status        | 获取仓库状态   |                                                                                                      |
| publish       | 发布仓库       | 可以大中小三个版本递增发布，可指定版本发布                                                           |
| rename        | 重命名         | 定制发布开源且三方源码必备                                                                           |
| build         | 制品打包       | 它应该提供主流的打包支持，且底层唯一，即只要是 epm，相互直接是可以随便复用的，除非执行平台存在不一致 |

## 执行平台

1. Web
2. Node
3. 小程序
4. 快应用
5. 跨端 App
6. ES 通用

## 内与外

底层技术是成熟，只是过于驳杂了，给模块开发者太多负担。所以项目的重点不是技术有多先进，而是对于开发者是否更简洁。

- 仅支持 pnpm（个人业余精力有限，无力做大而全的项目）
- 仅支持 typescript
- rebuild.config.ts 应该内置，不由使用者主动定义（目前需要抛出初步内容仅包含 source 配置）
- tsconfig.json 能否内置

  - 对打包的影响(打包可以在打包指令里定制 tsconfig)
  - 对 IDE 的影响(IDE 在 tsconfig 不外显的情况下，怎么做到智能类型提示支持，可能需要往插件方向考虑)
  - 外显的情况下，可在库里内置 tsconfig 基础配置（不同平台，不同版本），然后在项目 tsconfig 中再进一步继承

- 执行平台决定范围
  - 底层 API 功能（types）
  - output format

# 底层技术

项目底层基于 Rebuild
