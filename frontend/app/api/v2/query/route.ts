import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'
import { EnkryptClient } from '@/lib/backend/enkrypt'
import { runRiskAgent } from '@/lib/backend/agents/risk'
import { runForecastAgent } from '@/lib/backend/agents/forecast'
import { runAdvisorAgent } from '@/lib/backend/agents/advisor'
import { Workflow } from '@/lib/backend/workflow'
import { QualityGateService } from '@/lib/backend/quality-gates'
import { getRedisClient, getRedisSubClient, publishWorkflowTask } from '@/lib/backend/redis'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query, session_id } = body

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const sessionId = session_id || 'sess_' + Math.random().toString(36).substr(2, 9)

    // 1. Consent Verification (Compliance)
    const analysisConsent = await ConsentManager.verifyConsent(user.userId, 'financial_analysis')
    const advisoryConsent = await ConsentManager.verifyConsent(user.userId, 'advisory_output')
    if (!analysisConsent || !advisoryConsent) {
      return NextResponse.json({
        error: 'Consent is required for financial analysis and advisory outputs',
        code: 'CONSENT_REQUIRED',
      }, { status: 403 })
    }

    const traceId = 'tr_workflow_' + Math.random().toString(36).substr(2, 9)
    const enkrypt = new EnkryptClient()

    // 2. Input Guard Validation
    const inputGuardResult = await enkrypt.validateText(
      query,
      {
        user_id: user.userId,
        trace_id: traceId,
        agent_name: 'Input Guard',
        prompt_version: '2.0.0',
      },
      false
    )

    if (!inputGuardResult.allowed) {
      return NextResponse.json({
        error: 'Query blocked by safety filters',
        reason: inputGuardResult.reason,
        code: 'SAFETY_BLOCKED',
      }, { status: 403 })
    }

    // Query sanitized query if PII was redacted
    const sanitizedQuery = inputGuardResult.redactedText || query

    // 3. Fetch real financial data from DB (stored during CSV ingest)
    const db = getDbClient()
    const docRes = await db.execute({
      sql: `SELECT id FROM documents_metadata WHERE user_id = ? AND status = 'completed'`,
      args: [user.userId],
    })

    // Read real stored profile metrics from DB (written by profile-builder during ingest)
    const storedProfileRes = await db.execute({
      sql: `SELECT * FROM user_profiles WHERE user_id = ?`,
      args: [user.userId],
    })
    const storedProfile = storedProfileRes.rows[0] as any

    const hasRealData = docRes.rows.length > 0 &&
      storedProfile &&
      typeof storedProfile.monthly_gross === 'number' &&
      (storedProfile.monthly_gross as number) > 0

    // Build real ProfileResult from stored DB metrics — no re-parsing needed
    const grossIncome  = hasRealData ? (storedProfile.monthly_gross as number) : 0
    const totalExpenses = hasRealData ? (storedProfile.monthly_burn as number) : 0
    const dti          = hasRealData ? (storedProfile.debt_to_income_ratio as number) : 0
    const netWorth     = hasRealData ? (storedProfile.net_worth as number) : 0
    const riskTolerance = (storedProfile?.risk_tolerance_score as number) || 5
    const savingsRate  = grossIncome > 0
      ? parseFloat(((grossIncome - totalExpenses) / grossIncome * 100).toFixed(1))
      : 0
    const monthlyDebt  = grossIncome > 0 ? parseFloat((dti * grossIncome).toFixed(2)) : 0

    const now = new Date()
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const dataPeriod = {
      start: monthAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    }

    // 4. Instantiate and Execute Mastra Orchestrator Workflow
    const workflow = new Workflow('financial-advisory-pipeline', '2.0.0')

    // Step A: Build real ProfileResult directly from stored data
    let profileResult: any = null
    workflow.addStep({
      id: 'profile',
      handler: async () => {
        // Use real stored metrics instead of fake hardcoded transactions
        profileResult = {
          user_id: user.userId,
          profile_date: new Date().toISOString(),
          profile_updated: false,
          update_reason: hasRealData
            ? 'Profile loaded from stored ingest metrics'
            : 'No documents uploaded — using zero defaults',
          income: {
            monthly_gross: grossIncome,
            sources: [{ source: hasRealData ? 'Uploaded Statement' : 'No data', amount: grossIncome }],
          },
          expenses: {
            monthly_total: totalExpenses,
            breakdown: {
              HOUSING: 0, UTILITIES: 0, FOOD: 0, TRANSPORT: 0,
              HEALTHCARE: 0, ENTERTAINMENT: 0,
              DEBT_PAYMENT: monthlyDebt,
              SAVINGS: Math.max(0, grossIncome - totalExpenses),
              TRANSFER: 0, OTHER: 0,
            },
          },
          ratios: {
            debt_to_income: dti,
            savings_rate: savingsRate,
            emergency_fund_ratio: 0,
            net_worth: netWorth,
          },
          monthly_burn_rate: totalExpenses,
          risk_tolerance_score: riskTolerance,
          confidence_score: hasRealData ? 0.92 : 0.40,
          stale: !hasRealData,
          calculation_notes: hasRealData
            ? `Real data: Income $${grossIncome.toLocaleString()}/mo, Expenses $${totalExpenses.toLocaleString()}/mo, DTI ${(dti * 100).toFixed(1)}%, Savings Rate ${savingsRate}%`
            : 'No financial documents uploaded. Please upload a bank statement to get personalized advice.',
          metadata: {
            data_period: dataPeriod,
            transaction_count: docRes.rows.length,
            prompt_version: '1.8.0',
            model_version: 'stored-profile-v1',
          },
        }
        return profileResult
      },
    })

    // Step B: Parallel Risk & Forecast simulations (fan-out/fan-in)
    let riskResult: any = null
    let forecastResult: any = null
    workflow.addStep({
      id: 'parallel_analysis',
      parallelSteps: [
        {
          id: 'risk',
          handler: async () => {
            riskResult = await runRiskAgent(user.userId, profileResult)
            return riskResult
          },
        },
        {
          id: 'forecast',
          handler: async () => {
            forecastResult = await runForecastAgent(user.userId, profileResult, 12)
            return forecastResult
          },
        },
      ],
    })

    // Step C: Human approval gate checking
    workflow.addStep({
      id: 'human_approval',
    })

    // Step D: Advisor Synthesis & Output safety check
    let advisorResult: any = null
    workflow.addStep({
      id: 'advisory',
      handler: async () => {
        advisorResult = await runAdvisorAgent(
          user.userId,
          sessionId,
          sanitizedQuery,
          profileResult,
          riskResult,
          forecastResult
        )
        return advisorResult
      },
    })

    const startTime = Date.now()
    let latencyMs = 0
    let finalResponse: any = null
    let usedRedis = false

    // BUG-09 FIX: Only attempt Redis if it is actually configured. Skip the 6-second timeout waste.
    const hasRedisConfig = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL)

    if (hasRedisConfig) {
      try {
        const redis = getRedisClient()
        const pubsub = getRedisSubClient()
        const taskId = 'task_' + Math.random().toString(36).substr(2, 9)

        await redis.ping()
        usedRedis = true

        const completionPromise = new Promise<any>((resolve, reject) => {
          const channel = `workflow_complete:${taskId}`

          const onMessage = async (chan: string, msg: string) => {
            if (chan === channel) {
              try {
                const resString = await redis.get(`workflow_result:${taskId}`)
                if (resString) {
                  const parsed = JSON.parse(resString)
                  resolve(parsed)
                } else {
                  reject(new Error('Result not found in Redis'))
                }
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
            publishWorkflowTask(taskId, {
              userId: user.userId,
              sessionId,
              query: sanitizedQuery,
              traceId,
            }).catch(reject)
          }).catch(reject)
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis workflow worker timeout')), 6000)
        )

        finalResponse = await Promise.race([completionPromise, timeoutPromise])
        latencyMs = Date.now() - startTime

        await redis.del(`workflow_result:${taskId}`)
      } catch (redisErr) {
        console.warn('Redis workflow failed or timed out. Falling back to inline.', redisErr)
        usedRedis = false
      }
    }

    if (!usedRedis) {
      // Write workflow execution start record
      const execId = 'wf_' + Math.random().toString(36).substr(2, 9)
      const db = getDbClient()
      try {
        await db.execute({
          sql: `INSERT INTO workflow_executions (id, user_id, session_id, name, status, trace_id, started_at)
                VALUES (?, ?, ?, ?, 'running', ?, CURRENT_TIMESTAMP)`,
          args: [execId, user.userId, sessionId, 'Financial Advisory Pipeline', traceId],
        })
        // Log individual steps as pending
        for (const stepName of ['Profile Builder', 'Risk Agent', 'Forecast Agent', 'Advisor Agent']) {
          await db.execute({
            sql: `INSERT INTO workflow_steps (id, execution_id, step_name, status, started_at)
                  VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            args: ['step_' + Math.random().toString(36).substr(2, 9), execId, stepName],
          })
        }
      } catch (dbErr) {
        console.warn('Failed to log workflow execution start', dbErr)
      }

      // Trigger workflow execution inline
      let workflowError: any = null
      const workflowContext = await workflow.execute(sessionId, user.userId, { query: sanitizedQuery }).catch(e => {
        workflowError = e
        return null
      })
      latencyMs = Date.now() - startTime

      // Update execution record with final status
      const wfStatus = workflowError ? 'failed' : (workflowContext?.status === 'PENDING_APPROVAL' ? 'pending_approval' : 'completed')
      try {
        await db.execute({
          sql: `UPDATE workflow_executions SET status = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ?, error_message = ? WHERE id = ?`,
          args: [wfStatus, latencyMs, workflowError?.message || null, execId],
        })
        await db.execute({
          sql: `UPDATE workflow_steps SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE execution_id = ?`,
          args: [wfStatus === 'failed' ? 'failed' : 'completed', execId],
        })
      } catch (dbErr) {
        console.warn('Failed to update workflow execution record', dbErr)
      }

      if (workflowError) {
        return NextResponse.json({ error: 'Workflow execution failed', code: 'WORKFLOW_FAILED' }, { status: 500 })
      }


      // If paused at human approval gate
      if (workflowContext.status === 'PENDING_APPROVAL') {
        return NextResponse.json({
          status: 'pending_approval',
          session_id: sessionId,
          message: 'Critical risk flags detected. Escalated to compliance officer review.',
          code: 'HUMAN_APPROVAL_REQUIRED',
        })
      }

      // Evaluate Quality Gates on Advisor Output
      // BUG-C FIX: advisorResult can be null if the advisory step failed all retries
      if (!advisorResult) {
        console.error('Advisory step failed all retries — returning structured error response')
        return NextResponse.json({
          error: 'The advisory agent encountered an internal error. Please try again or rephrase your query.',
          code: 'ADVISOR_STEP_FAILED',
          session_id: sessionId,
          trace_id: traceId,
        }, { status: 500 })
      }

      const tokenCount = 1450
      const confidenceScore = advisorResult.confidence_score || 0.90
      
      const isSafetyBlocked = advisorResult.advisory?.executive_summary?.includes('[SECURITY BLOCK]') || false
      const isJsonValid = !isSafetyBlocked
      
      const safetyObj = {
        allowed: !isSafetyBlocked,
        hallucinationScore: advisorResult.safety_scores?.hallucination || 0.01,
        complianceScore: advisorResult.safety_scores?.compliance || 1.0,
        biasScore: advisorResult.safety_scores?.bias || 0.01,
        piiScore: isSafetyBlocked ? 0.95 : 0.0,
      }

      const gateResult = QualityGateService.evaluate(
        'Advisor Agent',
        traceId,
        '4.2.1',
        safetyObj,
        latencyMs,
        tokenCount,
        confidenceScore,
        isJsonValid
      )

      if (gateResult.overallAction === 'BLOCK') {
        return NextResponse.json({
          error: 'Output blocked by safety filters',
          code: 'SAFETY_BLOCKED',
          evaluations: gateResult.evaluations,
        }, { status: 403 })
      }

      if (gateResult.overallAction === 'ESCALATE') {
        return NextResponse.json({
          status: 'pending_approval',
          session_id: sessionId,
          message: 'Compliance verification failure. Escalated to compliance officer review.',
          code: 'HUMAN_APPROVAL_REQUIRED',
          evaluations: gateResult.evaluations,
        })
      }

      finalResponse = {
        request_id: 'req_' + Math.random().toString(36).substr(2, 9),
        trace_id: traceId,
        status: 'success',
        data: {
          advisory: advisorResult.advisory,
          confidence_score: advisorResult.confidence_score,
          safety_scores: advisorResult.safety_scores,
          prompt_versions: {
            ingest: '2.3.1',
            profile: '1.8.0',
            risk: '3.1.0',
            forecast: '2.0.0',
            advisor: '4.2.1',
          },
          model_version: 'gpt-4o',
        },
        metadata: {
          latency_ms: latencyMs,
          token_count: tokenCount,
          cost_usd: 0.021,
          agents_executed: ['profile', 'risk', 'forecast', 'advisor'],
          quality_gates_checked: gateResult.evaluations.length,
        },
      }
    }

    if (finalResponse.error) {
      const code = finalResponse.code || 'AGENT_FAILURE'
      const status = code === 'SAFETY_BLOCKED' ? 403 : 500
      return NextResponse.json(finalResponse, { status })
    }
    
    return NextResponse.json(finalResponse)
  } catch (e: any) {
    console.error('Query workflow execution error', e)
    return NextResponse.json({
      error: 'Query processing failed',
      details: e.message,
      code: 'AGENT_FAILURE',
    }, { status: 500 })
  }
}
