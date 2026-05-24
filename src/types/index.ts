export interface Employee {
  id: string
  office_id: string
  name: string
  email: string
  role: 'employee' | 'admin'
  created_at: string
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  check_in_at: string
  check_out_at: string | null
  check_in_lat: number
  check_in_lng: number
  photo_url: string
  status: 'present' | 'late'
  created_at: string
}

export interface TodayStatus {
  status: 'absent' | 'checked_in' | 'checked_out'
  record?: AttendanceRecord
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: 'sick' | 'annual' | 'other'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  created_at: string
}

export interface ApiError {
  error: string
}
