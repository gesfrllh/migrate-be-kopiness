// utils/crypto.ts
import { secretBox, openSecretBox } from "@stablelib/nacl";
import { randomBytes } from "@stablelib/random";

const SECRETBOX_KEY_LENGTH = 32;
const SECRETBOX_NONCE_LENGTH = 24;
export const SECRET_KEY = randomBytes(SECRETBOX_KEY_LENGTH);

export function encryptToken(token: string): string {
  const nonce = randomBytes(SECRETBOX_NONCE_LENGTH);
  const ciphertext = secretBox(new TextEncoder().encode(token), nonce, SECRET_KEY);
  return Buffer.from(nonce).toString("hex") + ":" + Buffer.from(ciphertext).toString("hex");
}

export function decryptToken(data: string): string | null {
  const [nonceHex, ciphertextHex] = data.split(":");
  const nonce = new Uint8Array(Buffer.from(nonceHex, "hex"));
  const ciphertext = new Uint8Array(Buffer.from(ciphertextHex, "hex"));

  const decrypted = openSecretBox(ciphertext, nonce, SECRET_KEY);
  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}

export function buildHttpOnlyCookie(encryptedToken: string): string {
  return `access_token=${encryptedToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}
