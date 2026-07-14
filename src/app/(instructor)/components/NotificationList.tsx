'use client'

import { useState } from 'react'
import { markNotificationAsRead, deleteNotification } from '@/app/actions/notifications'

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

interface NotificationListProps {
  initialNotifications: NotificationItem[]
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'proposal':
      return '📬'
    case 'interview_proposed':
      return '📅'
    case 'interview_confirmed':
      return '✅'
    default:
      return '🔔'
  }
}

const formatRelativeTime = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [isLoading, setIsLoading] = useState(false)

  const handleNotificationClick = async (notification: NotificationItem, link: string) => {
    console.log('[NotificationList] 클릭 시작:', notification.id, 'read=', notification.read)

    // 이미 읽음 상태면 링크로만 이동
    if (notification.read) {
      console.log('[NotificationList] 이미 읽음 상태 - 링크로 이동')
      window.location.href = link
      return
    }

    setIsLoading(true)

    try {
      const result = await markNotificationAsRead(notification.id)
      console.log('[NotificationList] markNotificationAsRead 완료:', result)

      if (result.success) {
        // UI 업데이트
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        )

        console.log('[NotificationList] 알림 읽음 표시 성공, 미읽음:', result.unreadCount)

        // 읽음 처리 후 링크로 이동
        setTimeout(() => {
          window.location.href = link
        }, 100)
      } else {
        console.error('[NotificationList] 알림 읽음 표시 실패:', result.error)
        // 실패해도 링크로 이동
        window.location.href = link
      }
    } catch (err) {
      console.error('[NotificationList] 오류:', err)
      // 에러도 링크로 이동
      window.location.href = link
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    console.log('[NotificationList] 삭제 시작:', notificationId)

    try {
      const result = await deleteNotification(notificationId)
      console.log('[NotificationList] deleteNotification 결과:', result)

      if (result.success) {
        // UI에서 제거
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        console.log('[NotificationList] 알림 삭제 성공')
      } else {
        console.error('[NotificationList] 알림 삭제 실패:', result.error)
        alert('알림 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('[NotificationList] 삭제 중 오류:', err)
      alert('알림 삭제 중 오류가 발생했습니다.')
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 text-lg">알림이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const link = notification.academyUserId ? `/matches/${notification.academyUserId}` : '#'

        return (
          <div
            key={notification.id}
            className={`rounded-lg border-l-4 p-4 transition-all cursor-pointer ${
              notification.read
                ? 'bg-white border-gray-300 hover:shadow-md'
                : 'bg-blue-50 border-blue-500 hover:shadow-lg'
            }`}
            onClick={() => handleNotificationClick(notification, link)}
          >
            <div className="block">
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{notification.title}</span>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 메시지 */}
              <p className="text-gray-700 ml-11">{notification.message}</p>

              {/* 읽음 상태 */}
              {notification.read && (
                <div className="mt-2 ml-11">
                  <span className="text-xs text-gray-500">읽음</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
