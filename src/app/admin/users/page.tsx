import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminUsersPage() {
  const session = await getSession()

  // 슈퍼어드민 권한 확인
  if (!session || session.userId !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 회원 관리</h1>
            <p className="text-sm text-gray-600 mt-1">원장 및 강사 회원 조회</p>
          </div>
          <Link
            href="/admin"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← 대시보드로
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">곧 구현될 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}
