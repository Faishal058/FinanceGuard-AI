import { initDb } from '../lib/backend/db'
import { getRedisClient, getRedisSubClient, publishWorkflowTask, runWorkflowWorker } from '../lib/backend/redis'

describe('Redis Streams Workflow Queue and Worker', () => {
  let redisAlive = false
  let workerActive = true

  beforeAll(async () => {
    await initDb()
    
    // Check if local Redis server is active
    try {
      const client = getRedisClient()
      await client.ping()
      redisAlive = true
    } catch (e) {
      console.warn('Local Redis server is not running. Skipping live integration tests, running fallbacks.')
    }
  })

  afterAll(async () => {
    workerActive = false
    try {
      const client = getRedisClient()
      const subClient = getRedisSubClient()
      client.disconnect()
      subClient.disconnect()
    } catch (e) {}
  })

  test('Worker processes stream tasks and triggers PubSub completed updates', async () => {
    if (!redisAlive) {
      console.log('Skipped live stream test (Redis offline)')
      return
    }

    const redis = getRedisClient()
    const pubsub = getRedisSubClient()
    const taskId = 'task_test_async_queue_88'
    const payload = {
      userId: 'user_dev_99',
      sessionId: 'sess_dev_99',
      query: 'What is my budget status?',
      traceId: 'tr_test_async_99',
    }

    // 1. Clear previous logs/cache if any
    await redis.del(`workflow_result:${taskId}`)
    await redis.del('workflow_tasks')

    // 2. Start worker asynchronously in background
    const workerPromise = runWorkflowWorker()

    // 3. Await PubSub completed event
    const results = await new Promise<any>((resolve, reject) => {
      const channel = `workflow_complete:${taskId}`
      
      const onMessage = async (chan: string, msg: string) => {
        if (chan === channel) {
          try {
            const res = await redis.get(`workflow_result:${taskId}`)
            resolve(res ? JSON.parse(res) : null)
          } catch (e) {
            reject(e)
          } finally {
            pubsub.unsubscribe(channel).catch(console.error)
            pubsub.off('message', onMessage)
          }
        }
      }

      pubsub.subscribe(channel).then(() => {
        pubsub.on('message', onMessage)
        
        // Publish task
        publishWorkflowTask(taskId, payload).catch(reject)
      }).catch(reject)
    })

    expect(results).not.toBeNull()
    if (results) {
      expect(results.status).toBe('success')
      expect(results.data.advisory).toBeDefined()
    }

    // Clean up
    await redis.del(`workflow_result:${taskId}`)
  })
})
