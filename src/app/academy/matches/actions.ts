'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

// ============================================
// 1. createProposal: 원장이 강사에게 채용 제안
// ============================================
export async function createProposal(
  instructorUserId: string
): Promise<{ success?: boolean; proposalId?: string; error?: string }> {
  console.log('[createProposal] 채용 제안 시작:', { instructorUserId })

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[createProposal] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  if (session.role !== 'academy') {
    console.error('[createProposal] 권한 확인 실패:', session.role)
    return { error: '원장만 제안할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 현재 pending 제안이 있는지 확인
  console.log('[createProposal] 기존 pending 제안 확인')
  const { data: pendingProposal, error: pendingError } = await supabase
    .from('interview_proposals')
    .select('id')
    .eq('academy_user_id', session.userId)
    .eq('instructor_user_id', instructorUserId)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingError) {
    console.error('[createProposal] 기존 제안 조회 실패:', pendingError.message)
    return { error: '제안 확인 중 오류가 발생했습니다.' }
  }

  if (pendingProposal) {
    console.log('[createProposal] 이미 pending 제안 존재')
    return { error: '이미 이 강사에게 제안했습니다.' }
  }

  // 3. 거절된 제안이 있는지 확인 (14일 이내면 재제안 불가)
  console.log('[createProposal] 거절된 제안 확인')
  const { data: rejectedProposal, error: rejectedError } = await supabase
    .from('interview_proposals')
    .select('id, responded_at')
    .eq('academy_user_id', session.userId)
    .eq('instructor_user_id', instructorUserId)
    .eq('status', 'declined')
    .order('responded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rejectedError) {
    console.error('[createProposal] 거절 제안 조회 실패:', rejectedError.message)
    return { error: '제안 조회 중 오류가 발생했습니다.' }
  }

  if (rejectedProposal && rejectedProposal.responded_at) {
    const rejectedDate = new Date(rejectedProposal.responded_at)
    const now = new Date()
    const daysSinceRejection = Math.floor((now.getTime() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceRejection < 14) {
      console.log('[createProposal] 거절 후 14일 미만:', daysSinceRejection, '일')
      const daysUntilCanRetry = 14 - daysSinceRejection
      return {
        error: `거절 후 14일이 지나야 재제안할 수 있습니다. (${daysUntilCanRetry}일 남음)`,
      }
    }
  }

  // 4. 원장 정보 조회 (알림 메시지에 학원명 필요)
  console.log('[createProposal] 원장 정보 조회')
  const { data: academy, error: academyError } = await supabase
    .from('academies')
    .select('academy_name')
    .eq('user_id', session.userId)
    .single()

  if (academyError || !academy) {
    console.error('[createProposal] 원장 정보 조회 실패:', academyError?.message)
    return { error: '학원 정보를 불러올 수 없습니다.' }
  }

  // 5. interview_proposals 생성 (DB 로직)
  console.log('[createProposal] interview_proposals 생성')
  const { data: proposal, error: proposalError } = await supabase
    .from('interview_proposals')
    .insert({
      academy_user_id: session.userId,
      instructor_user_id: instructorUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (proposalError || !proposal) {
    console.error('[createProposal] interview_proposals 생성 실패:', proposalError?.message)
    return { error: '제안 등록 중 오류가 발생했습니다.' }
  }

  console.log('[createProposal] interview_proposals 생성 성공:', proposal.id)

  // 6. 알림 생성 (알림 로직 - 선택적)
  try {
    console.log('[createProposal] 강사 알림 생성')
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: instructorUserId,
        recipient_role: 'instructor',
        type: 'proposal',
        related_proposal_id: proposal.id,
        title: `${academy.academy_name}에서 채용 제안했습니다`,
        message: `${academy.academy_name}에서 면접 제안을 보냈습니다. 수락 또는 거절해주세요.`,
        read: false,
      })

    if (notificationError) {
      console.error('[createProposal] 알림 생성 실패 (무시):', notificationError.message)
      // 알림 생성 실패는 무시하고 진행 (DB 로직은 성공했으므로)
    } else {
      console.log('[createProposal] 강사 알림 생성 성공')
    }
  } catch (err) {
    console.error('[createProposal] 알림 생성 중 예외 (무시):', err)
  }

  console.log('[createProposal] 완료:', proposal.id)
  return { success: true, proposalId: proposal.id }
}

// ============================================
// 2. respondProposal: 강사가 제안에 수락/거절 응답
// ============================================
export async function respondProposal(
  proposalId: string,
  response: 'accept' | 'reject'
): Promise<{ success?: boolean; status?: string; error?: string }> {
  console.log('[respondProposal] 응답 시작:', { proposalId, response })

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[respondProposal] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  if (session.role !== 'instructor') {
    console.error('[respondProposal] 권한 확인 실패:', session.role)
    return { error: '강사만 응답할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 제안 조회 및 유효성 확인
  console.log('[respondProposal] 제안 조회')
  const { data: proposal, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, academy_user_id, status, responded_at')
    .eq('id', proposalId)
    .eq('instructor_user_id', session.userId)
    .maybeSingle()

  if (proposalError) {
    console.error('[respondProposal] 제안 조회 실패:', proposalError.message)
    return { error: '제안 조회 중 오류가 발생했습니다.' }
  }

  if (!proposal) {
    console.error('[respondProposal] 제안을 찾을 수 없음')
    return { error: '제안을 찾을 수 없습니다.' }
  }

  // 3. 이미 응답했는지 확인
  if (proposal.responded_at) {
    console.log('[respondProposal] 이미 응답함:', proposal.responded_at)
    return { error: '이미 응답했습니다.' }
  }

  // 4. 상태값 결정
  const newStatus = response === 'accept' ? 'accepted' : 'declined'
  const respondedAt = new Date().toISOString()

  console.log('[respondProposal] 상태 업데이트:', { newStatus, respondedAt })

  // 5. interview_proposals 업데이트 (DB 로직)
  const { error: updateError } = await supabase
    .from('interview_proposals')
    .update({
      status: newStatus,
      responded_at: respondedAt,
    })
    .eq('id', proposalId)

  if (updateError) {
    console.error('[respondProposal] 업데이트 실패:', updateError.message)
    return { error: '응답 저장 중 오류가 발생했습니다.' }
  }

  console.log('[respondProposal] interview_proposals 업데이트 성공')

  // 6. 원장 정보 조회 (알림 메시지에 강사명 필요)
  console.log('[respondProposal] 강사 정보 조회')
  const { data: instructorProfile, error: instructorError } = await supabase
    .from('instructor_profiles')
    .select('name')
    .eq('user_id', session.userId)
    .single()

  if (instructorError || !instructorProfile) {
    console.error('[respondProposal] 강사 정보 조회 실패:', instructorError?.message)
    return { error: '강사 정보를 불러올 수 없습니다.' }
  }

  // 7. 알림 생성 (알림 로직 - 선택적)
  try {
    const notificationType = response === 'accept' ? 'response_accept' : 'response_reject'
    const notificationTitle = response === 'accept'
      ? `${instructorProfile.name} 강사가 수락했습니다`
      : `${instructorProfile.name} 강사가 거절했습니다`
    const notificationMessage = response === 'accept'
      ? `${instructorProfile.name} 강사가 면접 제안을 수락했습니다.`
      : `${instructorProfile.name} 강사가 면접 제안을 거절했습니다.`

    console.log('[respondProposal] 원장 알림 생성')
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: proposal.academy_user_id,
        recipient_role: 'academy',
        type: notificationType,
        related_proposal_id: proposalId,
        title: notificationTitle,
        message: notificationMessage,
        read: false,
      })

    if (notificationError) {
      console.error('[respondProposal] 알림 생성 실패 (무시):', notificationError.message)
      // 알림 생성 실패는 무시하고 진행 (DB 로직은 성공했으므로)
    } else {
      console.log('[respondProposal] 원장 알림 생성 성공')
    }
  } catch (err) {
    console.error('[respondProposal] 알림 생성 중 예외 (무시):', err)
  }

  console.log('[respondProposal] 완료:', { status: newStatus })
  return { success: true, status: newStatus }
}

// ============================================
// 3. proposeInterviewTime: 원장이 면접 시간대 제안
// ============================================
export async function proposeInterviewTime(
  proposalId: string,
  proposedDate: string,
  timeRangeStart: string,
  timeRangeEnd: string,
  slotMinutes: number
): Promise<{ success?: boolean; error?: string; warning?: string }> {
  console.log('[proposeInterviewTime] 면접 시간대 제안 시작:', {
    proposalId,
    proposedDate,
    timeRangeStart,
    timeRangeEnd,
    slotMinutes,
  })

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[proposeInterviewTime] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  if (session.role !== 'academy') {
    console.error('[proposeInterviewTime] 권한 확인 실패:', session.role)
    return { error: '원장만 면접 시간을 제안할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 제안 조회
  console.log('[proposeInterviewTime] 제안 조회 시작')
  const { data: proposal, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, status, instructor_user_id')
    .eq('id', proposalId)
    .eq('academy_user_id', session.userId)
    .single()

  if (proposalError || !proposal) {
    console.error('[proposeInterviewTime] 제안 조회 실패:', proposalError?.message)
    return { error: '제안을 찾을 수 없습니다.' }
  }

  // 3. 수락 상태 확인
  if (proposal.status !== 'accepted') {
    console.error('[proposeInterviewTime] 수락 상태 아님:', proposal.status)
    return { error: '수락된 제안만 일정을 제안할 수 있습니다.' }
  }

  // 4. 날짜 형식 및 오늘 이후 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(proposedDate)) {
    console.error('[proposeInterviewTime] 날짜 형식 오류')
    return { error: '올바른 날짜 형식을 입력해주세요. (예: 2026-07-15)' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedDate = new Date(proposedDate + 'T00:00:00')
  if (Number.isNaN(selectedDate.getTime())) {
    console.error('[proposeInterviewTime] 날짜 파싱 오류')
    return { error: '올바른 날짜를 입력해주세요.' }
  }
  if (selectedDate < today) {
    console.error('[proposeInterviewTime] 과거 날짜 선택')
    return { error: '오늘 이후 날짜만 선택할 수 있습니다.' }
  }

  // 5. 시간 범위 검증
  const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  if (!timePattern.test(timeRangeStart) || !timePattern.test(timeRangeEnd)) {
    console.error('[proposeInterviewTime] 시간 형식 오류')
    return { error: '올바른 시간 형식을 입력해주세요. (예: 14:00)' }
  }

  const startMinutes = parseInt(timeRangeStart.split(':')[0]) * 60 + parseInt(timeRangeStart.split(':')[1])
  const endMinutes = parseInt(timeRangeEnd.split(':')[0]) * 60 + parseInt(timeRangeEnd.split(':')[1])

  if (startMinutes >= endMinutes) {
    console.error('[proposeInterviewTime] 시간 범위 오류')
    return { error: '시작 시간이 종료 시간보다 작아야 합니다.' }
  }

  if (slotMinutes !== 30 && slotMinutes !== 60) {
    console.error('[proposeInterviewTime] 슬롯 단위 오류')
    return { error: '슬롯 단위는 30분 또는 60분이어야 합니다.' }
  }

  // 6. 같은 날짜에 이미 확정된 다른 면접이 있는지 확인 (경고만, 진행은 허용)
  // 날짜 단위 체크라 실제 시간 겹침 여부까지는 알 수 없음 — 최종 차단은 selectInterviewTime에서 처리
  console.log('[proposeInterviewTime] 겹치는 확정 면접 확인 시작')
  let warning: string | undefined
  const { data: sameDateInterviews, error: sameDateError } = await supabase
    .from('interview_proposals')
    .select('id, interview_time')
    .eq('academy_user_id', session.userId)
    .eq('interview_date', proposedDate)
    .not('interview_time', 'is', null)
    .neq('id', proposalId)

  if (sameDateError) {
    console.error('[proposeInterviewTime] 겹치는 면접 확인 실패 (무시):', sameDateError.message)
  } else if (sameDateInterviews && sameDateInterviews.length > 0) {
    console.warn('[proposeInterviewTime] 같은 날짜에 이미 확정된 면접 존재:', sameDateInterviews)
    warning = `${proposedDate}에 이미 확정된 면접이 ${sameDateInterviews.length}건 있습니다. 시간이 겹치지 않는지 확인해주세요.`
  }

  // 7. interview_proposals 업데이트
  console.log('[proposeInterviewTime] interview_proposals 업데이트')
  const { error: updateError } = await supabase
    .from('interview_proposals')
    .update({
      proposed_date: proposedDate,
      proposed_time_range_start: timeRangeStart,
      proposed_time_range_end: timeRangeEnd,
      interview_slot_minutes: slotMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)

  if (updateError) {
    console.error('[proposeInterviewTime] 업데이트 실패:', updateError.message)
    return { error: '일정 제안 저장에 실패했습니다.' }
  }

  console.log('[proposeInterviewTime] interview_proposals 업데이트 성공')

  // 7. 알림 생성 (강사용)
  const dateLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
  const notificationMessage = `${dateLabel} ${timeRangeStart}~${timeRangeEnd} (${slotMinutes}분 단위)`
  console.log('[proposeInterviewTime] 알림 생성 시작')

  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: proposal.instructor_user_id,
        recipient_role: 'instructor',
        type: 'interview_proposed',
        title: '면접 일정이 제안되었습니다',
        message: notificationMessage,
        related_proposal_id: proposalId,
        read: false,
      })

    if (notificationError) {
      console.log('[proposeInterviewTime] 알림 생성 실패:', notificationError.message)
    } else {
      console.log('[proposeInterviewTime] 알림 생성 성공')
    }
  } catch (err) {
    console.error('[proposeInterviewTime] 알림 생성 중 예외 (무시):', err)
  }

  console.log('[proposeInterviewTime] 완료')
  return { success: true, warning }
}
