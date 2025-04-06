import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export interface Meta {
  url: string;
}
/**
 * 获取当前模块路径
 * @param meta import.meta
 * @returns
 */
export const getFilePath = (meta: Meta) => fileURLToPath(meta.url);
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
