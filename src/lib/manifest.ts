import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as yaml from "js-yaml";

export interface SkillIntent {
  source: string;
  ref: string;
}

export interface SkillsYaml {
  skills: Record<string, SkillIntent>;
}

export interface LockEntry {
  source: string;
  resolved: string;
  locked: string;
  integrity: string;
}

export type SkillsLock = Record<string, LockEntry>;

function yamlPath(manifestDir: string): string {
  return path.join(manifestDir, "skills.yaml");
}

function lockPath(manifestDir: string): string {
  return path.join(manifestDir, "skills.lock");
}

export function readSkillsYaml(manifestDir: string): SkillsYaml {
  const p = yamlPath(manifestDir);
  if (!fs.existsSync(p)) return { skills: {} };
  const content = fs.readFileSync(p, "utf-8");
  const parsed = yaml.load(content) as SkillsYaml | null;
  return parsed ?? { skills: {} };
}

export function writeSkillsYaml(manifestDir: string, data: SkillsYaml): void {
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(yamlPath(manifestDir), yaml.dump(data, { lineWidth: -1 }), "utf-8");
}

export function readSkillsLock(manifestDir: string): SkillsLock {
  const p = lockPath(manifestDir);
  if (!fs.existsSync(p)) return {};
  const content = fs.readFileSync(p, "utf-8");
  return (yaml.load(content) as SkillsLock) ?? {};
}

export function writeSkillsLock(manifestDir: string, data: SkillsLock): void {
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(lockPath(manifestDir), yaml.dump(data, { lineWidth: -1 }), "utf-8");
}

export function computeIntegrity(dirPath: string): string {
  const hash = crypto.createHash("sha256");
  const files = collectFiles(dirPath).sort();
  for (const file of files) {
    const rel = path.relative(dirPath, file);
    hash.update(rel);
    hash.update(fs.readFileSync(file));
  }
  return `sha256-${hash.digest("hex").slice(0, 16)}`;
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}
