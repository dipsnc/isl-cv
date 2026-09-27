import { initialProgress } from '@/data/signs';
import type { SignId } from '@/types/sign';

const STORAGE_KEY = 'signlearn-progress';

export function getStoredProgress(): Record<SignId, number> {
  try {
    return { ...initialProgress, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return initialProgress;
  }
}

export function saveProgress(progress: Record<SignId, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
