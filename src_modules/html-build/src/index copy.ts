import { load } from "cheerio";
import path from "node:path";
import fs from "fs-extra";
import type * as esbuild from "esbuild";
import { getEsmPath, windowsPathToLinuxPath } from "module-ctrl";

// 定义加载器类型
interface Loader {
  [ext: string]: string;
}

// 定义 HTML 入口项类型
interface HtmlEntry {
  htmlPath: string;
  originalContent: string;
  otherResources: string[];
  resolveDir: string;
  scripts: string[];
}

// 定义资源选择器类型
interface ResourceSelector {
  selector: string;
  attr: string;
}

const getLoader = (ext: string): string => {
  const loaders: Loader = {
    ".js": "js",
    ".ts": "ts",
    ".jsx": "jsx",
    ".tsx": "tsx",
    ".mjs": "js",
    ".cjs": "js",
  };
  return loaders[ext] || "js";
};

export default function PluginHtml() {
  return {
    name: "epm-esbuild-plugin-html",
    setup(build) {
      build.initialOptions.metafile = true;
      const htmlEntries: HtmlEntry[] = [];

      // 处理 HTML 入口文件
      build.onResolve({ filter: /\.html$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: "html",
        pluginData: { resolveDir: args.resolveDir },
      }));

      // 加载并解析 HTML
      build.onLoad({ filter: /.*/, namespace: "html" }, async (args) => {
        const { resolveDir } = args.pluginData;
        const htmlPath = args.path;
        const content = await fs.readFile(htmlPath, "utf8");
        const $ = load(content);

        const scripts: { path: string; loader: string; absPath: string }[] = [];
        const otherResources = new Set<string>();

        // 定义 HTML5 资源选择器
        const resourceSelectors: ResourceSelector[] = [
          { selector: "script[src]", attr: "src" },
          { selector: "img[src]", attr: "src" },
          { selector: 'link[href][rel="stylesheet"]', attr: "href" },
          { selector: 'link[href][rel~="icon"]', attr: "href" },
          { selector: "video[src]", attr: "src" },
          { selector: "audio[src]", attr: "src" },
          { selector: "source[src]", attr: "src" },
          { selector: "track[src]", attr: "src" },
          { selector: "embed[src]", attr: "src" },
          { selector: "object[data]", attr: "data" },
        ];

        // 收集资源并处理脚本
        const resources: string[] = [];
        resourceSelectors.forEach(({ selector, attr }) => {
          $(selector).each((i, el) => {
            const resource = $(el).attr(attr);
            if (!resource) return;
            resources.push(resource);
          });
        });

        const olveDatas = await Promise.all(
          resources.map(async (resource) => {
            await build.resolve(resource, {
              resolveDir,
              kind: "entry-point",
            });
          })
        );

        console.log("olveDatas", olveDatas);

        // console.log(build);
        // htmlEntries.push({
        //   htmlPath,
        //   originalContent: content,
        //   otherResources: [...otherResources],
        //   resolveDir,
        //   scripts: scripts.map((s) => s.absPath),
        // });
        return {
          contents: $.html(),
          loader: "file",
        };
      });

      build.onEnd(async (result) => {
        const metafile = result.metafile;
        console.log(metafile, "metafile");
      });

      // // 构建完成后处理资源
      // build.onEnd(async (result) => {
      //   const { outdir = "dist" } = build.initialOptions;
      //   const metafile = result.metafile;

      //   if (!metafile) return;
      //   await Promise.all(
      //     htmlEntries.map(async (entry) => {
      //       const { htmlPath, originalContent, otherResources, resolveDir } =
      //         entry;
      //       const $ = load(originalContent);

      //       // 更新脚本引用
      //       $("script[src]").each((i, el) => {
      //         const src = $(el).attr("src");
      //         if (!src) return;
      //         const absPath = path.resolve(resolveDir, src);

      //         const outputEntry = Object.values(metafile.outputs).find(
      //           (o) => o.entryPoint === absPath
      //         );
      //         if (!outputEntry) return;

      //         const outputPath = Object.keys(metafile.outputs).find(
      //           (k) => metafile.outputs[k] === outputEntry
      //         );
      //         if (!outputPath) return;
      //         const relativePath = path.relative(outdir, outputPath);
      //         $(el).attr("src", relativePath);
      //       });

      //       // 处理其他资源
      //       await Promise.all(
      //         [...otherResources].map(async (resource) => {
      //           const srcPath = path.resolve(resolveDir, resource);
      //           const destPath = path.join(
      //             outdir,
      //             path.relative(resolveDir, srcPath)
      //           );

      //           await fs.ensureDir(path.dirname(destPath));
      //           await fs.copy(srcPath, destPath);

      //           // 更新 HTML 中的资源路径
      //           $(`[href="${resource}"], [src="${resource}"]`).each((i, el) => {
      //             const attr = el.name === "link" ? "href" : "src";
      //             const relativePath = path.relative(
      //               path.dirname(fileURLToPath(import.meta.url)),
      //               destPath
      //             );
      //             $(el).attr(attr, relativePath);
      //           });
      //         })
      //       );

      //       // 输出最终 HTML
      //       const outputHtmlPath = path.join(outdir, path.basename(htmlPath));
      //       // await fs.outputFile(outputHtmlPath, $.html());
      //       console.log($.html(), "outputHtmlPath);");
      //     })
      //   );
      // });
    },
  } as esbuild.Plugin;
}
