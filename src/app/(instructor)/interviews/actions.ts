'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function respondToInterviewProposal(proposalId: string, action: 'accepted' | 'declined') {
  console.log('[respondToInterviewProposal] 시작:', {
    proposalId,
    action,
  })

  // 1. 세션 확인
  const session = await getSession()
  if (!session || session.role !== 'instructor') {
    console.error('[respondToInterviewProposal] 세션 확인 실패')
    return { error: '강사만 응답할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 제안이 현재 로그인한 강사의 제안인지 확인
  console.log('[respondToInterviewProposal] 제안 소유권 확인')
  const { data: proposal, error: checkError } = await supabase
    .from('interview_proposals')
    .select('id, instructor_user_id')
    .eq('id', proposalId)
    .single()

  if (checkError || !proposal) {
    console.error('[respondToInterviewProposal] 제안 확인 실패:', checkError?.message)
    return { error: '제안을 찾을 수 없습니다.' }
  }

  if (proposal.instructor_user_id !== session.userId) {
    console.error('[respondToInterviewProposal] 소유권 확인 실패')
    return { error: '자신의 제안에만 응답할 수 있습니다.' }
  }

  // 3. 제안 상태 업데이트
  console.log('[respondToInterviewProposal] 상태 업데이트:', action)
  const { data: result, error: updateError } = await supabase
    .from('interview_proposals')
    .update({
      status: action,
      responded_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .select()

  if (updateError) {
    console.error('[respondToInterviewProposal] 업데이트 실패:', updateError.message)
    return { error: '응답 저장 중 오류가 발생했습니다.' }
  }

  console.log('[respondToInterviewProposal] 성공:', result)
  return { success: true, data: result }
}
