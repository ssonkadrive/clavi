'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface StudentSession {
  id: string
  instructorUserId: string
  instructorName: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  requestedAt: string
  respondedAt: string | null
}

export async function getMySessions(): Promise<{
  data: StudentSession[] | null
  error: string | null
}> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return { data: null, error: '학생 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    const { data: sessions, error: sessionsError } = await supabase
      .from('instructor_sessions')
      .select('id, instructor_user_id, status, requested_at, responded_at')
      .eq('student_user_id', session.userId)
      .order('requested_at', { ascending: false })

    if (sessionsError) {
      return { data: null, error: `[instructor_sessions] ${sessionsError.message}` }
    }

    if (!sessions || sessions.length === 0) {
      return { data: [], error: null }
    }

    const instructorIds = sessions.map((s) => s.instructor_user_id)
    const { data: instructors, error: instructorsError } = await supabase
      .from('instructor_profiles')
      .select('user_id, name')
      .in('user_id', instructorIds)

    if (instructorsError) {
      return { data: null, error: `[instructor_profiles] ${instructorsError.message}` }
    }

    const instructorByUserId = new Map(instructors?.map((i) => [i.user_id, i]) || [])

    const result: StudentSession[] = sessions.map((s) => ({
      id: s.id,
      instructorUserId: s.instructor_user_id,
      instructorName: instructorByUserId.get(s.instructor_user_id)?.name || '이름 없음',
      status: s.status,
      requestedAt: s.requested_at,
      respondedAt: s.responded_at,
    }))

    return { data: result, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { data: null, error: `[Exception] ${message}` }
  }
}
