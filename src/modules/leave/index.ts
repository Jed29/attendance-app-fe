import { api } from '../../lib/api'
import { LeaveRequest } from '../../types'

export async function requestLeave(
  leaveType: 'sick' | 'annual' | 'other',
  startDate: string,
  endDate: string,
  reason: string,
): Promise<LeaveRequest> {
  const { data } = await api.post<LeaveRequest>('/leave', {
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason,
  })
  return data
}

export async function getMyLeaves(status?: string): Promise<LeaveRequest[]> {
  const params = status ? `?status=${status}` : ''
  const { data } = await api.get<{ data: LeaveRequest[] }>(`/leave${params}`)
  return data.data ?? []
}
