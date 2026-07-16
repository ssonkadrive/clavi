'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StudentMorePage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">더보기</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
          {/* 프로필 */}
          <Link
            href="/student/profile"
            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">👤 프로필</p>
            <p className="text-sm text-gray-600">프로필 정보 관리</p>
          </Link>

          {/* 설정 */}
          <Link
            href="/student/settings"
            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">⚙️ 설정</p>
            <p className="text-sm text-gray-600">앱 설정</p>
          </Link>

          {/* 고객지원 */}
          <Link
            href="/student/support"
            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">💬 고객지원</p>
            <p className="text-sm text-gray-600">문의사항</p>
          </Link>

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-red-600">🚪 로그아웃</p>
          </button>
        </div>
      </div>
    </div>
  )
}
