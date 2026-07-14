import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

export function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = randomBytes(2).toString('hex');
  return `${base}-${suffix}`;
}

export async function hashPassword(plain: string): Promise<string> {
  // 10 is secure enough for app passwords and much faster than 12 in WSL/dev.
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
