#!/usr/bin/env node

import {
  cpModulesToSrc,
  cpSpecificSrcmodule,
  updatePackageInfoForSrcModule,
} from "module-ctrl";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { setTsconfigSrcmodule } from "./setTsconfigSrcmodule";
import { Test } from "vcs";
import { Shell } from "./utils/Shell";
import { build } from "./build";
import { createSubModuleHandler } from "./createSubModule";
import { createExportFile } from "./createExportFile";
import { switchModuleDistStatus } from "./swithModuleDistStatus";

yargs(hideBin(process.argv))
  .command({
    command: "init", // 不具名参数
    describe: "初始化：解析源模块并更新依赖关系",
    builder: {
      projectPath: {
        describe: "项目路径: 默认当前路径，全量",
        type: "string",
        default: "./",
      },
    },
    async handler(argv: Record<string, any>) {
      await cpModulesToSrc(argv.projectPath);
      await updatePackageInfoForSrcModule(argv.projectPath);
    },
  })
  .command({
    command: "cp", // 不具名参数
    describe: "复制源码库到src_modules",
    builder: {
      projectPath: {
        describe: "项目路径: 默认当前路径",
        type: "string",
        default: "./",
      },
      moduleName: {
        describe: "指定具体模块",
        type: "string",
        default: "",
      },
      all: {
        describe: "复制所有",
        type: "boolean",
        default: false,
      },
    },
    async handler(argv: Record<string, any>) {
      if (argv.all) {
        await cpModulesToSrc(argv.projectPath);
      } else {
        await cpSpecificSrcmodule(argv.projectPath, argv.moduleName);
      }
    },
  })
  .command({
    command: "updateInfo", // 不具名参数
    describe: "更新src_modules依赖信息",
    builder: {
      projectPath: {
        describe: "项目路径: 默认当前路径，全量",
        type: "string",
        default: "./",
      },
    },
    async handler(argv: Record<string, any>) {
      await updatePackageInfoForSrcModule(argv.projectPath);
    },
  })
  .command({
    command: "updateTsconfig", // 不具名参数
    describe: "更新src_modules模块的导入别名",
    builder: {
      projectPath: {
        describe: "项目路径: 默认当前路径，全量",
        type: "string",
        default: "./",
      },
    },
    async handler(argv: Record<string, any>) {
      await setTsconfigSrcmodule(argv.projectPath);
    },
  })
  .command({
    command: "shell", // 执行shell指令
    describe: "执行终端指令",
    builder: {},
    async handler(argv: Record<string, any>) {
      const v: string[] = argv._;
      const index = v.findIndex((i: string) => i == "shell");
      const params = v.slice(index + 1);
      Shell.exec(params.join(" "));
    },
  })
  .command({
    command: "build", // 打包
    describe: "打包",
    builder: {
      watch: {
        alias: "w",
        describe:
          "是否开启监听, 为了提升性能，监听模式只会打包根模块或请指定具体模块",
        type: "boolean",
        default: false,
      },
      projectNames: {
        alias: "p",
        describe: "指定具体项目，项目名（packageJson.name）,优先级高于--all",
        type: "array",
      },
      all: {
        describe: "是否打包全部: build模式默认开启，监听模式默认关闭",
        type: "boolean",
        default: false,
      },
      dts: {
        describe: "是否强制打包d.ts声明文明(默认不生成d.ts)",
        type: "boolean",
        default: false,
      },
      serve: {
        describe:
          "是否开启服务器，默认不开启（优先级低于--watch），开启后会自动监听文件变化并重新打包",
        type: "boolean",
        default: false,
      },
    },
    async handler(argv: Record<string, any>) {
      // @ts-expect-error
      await build(argv);
    },
  })
  .command({
    command: "createSubModule <projectName>", // 创建子模块
    describe: "创建子模块",
    aliases: ["csm"],
    async handler(argv: Record<string, any>) {
      if (!argv.projectName) {
        console.error("项目名称不能为空！");
        return;
      }
      await createSubModuleHandler(argv);
    },
  })
  .command({
    command: "createExportFile <filetName>", // 创建子模块
    describe: "创建可导出文件",
    aliases: ["cf"],
    async handler(argv: Record<string, any>) {
      if (!argv.filetName) {
        console.error("文件名称不能为空！");
        return;
      }
      await createExportFile(argv.filetName);
    },
  })
  .command({
    command: "swithBuildMode <projectName>", // 切换指定模块的打包模式
    describe:
      "切换指定模块的打包模式(源码模式-> 构建模式，构建模式-> 源码模式)",
    aliases: ["sbm"],
    async handler(argv: Record<string, any>) {
      if (!argv.projectName) {
        console.error("项目名称不能为空！");
        return;
      }
      await switchModuleDistStatus(argv.projectName);
    },
  })
  .fail((msg, err) => {
    if (err) {
      // 如果是程序内部错误，直接抛出
      console.error("Error:", err.message);
    } else {
      // 如果是命令解析错误，输出自定义错误信息
      console.error("Command Error:", msg);
    }
    process.exit(1); // 退出程序
  })
  .parserConfiguration({
    "unknown-options-as-args": true, // 将未知选项作为参数收集
  })
  .option("known", { type: "string" })
  // .strict(false)
  .demandCommand(1, Test.name) /// 至少需要一个子命令
  .help().argv;
