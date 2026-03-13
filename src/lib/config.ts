import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as yaml from "js-yaml";
import * as readline from "node:readline";
import { CLIENT_REGISTRY, getClient, getClientNames, type ClientConfig } from "./clients.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "agskill");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.yaml");

export interface AgskillConfig {
  client: string;
}

export function readConfig(): AgskillConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  const content = fs.readFileSync(CONFIG_FILE, "utf-8");
  return yaml.load(content) as AgskillConfig;
}

export function writeConfig(config: AgskillConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, yaml.dump(config), "utf-8");
}

function expandTilde(p: string): string {
  if (p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export interface ResolvedPaths {
  skillsDir: string;
  manifestDir: string;
}

export function resolvePaths(clientName: string, global: boolean): ResolvedPaths {
  const client = getClient(clientName);
  if (!client) {
    throw new Error(`Unknown client: ${clientName}. Available: ${getClientNames().join(", ")}`);
  }

  if (global) {
    return {
      skillsDir: expandTilde(client.userSkillsDir),
      manifestDir: expandTilde(client.userManifestDir),
    };
  }

  return {
    skillsDir: path.resolve(process.cwd(), client.projectSkillsDir),
    manifestDir: path.resolve(process.cwd(), client.projectManifestDir),
  };
}

function detectClient(): string | null {
  const detected: string[] = [];
  for (const [name, config] of Object.entries(CLIENT_REGISTRY)) {
    const dir = expandTilde(config.userSkillsDir).replace(/\/skills$/, "");
    if (fs.existsSync(dir)) {
      detected.push(name);
    }
  }
  if (detected.length === 1) return detected[0];
  return null;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function ensureConfig(): Promise<AgskillConfig> {
  const existing = readConfig();
  if (existing?.client) return existing;

  const autoDetected = detectClient();

  if (autoDetected) {
    const clientConfig = getClient(autoDetected)!;
    const answer = await prompt(
      `Detected ${clientConfig.name}. Use ${clientConfig.name} paths? [Y/n] `
    );
    if (answer === "" || answer.toLowerCase() === "y") {
      const config: AgskillConfig = { client: autoDetected };
      writeConfig(config);
      console.log(`Saved client config: ${autoDetected}`);
      return config;
    }
  }

  const clients = getClientNames();
  console.log("Which agent do you use?");
  clients.forEach((name, i) => {
    const config = getClient(name)!;
    console.log(`  ${i + 1}. ${config.name} (${name})`);
  });

  const answer = await prompt("Enter number: ");
  const idx = parseInt(answer, 10) - 1;
  if (idx < 0 || idx >= clients.length) {
    throw new Error("Invalid selection");
  }

  const config: AgskillConfig = { client: clients[idx] };
  writeConfig(config);
  console.log(`Saved client config: ${clients[idx]}`);
  return config;
}
