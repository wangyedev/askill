import * as fs from "node:fs";
import * as path from "node:path";

export function copySkillDir(sourceDir: string, targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(sourceDir, targetDir);
}

function copyRecursive(src: string, dest: string): void {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function removeSkillDir(skillDir: string): void {
  if (fs.existsSync(skillDir)) {
    fs.rmSync(skillDir, { recursive: true, force: true });
  }
}

export function validateSkillMd(skillDir: string): { valid: boolean; warning?: string } {
  const skillMdPath = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) {
    return { valid: false, warning: `No SKILL.md found in ${skillDir}` };
  }
  return { valid: true };
}

export function locateSkillInRepo(repoDir: string, subdirectory: string | null): string {
  if (subdirectory) {
    const skillPath = path.join(repoDir, subdirectory);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Subdirectory "${subdirectory}" not found in repository`);
    }
    return skillPath;
  }
  return repoDir;
}
