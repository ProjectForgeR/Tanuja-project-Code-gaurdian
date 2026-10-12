export interface AppSettings {
  id?: string
  user_id?: string
  theme: string
  default_language: string
  realtime_analysis: boolean
  debounce_delay_ms: number
  ai_provider: string
  ai_model_name: string
  data_retention_days: number
  save_source_code: boolean
  ai_provider_configured: boolean
}

export interface SettingsUpdatePayload {
  theme?: string
  default_language?: string
  realtime_analysis?: boolean
  debounce_delay_ms?: number
  ai_provider?: string
  ai_model_name?: string
  data_retention_days?: number
  save_source_code?: boolean
  gemini_api_key?: string
  openai_api_key?: string
}
