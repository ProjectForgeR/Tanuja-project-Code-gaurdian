export interface ExecutionErrorDetail {
  line_number?: number | null
  error_type: string
  raw_message: string
  what_went_wrong: string
  why_it_happened: string
  how_to_fix: string
  recommended_patch?: string | null
  corrected_code?: string | null
  concept_to_learn: string
}

export interface ExecuteRequest {
  code: string
  language: string
  stdin?: string
  generate_ai_fix?: boolean
}

export interface ExecuteResponse {
  status: string
  success: boolean
  output: string
  stdout: string
  stderr: string
  compile_output: string
  language: string
  execution_time?: number | null
  memory_usage_kb?: number | null
  exit_code?: number | null
  error_detail?: ExecutionErrorDetail | null
}

export interface TestCaseItem {
  id: string
  name: string
  input: string
  expected_output: string
}

export interface TestCaseResultItem {
  id: string
  name: string
  input: string
  expected_output: string
  actual_output: string
  status: 'passed' | 'failed' | 'error' | 'not_run'
  execution_time?: number | null
  mismatch_line?: string | null
  error_message?: string | null
}

export interface RunTestsResponse {
  total: number
  passed: number
  failed: number
  errors: number
  all_passed: boolean
  results: TestCaseResultItem[]
}

export interface GenerateTestCasesResponse {
  test_cases: TestCaseItem[]
}
