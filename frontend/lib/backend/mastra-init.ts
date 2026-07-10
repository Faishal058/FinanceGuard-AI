import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'

const defaultModel = {
  provider: 'OPENAI',
  name: 'gpt-4o',
}

export const ingestAgent = new Agent({
  name: 'Ingest Agent',
  instructions: 'Convert unstructured financial documents (bank statements, CSV transaction exports) into clean, normalized JSON structures.',
  model: defaultModel,
})

export const profileAgent = new Agent({
  name: 'Profile Builder Agent',
  instructions: 'Aggregate raw transaction data into user profiles, computing income, burn rates, and financial metrics.',
  model: defaultModel,
})

export const riskAgent = new Agent({
  name: 'Risk Agent',
  instructions: 'Identify personal finance risks (high DTI, low savings rate) and assign risk categories.',
  model: defaultModel,
})

export const forecastAgent = new Agent({
  name: 'Forecast Agent',
  instructions: 'Simulate future financial horizons using Monte Carlo forecast projections.',
  model: defaultModel,
})

export const advisorAgent = new Agent({
  name: 'Advisor Agent',
  instructions: 'Synthesize all profile, risk assessment, and forecast results to generate structural, objective advisory recommendations.',
  model: defaultModel,
})

export const mastra = new Mastra({
  agents: {
    ingest: ingestAgent,
    profile: profileAgent,
    risk: riskAgent,
    forecast: forecastAgent,
    advisor: advisorAgent,
  },
})
