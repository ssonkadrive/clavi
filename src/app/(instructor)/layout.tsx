import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'

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
    { label: '매칭현황', href: '/matching', icon: '📋' },
    { label: '학원찾기', href: '/find-academies', icon: '🔍' },
    { label: '채팅', href: '/messages', icon: '💬' },
    { label: '더보기', href: '/more', icon: '⋯' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className="pb-32">
        {children}
      </div>

      {/* 하단 탭바 */}
      <BottomNavigation role="instructor" items={navItems} />
    </div>
  )
}
