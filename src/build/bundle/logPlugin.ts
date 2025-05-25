import { Plugin } from "esbuild";

const logPlugin: Plugin = {
  name: "log-plugin",
  setup(build) {
    build.onStart(() => {
      // 处理多种入口文件格式（数组、对象、字符串）
      const formatEntry = (entry: unknown) => {
        const formatItem = (it: any) => (typeof it == "object" ? it.in : it);

        if (!entry) return [];
        if (Array.isArray(entry)) return entry.map(formatItem);
        if (typeof entry === "object")
          return Object.values(entry).map(formatItem);
        return [formatItem(entry)];
      };

      const entries = formatEntry(build.initialOptions.entryPoints);
      const entryInfo = entries.length
        ? `入口文件：${entries.join(", ")}`
        : "未指定入口文件";
      // console.log(entries);
      console.log(`[编译开始] ${entryInfo}`);
    });

    build.onEnd(() => {
      console.log("[编译完成!]");
    });
  },
};

export default logPlugin;
