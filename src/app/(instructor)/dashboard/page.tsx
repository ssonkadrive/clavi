import { getInstructorDashboardData } from './actions'

export default async function InstructorDashboardPage() {
  const result = await getInstructorDashboardData()

  const stats = result.data?.stats || {
    profileViews: 0,
    proposalsReceived: 0,
    acceptanceRate: 0,
    messagesCount: 0,
  }

  return (
    <div className="p-4 space-y-6">
      {/* 헤더 */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">매칭 대시보드</h1>
        <p className="text-gray-600 text-sm mt-1">오늘의 활동을 확인하세요</p>
      </div>

      {/* 통계 3개 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 조회수 */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">조회 수</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats.profileViews}
          </p>
        </div>

        {/* 제안수 */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">제안 수</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {stats.proposalsReceived}
          </p>
        </div>

        {/* 수락률 */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">수락률</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {stats.acceptanceRate}%
          </p>
        </div>
      </div>

    </div>
  )
}
