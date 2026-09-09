import { chmod, mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import type { GastlyConfig } from "./types.js"

const GASTLY_DIR = join(homedir(), ".gastly")
const CONFIG_PATH = join(GASTLY_DIR, "config.json")

export function getGastlyDir(): string {
  return GASTLY_DIR
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function parseConfig(value: unknown): GastlyConfig {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid config: expected an object.")
  }
  const record = value as Record<string, unknown>
  const url = record.url
  const publishableKey = record.publishableKey

  if (!isNonEmptyString(url) || !isNonEmptyString(publishableKey)) {
    throw new Error(
      "Invalid config: url and publishableKey are required. " +
        "Run: gastly-cli init --from-env <path/to/.env.local>",
    )
  }

  return {
    url: url.trim().replace(/\/+$/, ""),
    publishableKey: publishableKey.trim(),
  }
}

export async function ensureGastlyDir(): Promise<string> {
  await mkdir(GASTLY_DIR, { recursive: true, mode: 0o700 })
  return GASTLY_DIR
}

export async function readConfig(): Promise<GastlyConfig | null> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8")
    return parseConfig(JSON.parse(raw) as unknown)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "ENOENT"
    ) {
      return null
    }
    throw error
  }
}

export async function writeConfig(config: GastlyConfig): Promise<string> {
  const parsed = parseConfig(config)
  await ensureGastlyDir()
  await writeFile(CONFIG_PATH, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  await chmod(CONFIG_PATH, 0o600)
  return CONFIG_PATH
}
