import { htmlPlugin } from "@craftamap/esbuild-plugin-html";
import fs from "fs";

const loadHTMLTemplate = (filePath = "index.html") => {
  return fs.readFileSync(filePath, "utf-8");
};

export interface WebAppHtmlPluginOptions {
  inputHtmlPath: string;
  outHtmlPath: string;
  entryPoint: string;
  extraScripts?: (string | { src: string; attrs?: Record<string, string> })[];
}

export const WebAppHtmlPlugin = ({
  entryPoint,
  inputHtmlPath,
  outHtmlPath,
  extraScripts,
}: WebAppHtmlPluginOptions) => {
  const html = loadHTMLTemplate(inputHtmlPath);
  return htmlPlugin({
    files: [
      {
        entryPoints: [entryPoint],
        filename: outHtmlPath,
        htmlTemplate: html,
        extraScripts: extraScripts,
      },
    ],
  });
};
