import { getSession } from '@/lib/auth/getSession'
import NotificationList from '@/app/(instructor)/components/NotificationList'
import { createClient } from '@/lib/supabase/server'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedProposalId: string | null
  academyUserId: string | null
}

export default async function StudentNotificationsPage() {
  const session = await getSession()

  if (!session || session.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">알림</h1>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학생만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  const { data: notificationsData, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, read, created_at, related_proposal_id')
    .eq('recipient_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !notificationsData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">알림</h1>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">알림을 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const notifications: NotificationItem[] = notificationsData.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.created_at,
    relatedProposalId: n.related_proposal_id,
    academyUserId: null,
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          <p className="text-sm text-gray-600 mt-2">
            총 {notifications.length}개 | 미읽음 {notifications.filter((n) => !n.read).length}개
          </p>
        </div>

        <NotificationList initialNotifications={notifications} />
      </div>
    </div>
  )
}
