import { readdir, stat, readFile } from "fs/promises"
import fs from "fs"
import path from "path"
import cpy from "cpy"

export const cpModuleSToSrc = async (projectPath: string) => {
  const files = await readdir(path.join(projectPath, 'node_modules'))
  const cpExecs = files.map(async (p) => {
    if (await isSrcModule(p)) {
      return await cpy(p, path.join(projectPath, getLastFolderName(p)))
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
  const dirname = path.dirname(filePath);
  return path.basename(dirname);
}
