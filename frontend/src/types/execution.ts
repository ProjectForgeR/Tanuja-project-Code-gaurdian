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
  category?: 'Normal' | 'Boundary / Edge' | 'Invalid Input' | 'Branch Coverage' | 'Regression' | string
  reason?: string
  is_verified?: boolean
  is_user_edited?: boolean
  target_branch?: string | null
}

export interface TestCaseResultItem {
  id: string
  name: string
  input: string
  expected_output: string
  actual_output: string
  status: 'passed' | 'failed' | 'error' | 'timeout' | 'not_run'
  category?: string
  reason?: string
  is_verified?: boolean
  is_user_edited?: boolean
  execution_time?: number | null
  mismatch_line?: string | null
  error_message?: string | null
  failure_explanation?: string | null
}

export interface RunTestsResponse {
  total: number
  passed: number
  failed: number
  errors: number
  timeouts?: number
  all_passed: boolean
  pass_percentage?: number
  duration_seconds?: number
  estimated_coverage?: number
  results: TestCaseResultItem[]
}

export interface GenerateTestCasesResponse {
  test_cases: TestCaseItem[]
  detected_inputs?: string[]
  estimated_branches?: number
  language?: string
}

export interface ExplainTestFailureResponse {
  test_id: string
  explanation: string
  root_cause: string
  suggested_fix: string
  corrected_code?: string | null
}
