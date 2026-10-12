import { apiRequest } from './api'
import { AuthResponse, User } from '@/types/auth'

export const authService = {
  async register(data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getMe(): Promise<User> {
    return apiRequest<User>('/auth/me')
  },

  async forgotPassword(email: string): Promise<{ message: string; success: boolean; demo_reset_token?: string }> {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}
