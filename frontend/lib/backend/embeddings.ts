export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey || apiKey.startsWith('sk-or-') || apiKey.startsWith('fl-')) {
    // Return a deterministic mock vector if no API key is set, or using OpenRouter/Featherless (which lack embeddings APIs)
    return new Array(3072).fill(0).map((_, i) => Math.sin(i))
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.replace(/\n/g, ' '), // Replace newlines as recommended by OpenAI docs
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
    return new Array(3072).fill(0).map((_, i) => Math.sin(i))
  }
}
