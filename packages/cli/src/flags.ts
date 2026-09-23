import { createInterface } from "node:readline"

export function getFlagValue(args: string[], flag: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag) {
      return args[i + 1]
    }
  }
  return undefined
}

export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag)
}

export function parseMonth(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const match = value.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const d = new Date(`${value}-01T00:00:00`)
  return isNaN(d.getTime()) ? undefined : d
}

export function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export async function promptText(label: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  return new Promise<string>((resolve) => {
    rl.question(label, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export async function promptSecret(label: string): Promise<string> {
  process.stderr.write(label)
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  })
  return new Promise<string>((resolve) => {
    rl.on("line", (line: string) => {
      process.stderr.write("\n")
      rl.close()
      resolve(line.trim())
    })
  })
}

export async function promptConfirm(label: string): Promise<boolean> {
  const answer = await promptText(`${label} (y/N) `)
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
}
