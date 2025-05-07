import * as esbuild from "esbuild";
import { load } from "cheerio";
import fs from "fs/promises";
import { buildOnePlatForm } from "../bundle";
import connect from "connect";
import { formatLinuxPath } from "module-ctrl";
import path, { dirname } from "path";
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
  /**
   * 开发或生产环境服务的公共基础路径
   * @default '/'
   */
  base?: string;
  /**
   * 需要esbuild构建的文件的后缀
   * @default ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"
   **/
  esbuildSourceExts?: string[];
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

/**
 * 根据文件后缀返回对应的完整 DOM 节点
 * @param filePath 文件路径
 * @returns 对应的完整 DOM 节点字符串
 */
function getDomTagByExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  switch (ext) {
    case ".js":
    case ".mjs":
    case ".cjs":
      return `<script src="${fileName}" type="module"></script>`;
    case ".css":
      return `<link href="${fileName}" rel="stylesheet">`;
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".svg":
      return `<img src="${fileName}" alt="">`;
    case ".ico":
      return `<link href="${fileName}" rel="icon">`;
    case ".mp4":
    case ".webm":
    case ".ogg":
      return `<video src="${fileName}" controls></video>`;
    case ".mp3":
    case ".wav":
    case ".flac":
      return `<audio src="${fileName}" controls></audio>`;
    case ".ttf":
    case ".woff":
    case ".woff2":
      return `<style>@font-face { font-family: 'CustomFont'; src: url('${fileName}'); }</style>`;
    default:
      return `<!-- Unsupported file type: ${fileName} -->`;
  }
}

function isEmpty(value: any) {
  return typeof value === "undefined";
}

// TODO html多js文件构建时, 会携带原始路径的地址,这时候可能会导致html上拼接的路径不对
export async function HtmlBuild({
  path: htmlPath,
  outdir = "./dist",
  base = "/",
  esbuildSourceExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
  ...options
}: HtmlBuildOptions) {
  const content = await fs.readFile(htmlPath, "utf8"); // TODO 监听文件变化
  const $ = load(content);

  // 收集资源并按类型分组
  const esbuildResources: { url: string; type: string; fileUrl: string }[] = [];
  const resources: { url: string; type: string; fileUrl: string }[] = [];
  resourceSelectors.forEach(({ selector, attr, type }) => {
    $(selector).each((i, el) => {
      const resource = $(el).attr(attr);

      if (!resource) return;
      if (!isStaticUrl(resource) || !isEmpty($(el).attr("ignore"))) return; // ignore 不处理
      if (
        esbuildSourceExts.includes(path.extname(resource)) &&
        isEmpty($(el).attr("copy")) // 标注copy表示无需esbuild关注
      ) {
        $(el).remove();
        esbuildResources.push({
          url: path.join(dirname(htmlPath), resource),
          fileUrl: path.join(dirname(htmlPath), resource),
          type,
        });
      } else {
        resources.push({
          url: resource,
          type,
          fileUrl: path.join(dirname(htmlPath), resource),
        });
      }
    });
  });

  let appRes: Record<string, esbuild.OutputFile> = {};
  let emptyHtml = $.html();
  let $res = load(emptyHtml);

  const write = options.write && !options.serve;

  await buildOnePlatForm({
    ...options,
    metafile: true,
    serve: false,
    outdir,
    watch: options.serve || options.watch,
    write,
    plugins: [
      ...(options.plugins || []),
      {
        name: "get-resource",
        setup(build) {
          build.onEnd(async (result) => {
            // 重置html
            $res = load(emptyHtml);
            result.outputFiles?.forEach((file) => {
              appRes[getHttpUrl(file, outdir)] = file;
              $res("body").append(
                getDomTagByExtension(getHttpUrl(file, outdir))
              );
              if (write) {
                // 更新build导出文件
                if (!existsSync(path.dirname(file.path))) {
                  mkdirSync(path.dirname(file.path), { recursive: true });
                }
                fs.writeFile(file.path, file.contents);
              }
            });
            if (write) {
              // 更新html文件
              fs.writeFile(
                path.join(cwd(), outdir, path.basename(htmlPath)),
                $res.html()
              );
            }
          });
        },
      },
    ],
    entryPoints: esbuildResources.map((it) => it.fileUrl),
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
          : `http://127.0.0.1:${address?.port}`
      );
    });
  } else if (options.write) {
    resources.forEach(({ url, fileUrl }) => {
      const targetPath = path.join(cwd(), outdir, url);
      if (!existsSync(dirname(targetPath))) {
        mkdirSync(dirname(targetPath), { recursive: true });
      }
      fs.copyFile(path.join(cwd(), fileUrl), targetPath);
    });
  }
}
