'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface StudentSessionRequest {
  id: string
  studentUserId: string
  studentName: string
  grade: string | null
  interests: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  requestedAt: string
}

export async function getStudentSessions(): Promise<{
  data: StudentSessionRequest[] | null
  error: string | null
}> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'instructor') {
      return { data: null, error: '강사 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    const { data: sessions, error: sessionsError } = await supabase
      .from('instructor_sessions')
      .select('id, student_user_id, status, requested_at')
      .eq('instructor_user_id', session.userId)
      .order('requested_at', { ascending: false })

    if (sessionsError) {
      return { data: null, error: `[instructor_sessions] ${sessionsError.message}` }
    }

    if (!sessions || sessions.length === 0) {
      return { data: [], error: null }
    }

    const studentIds = sessions.map((s) => s.student_user_id)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('user_id, name, grade, interests')
      .in('user_id', studentIds)

    if (studentsError) {
      return { data: null, error: `[students] ${studentsError.message}` }
    }

    const studentByUserId = new Map(students?.map((s) => [s.user_id, s]) || [])

    const result: StudentSessionRequest[] = sessions.map((s) => {
      const student = studentByUserId.get(s.student_user_id)
      const interests =
        typeof student?.interests === 'string' && student.interests
          ? student.interests.split(',').map((i: string) => i.trim()).filter(Boolean)
          : []

      return {
        id: s.id,
        studentUserId: s.student_user_id,
        studentName: student?.name || '이름 없음',
        grade: student?.grade || null,
        interests,
        status: s.status,
        requestedAt: s.requested_at,
      }
    })

    return { data: result, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { data: null, error: `[Exception] ${message}` }
  }
}

export async function respondToSessionRequest(
  sessionId: string,
  status: 'accepted' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'instructor') {
      return { success: false, error: '강사 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    const { data: updatedSession, error: updateError } = await supabase
      .from('instructor_sessions')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('instructor_user_id', session.userId)
      .select('student_user_id')
      .single()

    if (updateError) {
      return { success: false, error: `상태 업데이트 실패: ${updateError.message}` }
    }

    // 학생에게 결과 알림 발송 (실패해도 상태 변경 자체는 유지)
    const { data: instructorProfile } = await supabase
      .from('instructor_profiles')
      .select('name')
      .eq('user_id', session.userId)
      .single()

    const instructorName = instructorProfile?.name || '강사'

    const { error: notificationError } = await supabase.from('notifications').insert({
      recipient_id: updatedSession.student_user_id,
      recipient_role: 'student',
      type: status === 'accepted' ? 'session_accepted' : 'session_rejected',
      title: status === 'accepted' ? '수강 신청이 수락되었습니다' : '수강 신청이 거절되었습니다',
      message:
        status === 'accepted'
          ? `${instructorName} 강사님이 수강 신청을 수락했습니다.`
          : `${instructorName} 강사님이 수강 신청을 거절했습니다.`,
      read: false,
    })

    if (notificationError) {
      console.error('[respondToSessionRequest] 알림 발송 실패:', notificationError.message)
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `예외 발생: ${message}` }
  }
}
