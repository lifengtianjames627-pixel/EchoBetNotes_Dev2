import { describe, expect, it } from 'vitest';
import { safeKey } from '../storage/objectStorage.js';

describe('storage keys', () => {
  it('rejects paths that leave the storage root', () => {
    expect(safeKey('public/covers/cover.jpg')).toBe('public/covers/cover.jpg');
    expect(() => safeKey('public/../podcasts/secret.mp3')).toThrow(/Invalid storage key/);
    expect(() => safeKey('../secret.mp3')).toThrow(/Invalid storage key/);
    expect(() => safeKey('/etc/passwd')).toThrow(/Invalid storage key/);
  });
});
