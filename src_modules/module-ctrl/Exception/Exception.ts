import { EXECPTIONS, EXCEPTION_ENUM } from "./enum";

export interface ExceptionOptions {
  /** 补充上下文 */
  contentMsg?: string,
  /** 原始错误 */
  error?: any,
  /** 仅抛一次,当throwOnce=true时,如果sourceError已经是定义的Exception时,将直接抛出(变相完成多态效果)
   * @default true
   */
  throwOnce?: boolean
}

export class Exception extends Error {
  constructor(public errorCode: string, message: string) {
    super(message);
  }
  public static throw(exception: EXCEPTION_ENUM, { contentMsg, error, throwOnce = true }: ExceptionOptions = {}): never {
    // 已经被处理过的error直接抛出
    if (error?.errorCode && throwOnce) {
      throw error
    }
    const msg = contentMsg ? `${EXECPTIONS[exception].msg}:${contentMsg}` : EXECPTIONS[exception].msg
    throw new Exception(EXECPTIONS[exception].code, msg)
  }
}

