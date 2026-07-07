'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function updateHiringDecision(
  proposalId: string,
  decision: 'hired' | 'rejected'
) {
  try {
    console.log('[updateHiringDecision] 시작:', { proposalId, decision })

    const session = await getSession()

    if (!session) {
      return { error: '로그인이 필요합니다.' }
    }

    if (session.role !== 'academy') {
      return { error: '학원만 사용 가능합니다.' }
    }

    const supabase = await createClient()

    // 제안 정보 확인 (권한 확인)
    const { data: proposal, error: fetchError } = await supabase
      .from('interview_proposals')
      .select('id, academy_user_id')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      console.error('[updateHiringDecision] 제안 조회 실패:', fetchError)
      return { error: '제안을 찾을 수 없습니다.' }
    }

    // 권한 확인 (학원 소유자만 업데이트 가능)
    if (proposal.academy_user_id !== session.userId) {
      return { error: '권한이 없습니다.' }
    }

    // hiring_decision 업데이트 (select로 반환된 데이터 확인)
    const { data: updatedData, error: updateError } = await supabase
      .from('interview_proposals')
      .update({
        hiring_decision: decision,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select('id, hiring_decision, updated_at')

    console.log('[updateHiringDecision] 업데이트 응답:', {
      updateError,
      updatedData,
      dataLength: updatedData?.length,
    })

    if (updateError) {
      console.error('[updateHiringDecision] 업데이트 실패 - Error 발생:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      return { error: `업데이트 실패: ${updateError.message}` }
    }

    // RLS 정책이 차단했을 수도 있으니 반환된 데이터 확인
    if (!updatedData || updatedData.length === 0) {
      console.error('[updateHiringDecision] RLS 정책으로 인한 업데이트 차단 (데이터 없음)', {
        proposalId,
        decision,
      })
      return {
        error: 'RLS 정책으로 인해 업데이트되지 않았습니다. 권한을 확인하세요.',
      }
    }

    console.log('[updateHiringDecision] 성공:', {
      proposalId,
      decision,
      updatedRecord: updatedData[0],
    })
    return { success: true, data: updatedData[0] }
  } catch (err) {
    console.error('[updateHiringDecision] 예외:', err)
    return { error: '오류가 발생했습니다.' }
  }
}
