import { hasValidWebhookSecret } from "./webhook-auth.ts";

Deno.test("accepts an exact configured webhook secret", () => {
  const request = new Request("https://example.test", {
    headers: { "x-hook-secret": "a-long-random-secret" },
  });

  if (
    !hasValidWebhookSecret(request, "x-hook-secret", "a-long-random-secret")
  ) {
    throw new Error("Expected matching secret to be accepted");
  }
});

Deno.test("rejects missing, unset, and incorrect webhook secrets", () => {
  const missing = new Request("https://example.test");
  const incorrect = new Request("https://example.test", {
    headers: { "x-hook-secret": "wrong" },
  });

  if (hasValidWebhookSecret(missing, "x-hook-secret", "configured")) {
    throw new Error("Expected missing secret to be rejected");
  }
  if (hasValidWebhookSecret(incorrect, "x-hook-secret", undefined)) {
    throw new Error("Expected unset secret to be rejected");
  }
  if (hasValidWebhookSecret(incorrect, "x-hook-secret", "configured")) {
    throw new Error("Expected incorrect secret to be rejected");
  }
});
