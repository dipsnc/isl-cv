import { dbGet, dbPut, STORES } from '@/lib/db';
import { initialProgress } from '@/data/signs';
import type { SignId } from '@/types/sign';

type StoredProgress = { userEmail: string; values: Record<SignId, number> };

export async function getProgress(userEmail: string): Promise<Record<SignId, number>> {
  const row = await dbGet<StoredProgress>(STORES.progress, userEmail);
  return row ? { ...initialProgress, ...row.values } : initialProgress;
}

export async function saveProgress(userEmail: string, progress: Record<SignId, number>): Promise<void> {
  await dbPut<StoredProgress>(STORES.progress, { userEmail, values: progress });
}
