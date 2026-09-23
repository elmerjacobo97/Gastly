/**
 * Fail-closed shared-secret validation for provider webhooks and scheduled jobs.
 * Compares encoded values without an early exit to avoid a byte-by-byte timing
 * oracle. Secrets are expected to be high-entropy values.
 */
export function hasValidWebhookSecret(
  request: Request,
  headerName: string,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret) return false;

  const actualSecret = request.headers.get(headerName);
  if (!actualSecret) return false;

  const encoder = new TextEncoder();
  const expected = encoder.encode(expectedSecret);
  const actual = encoder.encode(actualSecret);
  const length = Math.max(expected.length, actual.length);
  let difference = expected.length ^ actual.length;

  for (let i = 0; i < length; i++) {
    difference |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
  }

  return difference === 0;
}
