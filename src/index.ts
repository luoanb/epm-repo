import { cpModulesToSrc, cpSpecificSrcmodule, updatePackageInfoForSrcModule } from "../src_modules/module-ctrl"

const main = () => {
  // cpModulesToSrc("E:\\workspace\\epm-repo")
  // cpSpecificSrcmodule("E:\\workspace\\epm-repo", "typescript")
  updatePackageInfoForSrcModule("E:\\workspace\\epm-repo")
}

main()