import * as esbuild from "esbuild";
import { load } from "cheerio";
import fs from "fs/promises";
import { buildOnePlatForm } from "../bundle";

export interface HtmlBuildOptions extends Partial<esbuild.BuildOptions> {
  path: string /** HTML 文件路径 */;
  /** 是否时可执行脚本 */
  isBin?: boolean;
  watch?: boolean;
  serve?: boolean;
  custom?: boolean;
  serveOptions?: esbuild.ServeOptions;
}

// 定义加载器类型
interface Loader {
  [ext: string]: string;
}

// 定义资源选择器类型
interface ResourceSelector {
  selector: string;
  attr: string;
  type: string; // 节点类型
}

// 定义 HTML5 资源选择器并标注节点类型
const resourceSelectors: ResourceSelector[] = [
  { selector: "script[src]", attr: "src", type: "script" }, // 脚本
  { selector: "img[src]", attr: "src", type: "image" }, // 图片
  {
    selector: 'link[href][rel="stylesheet"]',
    attr: "href",
    type: "stylesheet",
  }, // 样式表
  { selector: 'link[href][rel~="icon"]', attr: "href", type: "icon" }, // 图标
  { selector: "video[src]", attr: "src", type: "video" }, // 视频
  { selector: "audio[src]", attr: "src", type: "audio" }, // 音频
  { selector: "source[src]", attr: "src", type: "source" }, // 媒体资源
  { selector: "track[src]", attr: "src", type: "track" }, // 字幕轨道
  { selector: "embed[src]", attr: "src", type: "embed" }, // 嵌入内容
  { selector: "object[data]", attr: "data", type: "object" }, // 对象
];

export async function HtmlBuild(options: HtmlBuildOptions) {
  const htmlPath = options.path;
  const content = await fs.readFile(htmlPath, "utf8");
  const $ = load(content);

  // 收集资源并按类型分组
  const resources: Record<string, string[]> = {};
  resourceSelectors.forEach(({ selector, attr, type }) => {
    $(selector).each((i, el) => {
      const resource = $(el).attr(attr);
      if (!resource) return;
      if (!resources[type]) {
        resources[type] = [];
      }
      resources[type].push(resource);
    });
  });

  console.log("Collected resources by type:", resources);
  buildOnePlatForm({
    ...options,
    entryPoints: resources["script"],
  });
}
