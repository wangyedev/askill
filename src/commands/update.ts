import * as path from "node:path";
import { ensureConfig, resolvePaths } from "../lib/config.js";
import { cloneToTempDefault, resolveCommitHash, cleanupTemp } from "../lib/git.js";
import { readSkillsYaml, readSkillsLock, writeSkillsLock, computeIntegrity } from "../lib/manifest.js";
import { copySkillDir, locateSkillInRepo, removeSkillDir } from "../lib/skills.js";

export async function updateCommand(skillName: string | undefined, options: { all?: boolean; global?: boolean }): Promise<void> {
  const config = await ensureConfig();
  const paths = resolvePaths(config.client, !!options.global);
  const skillsYaml = readSkillsYaml(paths.manifestDir);
  const lock = readSkillsLock(paths.manifestDir);

  let toUpdate: string[];

  if (options.all) {
    toUpdate = Object.keys(skillsYaml.skills);
  } else if (skillName) {
    if (!skillsYaml.skills[skillName]) {
      console.error(`Skill "${skillName}" not found in skills.yaml`);
      process.exit(1);
    }
    toUpdate = [skillName];
  } else {
    console.error("Specify a skill name or use --all");
    process.exit(1);
  }

  if (toUpdate.length === 0) {
    console.log("No skills to update.");
    return;
  }

  let anyUpdated = false;

  for (const name of toUpdate) {
    const intent = skillsYaml.skills[name];
    const currentLock = lock[name];
    const oldHash = currentLock?.locked ?? "none";

    console.log(`Checking ${name}...`);

    const isLocal = intent.source.startsWith("/") || intent.source.startsWith("./") || intent.source.startsWith("../");
    const isFullUrl = intent.source.startsWith("https://") || intent.source.startsWith("git@");
    let repoUrl: string;
    let subdirectory: string | null = null;

    if (isLocal || isFullUrl) {
      repoUrl = intent.source;
    } else {
      const fullParts = intent.source.replace(/^github\.com\//, "").split("/");
      repoUrl = `https://github.com/${fullParts[0]}/${fullParts[1]}.git`;
      subdirectory = fullParts.length > 2 ? fullParts.slice(2).join("/") : null;
    }

    let tmpDir: string;
    try {
      tmpDir = await cloneToTempDefault(repoUrl);
    } catch (err) {
      console.error(`  Failed to fetch ${name}: ${err}`);
      continue;
    }

    try {
      const newHash = await resolveCommitHash(tmpDir);

      if (newHash === oldHash) {
        console.log(`  ${name}: already up to date (${oldHash.slice(0, 7)})`);
        continue;
      }

      const skillSourceDir = locateSkillInRepo(tmpDir, subdirectory);
      const targetDir = path.join(paths.skillsDir, name);
      removeSkillDir(targetDir);
      copySkillDir(skillSourceDir, targetDir);

      const integrity = computeIntegrity(targetDir);

      lock[name] = {
        source: intent.source,
        resolved: intent.ref,
        locked: newHash,
        integrity,
      };

      console.log(`  ${name}: ${oldHash.slice(0, 7)} -> ${newHash.slice(0, 7)}`);
      anyUpdated = true;
    } finally {
      cleanupTemp(tmpDir);
    }
  }

  if (anyUpdated) {
    writeSkillsLock(paths.manifestDir, lock);
    console.log("Lock file updated.");
  } else {
    console.log("Everything is up to date.");
  }
}
