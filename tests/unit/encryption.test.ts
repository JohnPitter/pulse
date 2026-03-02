import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We'll import from the implementation file once it exists
import { encrypt, decrypt } from '../../packages/server/src/lib/encryption.js';

const VALID_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes

describe('encryption', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'hello world secret data';
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'senha secreta com acentos: cafe, nao, coracao';
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'x'.repeat(10000);
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('random IV ensures different ciphertexts', () => {
    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'same input every time';
      const ciphertext1 = encrypt(plaintext);
      const ciphertext2 = encrypt(plaintext);
      expect(ciphertext1).not.toBe(ciphertext2);
    });
  });

  describe('ciphertext format', () => {
    it('should produce ciphertext in iv:authTag:ciphertext hex format', () => {
      const ciphertext = encrypt('test');
      const parts = ciphertext.split(':');
      expect(parts).toHaveLength(3);

      const [iv, authTag, encrypted] = parts;
      // IV: 16 bytes = 32 hex chars
      expect(iv).toHaveLength(32);
      // Auth tag: 16 bytes = 32 hex chars
      expect(authTag).toHaveLength(32);
      // Encrypted data should be hex string
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('tampered ciphertext', () => {
    it('should throw on tampered ciphertext data', () => {
      const ciphertext = encrypt('sensitive data');
      const parts = ciphertext.split(':');
      // Tamper with the encrypted portion
      const tampered = parts[0] + ':' + parts[1] + ':' + 'ff'.repeat(parts[2].length / 2);
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const ciphertext = encrypt('sensitive data');
      const parts = ciphertext.split(':');
      // Tamper with the auth tag
      const tampered = parts[0] + ':' + 'ff'.repeat(16) + ':' + parts[2];
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw on tampered IV', () => {
      const ciphertext = encrypt('sensitive data');
      const parts = ciphertext.split(':');
      // Tamper with the IV
      const tampered = 'ff'.repeat(16) + ':' + parts[1] + ':' + parts[2];
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw on malformed ciphertext (wrong format)', () => {
      expect(() => decrypt('not-valid-ciphertext')).toThrow();
    });
  });

  describe('missing ENCRYPTION_KEY', () => {
    it('should throw if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
    });

    it('should throw if ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'tooshort';
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
    });
  });
});
