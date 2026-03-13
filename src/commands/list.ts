import { ensureConfig, resolvePaths } from "../lib/config.js";
import { readSkillsYaml, readSkillsLock } from "../lib/manifest.js";

export async function listCommand(options: { global?: boolean }): Promise<void> {
  const config = await ensureConfig();
  const paths = resolvePaths(config.client, !!options.global);
  const skillsYaml = readSkillsYaml(paths.manifestDir);
  const lock = readSkillsLock(paths.manifestDir);

  const names = Object.keys(skillsYaml.skills);

  if (names.length === 0) {
    console.log("No skills installed.");
    return;
  }

  const scope = options.global ? "global" : "project";
  console.log(`\nInstalled skills (${scope}):\n`);

  // Header
  const nameWidth = Math.max(12, ...names.map((n) => n.length)) + 2;
  const versionWidth = 14;
  console.log(
    "Name".padEnd(nameWidth) +
    "Version".padEnd(versionWidth) +
    "Source"
  );
  console.log("-".repeat(nameWidth + versionWidth + 40));

  for (const name of names) {
    const intent = skillsYaml.skills[name];
    const lockEntry = lock[name];
    const version = lockEntry ? lockEntry.locked.slice(0, 7) : intent.ref;
    console.log(
      name.padEnd(nameWidth) +
      version.padEnd(versionWidth) +
      intent.source
    );
  }

  console.log();
}
