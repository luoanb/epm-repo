import { moduleCtrl } from "module-ctrl";
import { Shell } from "./utils/Shell";

export const install = async () => {
  console.log(
    "Installing dependencies for source modules...",
    moduleCtrl.srcModulesInfo
  );

  Object.keys(moduleCtrl.srcModulesInfo?.moduleMap || {}).forEach((key) => {
    const m = moduleCtrl.srcModulesInfo?.moduleMap?.[key];
    if (m) {
      Shell.exec(`cd ${m.url.fileUrl} && pnpm install`);
    }
  });
};
