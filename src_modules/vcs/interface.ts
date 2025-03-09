export interface VCSCurrentInfo {
  /** 远程地址 */
  remote: string;
  /** 当前最新提交记录 */
  commitRecord: string;
  /** 是否是干净的工作区（无修改） */
  isCleanWorkspace: boolean;
}

/**
 * 版本插件需要实现的接口
 */
export interface VCSPlugin {
  /** 判断包是否无改动 */
  isCleanPackage: (packagePath: string) => Promise<boolean>;
  /**
   * 发布提交 把工作区内容提交版本管理
   * @param msg 备注
   * @returns 提交记录（保存到版本记录中）
   */
  publishCommit: (version: string, msg: string) => Promise<string>;
  /**
   * 根据版本记录重置指定版本的源码
   * @param record 版本记录
   */
  // updateFileByCommitRecord: (record: string) => Promise<void>;

  /**
   * 获取项目的版本管理信息
   * @param projectPath 项目路径
   * @returns
   */
  getCurrentInfo: (projectPath: string) => Promise<VCSCurrentInfo>;
}
