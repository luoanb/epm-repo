export const EXECPTIONS = {
  "1000": {
    "code": "1000",
    "msg": "这不是一个正确的项目路径"
  },
  "1001": {
    "code": "1001",
    "msg": "未找到对应模块，或对应模块并非‘源模块’"
  },
  "1002": {
    "code": "1002",
    "msg": "模块已在src_modules"
  },
}

export type EXCEPTION_ENUM = keyof typeof EXECPTIONS