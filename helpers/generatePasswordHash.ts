// helpers/generatePasswordHash.ts
import bcrypt from 'bcryptjs';
import crypto from "crypto";

// For compatibility with existing code
export async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Async version using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Synchronous version using bcrypt
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Verify password using bcrypt
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

// Synchronous version for verification
export function verifyPasswordSync(password: string, storedHash: string): boolean {
  return bcrypt.compareSync(password, storedHash);
}

// Keep the crypto-based version as an alternative if needed
export async function hashPasswordCrypto(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPasswordCrypto(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });
}