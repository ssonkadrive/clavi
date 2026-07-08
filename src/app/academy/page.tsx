import { getAcademyDashboardData } from './dashboard/actions'

export default async function AcademyHomePage() {
  const result = await getAcademyDashboardData()

  const stats = result.data?.stats || {
    instructorsViewed: 0,
    proposalsSent: 0,
    proposalsAccepted: 0,
  }

  return (
    <div className="p-4 space-y-6">
      {/* 헤더 */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">채용 대시보드</h1>
        <p className="text-gray-600 text-sm mt-1">오늘의 활동을 확인하세요</p>
      </div>

      {/* 통계 3개 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 검색수 */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">검색 수</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats.instructorsViewed}
          </p>
        </div>

        {/* 제안수 */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">제안 수</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {stats.proposalsSent}
          </p>
        </div>

        {/* 채용수 */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-xs font-medium">채용 수</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {stats.proposalsAccepted}
          </p>
        </div>
      </div>

      {/* 최근 활동 미리보기 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-bold text-gray-900 mb-3">최근 제안</h2>
        {result.data?.recentProposals && result.data.recentProposals.length > 0 ? (
          <div className="space-y-2">
            {result.data.recentProposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {proposal.instructor_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(proposal.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    proposal.status === '수락'
                      ? 'bg-green-100 text-green-700'
                      : proposal.status === '진행중'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {proposal.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            아직 제안 내역이 없습니다
          </p>
        )}
      </div>
    </div>
  )
}
