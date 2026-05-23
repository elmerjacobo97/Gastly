import { createHmac } from "crypto"

function getSecret() {
  return process.env.CALENDAR_SECRET ?? "dev-calendar-secret-change-in-prod"
}

export function encodeCalendarToken(userId: string): string {
  const encoded = Buffer.from(userId).toString("base64url")
  const sig = createHmac("sha256", getSecret()).update(userId).digest("hex").slice(0, 32)
  return `${encoded}.${sig}`
}

export function decodeCalendarToken(token: string): string | null {
  const dot = token.indexOf(".")
  if (dot === -1) return null
  const encoded = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let userId: string
  try {
    userId = Buffer.from(encoded, "base64url").toString()
  } catch {
    return null
  }
  if (!userId) return null
  const expected = createHmac("sha256", getSecret()).update(userId).digest("hex").slice(0, 32)
  if (sig !== expected) return null
  return userId
}
