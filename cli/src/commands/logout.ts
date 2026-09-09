import { clearSession } from "../session.js"
import { writeLine } from "../format.js"

export async function runLogout(): Promise<void> {
  await clearSession()
  writeLine("Logged out.")
}
