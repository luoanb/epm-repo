import type { RsbuildPlugin } from "@rsbuild/core";

/**
 * 批量注册rspack插件
 * @param RspackPluginInstance
 * @returns
 */
export const RegRspackPlugins = (
  ...RspackPluginInstance: any[]
): RsbuildPlugin => ({
  name: "rsg-repack-plugin",
  setup(api) {
    api.modifyRspackConfig((config) => {
      config.plugins?.push(...RspackPluginInstance);
    });
  },
});
