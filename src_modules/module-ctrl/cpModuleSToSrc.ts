import { readdir, stat, readFile } from "fs/promises"
import fs, { statSync } from "fs"
import path from "path"
import cpy from "cpy"

export const cpModulesToSrc = async (projectPath: string) => {
  const sourcePath = path.join(projectPath, 'node_modules')
  const files = await readdir(sourcePath)
  const cpExecs = files.map(async (p) => {
    const packPath = path.join(sourcePath, p)
    if (await isSrcModule(packPath)) {
      const targetPath = path.join(projectPath, "src_modules", getLastFolderName(packPath))
      // 已存在的跳过
      if (fs.existsSync(targetPath)) {
        return Promise.resolve()
      }
      return await cpy(`${packPath}/**`, targetPath)
    } else {
      return Promise.resolve()
    }
  })
  return Promise.all(cpExecs)
}

const isNodeModule = async (filePath: string) => {
  return (await stat(filePath)).isDirectory() && fs.existsSync(path.join(filePath, "package.json"))
}

export const isSrcModule = async (filePath: string) => {
  const isNM = await isNodeModule(filePath)
  if (!isNM) {
    return false
  }
  const strData = await readFile(path.join(filePath, "package.json"), "utf-8")
  try {
    const data = JSON.parse(strData)
    return data?.isSrcModule

  } catch (error) {
    return false
  }

}

/**
 * 返回node_nodules的package信息, 如果不是node_modules则返回false
 * @param projectPath 项目文件夹 
 * @returns 
 */
export const readPackageInfo = async (projectPath: string) => {
  const isNM = await isNodeModule(projectPath)
  if (!isNM) {
    return false
  }
  const strData = await readFile(path.join(projectPath, "package.json"), "utf-8")
  try {
    const data = JSON.parse(strData)
    return data as Record<string, any>

  } catch (error) {
    return false
  }

}

function getLastFolderName(filePath: string): string {
  const sta = statSync(filePath);
  if (sta.isDirectory()) {
    return path.basename(filePath);
  } else {
    return path.basename(path.dirname(filePath));
  }
}
