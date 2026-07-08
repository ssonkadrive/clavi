import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || session.role !== 'academy') {
    redirect('/signin')
  }

  const navItems = [
    { label: '홈', href: '/academy', icon: '🏠' },
    { label: '채용현황', href: '/academy/recruitment', icon: '📋' },
    { label: '강사찾기', href: '/academy/find-instructors', icon: '🔍' },
    { label: '채팅', href: '/academy/messages', icon: '💬' },
    { label: '더보기', href: '/academy/more', icon: '⋯' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className="pb-32">
        {children}
      </div>

      {/* 하단 탭바 */}
      <BottomNavigation role="academy" items={navItems} />
    </div>
  )
}
