import { apiRequest } from './api'
import { ExecuteRequest, ExecuteResponse } from '@/types/execution'

export const compilerService = {
  async executeCode(data: ExecuteRequest): Promise<ExecuteResponse> {
    return apiRequest<ExecuteResponse>('/compiler/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
