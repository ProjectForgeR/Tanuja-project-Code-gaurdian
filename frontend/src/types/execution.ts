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
