export const EXECPTIONS = {
  "1000": "这不是一个正确的项目路径",
  "1001": "未找到对应模块，或对应模块并非‘源模块’",
  "1002": "模块已在src_modules",
  "1003": "请先调用init初始化更新数据函数",
  "1004": "请确认项目的package.json的'srcModule.dist'配置是否正确",
  "1005": "文件夹已存在",
  "1006": "创建子模块发生异常",
  "1007": "选择的模板不存在",
  "1008": "模板目录不存在",
  "1009": "模板目录为空，未找到可用模板",
  "1010": "目标目录已存在",
};

export type EXCEPTION_ENUM = keyof typeof EXECPTIONS;
