'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateSelectedSkills(
  userId: string,
  selectedIds: string[]
) {
  console.log('[updateSelectedSkills] 저장 시작:', {
    userId,
    selectedIds,
  })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('instructor_conditions')
    .upsert(
      {
        user_id: userId,
        selected_skills: selectedIds,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()

  console.log('[updateSelectedSkills] 저장 결과:', {
    success: !error,
    error,
    data,
  })

  if (error) {
    throw new Error(`저장 실패: ${error.message}`)
  }

  return data
}
