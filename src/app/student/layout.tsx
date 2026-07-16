import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'
import NotificationBell from '@/app/components/NotificationBell'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || session.role !== 'student') {
    redirect('/signin')
  }

  const navItems = [
    { label: '홈', href: '/student', icon: '🏠' },
    { label: '수강현황', href: '/student/sessions', icon: '📚' },
    { label: '강사찾기', href: '/student/instructors', icon: '🔍' },
    { label: '채팅', href: '/student/messages', icon: '💬' },
    { label: '더보기', href: '/student/more', icon: '⋯' },
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
      <BottomNavigation role="student" items={navItems} />
    </div>
  )
}
