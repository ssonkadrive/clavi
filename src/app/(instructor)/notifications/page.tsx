import { getNotifications } from '@/app/(instructor)/matches/actions'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import NotificationList from '@/app/(instructor)/components/NotificationList'

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


export default async function InstructorNotificationsPage() {
  const session = await getSession()

  if (!session || session.role !== 'instructor') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">알림</h1>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const result = await getNotifications(session.userId, 50, 0, false)

  if (result.error || !result.notifications) {
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

  const instructorNotifications = result.notifications.filter((n) => {
    return ['proposal', 'interview_proposed', 'interview_confirmed', 'session_request'].includes(
      n.type
    )
  })

  // 디버깅: academyUserId 확인
  console.log('[InstructorNotificationsPage] 알림 데이터:')
  instructorNotifications.forEach((n) => {
    console.log(`  - ID: ${n.id}, Type: ${n.type}, Academy: ${n.academyUserId || 'null'}, Link: /matches/${n.academyUserId || 'MISSING'}`)
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          <p className="text-sm text-gray-600 mt-2">
            총 {instructorNotifications.length}개 | 미읽음 {instructorNotifications.filter((n) => !n.read).length}개
          </p>
        </div>

        <NotificationList initialNotifications={instructorNotifications} />

        {/* 돌아가기 */}
        <div className="mt-8">
          <Link
            href="/matches"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors font-medium"
          >
            매칭 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
