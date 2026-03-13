export interface ClientConfig {
  name: string;
  userSkillsDir: string;
  userManifestDir: string;
  projectSkillsDir: string;
  projectManifestDir: string;
}

export const CLIENT_REGISTRY: Record<string, ClientConfig> = {
  "claude-code": {
    name: "Claude Code",
    userSkillsDir: "~/.claude/skills",
    userManifestDir: "~/.claude",
    projectSkillsDir: ".claude/skills",
    projectManifestDir: ".claude",
  },
  codex: {
    name: "OpenAI Codex",
    userSkillsDir: "~/.agents/skills",
    userManifestDir: "~/.agents",
    projectSkillsDir: ".agents/skills",
    projectManifestDir: ".agents",
  },
  "gemini-cli": {
    name: "Gemini CLI",
    userSkillsDir: "~/.gemini/skills",
    userManifestDir: "~/.gemini",
    projectSkillsDir: ".gemini/skills",
    projectManifestDir: ".gemini",
  },
  cursor: {
    name: "Cursor",
    userSkillsDir: "~/.cursor/skills",
    userManifestDir: "~/.cursor",
    projectSkillsDir: ".cursor/skills",
    projectManifestDir: ".cursor",
  },
};

export function getClientNames(): string[] {
  return Object.keys(CLIENT_REGISTRY);
}

export function getClient(name: string): ClientConfig | undefined {
  return CLIENT_REGISTRY[name];
}
