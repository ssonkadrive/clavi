'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateSelectedSkills(userId: string, selectedIds: string[]) {
  console.log('[updateSelectedSkills] 업데이트 시작:', {
    userId,
    selectedIdsCount: selectedIds.length,
  })

  try {
    const supabase = await createClient()

    // instructor_conditions 테이블에 selected_skills 저장
    const { error: upsertError, data } = await supabase
      .from('instructor_conditions')
      .upsert({
        user_id: userId,
        selected_skills: selectedIds,
      })
      .select()

    if (upsertError) {
      console.error('[updateSelectedSkills] Upsert 실패:', upsertError)
      console.error('  메시지:', upsertError.message)
      console.error('  코드:', upsertError.code)
      console.error('  힌트:', upsertError.hint)

      if (upsertError.code === '42501') {
        return { error: 'RLS 정책으로 인한 접근 거부' }
      }

      return { error: '역량 저장에 실패했습니다.' }
    }

    console.log('[updateSelectedSkills] 저장 성공:', {
      savedCount: data?.length || 0,
      selectedSkills: selectedIds,
    })

    return { data }
  } catch (err) {
    console.error('[updateSelectedSkills] 예외:', err)
    return { error: '역량 저장 중 오류가 발생했습니다.' }
  }
}
