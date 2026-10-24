import { apiRequest } from './api'
import {
  ExecuteRequest,
  ExecuteResponse,
  TestCaseItem,
  TestCaseResultItem,
  RunTestsResponse,
  GenerateTestCasesResponse,
  ExplainTestFailureResponse,
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

  async runSingleTest(data: {
    code: string
    language: string
    test_case: TestCaseItem
  }): Promise<TestCaseResultItem> {
    return apiRequest<TestCaseResultItem>('/compiler/test-cases/run-single', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async generateTestCases(
    params: { code: string; language: string; count?: number } | string,
    language?: string
  ): Promise<GenerateTestCasesResponse> {
    const payload =
      typeof params === 'object'
        ? { code: params.code, language: params.language }
        : { code: params, language: language || '' }
    return apiRequest<GenerateTestCasesResponse>('/compiler/generate-test-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async explainTestFailure(data: {
    code: string
    language: string
    test_case: TestCaseResultItem
  }): Promise<ExplainTestFailureResponse> {
    return apiRequest<ExplainTestFailureResponse>('/compiler/explain-test-failure', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
