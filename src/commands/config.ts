import { readConfig, writeConfig } from "../lib/config.js";
import { getClient, getClientNames } from "../lib/clients.js";

export function configSetCommand(key: string, value: string): void {
  if (key !== "client") {
    console.error(`Unknown config key: "${key}". Available keys: client`);
    process.exit(1);
  }

  if (!getClient(value)) {
    console.error(`Unknown client: "${value}". Available: ${getClientNames().join(", ")}`);
    process.exit(1);
  }

  const config = readConfig() ?? { client: "" };
  config.client = value;
  writeConfig(config);
  console.log(`Set client to: ${value}`);
}

export function configGetCommand(key: string): void {
  const config = readConfig();
  if (!config) {
    console.log("No configuration found. Run any askill command to set up.");
    return;
  }

  if (key === "client") {
    console.log(config.client);
  } else {
    console.error(`Unknown config key: "${key}". Available keys: client`);
    process.exit(1);
  }
}
