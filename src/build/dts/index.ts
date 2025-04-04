import { Extractor, ExtractorConfig, IConfigFile } from '@microsoft/api-extractor';
import { dtsConfig } from './config';
import { Shell } from '../../utils/Shell';
import path from 'path';
import { cwd } from 'process';
import { SrcModuleInfo } from 'module-ctrl';
export interface DtsOptions extends IConfigFile {

  /** 根路径 默认cwd() */
  root?: string
  /** 项目路径 默认 "./" */
  projectPath?: string
  showVerboseMessages?: boolean
}

export const dts = async ({ root = cwd(), projectPath = '', mainEntryPointFilePath, showVerboseMessages, ...options }: DtsOptions) => {
  const packageJson = await SrcModuleInfo.readPackageInfo(projectPath)
  if (!packageJson) {
    return
  }
  await Shell.exec(`tsc ${mainEntryPointFilePath} --declaration  --emitDeclarationOnly  --outDir ./node_modules/._dist_dts`)

  const aburl = path.join('./node_modules/._dist_dts', path.basename(mainEntryPointFilePath.replace(path.extname(mainEntryPointFilePath), ".d.ts")))
  const config = ExtractorConfig.prepare({
    configObject: { ...dtsConfig, ...options, mainEntryPointFilePath: aburl },
    configObjectFullPath: undefined,
    packageJsonFullPath: path.join(root, projectPath, "./package.json"),
    // @ts-expect-error name不包含在string?
    packageJson: packageJson
  })
  return Extractor.invoke(config, { showVerboseMessages })?.succeeded
}