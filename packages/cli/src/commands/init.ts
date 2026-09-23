import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { getFlagValue, hasFlag } from "../flags.js"
import { writeConfig } from "../config.js"
import { writeLine } from "../format.js"

const INIT_HELP = `Usage:
  gastly-cli init [--from-env <path>] [--url <url> --key <key>]

Options:
  --from-env <path>   Read NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from a .env file
  --url <url>         Supabase project URL
  --key <key>         Supabase publishable (anon) key
  --help              Show this help
`

export async function runInit(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${INIT_HELP}\n`)
    return
  }

  let url = getFlagValue(args, "--url")
  let key = getFlagValue(args, "--key")
  const envPath = getFlagValue(args, "--from-env")

  if (envPath) {
    const raw = await readFile(resolve(envPath), "utf8")
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIndex = trimmed.indexOf("=")
      if (eqIndex === -1) continue
      const k = trimmed.slice(0, eqIndex).trim()
      let v = trimmed.slice(eqIndex + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      if (k === "NEXT_PUBLIC_SUPABASE_URL") url = v
      if (k === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") key = v
    }
  }

  if (!url || !key) {
    process.stderr.write(
      "Supabase URL and publishable key are required.\n\n" +
        "Provide via:\n" +
        "  gastly-cli init --from-env .env.local\n" +
        "  gastly-cli init --url <url> --key <key>\n",
    )
    process.exitCode = 1
    return
  }

  const path = await writeConfig({ url, publishableKey: key })
  writeLine(`Config saved to ${path}`)
}
