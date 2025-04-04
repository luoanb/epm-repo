export const EXECPTIONS = {
  "1000": {
    code: "1000",
    msg: "这不是一个正确的项目路径",
  },
  "1001": {
    code: "1001",
    msg: "未找到对应模块，或对应模块并非‘源模块’",
  },
  "1002": {
    code: "1002",
    msg: "模块已在src_modules",
  },
  "1003": {
    code: "1003",
    msg: "请先调用init初始化更新数据函数",
  },
  "1004": {
    code: "1004",
    msg: "请确认确认项目的package.json的'srcModule.dist'配置是否正确",
  },
};

export type EXCEPTION_ENUM = keyof typeof EXECPTIONS;
