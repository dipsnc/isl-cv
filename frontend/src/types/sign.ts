export type SignId = 'a' | 'b' | 'c' | 'd';

export type Sign = {
  id: SignId;
  name: string;
  phonetic: string;
  level: string;
  duration: string;
  progress: number;
  tint: string;
  accent: string;
  description: string;
  steps: string[];
};
