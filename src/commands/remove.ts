import * as fs from "node:fs";
import * as path from "node:path";
import { ensureConfig, resolvePaths } from "../lib/config.js";
import { readSkillsYaml, writeSkillsYaml, readSkillsLock, writeSkillsLock } from "../lib/manifest.js";
import { removeSkillDir } from "../lib/skills.js";

export async function removeCommand(skillName: string, options: { global?: boolean }): Promise<void> {
  const config = await ensureConfig();
  const paths = resolvePaths(config.client, !!options.global);

  const skillDir = path.join(paths.skillsDir, skillName);
  const skillsYaml = readSkillsYaml(paths.manifestDir);
  const lock = readSkillsLock(paths.manifestDir);

  const dirExists = fs.existsSync(skillDir);
  const inYaml = skillName in skillsYaml.skills;
  const inLock = skillName in lock;

  if (!dirExists && !inYaml && !inLock) {
    console.warn(`Skill "${skillName}" is not installed.`);
    return;
  }

  removeSkillDir(skillDir);

  if (inYaml) {
    delete skillsYaml.skills[skillName];
    writeSkillsYaml(paths.manifestDir, skillsYaml);
  }

  if (inLock) {
    delete lock[skillName];
    writeSkillsLock(paths.manifestDir, lock);
  }

  console.log(`Removed ${skillName}`);
}
