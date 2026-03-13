#!/usr/bin/env node

import { Command } from "commander";
import { installCommand } from "./commands/install.js";
import { updateCommand } from "./commands/update.js";
import { listCommand } from "./commands/list.js";
import { removeCommand } from "./commands/remove.js";
import { configSetCommand, configGetCommand } from "./commands/config.js";

const program = new Command();

program
  .name("agskill")
  .description("Agent Skill Hub — install, update, list, and remove agent skills")
  .version("0.1.0");

program
  .command("install [source]")
  .description("Install a skill from a git repository, or restore all from lock file")
  .option("-g, --global", "Install to user-level directory")
  .action(async (source: string | undefined, options: { global?: boolean }) => {
    try {
      await installCommand(source, options);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("update [skill-name]")
  .description("Update a skill or all skills to latest versions")
  .option("-a, --all", "Update all installed skills")
  .option("-g, --global", "Update from user-level directory")
  .action(async (skillName: string | undefined, options: { all?: boolean; global?: boolean }) => {
    try {
      await updateCommand(skillName, options);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List installed skills")
  .option("-g, --global", "List user-level skills")
  .action(async (options: { global?: boolean }) => {
    try {
      await listCommand(options);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("remove <skill-name>")
  .description("Remove an installed skill")
  .option("-g, --global", "Remove from user-level directory")
  .action(async (skillName: string, options: { global?: boolean }) => {
    try {
      await removeCommand(skillName, options);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

const configCmd = program
  .command("config")
  .description("Manage agskill configuration");

configCmd
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action((key: string, value: string) => {
    try {
      configSetCommand(key, value);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

configCmd
  .command("get <key>")
  .description("Get a configuration value")
  .action((key: string) => {
    try {
      configGetCommand(key);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
