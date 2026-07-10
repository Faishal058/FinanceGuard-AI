import { mastra } from '../lib/backend/mastra-init'

describe('Official Mastra Container Integration', () => {
  test('All 5 core agents are successfully registered in Mastra container', () => {
    expect(mastra).toBeDefined()
    
    // Check agents are present
    const ingest = mastra.getAgent('ingest')
    expect(ingest).toBeDefined()
    expect(ingest.name).toBe('Ingest Agent')

    const profile = mastra.getAgent('profile')
    expect(profile).toBeDefined()
    expect(profile.name).toBe('Profile Builder Agent')

    const risk = mastra.getAgent('risk')
    expect(risk).toBeDefined()
    expect(risk.name).toBe('Risk Agent')

    const forecast = mastra.getAgent('forecast')
    expect(forecast).toBeDefined()
    expect(forecast.name).toBe('Forecast Agent')

    const advisor = mastra.getAgent('advisor')
    expect(advisor).toBeDefined()
    expect(advisor.name).toBe('Advisor Agent')
  })
})
