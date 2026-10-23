import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { loadProfileName, saveProfileName } from '@/features/profile/storage';
import { decryptSnapshot, encryptSnapshot } from './crypto';
import { applySnapshot, buildSnapshot } from './snapshot';

export type BackupShareResult = { ok: true } | { ok: false; reason: 'sharing_unavailable' };
export type RestoreResult = { ok: true } | { ok: false; reason: 'cancelled' | 'not-backup' | 'bad-passphrase' };

export async function shareBackup(passphrase: string): Promise<BackupShareResult> {
  if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'sharing_unavailable' };
  const json = await encryptSnapshot(passphrase, buildSnapshot(new Date(), await loadProfileName()));
  const file = new File(Paths.cache, `sikalens-backup-${new Date().toISOString().slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save SikaLens backup',
  });
  return { ok: true };
}

export async function pickAndRestore(passphrase: string): Promise<RestoreResult> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', 'text/*'] });
  if (picked.canceled || !picked.result) return { ok: false, reason: 'cancelled' };
  const raw = await picked.result.text();
  try {
    const snap = await decryptSnapshot(passphrase, raw);
    applySnapshot(snap);
    if (snap.profileName) await saveProfileName(snap.profileName);
    return { ok: true };
  } catch (err) {
    const reason = err instanceof Error && err.message === 'bad-passphrase' ? 'bad-passphrase' : 'not-backup';
    return { ok: false, reason };
  }
}
