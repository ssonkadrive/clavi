'use server'

import { createClient } from '@/lib/supabase/server'

interface UpdateConditionsParams {
  userId: string
  region: string
  payMin: number | null
  payMax: number | null
  weekdays: string
  description: string
  requiredSkills: string[]
}

export async function updateAcademyConditions(params: UpdateConditionsParams) {
  console.log('[updateAcademyConditions] 업데이트 시작:', {
    userId: params.userId,
    region: params.region,
    requiredSkillsCount: params.requiredSkills.length,
  })

  try {
    const supabase = await createClient()

    // 참고: academy_conditions 테이블에는 user_id와 required_skills만 저장 가능
    // 다른 필드들은 테이블에 없음
    const { error: upsertError, data } = await supabase
      .from('academy_conditions')
      .upsert({
        user_id: params.userId,
        required_skills: params.requiredSkills,
      })
      .select()

    if (upsertError) {
      console.error('[updateAcademyConditions] Upsert 실패:', upsertError)
      console.error('  메시지:', upsertError.message)
      console.error('  코드:', upsertError.code)
      console.error('  힌트:', upsertError.hint)

      // RLS 정책 확인
      if (upsertError.code === '42501') {
        return { error: 'RLS 정책으로 인한 접근 거부. 관리자에게 문의하세요.' }
      }

      return { error: '조건 저장에 실패했습니다.' }
    }

    console.log('[updateAcademyConditions] 저장 성공:', {
      savedCount: data?.length || 0,
      requiredSkills: params.requiredSkills,
    })

    return { data }
  } catch (err) {
    console.error('[updateAcademyConditions] 예외:', err)
    return { error: '저장 중 오류가 발생했습니다.' }
  }
}
