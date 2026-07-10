import { getDbClient, initDb } from '../lib/backend/db'
import { PromptRegistry } from '../lib/backend/prompt-registry'

describe('Prompt Registry Lifecycle', () => {
  beforeAll(async () => {
    await initDb()
  })

  test('Prompt registry seeds and fetches defaults correctly', async () => {
    const db = getDbClient()
    
    // Check database has prompt rows
    const countRes = await db.execute('SELECT COUNT(*) as cnt FROM prompt_versions')
    expect(Number(countRes.rows[0].cnt)).toBeGreaterThanOrEqual(5)

    // Fetch latest active ingest prompt
    const latestIngest = await PromptRegistry.fetchPrompt('ingest')
    expect(latestIngest.version).toBe('2.3.1')
    expect(latestIngest.model_id).toBe('gpt-4o-2025-05-13')
    expect(latestIngest.temperature).toBe(0.05)
    expect(latestIngest.prompt_text).toContain('SYSTEM PROMPT — INGEST AGENT')

    // Fetch latest active advisor prompt
    const latestAdvisor = await PromptRegistry.fetchPrompt('advisor')
    expect(latestAdvisor.version).toBe('4.2.1')
    expect(latestAdvisor.temperature).toBe(0.30)
    expect(latestAdvisor.prompt_text).toContain('SYSTEM PROMPT — ADVISOR AGENT')
  })

  test('Registry retrieves specific version and handles dynamic active updates', async () => {
    const db = getDbClient()
    const agentName = 'ingest'
    const newVersion = '2.4.0-experimental'
    const newText = 'CUSTOM EXPERIMENTAL SYSTEM PROMPT FOR EXTRACTION'
    const promptId = 'pr_test_exp_99'

    // 1. Insert experimental prompt
    await db.execute({
      sql: `INSERT INTO prompt_versions (
              prompt_id, agent_name, version, prompt_text, model_id, temperature, top_p, max_tokens,
              output_schema, few_shot_examples, status, created_by
            ) VALUES (?, ?, ?, ?, 'gpt-4o', 0.1, 0.9, 2048, '{}', '[]', 'EXPERIMENTAL', 'Test Runner')`,
      args: [promptId, agentName, newVersion, newText],
    })

    // 2. Fetch specific experimental version
    const expPrompt = await PromptRegistry.fetchPrompt(agentName, newVersion)
    expect(expPrompt.version).toBe(newVersion)
    expect(expPrompt.prompt_text).toBe(newText)
    expect(expPrompt.status).toBe('EXPERIMENTAL')

    // 3. Make sure latest active STILL returns v2.3.1 (since v2.4.0 is EXPERIMENTAL)
    const activePrompt = await PromptRegistry.fetchPrompt(agentName)
    expect(activePrompt.version).toBe('2.3.1')

    // 4. Update statuses: deprecate old and activate experimental
    await db.execute({
      sql: `UPDATE prompt_versions SET status = 'DEPRECATED' WHERE agent_name = ? AND version = '2.3.1'`,
      args: [agentName],
    })
    await db.execute({
      sql: `UPDATE prompt_versions SET status = 'ACTIVE' WHERE agent_name = ? AND version = ?`,
      args: [agentName, newVersion],
    })

    // 5. Verify the active prompt is now updated dynamically
    const updatedActive = await PromptRegistry.fetchPrompt(agentName)
    expect(updatedActive.version).toBe(newVersion)
    expect(updatedActive.prompt_text).toBe(newText)

    // Clean up registry state for other runs
    await db.execute({
      sql: `UPDATE prompt_versions SET status = 'ACTIVE' WHERE agent_name = ? AND version = '2.3.1'`,
      args: [agentName],
    })
    await db.execute({
      sql: `DELETE FROM prompt_versions WHERE prompt_id = ?`,
      args: [promptId],
    })
  })
})
