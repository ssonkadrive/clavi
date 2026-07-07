'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function getMessages(proposalId: string) {
  console.log('[getMessages] 메시지 조회 시작:', proposalId)

  try {
    const session = await getSession()

    if (!session) {
      console.log('[getMessages] 세션 없음')
      return { error: '로그인이 필요합니다.' }
    }

    const supabase = await createClient()

    // interview_proposals에서 제안 정보 확인
    const { data: proposal } = await supabase
      .from('interview_proposals')
      .select('id, academy_user_id, instructor_user_id')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      console.log('[getMessages] 제안을 찾을 수 없음')
      return { error: '제안을 찾을 수 없습니다.' }
    }

    // 현재 사용자가 학원인지 강사인지 확인
    if (session.role === 'academy' && proposal.academy_user_id !== session.userId) {
      console.log('[getMessages] 권한 없음 (academy)')
      return { error: '접근할 수 없습니다.' }
    }

    if (
      session.role === 'instructor' &&
      proposal.instructor_user_id !== session.userId
    ) {
      console.log('[getMessages] 권한 없음 (instructor)')
      return { error: '접근할 수 없습니다.' }
    }

    // 메시지 조회
    const { data: messages, error: messagesError } = await supabase
      .from('interview_messages')
      .select('id, sender_id, content, created_at')
      .eq('interview_proposal_id', proposalId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('[getMessages] 메시지 조회 실패:', messagesError)
      return { error: '메시지를 불러올 수 없습니다.' }
    }

    console.log('[getMessages] 메시지 조회 성공:', messages?.length || 0)

    return {
      data: {
        messages: messages || [],
        currentUserId: session.userId,
      },
    }
  } catch (err) {
    console.error('[getMessages] 예외:', err)
    return { error: '메시지 조회 중 오류가 발생했습니다.' }
  }
}

export async function sendMessage(proposalId: string, message: string) {
  console.log('[sendMessage] 메시지 전송 시작:', { proposalId, messageLength: message.length })

  try {
    const session = await getSession()

    if (!session) {
      console.log('[sendMessage] 세션 없음')
      return { error: '로그인이 필요합니다.' }
    }

    if (!message.trim()) {
      return { error: '메시지를 입력하세요.' }
    }

    const supabase = await createClient()

    // interview_proposals에서 제안 정보 확인
    const { data: proposal } = await supabase
      .from('interview_proposals')
      .select('id, academy_user_id, instructor_user_id')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      console.log('[sendMessage] 제안을 찾을 수 없음')
      return { error: '제안을 찾을 수 없습니다.' }
    }

    // 현재 사용자가 학원인지 강사인지 확인
    if (session.role === 'academy' && proposal.academy_user_id !== session.userId) {
      console.log('[sendMessage] 권한 없음 (academy)')
      return { error: '접근할 수 없습니다.' }
    }

    if (
      session.role === 'instructor' &&
      proposal.instructor_user_id !== session.userId
    ) {
      console.log('[sendMessage] 권한 없음 (instructor)')
      return { error: '접근할 수 없습니다.' }
    }

    // 메시지 삽입
    const { data: newMessage, error: insertError } = await supabase
      .from('interview_messages')
      .insert({
        interview_proposal_id: proposalId,
        sender_id: session.userId,
        content: message.trim(),
      })
      .select('id, sender_id, content, created_at')
      .single()

    if (insertError) {
      console.error('[sendMessage] 메시지 삽입 실패:', insertError)
      return { error: '메시지 전송에 실패했습니다.' }
    }

    console.log('[sendMessage] 메시지 전송 성공:', newMessage?.id)

    return {
      data: newMessage,
    }
  } catch (err) {
    console.error('[sendMessage] 예외:', err)
    return { error: '메시지 전송 중 오류가 발생했습니다.' }
  }
}
