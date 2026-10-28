import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import type { UserSessionPayload } from '../models/user.model';

@Injectable()
export class DispatchEncryptionService {
  private readonly key: Buffer;
  private readonly authSecret: string;

  constructor(options?: { authSecret?: string; encryptionKey?: string }) {
    this.authSecret =
      options?.authSecret || 'pulseops-london-dispatch-secure-auth-secret-2026';
    const rawKey = options?.encryptionKey || '0123456789abcdef0123456789abcdef';
    // Ensure 32 bytes for AES-256
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  // --- AES-256-GCM FIELD-LEVEL ENCRYPTION ---

  /**
   * Encrypts a sensitive string (phone, door code, signature) using AES-256-GCM.
   * Returns a compact string: "iv:authTag:ciphertext"
   */
  encryptField(plainText: string): string {
    if (!plainText) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts an AES-256-GCM ciphertext. Returns plaintext or fallback on format mismatch.
   */
  decryptField(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;
    const [ivHex, authTagHex, encryptedHex] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // In case of wrong key or tampered ciphertext, return placeholder
      return '[Protected Encrypted Data]';
    }
  }

  // --- PBKDF2 PASSWORD HASHING ---

  hashPassword(password: string): { salt: string; hash: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
      .toString('hex');
    return { salt, hash };
  }

  verifyPassword(
    password: string,
    salt: string,
    expectedHash: string,
  ): boolean {
    const hash = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
      .toString('hex');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  }

  // --- SECURE HMAC-SHA256 SESSION TOKENS ---

  signSessionToken(payload: Omit<UserSessionPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 3600; // 7 days
    const fullPayload: UserSessionPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const dataToSign = `${header}.${body}`;
    const signature = crypto
      .createHmac('sha256', this.authSecret)
      .update(dataToSign)
      .digest('base64url');

    return `${dataToSign}.${signature}`;
  }

  verifySessionToken(token: string): UserSessionPayload | null {
    if (!token || !token.includes('.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const dataToSign = `${header}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.authSecret)
      .update(dataToSign)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    try {
      const payloadJson = Buffer.from(body, 'base64url').toString('utf8');
      const payload: UserSessionPayload = JSON.parse(payloadJson);
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }
      return payload;
    } catch {
      return null;
    }
  }
}
