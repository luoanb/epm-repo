#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { execSync } from "child_process";
import { Exception } from "exception";
interface CliOptions {
  projectName?: string;
  template?: string;
}

async function main() {
  console.log("Welcome to create-epm! 🚀");

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
      choices: ["node", "web"],
    },
  ]);

  const options: CliOptions = { projectName, template };

  const targetDir = path.resolve(process.cwd(), options.projectName!);

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${options.projectName}" already exists.`);
    process.exit(1);
  }

  // Create project directory
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`Creating project in ${targetDir}...`);

  // Path to the templates directory
  const templatesDir = path.resolve(__dirname, "templates", options.template!);

  // Check if the selected template exists
  if (!fs.existsSync(templatesDir)) {
    return Exception.throw("1007", { contentMsg: options.template });
  }

  // Copy template files to the target directory
  copyDirectory(templatesDir, targetDir);

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
