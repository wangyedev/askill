import * as path from "node:path";
import { ensureConfig, resolvePaths } from "../lib/config.js";
import { parseSource, cloneToTemp, cloneToTempDefault, resolveCommitHash, cleanupTemp } from "../lib/git.js";
import { readSkillsYaml, writeSkillsYaml, readSkillsLock, writeSkillsLock, computeIntegrity, type LockEntry } from "../lib/manifest.js";
import { copySkillDir, validateSkillMd, locateSkillInRepo, removeSkillDir } from "../lib/skills.js";

export async function installCommand(source: string | undefined, options: { global?: boolean }): Promise<void> {
  const config = await ensureConfig();
  const paths = resolvePaths(config.client, !!options.global);

  // Bare install: restore all from lock
  if (!source) {
    await bareInstall(config.client, paths, options);
    return;
  }

  // Parse source and optional @version
  let rawSource = source;
  let version: string | undefined;
  const atIdx = source.lastIndexOf("@");
  if (atIdx > 0) {
    rawSource = source.slice(0, atIdx);
    version = source.slice(atIdx + 1);
  }

  const parsed = parseSource(rawSource, version);
  console.log(`Installing ${parsed.skillName} from ${parsed.repoUrl}...`);

  // Clone repo to temp
  let tmpDir: string;
  try {
    tmpDir = await cloneToTemp(parsed.repoUrl, parsed.ref);
  } catch {
    // If branch clone fails, try default branch
    console.log(`Branch "${parsed.ref}" not found, trying default branch...`);
    tmpDir = await cloneToTempDefault(parsed.repoUrl);
  }

  try {
    // Locate skill within repo
    const skillSourceDir = locateSkillInRepo(tmpDir, parsed.subdirectory);

    // Validate SKILL.md
    const validation = validateSkillMd(skillSourceDir);
    if (!validation.valid) {
      console.warn(`Warning: ${validation.warning}`);
    }

    // Copy to target
    const targetDir = path.join(paths.skillsDir, parsed.skillName);
    removeSkillDir(targetDir);
    copySkillDir(skillSourceDir, targetDir);

    // Get commit hash and compute integrity
    const commitHash = await resolveCommitHash(tmpDir);
    const integrity = computeIntegrity(targetDir);

    // Build source string for manifest
    const isGitHubShorthand = !rawSource.startsWith("https://") && !rawSource.startsWith("git@") && !rawSource.startsWith("/") && !rawSource.startsWith("./") && !rawSource.startsWith("../");
    const manifestSource = isGitHubShorthand ? `github.com/${rawSource}` : rawSource;

    // Update skills.yaml
    const skillsYaml = readSkillsYaml(paths.manifestDir);
    skillsYaml.skills[parsed.skillName] = {
      source: manifestSource,
      ref: parsed.ref,
    };
    writeSkillsYaml(paths.manifestDir, skillsYaml);

    // Update skills.lock
    const lock = readSkillsLock(paths.manifestDir);
    lock[parsed.skillName] = {
      source: manifestSource,
      resolved: parsed.ref,
      locked: commitHash,
      integrity,
    };
    writeSkillsLock(paths.manifestDir, lock);

    console.log(`Installed ${parsed.skillName} @ ${commitHash.slice(0, 7)} -> ${targetDir}`);
  } finally {
    cleanupTemp(tmpDir);
  }
}

async function bareInstall(
  clientName: string,
  paths: { skillsDir: string; manifestDir: string },
  options: { global?: boolean }
): Promise<void> {
  const lock = readSkillsLock(paths.manifestDir);
  const entries = Object.entries(lock);

  if (entries.length === 0) {
    console.log("No skills found in lock file. Nothing to install.");
    return;
  }

  console.log(`Restoring ${entries.length} skill(s) from lock file...`);

  for (const [name, entry] of entries) {
    console.log(`  Installing ${name}...`);
    await installFromLock(name, entry, paths);
  }

  console.log("All skills restored.");
}

async function installFromLock(
  name: string,
  entry: LockEntry,
  paths: { skillsDir: string; manifestDir: string }
): Promise<void> {
  // Convert manifest source back to repo URL
  const isLocal = entry.source.startsWith("/") || entry.source.startsWith("./") || entry.source.startsWith("../");
  const isFullUrl = entry.source.startsWith("https://") || entry.source.startsWith("git@");
  let repoUrl: string;
  let subdirectory: string | null = null;

  if (isLocal || isFullUrl) {
    repoUrl = entry.source;
  } else {
    // GitHub shorthand stored as github.com/owner/repo[/subdir...]
    const fullParts = entry.source.replace(/^github\.com\//, "").split("/");
    repoUrl = `https://github.com/${fullParts[0]}/${fullParts[1]}.git`;
    subdirectory = fullParts.length > 2 ? fullParts.slice(2).join("/") : null;
  }

  let tmpDir: string;
  try {
    tmpDir = await cloneToTempDefault(repoUrl);
  } catch (err) {
    console.error(`  Failed to clone ${repoUrl}: ${err}`);
    return;
  }

  try {
    const skillSourceDir = locateSkillInRepo(tmpDir, subdirectory);
    const targetDir = path.join(paths.skillsDir, name);
    removeSkillDir(targetDir);
    copySkillDir(skillSourceDir, targetDir);
    console.log(`  Restored ${name} -> ${targetDir}`);
  } finally {
    cleanupTemp(tmpDir);
  }
}
