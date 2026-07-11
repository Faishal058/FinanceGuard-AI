import { getDbClient } from './db'

export interface VectorPoint {
  id: string
  vector: number[]
  payload: {
    user_id: string
    document_type: string
    upload_date: string
    embedding_version: string
    chunk_index: number
    total_chunks: number
    text: string
    document_id: string
    [key: string]: any
  }
}

// Ensure the local fallback table exists in the database
async function ensureFallbackTable() {
  const db = getDbClient()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mock_vector_store (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      text TEXT NOT NULL,
      vector_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// Tiny local text embedding / TF-IDF similarity solver for fallback
function computeLocalSimilarity(query: string, text: string): number {
  const qWords = new Set(query.toLowerCase().match(/\w+/g) || [])
  const tWords = text.toLowerCase().match(/\w+/g) || []
  if (qWords.size === 0 || tWords.length === 0) return 0

  let matchCount = 0
  for (const word of tWords) {
    if (qWords.has(word)) {
      matchCount++
    }
  }
  // Jaccard-like term overlap score
  const unionSize = qWords.size + new Set(tWords).size - new Set([...qWords].filter(x => new Set(tWords).has(x))).size
  return unionSize > 0 ? matchCount / unionSize : 0
}

export class QdrantClientWrapper {
  private url: string | undefined
  private apiKey: string | undefined
  private useMock: boolean

  constructor() {
    this.url = process.env.QDRANT_URL
    this.apiKey = process.env.QDRANT_API_KEY
    this.useMock = !this.url || !this.apiKey
  }

  async initCollection(collectionName: string) {
    if (this.useMock) {
      await ensureFallbackTable()
      return true
    }

    try {
      const response = await fetch(`${this.url}/collections/${collectionName}`, {
        headers: {
          'api-key': this.apiKey || '',
        },
      })
      
      if (response.status === 404) {
        // Create collection
        await fetch(`${this.url}/collections/${collectionName}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey || '',
          },
          body: JSON.stringify({
            vectors: {
              size: 3072, // text-embedding-3-large
              distance: 'Cosine',
            },
          }),
        })
      }
      return true
    } catch (e) {
      console.warn('Failed to connect to Qdrant, switching to Mock fallback.', e)
      this.useMock = true
      await ensureFallbackTable()
      return false
    }
  }

  async upsertPoints(collectionName: string, points: VectorPoint[]) {
    if (this.useMock) {
      await ensureFallbackTable()
      const db = getDbClient()
      for (const p of points) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO mock_vector_store (id, user_id, document_id, text, vector_json, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            p.id,
            p.payload.user_id,
            p.payload.document_id || '',
            p.payload.text,
            JSON.stringify(p.vector),
            JSON.stringify(p.payload),
          ],
        })
      }
      return true
    }

    try {
      const response = await fetch(`${this.url}/collections/${collectionName}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey || '',
        },
        body: JSON.stringify({ points }),
      })
      return response.ok
    } catch (e) {
      console.error('Qdrant upsert failed', e)
      return false
    }
  }

  async searchPoints(
    collectionName: string,
    queryText: string,
    userId: string,
    limit = 5
  ): Promise<any[]> {
    if (this.useMock) {
      await ensureFallbackTable()
      const db = getDbClient()
      const result = await db.execute({
        sql: `SELECT * FROM mock_vector_store WHERE user_id = ?`,
        args: [userId],
      })

      const scored = result.rows.map(row => {
        const metadata = JSON.parse(row.metadata_json as string)
        const score = computeLocalSimilarity(queryText, row.text as string)
        return {
          id: row.id,
          score,
          payload: metadata,
        }
      })

      // Sort by score descending and return top K
      return scored
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    }

    // Generate deterministic vector for query text
    const queryVector = (() => {
      let seed = 5381
      for (let i = 0; i < queryText.length; i++) {
        seed = ((seed << 5) + seed) ^ queryText.charCodeAt(i)
        seed = seed >>> 0
      }
      const vec: number[] = []
      for (let i = 0; i < 3072; i++) {
        const v = Math.sin(seed * (i + 1) * 0.0001 + i)
        vec.push(v)
      }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
      return vec.map(v => v / norm)
    })()


    try {
      const response = await fetch(`${this.url}/collections/${collectionName}/points/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey || '',
        },
        body: JSON.stringify({
          vector: queryVector,
          limit,
          filter: {
            must: [
              {
                key: 'user_id',
                match: {
                  value: userId,
                },
              },
            ],
          },
        }),
      })
      const data = await response.json()
      return data.result || []
    } catch (e) {
      console.error('Qdrant search failed, falling back to local text matching', e)
      this.useMock = true
      return this.searchPoints(collectionName, queryText, userId, limit)
    }
  }

  async deletePointsByDocId(collectionName: string, documentId: string) {
    if (this.useMock) {
      await ensureFallbackTable()
      const db = getDbClient()
      await db.execute({
        sql: `DELETE FROM mock_vector_store WHERE document_id = ?`,
        args: [documentId],
      })
      return true
    }

    try {
      const response = await fetch(`${this.url}/collections/${collectionName}/points/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey || '',
        },
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: 'document_id',
                match: {
                  value: documentId,
                },
              },
            ],
          },
        }),
      })
      return response.ok
    } catch (e) {
      console.error('Qdrant delete failed', e)
      return false
    }
  }

  async deletePointsByUserId(collectionName: string, userId: string) {
    if (this.useMock) {
      await ensureFallbackTable()
      const db = getDbClient()
      await db.execute({
        sql: `DELETE FROM mock_vector_store WHERE user_id = ?`,
        args: [userId],
      })
      return true
    }

    try {
      const response = await fetch(`${this.url}/collections/${collectionName}/points/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey || '',
        },
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: 'user_id',
                match: {
                  value: userId,
                },
              },
            ],
          },
        }),
      })
      return response.ok
    } catch (e) {
      console.error('Qdrant delete by user failed', e)
      return false
    }
  }

  async scrollPoints(collectionName: string, userId: string, limit = 100): Promise<any[]> {
    if (this.useMock) {
      await ensureFallbackTable()
      const db = getDbClient()
      const result = await db.execute({
        sql: `SELECT * FROM mock_vector_store WHERE user_id = ?`,
        args: [userId],
      })
      return result.rows.map(row => {
        try {
          return {
            id: row.id,
            payload: JSON.parse(row.metadata_json as string),
            text: row.text as string,
          }
        } catch (e) {
          return null
        }
      }).filter(Boolean) as any[]
    }

    try {
      const response = await fetch(`${this.url}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey || '',
        },
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: 'user_id',
                match: {
                  value: userId,
                },
              },
            ],
          },
          limit,
          with_payload: true,
          with_vector: false,
        }),
      })
      const data = await response.json()
      const points = data.result?.points || []
      return points.map((p: any) => ({
        id: p.id,
        payload: p.payload,
        text: p.payload?.text || '',
      }))
    } catch (e) {
      console.error('Qdrant scroll points failed, falling back to local list', e)
      this.useMock = true
      return this.scrollPoints(collectionName, userId, limit)
    }
  }
}
