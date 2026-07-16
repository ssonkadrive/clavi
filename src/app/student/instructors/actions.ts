'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface InstructorCard {
  userId: string
  name: string
  education: string | null
  experience: number
  profileImageUrl: string | null
  skills: string[]
  matchScore: number
}

// education 컬럼이 JSON({"school_name","degree","major","graduation_year"}) 또는
// 일반 문자열로 저장되어 있어 표시용 문자열로 변환
function formatEducation(education: unknown): string | null {
  if (!education) return null

  let parsed: unknown = education
  if (typeof education === 'string') {
    const trimmed = education.trim()
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        return trimmed
      }
    } else {
      return trimmed || null
    }
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const e = parsed as {
      school_name?: string
      major?: string
      degree?: string
      graduation_year?: number | string
    }
    const parts = [e.school_name, e.major, e.degree].filter(Boolean)
    let result = parts.join(' ')
    if (e.graduation_year) {
      result += ` (${e.graduation_year})`
    }
    return result || null
  }

  return null
}

export interface InstructorSearchData {
  instructors: InstructorCard[]
  skillOptions: string[]
  requestedInstructorIds: string[]
  studentInterests: string[]
}

// 강사 검색 페이지 초기 데이터 전체 로드
export async function loadInstructorSearch(): Promise<{
  data: InstructorSearchData | null
  error: string | null
}> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return { data: null, error: '학생 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    // 1. 학생의 관심과목 조회 (쉼표 구분 문자열)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('interests')
      .eq('user_id', session.userId)
      .single()

    if (studentError && studentError.code !== 'PGRST116') {
      return { data: null, error: `[students] ${studentError.message}` }
    }

    const studentInterests =
      typeof studentData?.interests === 'string' && studentData.interests
        ? studentData.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

    // 2. 강사 프로필 조회 (profile_image_url 컬럼은 DB에 없음)
    const { data: instructorProfiles, error: profileError } = await supabase
      .from('instructor_profiles')
      .select('user_id, name, education, years_of_experience')

    if (profileError) {
      return { data: null, error: `[instructor_profiles] ${profileError.message}` }
    }

    // 3. 강사 역량(스킬 ID 배열) 조회
    const { data: instructorConditions, error: condError } = await supabase
      .from('instructor_conditions')
      .select('user_id, selected_skills')

    if (condError) {
      return { data: null, error: `[instructor_conditions] ${condError.message}` }
    }

    // 4. 스킬 ID → 이름 매핑
    const { data: skillCategories, error: skillError } = await supabase
      .from('skill_categories')
      .select('id, name')
      .eq('is_active', true)

    if (skillError) {
      return { data: null, error: `[skill_categories] ${skillError.message}` }
    }

    const skillNameById = new Map<string, string>()
    skillCategories?.forEach((s) => skillNameById.set(s.id, s.name))

    const skillIdsByUser = new Map<string, string[]>()
    instructorConditions?.forEach((c) => {
      skillIdsByUser.set(c.user_id, c.selected_skills || [])
    })

    // 5. 이미 수강 신청한 강사 목록 (중복 신청 방지 + 버튼 상태)
    const { data: existingSessions } = await supabase
      .from('instructor_sessions')
      .select('instructor_user_id')
      .eq('student_user_id', session.userId)

    const requestedInstructorIds =
      existingSessions?.map((s) => s.instructor_user_id) || []

    // 6. 적합도 점수 계산 (학생 관심과목 이름 vs 강사 스킬 이름)
    const instructors: InstructorCard[] = (instructorProfiles || []).map((profile) => {
      const skillIds = skillIdsByUser.get(profile.user_id) || []
      const skillNames = skillIds
        .map((id) => skillNameById.get(id))
        .filter((n): n is string => Boolean(n))

      const matchingCount = studentInterests.filter((interest) =>
        skillNames.some((skill) => skill.includes(interest) || interest.includes(skill))
      ).length

      const matchScore =
        studentInterests.length > 0
          ? Math.round((matchingCount / studentInterests.length) * 100)
          : 0

      return {
        userId: profile.user_id,
        name: profile.name || '이름 없음',
        education: formatEducation(profile.education),
        experience: profile.years_of_experience || 0,
        profileImageUrl: null,
        skills: skillNames,
        matchScore,
      }
    })

    instructors.sort((a, b) => b.matchScore - a.matchScore)

    // 필터 드롭다운 옵션: 강사들이 실제 보유한 스킬만
    const skillOptions = Array.from(
      new Set(instructors.flatMap((i) => i.skills))
    ).sort()

    return {
      data: { instructors, skillOptions, requestedInstructorIds, studentInterests },
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { data: null, error: `[Exception] ${message}` }
  }
}

// 수강 신청
export async function requestInstructor(
  instructorUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return { success: false, error: '학생 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    // 1. 중복 신청 확인
    const { data: existing, error: checkError } = await supabase
      .from('instructor_sessions')
      .select('id')
      .eq('student_user_id', session.userId)
      .eq('instructor_user_id', instructorUserId)
      .maybeSingle()

    if (checkError) {
      return { success: false, error: `신청 확인 실패: ${checkError.message}` }
    }

    if (existing) {
      return { success: false, error: '이미 신청한 강사입니다.' }
    }

    // 2. instructor_sessions INSERT
    const { data: sessionData, error: insertError } = await supabase
      .from('instructor_sessions')
      .insert({
        student_user_id: session.userId,
        instructor_user_id: instructorUserId,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: `수강 신청 실패: ${insertError.message}` }
    }

    // 3. 강사에게 알림 발송 (실패해도 신청 자체는 유지)
    const { data: studentData } = await supabase
      .from('students')
      .select('name')
      .eq('user_id', session.userId)
      .single()

    const studentName = studentData?.name || '학생'

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: instructorUserId,
      type: 'session_request',
      title: '새로운 수강 신청',
      message: `${studentName}님이 수강을 신청했습니다.`,
      metadata: {
        session_id: sessionData?.id,
        student_user_id: session.userId,
      },
    })

    if (notificationError) {
      console.error('[requestInstructor] 알림 발송 실패:', notificationError.message)
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `예외 발생: ${message}` }
  }
}
