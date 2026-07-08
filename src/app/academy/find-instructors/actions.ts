'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

interface SearchFilters {
  selectedSkillIds: string[]
  education?: string
  experienceMin?: number
  salaryMin?: number
  salaryMax?: number
}

export interface Instructor {
  id: string
  user_id: string
  name: string
  education?: string
  experience: number
  selected_skills: string[]
  cms_score: number
  certified: boolean
  hourly_rate?: number
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
      .select('required_skills')
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
    console.log('[searchInstructors] requiredSkills:', requiredSkills)

    // 3. 모든 강사 프로필 조회 (여러 쿼리에서 사용)
    console.log('[searchInstructors] instructor_profiles 조회 시작')
    const { data: instructorProfiles, error: profileError } = await supabase
      .from('instructor_profiles')
      .select('user_id, name, education, years_of_experience, hourly_rate, certified')

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

    // 5. skill_categories 조회 (이름 변환용)
    const { data: skillCategories, error: skillError } = await supabase
      .from('skill_categories')
      .select('id, name')
      .eq('is_active', true)

    if (skillError) {
      console.error('[searchInstructors] skill_categories 조회 실패:', {
        message: skillError.message,
        code: skillError.code,
        details: skillError.details,
      })
    }

    const skillMap = new Map(skillCategories?.map(s => [s.id, s.name]) || [])

    // 6. 필터링 및 CMS 점수 계산
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

      // 시급
      if (filters.salaryMin && profile.hourly_rate && profile.hourly_rate < filters.salaryMin) {
        return
      }
      if (filters.salaryMax && profile.hourly_rate && profile.hourly_rate > filters.salaryMax) {
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

      // CMS 점수 계산
      const cms = calculateCMS(selectedSkills, requiredSkills)

      results.push({
        id: profile.user_id,
        user_id: profile.user_id,
        name: profile.name || '이름 없음',
        education: profile.education,
        experience: profile.years_of_experience || 0,
        selected_skills: selectedSkills,
        cms_score: cms,
        certified: profile.certified || false,
        hourly_rate: profile.hourly_rate,
      })
    })

    // 7. CMS 점수순 정렬
    results.sort((a, b) => b.cms_score - a.cms_score)

    console.log('[searchInstructors] 검색 완료:', {
      총개수: results.length,
      첫번째강사: results[0]?.name,
      첫번째강사스킬수: results[0]?.selected_skills.length,
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

// CMS 점수 계산 함수
function calculateCMS(instructorSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 0
  const matchCount = instructorSkills.filter(skill => requiredSkills.includes(skill)).length
  return Math.round((matchCount / requiredSkills.length) * 100)
}
