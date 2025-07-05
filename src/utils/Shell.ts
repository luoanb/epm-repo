import { exec, execSync, spawn } from "child_process";
import iconv from "iconv-lite";
import chardet from "chardet";

export interface ShellExecRes {
  /** 执行结果:0:正确执行完, 1:进程执行出错,2:进程被终止,3:进程不存在 */
  code: 0 | 1 | 2 | 3;
  /** 提示 */
  msg?: string;
  /** 错误 */
  err?: any;
  /** 返回数据 */
  data?: any;
}

const isWindows = process.platform === "win32";
export class Shell {
  static isWindows = isWindows;
  /**
   * 判断命令是否存在
   * @param command
   * @returns
   */
  static commandIsExists(command: string) {
    return new Promise((resolve) => {
      const platform = process.platform;
      const cmd = platform === "win32" ? "where" : "which";

      exec(`${cmd} ${command}`, (error) => {
        resolve(!error);
      });
    });
  }
  /**
   * 判断命令是否存在:同步版本
   * @param command
   * @returns
   */
  static commandExistsSync(command: string) {
    try {
      const platform = process.platform;
      const cmd = platform === "win32" ? "where" : "which";
      execSync(`${cmd} ${command}`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 执行指令
   * @param command
   * @param interactive 是否交互式执行，默认false
   */
  static exec(command: string, interactive = false) {
    if (interactive) {
      return new Promise<ShellExecRes>((res) => {
        console.log("------------------------------");
        console.log(`Executing command: ${command}`);
        // 以shell模式交互式执行，继承stdio
        const child = spawn(command, {
          shell: true,
          stdio: "inherit",
        });
        child.on("error", (err) => {
          res({ code: 3, err });
        });
        child.on("close", (code, signal) => {
          if (code === 0) {
            res({ code: 0 });
          } else if (code === null) {
            res({ code: 2, data: { signal } });
          } else {
            res({ code: 1, data: { code } });
          }
        });
      });
    } else {
      return new Promise<ShellExecRes>((res) => {
        console.log(`Executing command: ${command}`);

        const child = exec(command, { encoding: "buffer" });
        child.stdout?.on("data", (data) => {
          // 检测编码
          const encoding = chardet.detect(data) || "utf-8"; // 默认使用 utf-8
          const out = iconv.decode(data, encoding);
          console.log(`${truncateString(command, 10)}: ${out}`);
        });
        // 实时输出标准错误
        child.stderr?.on("data", (data) => {
          const encoding = chardet.detect(data) || "utf-8";
          const out = iconv.decode(data, encoding);
          console.error(`${truncateString(command, 10)}: ${out}`);
        });
        child.on("error", (err) => {
          res({ code: 3, err });
        });
        child.on("close", (code, signal) => {
          if (code === 0) {
            res({ code: 0 });
          } else if (code === null) {
            res({ code: 2, data: { signal } });
          } else {
            res({ code: 1, data: { code } });
          }
        });
      });
    }
  }
}
// 缩略字符串 string...string
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  const halfLength = Math.floor(maxLength / 2);
  return str.slice(0, halfLength) + "..." + str.slice(-halfLength);
}
