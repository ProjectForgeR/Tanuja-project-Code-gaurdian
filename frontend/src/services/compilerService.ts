import { apiRequest } from './api'
import {
  ExecuteRequest,
  ExecuteResponse,
  TestCaseItem,
  RunTestsResponse,
  GenerateTestCasesResponse,
} from '@/types/execution'

export const compilerService = {
  async executeCode(data: ExecuteRequest): Promise<ExecuteResponse> {
    return apiRequest<ExecuteResponse>('/compiler/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async runTestCases(
    params: { code: string; language: string; test_cases: TestCaseItem[] } | string,
    language?: string,
    testCases?: TestCaseItem[]
  ): Promise<RunTestsResponse> {
    const payload =
      typeof params === 'object'
        ? { code: params.code, language: params.language, test_cases: params.test_cases }
        : { code: params, language: language || '', test_cases: testCases || [] }
    return apiRequest<RunTestsResponse>('/compiler/test-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async generateTestCases(
    params: { code: string; language: string; count?: number } | string,
    language?: string
  ): Promise<GenerateTestCasesResponse> {
    const payload =
      typeof params === 'object'
        ? { code: params.code, language: params.language, count: params.count || 4 }
        : { code: params, language: language || '', count: 4 }
    return apiRequest<GenerateTestCasesResponse>('/compiler/generate-test-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
