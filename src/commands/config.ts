import { readConfig, writeConfig } from "../lib/config.js";
import { getClient, getClientNames } from "../lib/clients.js";

export function configSetCommand(key: string, value: string): void {
  if (key !== "client") {
    throw new Error(`Unknown config key: "${key}". Available keys: client`);
  }

  if (!getClient(value)) {
    throw new Error(`Unknown client: "${value}". Available: ${getClientNames().join(", ")}`);
  }

  const config = readConfig() ?? { client: "" };
  config.client = value;
  writeConfig(config);
  console.log(`Set client to: ${value}`);
}

export function configGetCommand(key: string): void {
  const config = readConfig();
  if (!config) {
    console.log("No configuration found. Run any agskill command to set up.");
    return;
  }

  if (key === "client") {
    console.log(config.client);
  } else {
    throw new Error(`Unknown config key: "${key}". Available keys: client`);
  }
}
