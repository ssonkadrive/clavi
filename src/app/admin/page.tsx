import { getSession } from '@/lib/auth/getSession'
import { getUserStats } from '@/app/actions/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await getSession()

  console.log('[AdminPage] 권한 확인:', {
    hasSession: !!session,
    userId: session?.userId,
    superAdminId: process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,
    isAdmin: session?.userId === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,
  })

  // 슈퍼어드민 권한 확인
  if (!session || session.userId !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
    console.log('[AdminPage] 권한 없음 - 리다이렉트')
    redirect('/')
  }

  console.log('[AdminPage] 권한 확인 완료 - 통계 조회 시작')
  const stats = await getUserStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ 슈퍼어드민 대시보드</h1>
            <p className="text-sm text-gray-600 mt-1">관리자 전용 시스템</p>
          </div>
          <Link
            href="/academy"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 원장 수 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600 text-sm font-medium">원장 회원 수</p>
            <p className="text-4xl font-bold text-blue-600 mt-4">
              {stats.academyCount}
            </p>
          </div>

          {/* 강사 수 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600 text-sm font-medium">강사 회원 수</p>
            <p className="text-4xl font-bold text-green-600 mt-4">
              {stats.instructorCount}
            </p>
          </div>

          {/* 과목 수 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600 text-sm font-medium">전체 과목 수</p>
            <p className="text-4xl font-bold text-purple-600 mt-4">
              {stats.skillCount}
            </p>
          </div>
        </div>

        {/* 관리 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">관리 기능</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* 과목 관리 */}
            <Link
              href="/admin/skills"
              className="p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">📚 과목 관리</h3>
              <p className="text-sm text-gray-600 mt-2">
                과목 카테고리 추가/수정/삭제
              </p>
            </Link>

            {/* 회원 관리 */}
            <Link
              href="/admin/users"
              className="p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">👥 회원 관리</h3>
              <p className="text-sm text-gray-600 mt-2">
                원장 및 강사 회원 조회
              </p>
            </Link>
          </div>
        </div>

        {/* 현재 사용자 정보 */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">현재 사용자</h3>
          <p className="text-sm text-gray-600 font-mono">{session.userId}</p>
        </div>
      </div>
    </div>
  )
}
