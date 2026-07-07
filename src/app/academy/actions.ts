'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function updateRequiredSkills(
  userId: string,
  requiredIds: string[]
) {
  console.log('[updateRequiredSkills] 저장 시작:', {
    userId,
    requiredIds,
  })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('academy_conditions')
    .upsert(
      {
        user_id: userId,
        required_skills: requiredIds,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()

  console.log('[updateRequiredSkills] 저장 결과:', {
    success: !error,
    error,
    data,
  })

  if (error) {
    throw new Error(`저장 실패: ${error.message}`)
  }

  return data
}

export async function updateAcademyInfo(data: {
  academy_name: string
  region: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()

  if (!session || session.role !== 'academy') {
    return { success: false, error: '권한이 없습니다.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('academies')
    .upsert(
      {
        user_id: session.userId,
        academy_name: data.academy_name,
        region: data.region,
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[updateAcademyInfo] 저장 실패:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
