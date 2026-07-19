'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { parseEducation, formatEducation } from '@/lib/utils/parseEducation'

interface SearchFilters {
  selectedSkillIds: string[]
  education?: string
  experienceMin?: number
}

export interface Instructor {
  id: string
  user_id: string
  name: string
  education?: string
  experience: number
  selected_skills: string[]
  cms_score: number
}

export async function searchInstructors(
  filters: SearchFilters
): Promise<{ data: Instructor[] | null; error: string | null }> {
  console.log('[searchInstructors] 검색 시작:', filters)

  try {
    // 1. 세션 확인
    const session = await getSession()
    if (!session || session.role !== 'academy') {
      console.error('[searchInstructors] 권한 없음')
      return { error: '원장 계정으로 로그인해주세요.', data: null }
    }

    const supabase = await createClient()

    // 2. 원장의 required_skills 조회
    console.log('[searchInstructors] academy_conditions 조회:', session.userId)
    const { data: academyConditions, error: condError } = await supabase
      .from('academy_conditions')
      .select('required_skills, preferred_schools')
      .eq('user_id', session.userId)
      .single()

    if (condError) {
      console.error('[searchInstructors] academy_conditions 조회 실패:', {
        message: condError.message,
        code: condError.code,
        details: condError.details,
      })
      return { error: `[academy_conditions] ${condError.message} (${condError.code})`, data: null }
    }

    const requiredSkills = academyConditions?.required_skills || []
    const preferredSchools = academyConditions?.preferred_schools || []
    console.log('[searchInstructors] requiredSkills:', requiredSkills)

    // 3. 모든 강사 프로필 조회
    console.log('[searchInstructors] instructor_profiles 조회 시작')
    const { data: instructorProfiles, error: profileError } = await supabase
      .from('instructor_profiles')
      .select('user_id, name, education, years_of_experience')

    if (profileError) {
      console.error('[searchInstructors] instructor_profiles 조회 실패:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
      })
      return { error: `[instructor_profiles] ${profileError.message} (${profileError.code})`, data: null }
    }

    console.log('[searchInstructors] instructor_profiles 조회 완료:', instructorProfiles?.length || 0, '명')

    // 4. 모든 강사의 selected_skills 조회
    console.log('[searchInstructors] instructor_conditions 조회 시작')
    const { data: instructorConditions, error: condQueryError } = await supabase
      .from('instructor_conditions')
      .select('user_id, selected_skills')

    if (condQueryError) {
      console.error('[searchInstructors] instructor_conditions 조회 실패:', {
        message: condQueryError.message,
        code: condQueryError.code,
        details: condQueryError.details,
      })
      return { error: `[instructor_conditions] ${condQueryError.message} (${condQueryError.code})`, data: null }
    }

    console.log('[searchInstructors] instructor_conditions 조회 완료:', instructorConditions?.length || 0, '명')

    // 5. 필터링 및 CMS 점수 계산
    const results: Instructor[] = []

    instructorProfiles?.forEach((profile) => {
      const conditions = instructorConditions?.find(c => c.user_id === profile.user_id)
      const selectedSkills = conditions?.selected_skills || []

      // 필터 적용
      // 학력
      if (filters.education && profile.education !== filters.education) {
        return
      }

      // 경력
      if (filters.experienceMin && (profile.years_of_experience || 0) < filters.experienceMin) {
        return
      }

      // 스킬 필터 (선택된 스킬이 있을 경우만 필터링)
      let hasMatchingSkill = true
      if (filters.selectedSkillIds && filters.selectedSkillIds.length > 0) {
        hasMatchingSkill = filters.selectedSkillIds.some(skillId =>
          selectedSkills.includes(skillId)
        )
      }

      if (!hasMatchingSkill) {
        return
      }

      // CMS 점수 계산 (역량 85% + 학력 선호도 15%)
      const instructorSchoolId = parseEducation(profile.education)?.school_id || null
      const cms = calculateWeightedCMS(selectedSkills, requiredSkills, instructorSchoolId, preferredSchools)

      results.push({
        id: profile.user_id,
        user_id: profile.user_id,
        name: profile.name || '이름 없음',
        education: formatEducation(profile.education),
        experience: profile.years_of_experience || 0,
        selected_skills: selectedSkills,
        cms_score: cms,
      })
    })

    // 6. CMS 점수순 정렬
    results.sort((a, b) => b.cms_score - a.cms_score)

    console.log('[searchInstructors] 검색 완료:', {
      총개수: results.length,
      첫번째강사: results[0]?.name,
      첫번째강사스킬수: results[0]?.selected_skills.length,
      CMS점수: results[0]?.cms_score,
    })

    return { data: results, error: null }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[searchInstructors] 예외 발생:', {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return { error: `[Exception] ${errorMessage}`, data: null }
  }
}

// CMS 점수 계산 함수 (역량 매칭 기반, 0~100)
function calculateSkillCMS(
  instructorSkills: string[],
  requiredSkills: Array<{ skill_id: string; weight: number }>
): number {
  if (requiredSkills.length === 0) return 0

  // 전체 가중치 합 계산
  const totalWeight = requiredSkills.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight === 0) return 0

  // 강사가 보유한 스킬의 가중치 합 계산
  const matchedWeight = requiredSkills.reduce((sum, req) => {
    return instructorSkills.includes(req.skill_id) ? sum + req.weight : sum
  }, 0)

  // 백분율 계산
  return Math.round((matchedWeight / totalWeight) * 100)
}

const MAX_SCHOOL_WEIGHT = 5
const EDUCATION_WEIGHT_RATIO = 0.15

// CMS 점수 계산 함수 (역량 매칭 85% + 학력(출신학교) 선호도 15%)
// 원장이 선호 학교를 등록하지 않았다면 학력 가중치는 반영하지 않고 역량 점수를 그대로 사용한다.
function calculateWeightedCMS(
  instructorSkills: string[],
  requiredSkills: Array<{ skill_id: string; weight: number }>,
  instructorSchoolId: string | null,
  preferredSchools: Array<{ school_id: string; weight: number }>
): number {
  const skillScore = calculateSkillCMS(instructorSkills, requiredSkills)

  if (!preferredSchools || preferredSchools.length === 0) {
    return skillScore
  }

  const matched = instructorSchoolId
    ? preferredSchools.find((s) => s.school_id === instructorSchoolId)
    : undefined
  const educationScore = matched ? (matched.weight / MAX_SCHOOL_WEIGHT) * 100 : 0

  return Math.round(skillScore * (1 - EDUCATION_WEIGHT_RATIO) + educationScore * EDUCATION_WEIGHT_RATIO)
}

// 강사에게 면접 제안하기
export async function submitInstructorProposal(
  instructorUserId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[submitInstructorProposal] 면접 제안 시작:', instructorUserId)

  try {
    // 1. 세션 확인
    const session = await getSession()
    if (!session || session.role !== 'academy') {
      console.error('[submitInstructorProposal] 권한 없음')
      return { success: false, error: '원장 계정으로 로그인해주세요.' }
    }

    const supabase = await createClient()

    // 2. 이미 pending 상태의 제안이 있는지 확인
    console.log('[submitInstructorProposal] 기존 pending 제안 확인')
    const { data: existingProposal, error: checkError } = await supabase
      .from('interview_proposals')
      .select('id')
      .eq('academy_user_id', session.userId)
      .eq('instructor_user_id', instructorUserId)
      .eq('status', 'pending')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[submitInstructorProposal] 확인 중 에러:', checkError.message)
      return { success: false, error: '제안 확인 중 오류 발생' }
    }

    if (existingProposal) {
      console.log('[submitInstructorProposal] 이미 pending 제안 존재')
      return { success: false, error: '이미 이 강사에게 제안했습니다.' }
    }

    // 3. interview_proposals에 insert
    console.log('[submitInstructorProposal] 새 제안 등록')

    const { data: result, error: insertError } = await supabase
      .from('interview_proposals')
      .insert({
        academy_user_id: session.userId,
        instructor_user_id: instructorUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error('[submitInstructorProposal] insert 실패:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
      })
      return { success: false, error: `제안 등록 실패: ${insertError.message}` }
    }

    console.log('[submitInstructorProposal] 성공:', result)
    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[submitInstructorProposal] 예외:', errorMessage)
    return { success: false, error: `예외 발생: ${errorMessage}` }
  }
}
