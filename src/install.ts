import { moduleCtrl } from "module-ctrl";
import { Shell } from "./utils/Shell";

export const install = async () => {
  console.log(
    "Installing dependencies for source modules...",
    moduleCtrl.srcModulesInfo
  );

  const cmds = Object.keys(moduleCtrl.srcModulesInfo?.moduleMap || {}).map(
    (key) => {
      return async () => {
        const m = moduleCtrl.srcModulesInfo?.moduleMap?.[key];
        if (m) {
          await Shell.exec(`cd ${m.url.fileUrl} && pnpm install`, true);
        }
      };
    }
  );
  for await (const cmd of cmds) {
    await cmd();
  }
};
