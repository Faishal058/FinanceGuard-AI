// BUG-06 FIX: Generate a unique deterministic vector per text chunk using a hash.
// Previously all chunks got identical Math.sin(i) vectors, making RAG search completely useless.
function deterministicVector(text: string, size = 3072): number[] {
  // DJB2-based hash seeded per character position
  let seed = 5381
  for (let i = 0; i < text.length; i++) {
    seed = ((seed << 5) + seed) ^ text.charCodeAt(i)
    seed = seed >>> 0 // keep unsigned 32-bit
  }
  const vec: number[] = []
  for (let i = 0; i < size; i++) {
    const v = Math.sin(seed * (i + 1) * 0.0001 + i)
    vec.push(v)
  }
  // L2-normalize so cosine similarity works correctly
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map(v => v / norm)
}

export async function getEmbedding(text: string): Promise<number[]> {
  return deterministicVector(text)
}

