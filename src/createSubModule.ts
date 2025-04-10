import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { Exception } from "exception";
import { execSync } from "child_process";
import { getFileDirPath, getRootDirname, SrcModuleInfo } from "module-ctrl";

interface CliOptions {
  projectName?: string;
  template?: string;
}

// 复制目录的工具函数
function copyDirectory(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function createSubModuleHandler(argv: CliOptions) {
  console.log("Welcome to create-submodule! 🚀");

  // 获取根目录路径
  const rootDir = getRootDirname();

  // 读取根目录的 package.json 数据
  const rootPackageJson = await SrcModuleInfo.readPackageInfo(rootDir);

  // 检查是否为根目录
  if (!(rootPackageJson || {}).srcModule?.isRoot) {
    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "你所在的项目并非根目录，是否继续？",
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("操作已取消。");
      return;
    }
  }

  // 模板目录路径
  const templatesDir = path.resolve(
    getFileDirPath(import.meta),
    "../",
    "templates"
  );

  // 检查模板目录是否存在
  if (!fs.existsSync(templatesDir)) {
    return Exception.throw("1008");
  }

  // 读取模板目录中的可用模板
  const availableTemplates = fs.readdirSync(templatesDir).filter((file) => {
    const filePath = path.join(templatesDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  if (availableTemplates.length === 0) {
    return Exception.throw("1009");
  }

  // 使用 inquirer 获取项目名和模板
  const { projectName: nameBase, template } = await inquirer.prompt([
    {
      name: "projectName",
      type: "input",
      message: "Enter your project name:",
      when: () => !argv.projectName,
      validate: (input) =>
        input.trim() !== "" || "Project name cannot be empty.",
    },
    {
      name: "template",
      type: "list",
      message: "Choose a template:",
      choices: availableTemplates,
    },
  ]);

  const projectName = argv.projectName || nameBase;
  // 目标目录路径
  const targetDir = path.resolve(rootDir, "src_modules", projectName);

  // 检查目标目录是否已存在
  if (fs.existsSync(targetDir)) {
    return Exception.throw("1010", {
      contentMsg: projectName,
    });
  }

  // 创建项目目录
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`Creating project in ${targetDir}...`);

  const selectedTemplateDir = path.join(templatesDir, template);

  // 检查所选模板是否存在
  if (!fs.existsSync(selectedTemplateDir)) {
    return Exception.throw("1007", { contentMsg: template });
  }

  // 复制模板文件到目标目录
  copyDirectory(selectedTemplateDir, targetDir);

  console.log("Installing dependencies...");
  try {
    execSync("pnpm install", { cwd: targetDir, stdio: "inherit" });
    console.log("Project setup complete! 🎉");
    console.log(
      `\nNext steps:\n  cd src_modules/${projectName}\n  pnpm run dev`
    );
  } catch (error) {
    console.error("Error installing dependencies:", error);
    process.exit(1);
  }
}
