'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

// ============================================
// selectInterviewTime: 강사가 면접 시간 선택
// ============================================
export async function selectInterviewTime(
  proposalId: string,
  interviewTime: string
): Promise<{ success?: boolean; error?: string }> {
  console.log('[selectInterviewTime] 면접 시간 선택 시작:', {
    proposalId,
    interviewTime,
  })

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[selectInterviewTime] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  if (session.role !== 'instructor') {
    console.error('[selectInterviewTime] 강사 역할 확인 실패:', session.role)
    return { error: '강사만 시간을 선택할 수 있습니다.' }
  }

  const supabase = await createClient()

  // 2. 제안 조회 (proposed_date 포함)
  console.log('[selectInterviewTime] 제안 조회 시작')
  const { data: proposal, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, status, proposed_date, proposed_time_range_start, proposed_time_range_end, interview_slot_minutes, academy_user_id, instructor_user_id')
    .eq('id', proposalId)
    .eq('instructor_user_id', session.userId)
    .single()

  if (proposalError || !proposal) {
    console.error('[selectInterviewTime] 제안 조회 실패:', proposalError?.message)
    return { error: '제안을 찾을 수 없습니다.' }
  }

  // 3. 수락 상태 확인
  if (proposal.status !== 'accepted') {
    console.error('[selectInterviewTime] 수락 상태 아님:', proposal.status)
    return { error: '수락한 제안만 시간을 선택할 수 있습니다.' }
  }

  // 4. 원장이 제안한 날짜/시간대 확인
  if (!proposal.proposed_date) {
    console.error('[selectInterviewTime] 제안 날짜 없음')
    return { error: '원장이 아직 면접 날짜를 제안하지 않았습니다.' }
  }

  if (!proposal.proposed_time_range_start || !proposal.proposed_time_range_end) {
    console.error('[selectInterviewTime] 시간대 제안 없음')
    return { error: '원장이 아직 시간대를 제안하지 않았습니다.' }
  }

  // 5. 시간 형식 검증
  const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/

  if (!timePattern.test(interviewTime)) {
    console.error('[selectInterviewTime] 시간 형식 오류')
    return { error: '올바른 시간 형식을 입력해주세요. (예: 14:00)' }
  }

  // 6. 선택한 시간이 범위 안인지 확인
  const selectedMinutes = parseInt(interviewTime.split(':')[0]) * 60 + parseInt(interviewTime.split(':')[1])
  const rangeStartMinutes = parseInt(proposal.proposed_time_range_start.split(':')[0]) * 60 + parseInt(proposal.proposed_time_range_start.split(':')[1])
  const rangeEndMinutes = parseInt(proposal.proposed_time_range_end.split(':')[0]) * 60 + parseInt(proposal.proposed_time_range_end.split(':')[1])

  if (selectedMinutes < rangeStartMinutes || selectedMinutes >= rangeEndMinutes) {
    console.error('[selectInterviewTime] 시간대 범위 밖')
    return { error: `제안된 시간대(${proposal.proposed_time_range_start}~${proposal.proposed_time_range_end}) 안에서 선택해주세요.` }
  }

  // 7. 슬롯 단위 검증
  const slotMinutes = proposal.interview_slot_minutes || 60
  const minutesSinceStart = selectedMinutes - rangeStartMinutes
  if (minutesSinceStart % slotMinutes !== 0) {
    console.error('[selectInterviewTime] 슬롯 단위 맞지 않음')
    return { error: `${slotMinutes}분 단위로만 선택 가능합니다.` }
  }

  // 8. 같은 학원에 정확히 같은 시간(interview_date + interview_time)으로 이미 확정된
  // 다른 면접이 있는지 확인 — 실제 더블부킹을 막는 최종 방어선
  // interview_proposals는 강사 본인 row만 SELECT 가능한 RLS가 걸려 있어
  // (다른 강사의 확정 면접을 직접 조회할 수 없음) SECURITY DEFINER RPC로 겹침 여부만 확인한다.
  console.log('[selectInterviewTime] 더블부킹 확인 시작')
  const { data: hasConflict, error: conflictCheckError } = await supabase.rpc(
    'check_interview_time_conflict',
    {
      p_academy_user_id: proposal.academy_user_id,
      p_interview_date: proposal.proposed_date,
      p_interview_time: interviewTime,
      p_exclude_proposal_id: proposalId,
    }
  )

  if (conflictCheckError) {
    console.error('[selectInterviewTime] 더블부킹 확인 실패:', conflictCheckError.message)
    return { error: '시간 확인 중 오류가 발생했습니다.' }
  }

  if (hasConflict) {
    console.error('[selectInterviewTime] 이미 다른 면접이 잡힌 시간')
    return { error: '이미 다른 면접이 잡힌 시간입니다.' }
  }

  // 9. interview_proposals 업데이트 (proposed_date + selected time 저장)
  console.log('[selectInterviewTime] interview_proposals 업데이트')
  const { error: updateError } = await supabase
    .from('interview_proposals')
    .update({
      interview_date: proposal.proposed_date,
      interview_time: interviewTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)

  if (updateError) {
    console.error('[selectInterviewTime] 업데이트 실패:', updateError.message)
    return { error: '시간 선택 저장에 실패했습니다.' }
  }

  console.log('[selectInterviewTime] interview_proposals 업데이트 성공')

  // 9. 강사 정보 조회 (알림 메시지용)
  console.log('[selectInterviewTime] 강사 정보 조회')
  const { data: instructorData } = await supabase
    .from('instructor_profiles')
    .select('name')
    .eq('user_id', session.userId)
    .single()

  const instructorName = instructorData?.name || '강사'

  // 10. 날짜를 월/일 형식으로 변환 (예: "2월 15일")
  const dateObj = new Date(proposal.proposed_date + 'T00:00:00')
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const dateLabel = `${month}월 ${day}일`

  // 11. 알림 생성 (강사용)
  const instructorMessageText = `${dateLabel} ${interviewTime} 면접 확정됐습니다`
  console.log('[selectInterviewTime] 강사 알림 생성 시작')

  try {
    const { error: notificationError1 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: session.userId,
        recipient_role: 'instructor',
        type: 'interview_confirmed',
        title: '면접 시간이 확정되었습니다',
        message: instructorMessageText,
        related_proposal_id: proposalId,
        read: false,
      })

    if (notificationError1) {
      console.log('[selectInterviewTime] 강사 알림 생성 실패:', notificationError1.message)
    } else {
      console.log('[selectInterviewTime] 강사 알림 생성 성공')
    }
  } catch (err) {
    console.error('[selectInterviewTime] 강사 알림 생성 중 예외 (무시):', err)
  }

  // 12. 알림 생성 (원장용)
  const academyMessageText = `${instructorName} 강사와 ${dateLabel} ${interviewTime} 면접 확정됐습니다`
  console.log('[selectInterviewTime] 원장 알림 생성 시작')

  try {
    const { error: notificationError2 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: proposal.academy_user_id,
        recipient_role: 'academy',
        type: 'interview_confirmed',
        title: '면접 시간이 확정되었습니다',
        message: academyMessageText,
        related_proposal_id: proposalId,
        read: false,
      })

    if (notificationError2) {
      console.log('[selectInterviewTime] 원장 알림 생성 실패:', notificationError2.message)
    } else {
      console.log('[selectInterviewTime] 원장 알림 생성 성공')
    }
  } catch (err) {
    console.error('[selectInterviewTime] 원장 알림 생성 중 예외 (무시):', err)
  }

  console.log('[selectInterviewTime] 완료')
  return { success: true }
}

// ============================================
// getNotifications: 사용자의 알림 조회
// ============================================
interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedProposalId: string | null
  academyUserId: string | null
}

export async function getNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<{
  success?: boolean
  notifications?: Notification[]
  total?: number
  error?: string
}> {
  console.log('[getNotifications] 알림 조회 시작:', {
    userId,
    limit,
    offset,
    unreadOnly,
  })

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[getNotifications] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  // 2. 권한 체크 (자신의 알림만 조회 가능)
  if (session.userId !== userId) {
    console.error('[getNotifications] 권한 없음:', { sessionUserId: session.userId, requestedUserId: userId })
    return { error: '자신의 알림만 조회할 수 있습니다.' }
  }

  // 3. limit/offset 유효성 검증
  if (limit < 1 || limit > 1000) {
    console.error('[getNotifications] limit 범위 오류')
    return { error: 'limit은 1 이상 1000 이하여야 합니다.' }
  }

  if (offset < 0) {
    console.error('[getNotifications] offset 범위 오류')
    return { error: 'offset은 0 이상이어야 합니다.' }
  }

  const supabase = await createClient()

  // 4. 전체 알림 개수 조회
  console.log('[getNotifications] 전체 알림 개수 조회')
  let countQuery = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)

  if (unreadOnly) {
    countQuery = countQuery.eq('read', false)
  }

  const { count: totalCount, error: countError } = await countQuery

  if (countError) {
    console.error('[getNotifications] 전체 개수 조회 실패:', countError.message)
    return { error: '알림 개수 조회에 실패했습니다.' }
  }

  // 5. 알림 조회
  console.log('[getNotifications] 알림 조회 시작')
  let query = supabase
    .from('notifications')
    .select('id, type, title, message, read, created_at, related_proposal_id')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data: notificationsData, error: queryError } = await query

  if (queryError) {
    console.error('[getNotifications] 알림 조회 실패:', queryError.message)
    return { error: '알림 조회에 실패했습니다.' }
  }

  console.log('[getNotifications] 조회된 알림 원본 데이터:')
  notificationsData?.forEach((n: any) => {
    console.log(`  - ID: ${n.id}, Type: ${n.type}, Related: ${n.related_proposal_id || 'null'}`)
  })

  // 6. related_proposal_id로 academy_user_id 조회 (또는 instructor_user_id로 역추적)
  const proposalIds = (notificationsData || [])
    .map((n: any) => n.related_proposal_id)
    .filter((id: any) => id !== null)

  console.log('[getNotifications] proposalIds 추출:', {
    total: notificationsData?.length || 0,
    withIds: proposalIds.length,
    ids: proposalIds,
  })

  let proposalMap: Record<string, string> = {}

  // 6-1. related_proposal_id로 조회
  if (proposalIds.length > 0) {
    console.log('[getNotifications] proposal 조회 시작 (related_proposal_id):', proposalIds.length)
    const { data: proposals, error: proposalError } = await supabase
      .from('interview_proposals')
      .select('id, academy_user_id')
      .in('id', proposalIds)

    console.log('[getNotifications] proposal 조회 결과:', {
      error: proposalError?.message,
      count: proposals?.length || 0,
    })

    if (!proposalError && proposals) {
      proposalMap = Object.fromEntries(
        proposals.map((p: any) => [p.id, p.academy_user_id])
      )
    }
  }

  // 6-2. related_proposal_id가 NULL인 경우, instructor_user_id로 역추적
  const nullProposals = (notificationsData || []).filter((n: any) => n.related_proposal_id === null)
  if (nullProposals.length > 0) {
    console.log('[getNotifications] NULL proposal 역추적 시작:', nullProposals.length)
    const { data: proposals, error: proposalError } = await supabase
      .from('interview_proposals')
      .select('id, academy_user_id, created_at')
      .eq('instructor_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('[getNotifications] instructor 기반 proposal 조회:', {
      error: proposalError?.message,
      found: proposals?.length,
    })

    // 가장 최근 proposal을 NULL 알림에 매핑
    if (proposals && proposals.length > 0) {
      const latestProposal = proposals[0]
      nullProposals.forEach((n: any) => {
        // notification ID를 키로 사용
        proposalMap[n.id] = latestProposal.academy_user_id
      })
      console.log('[getNotifications] NULL 알림에 academy_user_id 매핑:', latestProposal.academy_user_id)
    }
  }

  // 7. 데이터 변환
  const notifications: Notification[] = (notificationsData || []).map((n: any) => {
    // related_proposal_id가 있으면 그로 매핑, 없으면 notification ID로 매핑 (역추적)
    const academyUserId = proposalMap[n.related_proposal_id] || proposalMap[n.id] || null
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.created_at,
      relatedProposalId: n.related_proposal_id,
      academyUserId,
    }
  })

  console.log('[getNotifications] 조회 성공:', {
    개수: notifications.length,
    전체: totalCount,
  })

  return {
    success: true,
    notifications,
    total: totalCount || 0,
  }
}
