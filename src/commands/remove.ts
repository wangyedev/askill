import * as path from "node:path";
import { ensureConfig, resolvePaths } from "../lib/config.js";
import { readSkillsYaml, writeSkillsYaml, readSkillsLock, writeSkillsLock } from "../lib/manifest.js";
import { removeSkillDir } from "../lib/skills.js";

export async function removeCommand(skillName: string, options: { global?: boolean }): Promise<void> {
  const config = await ensureConfig();
  const paths = resolvePaths(config.client, !!options.global);

  // Remove skill directory
  const skillDir = path.join(paths.skillsDir, skillName);
  removeSkillDir(skillDir);

  // Remove from skills.yaml
  const skillsYaml = readSkillsYaml(paths.manifestDir);
  if (skillsYaml.skills[skillName]) {
    delete skillsYaml.skills[skillName];
    writeSkillsYaml(paths.manifestDir, skillsYaml);
  }

  // Remove from skills.lock
  const lock = readSkillsLock(paths.manifestDir);
  if (lock[skillName]) {
    delete lock[skillName];
    writeSkillsLock(paths.manifestDir, lock);
  }

  console.log(`Removed ${skillName}`);
}
