import * as esbuild from "esbuild";
import { load } from "cheerio";
import fs from "fs/promises";
import { buildOnePlatForm } from "../bundle";
import connect from "connect";
import { formatLinuxPath } from "module-ctrl";
import path from "path";
import http from "http";

export interface HtmlBuildOptions extends Partial<esbuild.BuildOptions> {
  path: string /** HTML 文件路径 */;
  /** 是否时可执行脚本 */
  isBin?: boolean;
  watch?: boolean;
  serve?: boolean;
  custom?: boolean;
  serveOptions?: esbuild.ServeOptions;
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

function getHttpUrl(file: esbuild.OutputFile, serveDir: string) {
  return formatLinuxPath(
    path.join("/", path.relative(serveDir || "./dist", file.path))
  );
}

// TODO build写文件& 仅监听模式写文件
export async function HtmlBuild({
  path: htmlPath,
  ...options
}: HtmlBuildOptions) {
  const content = await fs.readFile(htmlPath, "utf8"); // TODO 监听文件变化
  const $ = load(content);

  // 收集资源并按类型分组
  const resources: Record<string, string[]> = {};
  resourceSelectors.forEach(({ selector, attr, type }) => {
    $(selector).each((i, el) => {
      const resource = $(el).attr(attr);
      if (!resource) return;
      $(el).remove();
      if (!resources[type]) {
        resources[type] = [];
      }
      resources[type].push(resource);
    });
  });

  console.log("Collected resources by type:", resources);

  let appRes: Record<string, esbuild.OutputFile> = {};
  let emptyHtml = $.html();
  let $res = load(emptyHtml);
  const res = await buildOnePlatForm({
    ...options,
    metafile: true,
    serve: false,
    watch: options.serve || options.watch,
    write: options.write && !options.serve,
    plugins: [
      ...(options.plugins || []),
      {
        name: "get-resource",
        setup(build) {
          build.onEnd(async (result) => {
            console.log(result, "result");
            result.outputFiles?.forEach((file) => {
              if (options.serve) {
                appRes[getHttpUrl(file, options.outdir || "./dist")] = file;
                $res = load(emptyHtml);
                $res("body").append(
                  `<script type="module" src="${getHttpUrl(
                    file,
                    options.outdir || "./dist"
                  )}"></script>`
                );
              }
            });
          });
        },
      },
    ],
    entryPoints: resources["script"], // TODO // 其他资源类型 取决于esbuild的loader和插件
  });

  if (options.serve) {
    const app = connect();
    app.use((req, res) => {
      if (!req.url) {
        res.end($res.html());
        return;
      }
      const file = appRes[req.url];
      // TODO 热更新
      // TODO 动态处理其他资源类型
      if (file) {
        res.setHeader("Content-Type", "application/javascript");
        res.end(file.contents);
      } else {
        res.setHeader("Content-Type", "text/html");
        res.end($res.html());
      }
    });
    const serve = http.createServer(app);
    serve.listen(options.serveOptions?.port || 3000, () => {
      const address = serve.address();
      console.log(
        "Server running at:",
        typeof address === "string"
          ? address
          : `${address?.address}:${address?.port}`
      );
    });
  }
}
