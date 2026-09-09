import { createEmailPasswordSession, requireConfig } from "../supabase-client.js"
import { getFlagValue, hasFlag, promptSecret, promptText } from "../flags.js"
import { writeSession } from "../session.js"
import { writeLine } from "../format.js"

const LOGIN_HELP = `Usage:
  gastly-cli login [--email <email>] [--password <password>]

Options:
  --email <email>         Account email
  --password <password>   Account password (prefer interactive prompt)
  --help                  Show this help
`

export async function runLogin(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${LOGIN_HELP}\n`)
    return
  }

  const config = await requireConfig()

  let email = getFlagValue(args, "--email")
  let password = getFlagValue(args, "--password")

  if (!email) {
    email = await promptText("Email: ")
  }
  if (!password) {
    password = await promptSecret("Password: ")
  }

  if (!email || !password) {
    process.stderr.write(`Email and password are required.\n\n${LOGIN_HELP}\n`)
    process.exitCode = 1
    return
  }

  const session = await createEmailPasswordSession({
    config,
    email,
    password,
  })

  const path = await writeSession(session)
  writeLine(`Logged in as ${session.userId}`)
  writeLine(`Session saved to ${path}`)
}
