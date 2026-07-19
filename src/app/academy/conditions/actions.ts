'use server'

import { createClient } from '@/lib/supabase/server'

export interface WeightedSkill {
  skill_id: string
  weight: number
}

export interface PreferredSchool {
  school_id: string
  school_name: string
  weight: number
}

interface UpdateConditionsParams {
  userId: string
  region: string
  payMin: number | null
  payMax: number | null
  weekdays: string
  description: string
  requiredSkills: WeightedSkill[]
  preferredSchools: PreferredSchool[]
}

export async function updateAcademyConditions(params: UpdateConditionsParams) {
  console.log('[updateAcademyConditions] 업데이트 시작:', {
    userId: params.userId,
    region: params.region,
    requiredSkillsCount: params.requiredSkills.length,
    requiredSkills: params.requiredSkills,
  })

  try {
    const supabase = await createClient()

    // 1. academies 테이블에 region 업데이트
    console.log('[updateAcademyConditions] academies.region 업데이트 시작')
    const { error: academyError } = await supabase
      .from('academies')
      .update({ region: params.region })
      .eq('user_id', params.userId)

    if (academyError) {
      console.error('[updateAcademyConditions] academies 업데이트 실패:', academyError)
      return { error: '지역 저장에 실패했습니다.' }
    }

    console.log('[updateAcademyConditions] academies.region 업데이트 완료')

    // 2. academy_conditions 테이블에 전체 조건 저장
    console.log('[updateAcademyConditions] academy_conditions 업데이트 시작')
    const { error: conditionsError, data } = await supabase
      .from('academy_conditions')
      .upsert({
        user_id: params.userId,
        pay_min: params.payMin,
        pay_max: params.payMax,
        weekdays: params.weekdays,
        description: params.description,
        required_skills: params.requiredSkills,
        preferred_schools: params.preferredSchools,
      })
      .select()

    if (conditionsError) {
      console.error('[updateAcademyConditions] academy_conditions 업데이트 실패:', conditionsError)
      console.error('  메시지:', conditionsError.message)
      console.error('  코드:', conditionsError.code)
      console.error('  힌트:', conditionsError.hint)

      // RLS 정책 확인
      if (conditionsError.code === '42501') {
        return { error: 'RLS 정책으로 인한 접근 거부. 관리자에게 문의하세요.' }
      }

      return { error: '조건 저장에 실패했습니다.' }
    }

    console.log('[updateAcademyConditions] 저장 성공:', {
      savedCount: data?.length || 0,
      region: params.region,
      payMin: params.payMin,
      payMax: params.payMax,
      weekdays: params.weekdays,
    })

    return { data }
  } catch (err) {
    console.error('[updateAcademyConditions] 예외:', err)
    return { error: '저장 중 오류가 발생했습니다.' }
  }
}
