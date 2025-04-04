"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src_modules/vcs/index.ts
var vcs_exports = {};
__export(vcs_exports, {
  Test: () => Test
});
module.exports = __toCommonJS(vcs_exports);
var Test = {
  /**模块测试 */
  name: "\u4E00\u5207\u4ECE\u6B64\u523B\u5F00\u59CB"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Test
});
