import crypto from 'crypto';
const DIM = parseInt(process.env.EMBED_DIM || '64', 10);

export function embedText(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  const vec = new Array(DIM).fill(0).map((_, i) => {
    const b = hash[i % hash.length]; 
    return ((b / 255) * 2 - 1);
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
  return vec.map(v => v / (norm || 1));
}
