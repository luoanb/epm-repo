import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export interface Meta {
  url: string;
}
/**
 * 获取当前模块路径,取决于调用所在的文件，build之后，会指向build后的文件
 * @description 所以如无必要，不推荐build，可能导致开发和生产环境路径不一致
 * @param meta import.meta
 * @returns
 */
export const getFilePath = (meta: Meta) =>
  meta?.url ? fileURLToPath(meta.url) : __filename;
/**
 * 获取当前模块路径
 * @param meta import.meta
 * @returns
 */
export const getFileDirPath = (meta: Meta) => dirname(getFilePath(meta));

/**
 * 获取当前模块root目录
 * @returns
 */
export const getRootDirname = () => process.cwd();
