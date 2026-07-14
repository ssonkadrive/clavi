import { getSession } from '@/lib/auth/getSession'
import { getSkillCategoriesTree } from '@/app/actions/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SkillsTree from '@/app/admin/components/SkillsTree'

export default async function AdminSkillsPage() {
  const session = await getSession()

  console.log('[AdminSkillsPage] 권한 확인:', {
    hasSession: !!session,
    userId: session?.userId,
    superAdminId: process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,
    isAdmin: session?.userId === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,
  })

  // 슈퍼어드민 권한 확인
  if (!session || session.userId !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
    console.log('[AdminSkillsPage] 권한 없음 - 리다이렉트')
    redirect('/')
  }

  console.log('[AdminSkillsPage] 권한 확인 완료 - 트리 조회 시작')
  const tree = await getSkillCategoriesTree()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 과목 관리</h1>
            <p className="text-sm text-gray-600 mt-1">과목 카테고리 생성/수정/삭제</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <SkillsTree initialTree={tree} />
        </div>
      </div>
    </div>
  )
}
