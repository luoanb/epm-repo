import path from "node:path";

export interface UrlState {
  /** 以当前的root为参照，创建一个UrlState对象 */
  create: (url: string) => UrlState;
  /** 项目路径 */
  root: string;
  /** 文件系统路径(如果是相对路径，则是基于cwd()) */
  fileUrl: string;
  /** 基于root的相对路径 */
  url: string;
  toJSON: () => {
    root: string;
    fileUrl: string;
    url: string;
  };
  valueOf: () => string;
  toString: () => string;
}

/**
 * 把windows path 转为linux path
 * @param windowsPath
 * @param strongRelative 强制附加 "./"|"../"
 * @returns
 */
export function formatLinuxPath(windowsPath: string, strongRelative = false) {
  const isAbsolute = path.isAbsolute(windowsPath);
  // 检查是否是绝对路径（以驱动器字母开头）
  const driveLetterPattern = /^[a-zA-Z]:/;
  if (driveLetterPattern.test(windowsPath)) {
    // 替换驱动器字母为挂载点路径（假设挂载点为 /mnt）
    windowsPath = windowsPath.replace(
      driveLetterPattern,
      (match) => `${match[0]}`
    );
  }

  // 替换所有反斜杠为正斜杠
  const linuxPath = windowsPath.replace(/\\/g, "/");

  if (isAbsolute || !strongRelative) {
    return linuxPath;
  }
  if (linuxPath.startsWith("./") || linuxPath.startsWith("../")) {
    return linuxPath;
  }
  return `./${linuxPath}`;
}

/**
 * 创建一个UrlState对象
 * @param projectPath 项目路径
 * @param filePath 文件路径
 * @returns UrlState对象
 */
export function createUrlState(
  /** 项目路径 */
  projectPath: string,
  /** 文件路径 */
  filePath: string
): UrlState {
  const toUrl = (src: string) =>
    formatLinuxPath(path.relative(projectPath, src), true);

  const url = toUrl(filePath);
  /**
   * 创建一个UrlState对象
   * @param url 相对路径或绝对路径
   * @returns UrlState对象
   */
  const create = (url: string) => createUrlState(projectPath, url);

  return {
    /** 项目路径 */
    root: path.resolve(projectPath),
    /** 文件系统路径 */
    fileUrl: path.resolve(filePath),
    /** URL路径 */
    url,
    create,
    toJSON: function () {
      return {
        root: this.root,
        fileUrl: this.fileUrl,
        url: this.url,
      };
    },
    /**
     * 返回文件系统路径
     * @returns 文件系统路径
     */
    valueOf() {
      return this.fileUrl;
    },
    /**
     * 返回URL路径
     * @returns URL JSON
     */
    toString() {
      return JSON.stringify(this.toJSON());
    },
  };
}
