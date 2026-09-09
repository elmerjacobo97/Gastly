import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { readConfig } from "./config.js"
import { readSession, writeSession } from "./session.js"
import type { GastlyConfig, GastlySession } from "./types.js"

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${context} returned an invalid response.`)
  }
  return value as Record<string, unknown>
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key]
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} response is missing ${key}.`)
  }
  return value
}

function parseAuthSession(
  value: unknown,
  context: string,
  fallbackRefreshToken?: string,
): GastlySession {
  const record = asRecord(value, context)

  // Supabase JS v2: tokens live in data.session
  const session = record.session ? asRecord(record.session, context) : record
  const user = asRecord(session.user ?? record.user, context)

  const accessToken =
    (session.access_token as string) ?? (session.accessToken as string)
  const refreshToken =
    (session.refresh_token as string) ?? (session.refreshToken as string)

  if (!accessToken || accessToken.length === 0) {
    throw new Error(`${context} response is missing access token.`)
  }

  return {
    userId: requiredString(user, "id", context),
    accessToken,
    refreshToken:
      (typeof refreshToken === "string" && refreshToken.length > 0
        ? refreshToken
        : fallbackRefreshToken) ?? "",
  }
}

export async function requireConfig(): Promise<GastlyConfig> {
  const config = await readConfig()
  if (!config) {
    throw new Error(
      "No config found. Run: gastly-cli init --from-env <path/to/.env.local>",
    )
  }
  return config
}

export async function requireSession(): Promise<GastlySession> {
  const session = await readSession()
  if (!session) throw new Error("Not logged in. Run: gastly-cli login")
  return session
}

export function createClient(
  config: GastlyConfig,
  accessToken?: string,
): SupabaseClient {
  return createSupabaseClient(config.url, config.publishableKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

export async function createAuthedClient(): Promise<{
  config: GastlyConfig
  session: GastlySession
  supabase: SupabaseClient
}> {
  const config = await requireConfig()
  const currentSession = await requireSession()
  const refreshClient = createClient(config)
  const { data, error } = await refreshClient.auth.refreshSession({
    refresh_token: currentSession.refreshToken,
  })
  if (error) throw new Error(error.message)

  const session = parseAuthSession(
    data as unknown,
    "Session refresh",
    currentSession.refreshToken,
  )
  await writeSession(session)
  return {
    config,
    session,
    supabase: createClient(config, session.accessToken),
  }
}

export async function createEmailPasswordSession(params: {
  config: GastlyConfig
  email: string
  password: string
}): Promise<GastlySession> {
  const client = createClient(params.config)
  const { data, error } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })
  if (error) throw new Error(error.message)
  return parseAuthSession(data as unknown, "Login")
}
