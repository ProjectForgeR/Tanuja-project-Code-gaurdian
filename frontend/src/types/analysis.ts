export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational'
export type Category = 'Security' | 'Bug' | 'Code Smell' | 'Maintainability' | 'Analysis Info' | string

export interface Finding {
  id?: string
  title: string
  severity: Severity
  category: Category
  line_start: number
  line_end: number
  col_start?: number
  col_end?: number
  snippet?: string
  explanation: string
  impact?: string
  recommended_fix?: string
  confidence: string
  detection_method: string
  suggested_patch?: string
  rule_id?: string
  duplicate_group_id?: string
}

export interface DuplicateGroup {
  id: string
  title: string
  description?: string
  count: number
  similarity_score: number
  finding_ids?: string[]
}

export interface RiskBreakdown {
  impact_score: number
  exploitability_score: number
  confidence_score: number
  scope_score: number
  summary: string
  factors: string[]
}

export interface ComplexityMetrics {
  loc?: number
  cyclomatic_estimate?: number
  max_nesting_depth?: number
  findings_density?: number
  cyclomatic_complexity?: number
  cognitive_complexity?: number
  halstead_volume?: number
  lines_of_code?: number
}

export interface AnalysisResult {
  id: string
  title: string
  language: string
  quality_score: number
  risk_score: number
  duration_ms: number
  status: string
  created_at?: string
  findings_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  code_smells_count?: number
  maintainability_count?: number
  performance_count?: number
  security_count?: number
  complexity_metrics?: ComplexityMetrics
  findings: Finding[]
  duplicate_groups: DuplicateGroup[]
  risk_breakdown: RiskBreakdown
  ai_status?: string
}

export interface RefactorImprovement {
  title: string
  code_smell: string
  category: string
  description: string
}

export interface RefactorModification {
  description: string
  line_range: string
  before_snippet: string
  after_snippet: string
}

export interface RefactorResult {
  original_code: string
  refactored_code: string
  diff: string
  original_quality_score: number
  refactored_quality_score: number
  improvements: RefactorImprovement[]
  modifications: RefactorModification[]
  smells_resolved: string[]
  syntax_valid: boolean
  behavior_notes: string
  is_ai_generated: boolean
}

export type RefactorResponse = RefactorResult

export interface FixResult {
  explanation: string
  why_unsafe: string
  corrected_code: string
  diff: string
  side_effects: string
  recommended_tests: string[]
  is_ai_generated: boolean
}

export interface TestResult {
  tests_code: string
  framework: string
  test_cases_breakdown: string[]
  run_command_hint: string
  is_ai_generated: boolean
}

export interface CompareResult {
  analysis_1: { id: string; title: string; quality_score: number; created_at: string }
  analysis_2: { id: string; title: string; quality_score: number; created_at: string }
  quality_score_delta: number
  risk_score_delta: number
  findings_delta: number
  resolved_findings: Finding[]
  new_findings: Finding[]
  persisting_findings: Finding[]
}

// ---------------------------------------------------------------------------
// Explain Errors with AI types
// ---------------------------------------------------------------------------

export interface FindingExplanation {
  finding_id: string
  title: string
  severity: Severity
  line: number
  what: string
  why: string
  impact: string
  fix: string
  corrected_code: string
  prevention: string
}

export interface ExplainResult {
  success: boolean
  language: string
  explanations: FindingExplanation[]
  ai_used: boolean
  message: string
}

