import { getSession } from '@/lib/auth/getSession'
import { getNotifications } from '@/app/(instructor)/matches/actions'
import Link from 'next/link'

export default async function NotificationBell() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // 미읽은 알림 개수 조회
  let unreadCount = 0
  try {
    const result = await getNotifications(session.userId, 50, 0, true)
    unreadCount = result.notifications?.length || 0
  } catch (err) {
    console.error('[NotificationBell] 미읽은 알림 조회 실패:', err)
  }

  const notificationPath =
    session.role === 'academy' ? '/academy/notifications'
    : session.role === 'student' ? '/student/notifications'
    : '/notifications'

  return (
    <Link
      href={notificationPath}
      className="fixed top-4 right-4 z-40 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2 font-medium"
      title="알림 페이지로 이동"
    >
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
