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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "askill-"));
  const git: SimpleGit = simpleGit();
  await git.clone(repoUrl, tmpDir, ["--depth", "1", "--branch", ref]);
  return tmpDir;
}

export async function cloneToTempDefault(repoUrl: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "askill-"));
  const git: SimpleGit = simpleGit();
  await git.clone(repoUrl, tmpDir, ["--depth", "1"]);
  return tmpDir;
}

export async function resolveCommitHash(repoDir: string): Promise<string> {
  const git: SimpleGit = simpleGit(repoDir);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash ?? "unknown";
}

export async function fetchAndUpdate(repoDir: string, ref: string): Promise<{ hash: string; updated: boolean }> {
  const git: SimpleGit = simpleGit(repoDir);
  const oldHash = (await git.log({ maxCount: 1 })).latest?.hash ?? "";

  await git.fetch("origin", ref);

  try {
    await git.checkout(ref);
    await git.pull("origin", ref);
  } catch {
    // If ref is a tag, just checkout
    await git.checkout(`origin/${ref}`).catch(() => git.checkout(ref));
  }

  const newHash = (await git.log({ maxCount: 1 })).latest?.hash ?? "";
  return { hash: newHash, updated: oldHash !== newHash };
}

export function cleanupTemp(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
