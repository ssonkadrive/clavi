import { getAcademyDashboardData } from './actions'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ label, value, color }: StatCardProps) {
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

function getStatusBadge(status: string) {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기중' },
    accepted: { bg: 'bg-green-100', text: 'text-green-800', label: '수락함' },
    declined: { bg: 'bg-red-100', text: 'text-red-800', label: '거절함' },
  }

  const s = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
  return <span className={`inline-block ${s.bg} ${s.text} px-3 py-1 rounded-full text-sm font-medium`}>{s.label}</span>
}

export default async function AcademyDashboardPage() {
  console.log('[AcademyDashboardPage] 페이지 로드')

  const result = await getAcademyDashboardData()

  console.log('[AcademyDashboardPage] result 전체:', result)
  console.log('[AcademyDashboardPage] result.data:', result.data)
  console.log('[AcademyDashboardPage] result.error:', result.error)

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 대시보드</h1>
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 대시보드</h1>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-700">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const { stats, recentProposals } = result.data
  const acceptanceRate = stats.proposalsSent > 0 ? Math.round((stats.proposalsAccepted / stats.proposalsSent) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">학원 대시보드</h1>
          <p className="text-gray-600 mt-2">채용 통계 및 최근 제안 현황을 확인하세요</p>
        </div>

        {/* 4개 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="강사 검색 수" value={stats.instructorsViewed} color="blue" />
          <StatCard label="면접 제안 건수" value={stats.proposalsSent} color="green" />
          <StatCard label="수락률" value={`${acceptanceRate}%`} color="purple" />
          <StatCard label="평균 매칭 시간" value={`${stats.avgMatchingDays}일`} color="orange" />
        </div>

        {/* 최근 제안 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">최근 제안 현황</h2>
          </div>

          {recentProposals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      강사명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      제안일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      소요시간
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <Link href={`/academy/proposals/${proposal.id}`} className="text-blue-600 hover:text-blue-700 underline">
                          {proposal.instructor_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(proposal.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(proposal.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {proposal.daysToAccept !== undefined ? `${proposal.daysToAccept}일` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">최근 제안이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex gap-3 flex-wrap">
          <Link
            href="/academy"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            대시보드 홈
          </Link>
          <Link
            href="/academy/proposals"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            제안 인박스
          </Link>
          <Link
            href="/academy/prospects"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            면접 본 강사
          </Link>
          <Link
            href="/academy/instructors"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            강사 검색
          </Link>
        </div>
      </div>
    </div>
  )
}
