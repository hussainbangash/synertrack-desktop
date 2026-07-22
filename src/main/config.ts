import { app, safeStorage } from "electron";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Persisted credentials. The token is encrypted at rest with the OS keychain
// (safeStorage) when available; otherwise stored plaintext as a last resort.
interface StoredConfig {
  serverUrl?: string;
  tokenEnc?: string; // base64 of encrypted bytes
  tokenPlain?: string; // fallback only when encryption is unavailable
}

interface Credentials {
  serverUrl: string;
  token: string;
}

function configPath(): string {
  return join(app.getPath("userData"), "synertrack-config.json");
}

function read(): StoredConfig {
  try {
    if (!existsSync(configPath())) return {};
    return JSON.parse(readFileSync(configPath(), "utf-8")) as StoredConfig;
  } catch {
    return {};
  }
}

function write(config: StoredConfig): void {
  writeFileSync(configPath(), JSON.stringify(config), "utf-8");
}

export function loadCredentials(): Credentials | null {
  const config = read();
  if (!config.serverUrl) return null;

  if (config.tokenEnc && safeStorage.isEncryptionAvailable()) {
    try {
      const token = safeStorage.decryptString(Buffer.from(config.tokenEnc, "base64"));
      return { serverUrl: config.serverUrl, token };
    } catch {
      return null;
    }
  }
  if (config.tokenPlain) {
    return { serverUrl: config.serverUrl, token: config.tokenPlain };
  }
  return null;
}

export function saveCredentials(serverUrl: string, token: string): void {
  const normalized = serverUrl.replace(/\/+$/, ""); // trim trailing slashes
  if (safeStorage.isEncryptionAvailable()) {
    const enc = safeStorage.encryptString(token).toString("base64");
    write({ serverUrl: normalized, tokenEnc: enc });
  } else {
    write({ serverUrl: normalized, tokenPlain: token });
  }
}

export function clearCredentials(): void {
  write({});
}
