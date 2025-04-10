#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { execSync } from "child_process";
import { Exception } from "exception";
import { getFileDirPath } from "module-ctrl/pathUtil";
interface CliOptions {
  projectName?: string;
  template?: string;
}

async function main() {
  console.log("Welcome to create-epm! 🚀");

  // Path to the templates directory
  const templatesDir = path.resolve(
    getFileDirPath(import.meta),
    "../",
    "templates"
  );

  // Check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    return Exception.throw("1008");
  }

  // Read available templates from the templates directory
  const availableTemplates = fs.readdirSync(templatesDir).filter((file) => {
    const filePath = path.join(templatesDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  if (availableTemplates.length === 0) {
    return Exception.throw("1009");
  }

  // Prompt user for arguments
  const { projectName, template } = await inquirer.prompt([
    {
      name: "projectName",
      type: "input",
      message: "Enter your project name:",
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

  const options: CliOptions = { projectName, template };

  const targetDir = path.resolve(process.cwd(), options.projectName!);

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    return Exception.throw("1010", {
      contentMsg: options.projectName,
    });
  }

  // Create project directory
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`Creating project in ${targetDir}...`);

  const selectedTemplateDir = path.join(templatesDir, options.template!);

  // Check if the selected template exists
  if (!fs.existsSync(selectedTemplateDir)) {
    return Exception.throw("1007", { contentMsg: options.template });
  }

  // Copy template files to the target directory
  copyDirectory(selectedTemplateDir, targetDir);

  console.log("Installing dependencies...");
  try {
    execSync("pnpm install", { cwd: targetDir, stdio: "inherit" });
    console.log("Project setup complete! 🎉");
    console.log(`\nNext steps:\n  cd ${options.projectName}\n  pnpm run dev`);
  } catch (error) {
    console.error("Error installing dependencies:", error);
    process.exit(1);
  }
}

// Helper function to copy files from one directory to another
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
