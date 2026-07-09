import { getDbClient } from './db'

export type StepHandler = (context: any) => Promise<any>

export interface WorkflowStep {
  id: string
  handler?: StepHandler
  parallelSteps?: WorkflowStep[]
  condition?: (context: any) => boolean
  onFailure?: 'abort' | 'retry' | 'ignore'
}

export class Workflow {
  name: string
  version: string
  steps: WorkflowStep[] = []
  maxAttempts = 3
  baseDelayMs = 2000

  constructor(name: string, version: string) {
    this.name = name
    this.version = version
  }

  addStep(step: WorkflowStep) {
    this.steps.push(step)
  }

  // Persists workflow context to LibSQL session_state
  private async saveState(sessionId: string, userId: string, stepId: string, context: any) {
    const db = getDbClient()
    await db.execute({
      sql: `INSERT OR REPLACE INTO session_state (session_id, user_id, current_step, context_blob, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [sessionId, userId, stepId, JSON.stringify(context)],
    })
  }

  // Load workflow context from LibSQL
  async loadState(sessionId: string): Promise<any | null> {
    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT context_blob, current_step FROM session_state WHERE session_id = ?`,
      args: [sessionId],
    })
    if (result.rows.length > 0) {
      return {
        context: JSON.parse(result.rows[0].context_blob as string),
        currentStep: result.rows[0].current_step as string,
      }
    }
    return null
  }

  // Runs a step with exponential backoff retry policy
  private async executeWithRetry(stepId: string, handler: StepHandler, context: any): Promise<any> {
    let attempt = 0
    let delay = this.baseDelayMs

    while (attempt < this.maxAttempts) {
      try {
        return await handler(context)
      } catch (err) {
        attempt++
        console.warn(`Step [${stepId}] failed on attempt ${attempt}/${this.maxAttempts}:`, err)
        if (attempt >= this.maxAttempts) {
          throw err
        }
        // Exponential backoff with jitter
        const jitter = Math.random() * 500
        await new Promise(r => setTimeout(r, delay + jitter))
        delay *= 2
      }
    }
  }

  // Runs the workflow from a given step (for resuming) or from the start
  async execute(sessionId: string, userId: string, initialContext: any, startStepId?: string): Promise<any> {
    let context = { ...initialContext }
    let startIndex = 0

    if (startStepId) {
      const idx = this.steps.findIndex(s => s.id === startStepId)
      if (idx !== -1) {
        startIndex = idx
      }
    }

    for (let i = startIndex; i < this.steps.length; i++) {
      const step = this.steps[i]

      // Check conditionals
      if (step.condition && !step.condition(context)) {
        console.log(`Skipping step [${step.id}] due to condition`)
        continue
      }

      await this.saveState(sessionId, userId, step.id, context)

      try {
        if (step.parallelSteps && step.parallelSteps.length > 0) {
          // Execute steps in parallel (fan-out/fan-in)
          console.log(`Executing parallel steps: ${step.parallelSteps.map(s => s.id).join(', ')}`)
          const promises = step.parallelSteps.map(pStep => {
            if (pStep.handler) {
              return this.executeWithRetry(pStep.id, pStep.handler, context).then(res => ({
                id: pStep.id,
                result: res,
              }))
            }
            return Promise.resolve({ id: pStep.id, result: null })
          })

          const parallelResults = await Promise.all(promises)
          for (const pr of parallelResults) {
            context[pr.id] = pr.result
          }
        } else if (step.handler) {
          // Execute single step
          console.log(`Executing step [${step.id}]`)
          const result = await this.executeWithRetry(step.id, step.handler, context)
          context[step.id] = result
        }

        // Special: Human-in-the-loop gate
        if (step.id === 'human_approval') {
          // If condition matches, pause the workflow state
          const riskResult = context['risk']
          if (riskResult && riskResult.overall_risk_score > 70) { // Critical risk threshold
            console.log(`Workflow [${this.name}] paused at [human_approval] - Critical risk detected`)
            context.status = 'PENDING_APPROVAL'
            await this.saveState(sessionId, userId, 'PENDING_APPROVAL', context)
            return context
          }
        }
      } catch (err) {
        console.error(`Workflow step [${step.id}] encountered critical failure:`, err)
        context.status = 'FAILED'
        context.error = String(err)
        await this.saveState(sessionId, userId, `FAILED_${step.id}`, context)

        if (step.onFailure === 'abort') {
          throw err
        }
      }
    }

    context.status = 'COMPLETED'
    await this.saveState(sessionId, userId, 'COMPLETED', context)
    return context
  }
}
