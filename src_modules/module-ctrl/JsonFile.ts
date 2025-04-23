import { readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * 读取JSON文件
 * @param filePath 文本文件路径
 * @returns
 */
export async function readJsonFile(
  filePath: string
): Promise<Record<string, any> | null> {
  try {
    const strData = await readFile(path.join(filePath), "utf-8");
    const data = JSON.parse(strData);
    return data as Record<string, any>;
  } catch (error) {
    return null;
  }
}

/**
 * 写文件
 * @param filePath
 * @param data
 * @param indent
 * @returns
 */
export async function wirteJsonFile(
  filePath: string,
  data: any,
  indent = 0
): Promise<void> {
  return await writeFile(filePath, JSON.stringify(data, null, indent), "utf-8");
}
