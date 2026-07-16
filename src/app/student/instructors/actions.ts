'use server'

import { createClient } from '@/lib/supabase/server'

export interface InstructorCard {
  userId: string
  name: string
  bio: string
  profileImageUrl: string | null
  location: string | null
  skills: string[]
  matchScore: number
}

export async function fetchInstructorsWithMatch() {
  const supabase = await createClient()

  // 1. 현재 학생 정보 조회
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('Authentication required')
  }

  const { data: studentData } = await supabase
    .from('students')
    .select('interests')
    .eq('user_id', authUser.id)
    .single()

  const studentInterests = Array.isArray(studentData?.interests)
    ? studentData.interests
    : typeof studentData?.interests === 'string' && studentData.interests
      ? studentData.interests.split(',').map((s) => s.trim())
      : []

  // 2. 강사 프로필 조회
  const { data: instructorProfiles } = await supabase
    .from('instructor_profiles')
    .select(
      `
      user_id,
      name,
      bio,
      profile_image_url,
      location,
      users!inner(id)
    `
    )

  if (!instructorProfiles) {
    return []
  }

  // 3. 강사들의 역량 조회
  const instructorIds = instructorProfiles.map((p) => p.user_id)
  const { data: instructorConditions } = await supabase
    .from('instructor_conditions')
    .select('user_id, selected_skills')
    .in('user_id', instructorIds)

  // 4. 맵핑: user_id -> skills
  const skillsMap = new Map<string, string[]>()
  instructorConditions?.forEach((ic) => {
    const skills = Array.isArray(ic.selected_skills)
      ? ic.selected_skills
      : typeof ic.selected_skills === 'string' && ic.selected_skills
        ? ic.selected_skills.split(',').map((s) => s.trim())
        : []
    skillsMap.set(ic.user_id, skills)
  })

  // 5. 적합도 점수 계산
  const instructors: InstructorCard[] = instructorProfiles.map((profile) => {
    const instructorSkills = skillsMap.get(profile.user_id) || []

    // 겹치는 기술 개수 계산
    const matchingSkills = instructorSkills.filter((skill) =>
      studentInterests.includes(skill)
    ).length

    // 점수 계산: (겹치는 기술 / 학생의 관심과목 수) * 100
    const matchScore = studentInterests.length > 0
      ? Math.round((matchingSkills / studentInterests.length) * 100)
      : 0

    return {
      userId: profile.user_id,
      name: profile.name || '이름 없음',
      bio: profile.bio || '',
      profileImageUrl: profile.profile_image_url,
      location: profile.location,
      skills: instructorSkills,
      matchScore,
    }
  })

  // 적합도 점수 내림차순 정렬
  return instructors.sort((a, b) => b.matchScore - a.matchScore)
}

export async function getSkillCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('skill_categories')
    .select('id, name')
    .order('name', { ascending: true })
  return data || []
}

export async function requestInstructor(instructorUserId: string) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('Authentication required')
  }

  // 1. instructor_sessions에 INSERT
  const { data: sessionData, error: sessionError } = await supabase
    .from('instructor_sessions')
    .insert({
      student_user_id: authUser.id,
      instructor_user_id: instructorUserId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`)
  }

  // 2. 강사에게 알림 발송
  const { data: studentData } = await supabase
    .from('students')
    .select('name')
    .eq('user_id', authUser.id)
    .single()

  const studentName = studentData?.name || '익명의 학생'

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: instructorUserId,
      type: 'session_request',
      title: '새로운 수강 신청',
      message: `${studentName}님이 수강을 신청했습니다.`,
      metadata: {
        session_id: sessionData?.id,
        student_user_id: authUser.id,
        student_name: studentName,
      },
    })

  if (notificationError) {
    console.error('Notification error:', notificationError)
    // 알림 실패는 무시하고 계속 진행
  }

  return sessionData
}
