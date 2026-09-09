import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json")

export async function getCliVersion(): Promise<string> {
  try {
    const raw = await readFile(pkgPath, "utf8")
    return (JSON.parse(raw) as { version: string }).version
  } catch {
    return "0.0.0"
  }
}
