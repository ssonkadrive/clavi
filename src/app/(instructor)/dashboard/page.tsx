import { getInstructorDashboardData } from './actions'
import ProposalsChart from './ProposalsChart'
import Link from 'next/link'

export default async function InstructorDashboardPage() {
  console.log('[InstructorDashboardPage] 페이지 로드')

  const result = await getInstructorDashboardData()

  console.log('[InstructorDashboardPage] result 전체:', result)
  console.log('[InstructorDashboardPage] result.data:', result.data)
  console.log('[InstructorDashboardPage] result.error:', result.error)

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 대시보드</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{result.error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 대시보드</h1>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-700">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const { stats, chartData } = result.data

  // 카드 컴포넌트 헬퍼
  interface StatCardProps {
    label: string
    value: string | number
    icon?: string
    color: 'blue' | 'green' | 'purple' | 'orange'
  }

  const StatCard = ({ label, value, color }: StatCardProps) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
    }

    return (
      <div className={`${colorMap[color]} rounded-lg p-6 shadow hover:shadow-lg transition-shadow`}>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-3xl font-bold mt-3">{value}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">강사 대시보드</h1>
          <p className="text-gray-600 mt-2">당신의 활동 통계를 확인하세요</p>
        </div>

        {/* 4개 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="프로필 조회수" value={stats.profileViews} color="blue" />
          <StatCard label="받은 제안 수" value={stats.proposalsReceived} color="green" />
          <StatCard label="수락률" value={`${stats.acceptanceRate}%`} color="purple" />
          <StatCard label="채팅 건수" value={stats.messagesCount} color="orange" />
        </div>

        {/* 차트 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">지난 7일 제안 추이</h2>
          <ProposalsChart data={chartData} />
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            프로필 보기
          </Link>
          <Link
            href="/interviews"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            면접 제안
          </Link>
          <Link
            href="/matches"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            학원 매칭
          </Link>
        </div>
      </div>
    </div>
  )
}
