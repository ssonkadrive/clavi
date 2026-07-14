import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import ProposeInterviewTimeModal from '@/app/academy/components/ProposeInterviewTimeModal'

interface InterviewProposalDetail {
  id: string
  instructor_name: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
}

interface InstructorSkill {
  name: string
  level: string
}

export default async function AcademyProposalDetailPage({
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

  if (session.role !== 'academy') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학원만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  console.log('[AcademyProposalDetailPage] 제안 조회 시작:', { proposalId, academyId: session.userId })

  // 2. interview_proposals에서 제안 조회
  const { data: proposalData, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, instructor_user_id, status, created_at, responded_at')
    .eq('academy_user_id', session.userId)
    .eq('id', proposalId)
    .single()

  console.log('[AcademyProposalDetailPage] 제안 조회 결과:', {
    found: !!proposalData,
    error: proposalError?.message,
  })

  if (proposalError || !proposalData) {
    console.error('[AcademyProposalDetailPage] 제안 조회 실패:', proposalError?.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">제안을 찾을 수 없습니다.</p>
          </div>
          <Link
            href="/academy/proposals"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 3. instructor_profiles 테이블에서 강사 이름 조회
  console.log('[AcademyProposalDetailPage] 강사 프로필 조회 시작:', proposalData.instructor_user_id)
  const { data: profileData, error: profileError } = await supabase
    .from('instructor_profiles')
    .select('user_id, name')
    .eq('user_id', proposalData.instructor_user_id)
    .single()

  if (profileError) {
    console.error('[AcademyProposalDetailPage] 강사 프로필 조회 실패:', profileError.message)
  } else {
    console.log('[AcademyProposalDetailPage] 강사 프로필 조회 성공')
  }

  const instructorName = profileData?.name || '알 수 없는 강사'

  // 4. 강사의 선택된 스킬 조회
  const { data: instructorConditions } = await supabase
    .from('instructor_conditions')
    .select('selected_skills')
    .eq('user_id', proposalData.instructor_user_id)
    .single()

  const selectedSkillIds = instructorConditions?.selected_skills || []

  // 5. 모든 스킬 카테고리 조회
  const { data: allSkills } = await supabase
    .from('skill_categories')
    .select('id, parent_id, level, name')
    .eq('is_active', true)

  // 강사의 스킬 정보 구성
  const skillMap = new Map(allSkills?.map(s => [s.id, s]) || [])
  const instructorSkills: InstructorSkill[] = selectedSkillIds
    .map((skillId: string) => {
      const skill = skillMap.get(skillId)
      if (!skill) return null
      return {
        name: skill.name,
        level: skill.level,
      }
    })
    .filter(Boolean)

  // 6. 최종 데이터
  const proposal: InterviewProposalDetail = {
    id: proposalData.id,
    instructor_name: instructorName,
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

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'major':
        return '대분류'
      case 'middle':
        return '중분류'
      case 'minor':
        return '소분류'
      default:
        return level
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 제안 상세보기</h1>

        <div className="bg-white rounded-lg shadow p-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{proposal.instructor_name}</h2>
              <p className="text-sm text-gray-600 mt-2">제안일: {formatDate(proposal.created_at)}</p>
            </div>
            {getStatusBadge(proposal.status)}
          </div>

          {/* 역량 정보 */}
          {instructorSkills.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">강사 역량</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instructorSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span className="text-xs font-semibold text-blue-600 bg-white rounded px-2 py-1">
                      {getLevelLabel(skill.level)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 면접 정보 */}
          <div className="space-y-6 mb-8">

            {proposal.status !== 'pending' && proposal.responded_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  강사의 응답 시간: {formatDateTime(proposal.responded_at)}
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-4 pt-6 border-t">
            {proposal.status === 'accepted' && (
              <ProposeInterviewTimeModal
                proposalId={proposal.id}
                instructorName={proposal.instructor_name}
              />
            )}

            <div className="flex gap-4">
              <Link
                href={`/academy/proposals/${proposal.id}/messages`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors text-center font-medium"
              >
                메시지 보내기
              </Link>
              <Link
                href="/academy/proposals"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-md transition-colors text-center font-medium"
              >
                돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
