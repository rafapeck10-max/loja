import { createHash, timingSafeEqual } from "node:crypto";

export function verifyAdminSecret(input: string): void {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD não configurado.");
  const a = createHash("sha256")
    .update(String(input ?? ""), "utf8")
    .digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Senha administrativa incorreta.");
  }
}
