import { Exception } from "../exception";
import { VCSCurrentInfo, VCSPlugin } from "./interface";

export class Git implements VCSPlugin {
  async isCleanPackage(packagePath: string) {
    return Exception.throw("1003");
  }
  publishCommit = async (version: string, msg: string) => {
    Exception.throw("1003");
  };
  getCurrentInfo = async (projectPath: string) => {
    Exception.throw("1003");
  };
}
