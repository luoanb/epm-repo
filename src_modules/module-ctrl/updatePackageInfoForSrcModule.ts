import { readdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { Exception } from "./Exception"
import { readPackageInfo } from "./cpModuleSToSrc"

const deps = ["devDependencies", "dependencies", "peerDependencies"]
// const defaultDependencies = "dependencies"


interface PackageDatasItem {
  /** 项目路径 */
  url: string,
  /** package.json Data */
  data: Record<string, any>,
}

interface SrcModuleItem {
  /** 项目路径 */
  url: string,
  /** 项目名称 */
  name: string
}

/**
 * 为SrcModule更新package.json信息
 */
export const updatePackageInfoForSrcModule = async (projectPath: string) => {
  const srcModulesDir = "src_modules"
  try {
    const packageStr = await readFile(path.join(projectPath, "package.json"), "utf-8")
    let packageData = JSON.parse(packageStr)
    const srcPath = path.join(projectPath, srcModulesDir)
    const files = await readdir(srcPath)

    const packageDatas: PackageDatasItem[] = []
    const srcModules: SrcModuleItem[] = []
    packageDatas.push({ url: projectPath, data: packageData })

    for (const f of files) {
      const mf = path.join(srcPath, f)
      const info = await readPackageInfo(mf)
      if (info) {
        packageDatas.push({
          url: mf,
          data: info
        })
        if (info.isSrcModule) {
          srcModules.push({
            url: mf, // 绝对路径
            name: info.name
          })
        }
      }
    }

    for (const pInfo of packageDatas) {
      // 没有src_modules不用更新
      if (!srcModules.length) {
        return
      }
      let newP = pInfo.data
      for (const sm of srcModules) {
        newP = updateDependenciesInPackageData(pInfo.data, sm.name, windowsPathToLinuxPath(path.relative(pInfo.url, sm.url)))
      }
      await writeFile(path.join(pInfo.url, "package.json"), JSON.stringify(newP, null, 2))
    }


  } catch (error) {
    throw Exception.throw("1000", { contentMsg: projectPath, error })
  }
}


/**
 * 更新指定package.json data 的依赖
 * @param packageData 
 * @param depName 
 * @param depPath 
 * @returns 
 */
const updateDependenciesInPackageData = (packageData: Record<string, any>, depName: string, depPath: string) => {
  let isExistInPackage = 0
  for (const dep of deps) {
    if (packageData[dep]?.[depName]) {
      packageData[dep][depName] = depPath
      isExistInPackage++
    }
  }
  // if (!isExistInPackage) {
  //   if (!packageData[defaultDependencies]) {
  //     packageData[defaultDependencies] = {}
  //   }
  //   packageData[defaultDependencies][depName] = depPath
  // }
  return packageData
}

function windowsPathToLinuxPath(windowsPath: string) {
  // 检查是否是绝对路径（以驱动器字母开头）
  const driveLetterPattern = /^[a-zA-Z]:/;
  if (driveLetterPattern.test(windowsPath)) {
    // 替换驱动器字母为挂载点路径（假设挂载点为 /mnt）
    windowsPath = windowsPath.replace(driveLetterPattern, (match) => `${match[0]}`);
  }

  // 替换所有反斜杠为正斜杠
  const linuxPath = windowsPath.replace(/\\/g, '/');
  return linuxPath;
}
