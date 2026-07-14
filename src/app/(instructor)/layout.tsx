import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'
import NotificationBell from '@/app/components/NotificationBell'

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || session.role !== 'instructor') {
    redirect('/signin')
  }

  const navItems = [
    { label: '홈', href: '/dashboard', icon: '🏠' },
    { label: '매칭', href: '/matches', icon: '📋' },
    { label: '채팅', href: '/messages', icon: '💬' },
    { label: '더보기', href: '/more', icon: '⋯' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 알림 종 아이콘 */}
      <NotificationBell />

      {/* 메인 콘텐츠 */}
      <div className="pb-32">
        {children}
      </div>

      {/* 하단 탭바 */}
      <BottomNavigation role="instructor" items={navItems} />
    </div>
  )
}
