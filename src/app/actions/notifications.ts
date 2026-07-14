'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success?: boolean; error?: string; unreadCount?: number }> {
  console.log('[markNotificationAsRead] 시작:', notificationId)

  // 1. 세션 확인
  const session = await getSession()
  if (!session) {
    console.error('[markNotificationAsRead] 세션 없음')
    return { error: '로그인이 필요합니다.' }
  }

  const supabase = await createClient()

  // 2. 알림을 읽음으로 표시
  console.log('[markNotificationAsRead] 알림 업데이트 시작')
  const { error: updateError } = await supabase
    .from('notifications')
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('recipient_id', session.userId)

  if (updateError) {
    console.error('[markNotificationAsRead] 업데이트 실패:', updateError.message)
    return { error: '알림 업데이트에 실패했습니다.' }
  }

  console.log('[markNotificationAsRead] 알림 업데이트 성공')

  // 3. 읽지 않은 알림 개수 조회
  console.log('[markNotificationAsRead] 미읽음 개수 조회')
  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', session.userId)
    .eq('read', false)

  if (countError) {
    console.error('[markNotificationAsRead] 개수 조회 실패:', countError.message)
    return { success: true, unreadCount: 0 }
  }

  console.log('[markNotificationAsRead] 미읽음 개수:', unreadCount)

  return {
    success: true,
    unreadCount: unreadCount || 0,
  }
}
