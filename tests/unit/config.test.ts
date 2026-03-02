import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { loadConfig } from '../../packages/server/src/lib/config.js';

describe('config', () => {
  const originalEnv: Record<string, string | undefined> = {};
  const envKeys = [
    'PORT',
    'NODE_ENV',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
    'DB_PATH',
    'CORS_ORIGIN',
  ];

  beforeEach(() => {
    // Save original env values
    for (const key of envKeys) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore original env values
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  describe('defaults', () => {
    it('should return sensible defaults when no env vars are set', () => {
      const config = loadConfig();
      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe('development');
      expect(config.encryptionKey).toBe('');
      expect(config.jwtSecret).toBe('pulse-dev-secret');
      expect(config.dbPath).toBe('./data/pulse.db');
      expect(config.corsOrigin).toBe('http://localhost:5173');
    });
  });

  describe('env var reading', () => {
    it('should read PORT from env', () => {
      process.env.PORT = '8080';
      const config = loadConfig();
      expect(config.port).toBe(8080);
    });

    it('should read NODE_ENV from env', () => {
      process.env.NODE_ENV = 'production';
      const config = loadConfig();
      expect(config.nodeEnv).toBe('production');
    });

    it('should read ENCRYPTION_KEY from env', () => {
      const key = 'b'.repeat(64);
      process.env.ENCRYPTION_KEY = key;
      const config = loadConfig();
      expect(config.encryptionKey).toBe(key);
    });

    it('should read JWT_SECRET from env', () => {
      process.env.JWT_SECRET = 'my-super-secret';
      const config = loadConfig();
      expect(config.jwtSecret).toBe('my-super-secret');
    });

    it('should read DB_PATH from env', () => {
      process.env.DB_PATH = '/var/data/pulse.db';
      const config = loadConfig();
      expect(config.dbPath).toBe('/var/data/pulse.db');
    });

    it('should read CORS_ORIGIN from env', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const config = loadConfig();
      expect(config.corsOrigin).toBe('https://example.com');
    });
  });

  describe('port parsing', () => {
    it('should default to 3000 for invalid PORT', () => {
      process.env.PORT = 'not-a-number';
      const config = loadConfig();
      expect(config.port).toBe(3000);
    });

    it('should handle PORT as float by truncating', () => {
      process.env.PORT = '3000.5';
      const config = loadConfig();
      expect(config.port).toBe(3000);
    });
  });

  describe('config object shape', () => {
    it('should return an object with all expected keys', () => {
      const config = loadConfig();
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('encryptionKey');
      expect(config).toHaveProperty('jwtSecret');
      expect(config).toHaveProperty('dbPath');
      expect(config).toHaveProperty('corsOrigin');
    });
  });
});
