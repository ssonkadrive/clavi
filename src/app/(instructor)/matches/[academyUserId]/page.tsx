import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import { generateStrengthMessage } from '@/lib/utils/generateStrengthMessage'
import InterviewResponseButton from '@/app/(instructor)/components/InterviewResponseButton'
import SelectInterviewTimeModal from '@/app/(instructor)/components/SelectInterviewTimeModal'

// weekdays 코드를 한글로 변환
const getWeekdaysLabel = (code: string): string => {
  const weekdaysMap: Record<string, string> = {
    all: '요일 무관',
    weekdays: '평일만',
    weekends: '주말만',
  }
  return weekdaysMap[code] || code
}

export default async function AcademyDetailPage({
  params,
}: {
  params: Promise<{ academyUserId: string }>
}) {
  const { academyUserId } = await params
  console.log('[AcademyDetailPage] 페이지 로드 시작, academyUserId:', academyUserId)

  // 1. 세션 확인
  const session = await getSession()
  console.log('[AcademyDetailPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[AcademyDetailPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">학원 상세 정보</h1>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'instructor') {
    console.log('[AcademyDetailPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">학원 상세 정보</h1>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // 2. academies 테이블에서 학원 정보 조회
  console.log('[AcademyDetailPage] academies 조회 시작')
  const { data: academyData, error: academyError } = await supabase
    .from('academies')
    .select('user_id, academy_name, region')
    .eq('user_id', academyUserId)
    .maybeSingle()

  console.log('[AcademyDetailPage] academies 조회 결과:', {
    hasData: !!academyData,
    error: academyError,
  })

  // academyData가 없을 수 있지만, proposalData는 계속 조회

  // 3. interview_proposals에서 이 학원과의 제안 조회 (proposalId 가져오기)
  console.log('[DEBUG] session.userId:', session.userId)
  console.log('[DEBUG] academyUserId:', academyUserId)
  console.log('[AcademyDetailPage] interview_proposals 조회 시작')
  const { data: proposalData, error: proposalError } = await supabase
    .from('interview_proposals')
    .select('id, status, responded_at, proposed_date, proposed_time_range_start, proposed_time_range_end, interview_slot_minutes, interview_date, interview_time')
    .eq('academy_user_id', academyUserId)
    .eq('instructor_user_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log('[AcademyDetailPage] interview_proposals 조회 결과:', {
    found: !!proposalData,
    status: proposalData?.status,
    responded_at: proposalData?.responded_at,
    error: proposalError,
  })

  const proposalId = proposalData?.id

  // 4. 강사의 selected_skills 조회
  console.log('[AcademyDetailPage] instructor_conditions 조회 시작')
  const { data: instructorConditions, error: instructorCondError } = await supabase
    .from('instructor_conditions')
    .select('selected_skills')
    .eq('user_id', session.userId)
    .single()

  if (instructorCondError) {
    console.error('[AcademyDetailPage] instructor_conditions 조회 실패:', instructorCondError)
  }

  const selectedSkills = instructorConditions?.selected_skills || []
  console.log('[AcademyDetailPage] selectedSkills:', selectedSkills)

  // 5. academy_conditions에서 조건 정보 조회 (academyData가 있을 때만)
  console.log('[AcademyDetailPage] academy_conditions 조회 시작')
  let conditionsData = null
  let conditionsError = null

  if (academyData) {
    const result = await supabase
      .from('academy_conditions')
      .select('required_skills, weekdays, pay_max, description')
      .eq('user_id', academyData.user_id)
      .single()

    conditionsData = result.data
    conditionsError = result.error

    console.log('[AcademyDetailPage] academy_conditions 조회 결과:', {
      hasData: !!conditionsData,
      error: conditionsError,
      requiredSkills: conditionsData?.required_skills,
    })
  } else {
    console.log('[AcademyDetailPage] academyData가 없어 academy_conditions 조회 스킵')
  }

  // 5-1. 강사의 모든 역량에 대해 skill_names 조회 (학원 조건 무관)
  // 중요: selectedSkills 기반으로만 조회하여 CMS 정보 노출 방지
  let skillNames: Record<string, string> = {}
  if (selectedSkills && Array.isArray(selectedSkills) && selectedSkills.length > 0) {
    console.log('[AcademyDetailPage] 강사 역량 skill_categories 조회 시작, selectedSkills:', selectedSkills)
    const { data: skillsData, error: skillsError } = await supabase
      .from('skill_categories')
      .select('id, name')
      .in('id', selectedSkills)

    console.log('[AcademyDetailPage] 강사 역량 skill_categories 조회 결과:', {
      count: skillsData?.length,
      error: skillsError,
      skillNames: skillsData?.map(s => ({ id: s.id, name: s.name })),
    })

    if (skillsData) {
      skillNames = Object.fromEntries(skillsData.map(s => [s.id, s.name]))
      console.log('[AcademyDetailPage] 최종 skillNames (학원 조건 제외):', skillNames)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/matches"
          className="text-blue-500 hover:text-blue-600 mb-8 inline-block font-medium"
        >
          ← 매칭 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {academyData?.academy_name || '학원 정보'}
          </h1>

          {/* 학원 정보가 없을 때 안내 */}
          {!academyData && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                학원 정보를 불러올 수 없습니다. 제안 정보는 아래에서 확인하실 수 있습니다.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-6">
            {/* 지역 - 데이터 있을 때만 표시 */}
            {academyData?.region && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">지역</h3>
                <p className="text-sm text-gray-700">{academyData.region}</p>
              </div>
            )}

            {/* 역량 메시지 (학원 조건 절대 노출 금지) */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">당신의 역량</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  {generateStrengthMessage(selectedSkills, skillNames)}
                </p>
              </div>
            </div>

            {/* 근무 요일 */}
            {conditionsData?.weekdays && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">근무 요일</h3>
                <p className="text-sm text-gray-700">{getWeekdaysLabel(conditionsData.weekdays)}</p>
              </div>
            )}

            {/* 설명 */}
            {conditionsData?.description && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">학원 소개</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{conditionsData.description}</p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t pt-8">
            {/* 제안이 있고 아직 응답하지 않았을 때 - 수락/거절 버튼 */}
            {proposalId && !proposalData?.responded_at ? (
              <InterviewResponseButton
                proposalId={proposalId}
                instructorUserId={session.userId}
                academyName={academyData?.academy_name || '학원'}
              />
            ) : null}

            {/* 제안이 수락되고 시간대 제안이 있을 때 - 면접 시간 선택 버튼 */}
            {proposalId &&
            proposalData?.status === 'accepted' &&
            proposalData?.proposed_date &&
            proposalData?.proposed_time_range_start &&
            proposalData?.proposed_time_range_end ? (
              <SelectInterviewTimeModal
                proposalId={proposalId}
                proposedDate={proposalData.proposed_date}
                timeRangeStart={proposalData.proposed_time_range_start}
                timeRangeEnd={proposalData.proposed_time_range_end}
                slotMinutes={proposalData.interview_slot_minutes || 60}
                interviewDate={proposalData.interview_date}
                interviewTime={proposalData.interview_time}
              />
            ) : null}

            {/* 기본 버튼 */}
            <div className="mt-6">
              <Link
                href="/matches"
                className="inline-block bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
