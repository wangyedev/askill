import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { simpleGit, type SimpleGit } from "simple-git";

export interface ParsedSource {
  repoUrl: string;
  subdirectory: string | null;
  skillName: string;
  ref: string;
}

export function parseSource(source: string, version?: string): ParsedSource {
  // Handle full git URLs and local paths
  if (source.startsWith("https://") || source.startsWith("git@") || source.endsWith(".git") || source.startsWith("/") || source.startsWith("./") || source.startsWith("../")) {
    const skillName = path.basename(source, ".git");
    return {
      repoUrl: source,
      subdirectory: null,
      skillName,
      ref: version ?? "main",
    };
  }

  // GitHub shorthand: owner/repo/path/to/skill or owner/repo
  const parts = source.split("/");
  if (parts.length < 2) {
    throw new Error(
      `Invalid source: "${source}". Use owner/repo or owner/repo/skill-path format.`
    );
  }

  const owner = parts[0];
  const repo = parts[1];
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  if (parts.length > 2) {
    const subPath = parts.slice(2).join("/");
    const skillName = parts[parts.length - 1];
    return { repoUrl, subdirectory: subPath, skillName, ref: version ?? "main" };
  }

  return { repoUrl, subdirectory: null, skillName: repo, ref: version ?? "main" };
}

export async function cloneToTemp(repoUrl: string, ref: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agskill-"));
  try {
    const git: SimpleGit = simpleGit();
    await git.clone(repoUrl, tmpDir, ["--depth", "1", "--branch", ref]);
    return tmpDir;
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}

export async function cloneToTempDefault(repoUrl: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agskill-"));
  try {
    const git: SimpleGit = simpleGit();
    await git.clone(repoUrl, tmpDir, ["--depth", "1"]);
    return tmpDir;
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}

export async function resolveCommitHash(repoDir: string): Promise<string> {
  const git: SimpleGit = simpleGit(repoDir);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash ?? "unknown";
}

export function resolveManifestSource(source: string): { repoUrl: string; subdirectory: string | null } {
  const isLocal = source.startsWith("/") || source.startsWith("./") || source.startsWith("../");
  const isFullUrl = source.startsWith("https://") || source.startsWith("git@");

  if (isLocal || isFullUrl) {
    return { repoUrl: source, subdirectory: null };
  }

  const parts = source.replace(/^github\.com\//, "").split("/");
  const repoUrl = `https://github.com/${parts[0]}/${parts[1]}.git`;
  const subdirectory = parts.length > 2 ? parts.slice(2).join("/") : null;
  return { repoUrl, subdirectory };
}

export function cleanupTemp(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
