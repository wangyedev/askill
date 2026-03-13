---
name: agskill
description: Manage agent skills — install, update, list, and remove skills using the agskill CLI
triggers:
  - install a skill
  - update skills
  - list skills
  - remove a skill
  - what skills do I have
  - what skills would help
  - skill management
---

# Skill Hub

You have access to the `agskill` CLI tool for managing agent skills. Use it when the user asks about installing, updating, listing, removing, or discovering skills.

## Commands

### Install a skill

```bash
agskill install <source>[@version] [--global]
```

- `<source>` is a GitHub shorthand (e.g., `anthropics/skills/superpowers`) or full git URL
- `@version` optionally pins to a branch or tag (e.g., `@v5.x`)
- `--global` installs to the user-level directory (shared across projects)
- Without arguments, `agskill install` restores all skills from the lock file

### Update skills

```bash
agskill update <skill-name> [--global]
agskill update --all [--global]
```

- Updates one or all skills to the latest version matching their ref constraint
- Shows a summary of version changes

### List installed skills

```bash
agskill list [--global]
```

- Displays a table of installed skills with name, version, and source

### Remove a skill

```bash
agskill remove <skill-name> [--global]
```

- Removes the skill directory and cleans up manifest entries

### Configure client

```bash
agskill config set client <client-name>
agskill config get client
```

- Sets which agent client to use (claude-code, codex, gemini-cli, cursor)
- Determines where skills are installed

## Behavior Guide

| User intent                      | Your action                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Install X skill"                | Run `agskill install <source>` and report the result                                                        |
| "Update my skills"               | Run `agskill update --all` and summarize what changed                                                       |
| "What skills do I have?"         | Run `agskill list` and explain each skill's purpose                                                         |
| "Remove a skill"                 | Confirm which skill, then run `agskill remove <name>`                                                       |
| "What skills would help here?"   | Analyze the project context (language, framework, workflow) and suggest relevant skills from the ecosystem |
| "Set up skills for this project" | Run `agskill install` to restore from lock file if one exists                                               |

## Tips

- When suggesting skills, consider the project's language, framework, and development workflow
- After installing a skill, briefly explain what it does and when it activates
- When updating, highlight meaningful changes in the update summary
- If `agskill` is not installed, suggest: `npm install -g agskill`
