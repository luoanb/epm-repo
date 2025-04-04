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
      Shell.exec(argv._.join(" "))
    },
  })
  .command({
    command: "build", // 打包
    describe: "打包",
    builder: {
      config: {
        alias: "c",
        describe: "配置文件路径",
        type: "string",
        default: "./rslib.config.ts",
      },
      watch: {
        alias: "w",
        describe: "是否开启监听",
        type: "boolean",
        default: false,
      },
      useRsbuild: {
        describe: "是否使用rsbuild打包",
        type: "boolean",
        default: false,
      }
    },
    async handler(argv: Record<string, any>) {
      console.log("argv", argv);
    },
  })
  .parserConfiguration({
    "unknown-options-as-args": true, // 将未知选项作为参数收集
  })
  .option("known", { type: "string" })
  // .strict(false)
  .demandCommand(1, Test.name) /// 至少需要一个子命令
  .help().argv;
