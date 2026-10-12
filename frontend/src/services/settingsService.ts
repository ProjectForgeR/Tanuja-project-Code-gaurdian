import { apiRequest } from './api'
import { AppSettings, SettingsUpdatePayload } from '@/types/settings'

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    return apiRequest<AppSettings>('/settings')
  },

  async updateSettings(data: SettingsUpdatePayload): Promise<AppSettings> {
    return apiRequest<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}
