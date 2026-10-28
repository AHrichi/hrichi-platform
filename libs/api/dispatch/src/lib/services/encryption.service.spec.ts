import { describe, it, expect } from 'vitest';
import { DispatchEncryptionService } from './encryption.service';

describe('DispatchEncryptionService', () => {
  const service = new DispatchEncryptionService({
    authSecret: 'test-secret-1234567890-test-secret',
    encryptionKey: '0123456789abcdef0123456789abcdef',
  });

  describe('Field-Level AES-256-GCM Encryption', () => {
    it('should encrypt and decrypt sensitive fields accurately', () => {
      const sensitiveDoorCode = 'Keypad code: #4920, Security Gate 3';
      const encrypted = service.encryptField(sensitiveDoorCode);

      expect(encrypted).not.toBe(sensitiveDoorCode);
      expect(encrypted.split(':').length).toBe(3); // iv:tag:data

      const decrypted = service.decryptField(encrypted);
      expect(decrypted).toBe(sensitiveDoorCode);
    });

    it('should produce different ciphertexts for the same plaintext due to random IV', () => {
      const text = '+44 7700 900820';
      const enc1 = service.encryptField(text);
      const enc2 = service.encryptField(text);

      expect(enc1).not.toBe(enc2);
      expect(service.decryptField(enc1)).toBe(text);
      expect(service.decryptField(enc2)).toBe(text);
    });

    it('should handle empty or unencrypted legacy strings gracefully', () => {
      expect(service.encryptField('')).toBe('');
      expect(service.decryptField('')).toBe('');
      expect(service.decryptField('plain-text-no-colons')).toBe(
        'plain-text-no-colons',
      );
    });
  });

  describe('PBKDF2 Password Hashing', () => {
    it('should hash and verify passwords correctly', () => {
      const password = 'CorrectHorseBatteryStaple123!';
      const { salt, hash } = service.hashPassword(password);

      expect(salt).toBeDefined();
      expect(hash).toBeDefined();

      const isMatch = service.verifyPassword(password, salt, hash);
      expect(isMatch).toBe(true);

      const isWrong = service.verifyPassword('WrongPassword', salt, hash);
      expect(isWrong).toBe(false);
    });
  });

  describe('HMAC-SHA256 Session Tokens', () => {
    it('should sign and verify valid session tokens', () => {
      const payload = {
        sub: 'usr_1001',
        email: 'tariq@lplaundry.co.uk',
        name: 'Tariq Mahmood',
        role: 'driver' as const,
        associatedId: 'drv-tariq',
      };

      const token = service.signSessionToken(payload);
      expect(token).toContain('.');

      const verified = service.verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(payload.sub);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe('driver');
    });

    it('should reject tampered or corrupted tokens', () => {
      const payload = {
        sub: 'usr_1002',
        email: 'attacker@evil.com',
        name: 'Attacker',
        role: 'coordinator' as const,
      };

      const token = service.signSessionToken(payload);
      const parts = token.split('.');
      parts[1] = Buffer.from(
        JSON.stringify({ ...payload, role: 'owner' }),
      ).toString('base64url');
      const tampered = parts.join('.');

      expect(service.verifySessionToken(tampered)).toBeNull();
      expect(service.verifySessionToken('completely-invalid-token')).toBeNull();
    });
  });
});
