import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytes } from 'expo-crypto';

import { base64ToBytes, bytesToBase64, pbkdf2Sha256Async } from './kdf';
import type { LedgerSnapshot } from './snapshot';

/** High enough to slow guessing, low enough that a phone finishes in a few seconds. */
export const BACKUP_ITERATIONS = 60_000;

type Envelope = {
  format: 'sikalens-backup';
  version: 1;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

function passphraseKey(passphrase: string, salt: Uint8Array, iterations: number) {
  return pbkdf2Sha256Async(new TextEncoder().encode(passphrase), salt, iterations, 32);
}

export async function encryptSnapshot(passphrase: string, snapshot: LedgerSnapshot): Promise<string> {
  const salt = getRandomBytes(16);
  const key = await AESEncryptionKey.import(await passphraseKey(passphrase, salt, BACKUP_ITERATIONS));
  const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(snapshot)), key);
  const envelope: Envelope = {
    format: 'sikalens-backup',
    version: 1,
    kdf: 'pbkdf2-sha256',
    iterations: BACKUP_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: await sealed.iv('base64'),
    tag: await sealed.tag('base64'),
    ciphertext: await sealed.ciphertext({ encoding: 'base64' }),
  };
  return JSON.stringify(envelope);
}

export async function decryptSnapshot(passphrase: string, raw: string): Promise<LedgerSnapshot> {
  let env: Envelope;
  try {
    env = JSON.parse(raw) as Envelope;
  } catch {
    throw new Error('not-backup');
  }
  if (env.format !== 'sikalens-backup' || env.version !== 1 || env.kdf !== 'pbkdf2-sha256') throw new Error('not-backup');
  if (typeof env.iterations !== 'number' || env.iterations < 1 || env.iterations > 1_000_000) throw new Error('not-backup');

  const key = await AESEncryptionKey.import(await passphraseKey(passphrase, base64ToBytes(env.salt), env.iterations));
  const sealed = AESSealedData.fromParts(env.iv, env.ciphertext, env.tag);
  try {
    const bytes = (await aesDecryptAsync(sealed, key)) as Uint8Array;
    const snap = JSON.parse(new TextDecoder().decode(bytes)) as LedgerSnapshot;
    if (snap.version !== 1 || !Array.isArray(snap.transactions)) throw new Error('not-backup');
    return snap;
  } catch (err) {
    if (err instanceof Error && err.message === 'not-backup') throw err;
    throw new Error('bad-passphrase');
  }
}
