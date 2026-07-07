import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'

interface InterviewProposal {
  id: string
  instructor_name: string
  proposed_date: string
  proposed_time: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
}

export default async function AcademyProposalsPage() {
  console.log('[AcademyProposalsPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[AcademyProposalsPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[AcademyProposalsPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 인박스</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'academy') {
    console.log('[AcademyProposalsPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 인박스</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학원만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  console.log('[AcademyProposalsPage] Supabase 클라이언트 생성 완료')

  // 2. interview_proposals에서 학원이 보낸 제안 조회
  console.log('[AcademyProposalsPage] interview_proposals 조회 시작:', session.userId)
  const { data: proposalsData, error: proposalsError } = await supabase
    .from('interview_proposals')
    .select('id, instructor_user_id, proposed_date, proposed_time, status, created_at, responded_at')
    .eq('academy_user_id', session.userId)
    .order('created_at', { ascending: false })

  console.log('[AcademyProposalsPage] interview_proposals 조회 결과:', {
    개수: proposalsData?.length,
    에러: proposalsError?.message,
  })

  if (proposalsError) {
    console.error('[AcademyProposalsPage] interview_proposals 조회 에러:', proposalsError.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 인박스</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">제안 목록을 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!proposalsData || proposalsData.length === 0) {
    console.log('[AcademyProposalsPage] 보낸 제안이 없음')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 인박스</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">보낸 면접 제안이 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3. instructor_user_id 목록 추출해서 instructor_profiles 테이블 조회 (강사명 포함)
  const instructorUserIds = (proposalsData || []).map((p: any) => p.instructor_user_id)
  console.log('[AcademyProposalsPage] 강사 조회 시작:', instructorUserIds)

  const { data: instructorProfilesData, error: profilesError } = await supabase
    .from('instructor_profiles')
    .select('user_id, name')
    .in('user_id', instructorUserIds)

  console.log('[AcademyProposalsPage] instructor_profiles 조회 결과:', {
    개수: instructorProfilesData?.length,
    에러: profilesError?.message,
  })

  // 4. 최종 데이터 조합 (instructor_profiles에서 이름 가져오기)
  const proposals: InterviewProposal[] = (proposalsData || [])
    .map((proposal: any) => {
      const instructorProfile = instructorProfilesData?.find((p: any) => p.user_id === proposal.instructor_user_id)
      return {
        id: proposal.id,
        instructor_name: instructorProfile?.name || '알 수 없는 강사',
        proposed_date: proposal.proposed_date,
        proposed_time: proposal.proposed_time,
        status: proposal.status,
        created_at: proposal.created_at,
        responded_at: proposal.responded_at,
      }
    })

  console.log('[AcademyProposalsPage] 최종 proposals:', proposals.length + '개')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">대기중</span>
      case 'accepted':
        return <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">수락함</span>
      case 'declined':
        return <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">거절함</span>
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 인박스</h1>

        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <Link
                href={`/academy/proposals/${proposal.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{proposal.instructor_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">제안일: {formatDate(proposal.created_at)}</p>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">날짜:</span>
                    <span className="text-gray-600">{formatDate(proposal.proposed_date)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">시간:</span>
                    <span className="text-gray-600">{proposal.proposed_time}</span>
                  </div>
                </div>
              </Link>

              {proposal.responded_at && (
                <div className="p-6 pt-4 border-t text-sm text-gray-600">
                  <p>응답 시간: {new Date(proposal.responded_at).toLocaleString('ko-KR')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
