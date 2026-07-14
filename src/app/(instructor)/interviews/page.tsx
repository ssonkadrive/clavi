import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import InterviewResponseButton from './InterviewResponseButton'
import Link from 'next/link'

interface InterviewProposal {
  id: string
  academy_name: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
}

export default async function InterviewsPage() {
  console.log('[InterviewsPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[InterviewsPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[InterviewsPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">받은 면접 제안</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'instructor') {
    console.log('[InterviewsPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">받은 면접 제안</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  console.log('[InterviewsPage] Supabase 클라이언트 생성 완료')

  // 2. interview_proposals에서 강사가 받은 제안 조회
  console.log('[InterviewsPage] interview_proposals 조회 시작:', session.userId)
  const { data: proposalsData, error: proposalsError } = await supabase
    .from('interview_proposals')
    .select('id, academy_user_id, message, status, created_at, responded_at')
    .eq('instructor_user_id', session.userId)
    .order('created_at', { ascending: false })

  console.log('[InterviewsPage] interview_proposals 조회 결과:', {
    개수: proposalsData?.length,
    에러: proposalsError?.message,
  })

  if (proposalsError) {
    console.error('[InterviewsPage] interview_proposals 조회 에러:', proposalsError.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">받은 면접 제안</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">제안 목록을 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!proposalsData || proposalsData.length === 0) {
    console.log('[InterviewsPage] 받은 제안이 없음')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">받은 면접 제안</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">받은 면접 제안이 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3. academy_user_id 목록 추출해서 academies 테이블 조회
  const academyUserIds = (proposalsData || []).map((p: any) => p.academy_user_id)
  console.log('[InterviewsPage] 학원 조회 시작:', academyUserIds)

  const { data: academiesData, error: academiesError } = await supabase
    .from('academies')
    .select('user_id, academy_name')
    .in('user_id', academyUserIds)

  console.log('[InterviewsPage] academies 조회 결과:', {
    개수: academiesData?.length,
    에러: academiesError?.message,
  })

  // 4. 최종 데이터 조합
  const proposals: InterviewProposal[] = (proposalsData || [])
    .map((proposal: any) => {
      const academy = academiesData?.find((a: any) => a.user_id === proposal.academy_user_id)
      return {
        id: proposal.id,
        academy_name: academy?.academy_name || '알 수 없는 학원',
        message: proposal.message,
        status: proposal.status,
        created_at: proposal.created_at,
        responded_at: proposal.responded_at,
      }
    })

  console.log('[InterviewsPage] 최종 proposals:', proposals.length + '개')

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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">받은 면접 제안</h1>

        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <Link
                href={`/interviews/${proposal.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{proposal.academy_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">제안일: {formatDate(proposal.created_at)}</p>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>

                <div className="space-y-3 mb-4">
                  {proposal.message && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">메시지:</span>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">{proposal.message}</p>
                    </div>
                  )}
                </div>
              </Link>

              {proposal.status === 'pending' && (
                <div className="flex gap-3 p-6 pt-4 border-t">
                  <InterviewResponseButton
                    proposalId={proposal.id}
                    action="accepted"
                    label="수락"
                  />
                  <InterviewResponseButton
                    proposalId={proposal.id}
                    action="declined"
                    label="거절"
                  />
                </div>
              )}

              {proposal.status !== 'pending' && proposal.responded_at && (
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
