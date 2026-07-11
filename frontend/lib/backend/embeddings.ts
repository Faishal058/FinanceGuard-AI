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
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey.startsWith('sk-or-') || apiKey.startsWith('fl-') || apiKey.startsWith('rc_')) {
    // Return a unique deterministic vector derived from text content
    return deterministicVector(text)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.replace(/\n/g, ' '),
        model: 'text-embedding-3-large',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI Embeddings API returned status ${response.status}`)
    }

    const data = await response.json()
    if (data?.data?.[0]?.embedding) {
      return data.data[0].embedding
    } else {
      throw new Error('Invalid response structure from OpenAI Embeddings API')
    }
  } catch (e) {
    console.warn('OpenAI Embeddings fetch failed, using fallback deterministic vector:', e)
    return deterministicVector(text)
  }
}
