# askill

CLI tool for managing agent skills — install, update, list, and remove skills from git repositories.

Skills are the open format for giving AI agents new capabilities ([agentskills.io](https://agentskills.io)). `askill` handles the lifecycle: installing, updating, and removing skills so you don't have to manage files manually.

## Install

```bash
npm install -g askill
```

## Quick Start

```bash
# First run auto-detects your agent client (Claude Code, Codex, Gemini CLI, Cursor)
askill install anthropics/skills/superpowers

# List installed skills
askill list

# Update all skills
askill update --all

# Remove a skill
askill remove superpowers
```

## Commands

### `askill install [source[@version]] [--global]`

Install a skill from a git repository.

```bash
# GitHub shorthand
askill install anthropics/skills/superpowers

# Pin to a branch or tag
askill install anthropics/skills/superpowers@v5.x

# Full git URL
askill install https://github.com/myorg/my-skill.git

# Global install (shared across projects)
askill install anthropics/skills/superpowers --global

# Restore all skills from lock file
askill install
```

### `askill update [skill-name | --all] [--global]`

Update skills to the latest version matching their ref constraint.

```bash
askill update superpowers
askill update --all
```

### `askill list [--global]`

Display installed skills with name, version, and source.

### `askill remove <skill-name> [--global]`

Remove an installed skill and clean up manifest entries.

### `askill config set <key> <value>`

Configure the agent client. Supported clients: `claude-code`, `codex`, `gemini-cli`, `cursor`.

```bash
askill config set client claude-code
```

## How It Works

`askill` uses a two-file manifest system (like npm, Cargo, Poetry):

- **`skills.yaml`** — human-editable intent (source + version constraint)
- **`skills.lock`** — machine-generated pins (commit hash + integrity hash)

Both files live in your client's config directory (e.g., `.claude/` for Claude Code) and are safe to commit to version control.

### Scopes

| Scope | Flag | Example path (Claude Code) |
|-------|------|---------------------------|
| Project (default) | — | `$CWD/.claude/skills/` |
| Global | `--global` | `~/.claude/skills/` |

### Supported Clients

| Client | Project dir | Global dir |
|--------|------------|------------|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| OpenAI Codex | `.agents/skills/` | `~/.agents/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |

## Companion Skill

`askill` ships with a companion skill (`skill-hub/SKILL.md`) that lets your agent manage skills conversationally:

> "Install the superpowers skill"
> "What skills do I have?"
> "Update all my skills"

## Development

```bash
npm install
npm run build
node dist/cli.js --help
```

## License

MIT
