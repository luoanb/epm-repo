import { readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * 读取JSON文件
 * @param filePath 文本文件路径
 * @returns
 */
export const readJsonFile = async (filePath: string) => {
  try {
    const strData = await readFile(path.join(filePath), "utf-8");
    const data = JSON.parse(strData);
    return data as Record<string, any>;
  } catch (error) {
    return null;
  }
};

/**
 * 写文件
 * @param filePath
 * @param data
 * @param indent
 * @returns
 */
export const wirteJsonFile = async (
  filePath: string,
  data: any,
  indent = 0
) => {
  return await writeFile(filePath, JSON.stringify(data, null, indent), "utf-8");
};
