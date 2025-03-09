import {
  cpModulesToSrc,
  cpSpecificSrcmodule,
  updatePackageInfoForSrcModule,
} from "module-ctrl";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
// const main = () => {
//   // cpModulesToSrc("E:\\workspace\\epm-repo")
//   // cpSpecificSrcmodule("E:\\workspace\\epm-repo", "typescript")
//   updatePackageInfoForSrcModule("E:\\workspace\\epm-repo")
// }

// main()

yargs(hideBin(process.argv))
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
  .strictCommands()
  .demandCommand(1) /// 至少需要一个子命令
  .help().argv;
