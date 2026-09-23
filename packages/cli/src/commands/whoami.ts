import { createAuthedClient } from "../supabase-client.js"
import { hasFlag } from "../flags.js"
import { writeJson, writeLine } from "../format.js"

export async function runWhoami(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const { session } = await createAuthedClient()

  if (json) {
    writeJson({ userId: session.userId })
  } else {
    writeLine(`Authenticated as ${session.userId}`)
  }
}
