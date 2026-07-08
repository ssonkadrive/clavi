'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

interface MessageResponse {
  id: string
  sender_id: string
  message: string
  created_at: string
  sender_type: 'instructor' | 'academy'
}

interface GetMessagesResult {
  messages: MessageResponse[]
  currentUserId: string
}

export async function sendMessage(proposalId: string, content: string) {
  console.log('[sendMessage] 시작:', {
    proposalId,
    contentLength: content.length,
  })

  try {
    // 1. 세션 확인
    const session = await getSession()
    if (!session || session.role !== 'instructor') {
      console.error('[sendMessage] 세션 확인 실패')
      return { error: '강사만 메시지를 전송할 수 있습니다.', data: undefined }
    }

    console.log('[sendMessage] 세션 확인 완료:', session.userId)

    const supabase = await createClient()

    // 2. proposal 소유권 확인
    console.log('[sendMessage] proposal 소유권 확인')
    const { data: proposal, error: proposalError } = await supabase
      .from('interview_proposals')
      .select('id, instructor_user_id')
      .eq('id', proposalId)
      .eq('instructor_user_id', session.userId)
      .single()

    if (proposalError) {
      console.error('[sendMessage] proposal 조회 에러:', {
        message: proposalError.message,
        code: proposalError.code,
        details: proposalError.details,
      })
      return { error: '제안을 찾을 수 없습니다.', data: undefined }
    }

    if (!proposal) {
      console.error('[sendMessage] proposal이 없음')
      return { error: '제안을 찾을 수 없습니다.', data: undefined }
    }

    console.log('[sendMessage] proposal 확인 완료')

    // 3. 메시지 저장
    console.log('[sendMessage] 메시지 저장 시작')
    const { data: message, error: messageError } = await supabase
      .from('interview_messages')
      .insert({
        interview_proposal_id: proposalId,
        sender_id: session.userId,
        content: content,
      })
      .select()
      .single()

    if (messageError) {
      console.error('[sendMessage] 메시지 저장 에러:', {
        message: messageError.message,
        code: messageError.code,
        details: messageError.details,
        hint: messageError.hint,
      })
      return { error: `메시지 저장 실패: ${messageError.message}`, data: undefined }
    }

    if (!message) {
      console.error('[sendMessage] 저장된 메시지가 없음')
      return { error: '메시지 저장 중 오류가 발생했습니다.', data: undefined }
    }

    console.log('[sendMessage] 성공:', message?.id)
    return {
      data: {
        id: message.id,
        sender_id: message.sender_id,
        message: message.content,
        created_at: message.created_at,
        sender_type: 'instructor' as const,
      },
    }
  } catch (error: any) {
    const errorMsg = error?.message || error?.details || error?.hint || error?.toString() || '알 수 없는 에러'
    console.error('[sendMessage] 상세 에러:', {
      message: errorMsg,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      status: error?.status,
      stack: error?.stack,
    })
    return { error: `메시지 전송 실패: ${errorMsg}`, data: undefined }
  }
}

export async function getMessages(proposalId: string) {
  console.log('[getMessages] 시작:', proposalId)

  try {
    // 1. 세션 확인
    const session = await getSession()
    if (!session || session.role !== 'instructor') {
      console.error('[getMessages] 세션 확인 실패')
      return { error: '강사만 메시지를 조회할 수 있습니다.', data: undefined }
    }

    console.log('[getMessages] 세션 확인 완료:', session.userId)

    const supabase = await createClient()

    // 2. proposal 소유권 확인
    console.log('[getMessages] proposal 소유권 확인:', proposalId)
    const { data: proposal, error: proposalError } = await supabase
      .from('interview_proposals')
      .select('id, instructor_user_id')
      .eq('id', proposalId)
      .eq('instructor_user_id', session.userId)
      .single()

    if (proposalError) {
      console.error('[getMessages] proposal 조회 에러:', {
        message: proposalError.message,
        code: proposalError.code,
        details: proposalError.details,
      })
      return { error: '제안을 찾을 수 없습니다.', data: undefined }
    }

    if (!proposal) {
      console.error('[getMessages] proposal이 없음')
      return { error: '제안을 찾을 수 없습니다.', data: undefined }
    }

    console.log('[getMessages] proposal 확인 완료')

    // 3. 메시지 조회
    console.log('[getMessages] interview_messages 테이블 조회 시작:', proposalId)
    const { data: messages, error: messagesError } = await supabase
      .from('interview_messages')
      .select('id, sender_id, content, created_at')
      .eq('interview_proposal_id', proposalId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('[getMessages] 메시지 조회 에러:', {
        message: messagesError.message,
        code: messagesError.code,
        details: messagesError.details,
        hint: messagesError.hint,
      })
      return { error: `메시지 조회 실패: ${messagesError.message}`, data: undefined }
    }

    console.log('[getMessages] 성공:', (messages || []).length + '개')
    return {
      data: {
        messages: (messages || []).map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          message: msg.content,
          created_at: msg.created_at,
          sender_type: 'instructor' as const,
        })),
        currentUserId: session.userId,
      },
    }
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '알 수 없는 에러'
    console.error('[getMessages] 예외 발생:', {
      message: errorMsg,
      stack: error?.stack,
      error: error,
    })
    return { error: `메시지 로드 실패: ${errorMsg}`, data: undefined }
  }
}
