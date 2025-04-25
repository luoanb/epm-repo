import * as esbuild from "esbuild";
import { load } from "cheerio";
import fs from "fs/promises";
import { buildOnePlatForm } from "../bundle";
import connect from "connect";
import { formatLinuxPath } from "module-ctrl";
import path from "path";
import http from "http";
import { Cache_Createor } from "module-ctrl";
import * as fileType from "file-type";
import { pathToFileURL } from "url";
import { cwd } from "process";
import { mkdirSync, existsSync } from "fs";

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

type ResType = null | {
  content: any;
  mimeType: string | undefined;
};

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

const esbuildSourceExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

/**
 * 判断是否是静态资源路径
 * @param url 资源路径
 * @returns
 */
function isStaticUrl(url: string) {
  // 是否是本地路径
  return url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
}

function getHttpUrl(file: esbuild.OutputFile, serveDir: string) {
  return formatLinuxPath(
    path.join("/", path.relative(serveDir || "./dist", file.path))
  );
}

// TODO build写文件& 仅监听模式写文件
export async function HtmlBuild({
  path: htmlPath,
  outdir = "./dist",
  ...options
}: HtmlBuildOptions) {
  const content = await fs.readFile(htmlPath, "utf8"); // TODO 监听文件变化
  const $ = load(content);

  // 收集资源并按类型分组
  const esbuildResources: { url: string; type: string }[] = [];
  const resources: { url: string; type: string }[] = [];
  resourceSelectors.forEach(({ selector, attr, type }) => {
    $(selector).each((i, el) => {
      const resource = $(el).attr(attr);

      if (!resource) return;
      if (!isStaticUrl(resource)) return;
      if (esbuildSourceExts.includes(path.extname(resource))) {
        $(el).remove();
        esbuildResources.push({ url: resource, type });
      } else {
        resources.push({ url: resource, type });
      }
    });
  });

  let appRes: Record<string, esbuild.OutputFile> = {};
  let emptyHtml = $.html();
  let $res = load(emptyHtml);

  await buildOnePlatForm({
    ...options,
    metafile: true,
    serve: false,
    outdir,
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
              appRes[getHttpUrl(file, outdir)] = file;
              $res = load(emptyHtml);
              $res("body").append(
                `<script type="module" src="${getHttpUrl(
                  file,
                  outdir
                )}"></script>`
              );
              if (options.write) {
                // 更新build导出文件
                if (!existsSync(path.dirname(file.path))) {
                  mkdirSync(path.dirname(file.path), { recursive: true });
                }
                fs.writeFile(file.path, file.contents);
                // 更新html文件
                fs.writeFile(
                  path.join(cwd(), outdir, path.basename(htmlPath)),
                  $res.html()
                );
              }
            });
          });
        },
      },
    ],
    entryPoints: esbuildResources.map((it) => it.url),
  });

  if (options.serve) {
    const app = connect();
    const fileCache = Cache_Createor(async (filePath) => {
      try {
        const content = await fs.readFile(filePath);
        return {
          content,
          mimeType: (await fileType.fileTypeFromBuffer(content))?.mime,
        };
      } catch (error) {
        return null;
      }
    });
    app.use(async (req, res) => {
      if (!req.url) {
        res.end($res.html());
        return;
      }
      let file: ResType = null;

      if (appRes[req.url]?.contents) {
        file = {
          content: appRes[req.url]?.contents,
          mimeType: "application/javascript",
        };
      }
      if (!file) {
        file = await fileCache.getValue(path.join(cwd(), req.url));
      }
      // TODO 热更新
      // TODO 动态处理其他资源类型
      if (file) {
        res.setHeader("Content-Type", file.mimeType || "text/plain");
        res.end(file.content);
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
  } else if (options.write) {
    resources.forEach(({ url }) => {
      const targetPath = path.join(cwd(), outdir, url);
      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true });
      }
      fs.rename(path.join(cwd(), url), targetPath);
    });
  }
}
