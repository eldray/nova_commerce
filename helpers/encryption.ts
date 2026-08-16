import crypto from "crypto";

// Fix: Use import.meta.env for Vite projects instead of process.env
// Ensure you have VITE_ENCRYPTION_SECRET in your .env file
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_SECRET ?? "nova-commerce-secret-key-32-chars!!";
const ALGORITHM = "aes-256-cbc";

export function encryptSecret(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  // Note: In a real browser environment, crypto.scryptSync might be slow or unavailable depending on the build setup.
  // For Vite + Node polyfills, this usually works if the plugin is configured.
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return "";
  const parts = cipherText.split(":");
  if (parts.length !== 2) return cipherText;
  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}