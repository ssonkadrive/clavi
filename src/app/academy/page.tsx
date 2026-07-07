import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function AcademyPage() {
  console.log('[AcademyPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[AcademyPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[AcademyPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 대시보드</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'academy') {
    console.log('[AcademyPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 대시보드</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학원만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // 2. 학원 정보 조회
  console.log('[AcademyPage] 학원 정보 조회:', session.userId)
  const { data: academy, error: academyError } = await supabase
    .from('academies')
    .select('user_id, academy_name, region')
    .eq('user_id', session.userId)
    .single()

  console.log('[AcademyPage] 학원 정보 조회 결과:', {
    found: !!academy,
    error: academyError?.message,
  })

  if (academyError || !academy) {
    console.error('[AcademyPage] 학원 정보 조회 실패:', academyError?.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 대시보드</h1>
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">학원 정보를 불러올 수 없습니다.</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">학원 대시보드</h1>
          <p className="mt-2 text-gray-600">학원 정보 및 채용 관리 센터</p>
        </div>

        {/* 학원 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">{academy.academy_name}</h2>
            {academy.region && (
              <p className="text-sm text-gray-600 mt-2">
                지역: {academy.region}
              </p>
            )}
          </div>

          {/* 통계 영역 (추후 확장) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">받은 면접 요청</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">수락한 강사</p>
              <p className="text-2xl font-bold text-green-600 mt-2">0</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">진행 중인 채용</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">0</p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Link
              href="/academy/proposals"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors text-center font-medium"
            >
              면접 제안 인박스
            </Link>
            <Link
              href="/academy/prospects"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors text-center font-medium"
            >
              면접 본 강사들 (CMS 순)
            </Link>
            <Link
              href="/academy/conditions"
              className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors text-center font-medium"
            >
              채용 조건 설정
            </Link>
            <Link
              href="/academy/dashboard"
              className="block w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors text-center font-medium"
            >
              📊 통계 대시보드
            </Link>
            <Link
              href="/academy/profile"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-lg transition-colors text-center font-medium"
            >
              프로필 관리
            </Link>
            <LogoutButton className="w-full" />
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 강사와의 면접을 예약하려면 "면접 제안 보내기" 버튼을 클릭하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
