import { EXECPTIONS, EXCEPTION_ENUM } from "./enum";

export class Exception extends Error {
  constructor(public errorCode: string, message: string) {
    super(message);
  }
  public static throw(exception: EXCEPTION_ENUM, contentMsg?: string): never {
    const msg = contentMsg ? `${EXECPTIONS[exception].msg}:${contentMsg}` : EXECPTIONS[exception].msg
    throw new Exception(EXECPTIONS[exception].code, msg)
  }
}

