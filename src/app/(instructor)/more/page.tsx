'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InstructorMorePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/signin')
    } catch (err) {
      console.error('[InstructorMorePage] 로그아웃 에러:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">더보기</h1>

        <div className="space-y-3">
          <Link
            href="/profile"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-gray-900">👤 프로필</p>
            <p className="text-sm text-gray-600 mt-1">계정 정보 관리</p>
          </Link>

          <Link
            href="/students"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-gray-900">🎓 수강 신청 관리</p>
            <p className="text-sm text-gray-600 mt-1">학생 수강 신청 확인 및 응답</p>
          </Link>

          <Link
            href="/settings"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-gray-900">⚙️ 설정</p>
            <p className="text-sm text-gray-600 mt-1">앱 설정 및 알림</p>
          </Link>

          <Link
            href="/support"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-gray-900">❓ 고객센터</p>
            <p className="text-sm text-gray-600 mt-1">도움말 및 지원</p>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors text-left"
          >
            <p className="font-medium text-red-900">🚪 로그아웃</p>
            <p className="text-sm text-red-700 mt-1">계정에서 로그아웃</p>
          </button>
        </div>

        <div className="mt-12 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-xs text-gray-600">CLAVI v1.0.0</p>
          <p className="text-xs text-gray-500 mt-1">© 2026 CLAVI</p>
        </div>
      </div>
    </div>
  )
}
