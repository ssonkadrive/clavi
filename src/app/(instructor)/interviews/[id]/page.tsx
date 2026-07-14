import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'

interface InterviewProposalDetail {
  id: string
  academy_name: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: proposalId } = await params

  // 1. 세션 확인
  const session = await getSession()

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'instructor') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  console.log('[InterviewDetailPage] 제안 조회 시작:', { proposalId, instructorId: session.userId })

  // 2. interview_proposals에서 제안 조회 (instructor_user_id 필터 포함)
  const { data: proposalData, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, academy_user_id, message, status, created_at, responded_at, instructor_user_id')
    .eq('instructor_user_id', session.userId)
    .eq('id', proposalId)
    .single()

  console.log('[InterviewDetailPage] 제안 조회 결과:', {
    found: !!proposalData,
    error: proposalError?.message,
  })

  if (proposalError || !proposalData) {
    console.error('[InterviewDetailPage] 제안 조회 실패:', proposalError?.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">제안을 찾을 수 없습니다.</p>
          </div>
          <Link
            href="/interviews"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 3. academies 테이블에서 학원 정보 조회
  console.log('[InterviewDetailPage] 학원 정보 조회 시작:', proposalData.academy_user_id)
  const { data: academyData, error: academyError } = await supabase
    .from('academies')
    .select('user_id, academy_name')
    .eq('user_id', proposalData.academy_user_id)
    .single()

  console.log('[InterviewDetailPage] 학원 정보 조회 결과:', {
    found: !!academyData,
    error: academyError?.message,
  })

  const academyName = academyData?.academy_name || '알 수 없는 학원'

  // 4. 최종 데이터
  const proposal: InterviewProposalDetail = {
    id: proposalData.id,
    academy_name: academyName,
    message: proposalData.message,
    status: proposalData.status,
    created_at: proposalData.created_at,
    responded_at: proposalData.responded_at,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">대기중</span>
      case 'accepted':
        return <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">수락함</span>
      case 'declined':
        return <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">거절함</span>
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ko-KR')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>

        <div className="bg-white rounded-lg shadow p-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{proposal.academy_name}</h2>
              <p className="text-sm text-gray-600 mt-2">제안 접수일: {formatDate(proposal.created_at)}</p>
            </div>
            {getStatusBadge(proposal.status)}
          </div>

          {/* 상세 정보 */}
          <div className="space-y-6 mb-8">
            {proposal.message && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메시지</label>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.message}</p>
                </div>
              </div>
            )}

            {proposal.status !== 'pending' && proposal.responded_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  응답 시간: {formatDateTime(proposal.responded_at)}
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4 pt-6 border-t">
            <Link
              href={`/interviews/${proposal.id}/messages`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors text-center font-medium"
            >
              메시지 보내기
            </Link>
            <Link
              href="/interviews"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-md transition-colors text-center font-medium"
            >
              돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
