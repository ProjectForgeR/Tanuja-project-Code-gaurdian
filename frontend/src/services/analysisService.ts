import { apiRequest } from './api'
import {
  AnalysisResult,
  CompareResult,
  ExplainResult,
  Finding,
  FixResult,
  TestResult,
} from '@/types/analysis'

export const analysisService = {
  async analyzeCode(data: {
    code: string
    language: string
    filename?: string
    run_ai?: boolean
    demo_mode?: boolean
  }): Promise<AnalysisResult> {
    return apiRequest<AnalysisResult>('/analyses/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async suggestFix(data: {
    code: string
    language: string
    finding: Finding
  }): Promise<FixResult> {
    return apiRequest<FixResult>('/analyses/fix/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async generateTests(data: {
    code: string
    language: string
    finding?: Finding
    framework?: string
  }): Promise<TestResult> {
    return apiRequest<TestResult>('/analyses/tests/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async explainFindings(data: {
    code: string
    language: string
    findings: Finding[]
  }): Promise<ExplainResult> {
    return apiRequest<ExplainResult>('/analyses/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listAnalyses(limit: number = 50): Promise<AnalysisResult[]> {
    return apiRequest<AnalysisResult[]>(`/analyses?limit=${limit}`)
  },

  async getAnalysis(id: string): Promise<AnalysisResult> {
    return apiRequest<AnalysisResult>(`/analyses/${id}`)
  },

  async deleteAnalysis(id: string): Promise<{ message: string; id: string }> {
    return apiRequest<{ message: string; id: string }>(`/analyses/${id}`, {
      method: 'DELETE',
    })
  },

  async compareAnalyses(analysisId1: string, analysisId2: string): Promise<CompareResult> {
    return apiRequest<CompareResult>('/analyses/compare', {
      method: 'POST',
      body: JSON.stringify({
        analysis_id_1: analysisId1,
        analysis_id_2: analysisId2,
      }),
    })
  },

  getExportHtmlUrl(id: string): string {
    return `/api/analyses/${id}/export/html`
  },

  getExportJsonUrl(id: string): string {
    return `/api/analyses/${id}/export/json`
  },
}
