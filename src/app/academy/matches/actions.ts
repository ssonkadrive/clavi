'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function submitInterviewProposal(
  instructorUserId: string,
  proposedDate: string,
  proposedTime: string,
  message: string
) {
  console.log('[submitInterviewProposal] 면접 제안 제출 시작:', {
    instructorUserId,
    proposedDate,
    proposedTime,
  })

  // 1. 세션 확인
  const session = await getSession()
  if (!session || session.role !== 'academy') {
    console.error('[submitInterviewProposal] 세션 확인 실패')
    return { error: '학원만 면접을 제안할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 이미 pending 상태로 제안을 보낸 적이 있는지 확인
  console.log('[submitInterviewProposal] 기존 pending 제안 확인 시작')
  const { data: existingProposal, error: checkError } = await supabase
    .from('interview_proposals')
    .select('id')
    .eq('academy_user_id', session.userId)
    .eq('instructor_user_id', instructorUserId)
    .eq('status', 'pending')
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('[submitInterviewProposal] 기존 제안 확인 중 에러:', checkError.message)
    return { error: '제안 확인 중 오류가 발생했습니다.' }
  }

  if (existingProposal) {
    console.log('[submitInterviewProposal] 이미 pending 상태의 제안이 존재함')
    return { error: '이미 이 강사에게 면접을 제안했습니다.' }
  }

  // 3. interview_proposals에 insert
  console.log('[submitInterviewProposal] 새 제안 등록 시작')
  const { data: result, error: insertError } = await supabase
    .from('interview_proposals')
    .insert({
      academy_user_id: session.userId,
      instructor_user_id: instructorUserId,
      proposed_date: proposedDate,
      proposed_time: proposedTime,
      message: message,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()

  if (insertError) {
    console.error('[submitInterviewProposal] 제안 등록 중 에러:', insertError.message)
    return { error: '면접 제안 등록 중 오류가 발생했습니다.' }
  }

  console.log('[submitInterviewProposal] 제안 등록 성공:', result)
  return { success: true, data: result }
}
