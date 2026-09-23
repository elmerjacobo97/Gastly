import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  loginSchema,
} from "@/features/auth/schemas/auth-schemas";

describe("loginSchema", () => {
  it("parses valid credentials", () => {
    expect(
      loginSchema.parse({ email: "user@example.com", password: "secret123" }),
    ).toEqual({ email: "user@example.com", password: "secret123" });
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa un email valido.");
    }
  });

  it("rejects a missing email", () => {
    expect(loginSchema.safeParse({ password: "secret123" }).success).toBe(
      false,
    );
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El password debe tener al menos 6 caracteres.",
      );
    }
  });

  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com" }).success).toBe(
      false,
    );
  });
});

describe("changePasswordSchema", () => {
  it("parses matching passwords", () => {
    expect(
      changePasswordSchema.parse({
        currentPassword: "old-secret",
        newPassword: "new-secret",
        confirmPassword: "new-secret",
      }),
    ).toEqual({
      currentPassword: "old-secret",
      newPassword: "new-secret",
      confirmPassword: "new-secret",
    });
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "new-secret",
      confirmPassword: "new-secret",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa tu contraseña actual.",
      );
    }
  });

  it("rejects a new password shorter than 6 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-secret",
      newPassword: "12345",
      confirmPassword: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La nueva contraseña debe tener al menos 6 caracteres.",
      );
    }
  });

  it("rejects a short confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-secret",
      newPassword: "new-secret",
      confirmPassword: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Confirma tu nueva contraseña.",
      );
    }
  });

  it("rejects mismatched passwords on the confirmation path", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-secret",
      newPassword: "new-secret",
      confirmPassword: "other-secret",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.message === "Las contraseñas no coinciden.",
      );
      expect(issue?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a missing confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-secret",
      newPassword: "new-secret",
    });

    expect(result.success).toBe(false);
  });
});
