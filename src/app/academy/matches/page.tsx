import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import InterviewProposalModal from './InterviewProposalModal'

interface MatchedInstructor {
  user_id: string
  name: string
  email: string
}

export default async function AcademyMatchesPage() {
  console.log('[AcademyMatchesPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[AcademyMatchesPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[AcademyMatchesPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'academy') {
    console.log('[AcademyMatchesPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학원만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  console.log('[AcademyMatchesPage] Supabase 클라이언트 생성 완료')

  // 2. 로그인한 학원의 required_skills 조회
  console.log('[AcademyMatchesPage] academy_conditions 조회 시작:', session.userId)
  const { data: academyConditions, error: condError } = await supabase
    .from('academy_conditions')
    .select('required_skills')
    .eq('user_id', session.userId)
    .single()

  console.log('[AcademyMatchesPage] academy_conditions 조회 결과:', {
    hasData: !!academyConditions,
    error: condError,
    required_skills: academyConditions?.required_skills,
    required_skills_type: typeof academyConditions?.required_skills,
    required_skills_isArray: Array.isArray(academyConditions?.required_skills),
  })

  if (condError) {
    console.error('[AcademyMatchesPage] academy_conditions 쿼리 에러:', condError.message, condError.details)
  }

  if (condError || !academyConditions || !academyConditions.required_skills) {
    console.error('[AcademyMatchesPage] academy_conditions 체크 실패:', {
      hasError: !!condError,
      hasData: !!academyConditions,
      hasSkills: !!academyConditions?.required_skills,
    })
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 강사가 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const requiredSkills = academyConditions.required_skills as string[]
  console.log('[AcademyMatchesPage] requiredSkills 상세:', {
    개수: requiredSkills.length,
    배열: requiredSkills,
    타입: typeof requiredSkills[0],
  })
  console.log('[DEBUG] required_skills 값 확인:', JSON.stringify(requiredSkills))

  // 3-0. DEBUG: 모든 instructor_conditions 데이터를 먼저 조회해서 형식 확인
  console.log('[AcademyMatchesPage] DEBUG: 모든 instructor_conditions 조회')
  const { data: allInstructorConditions, error: allCondError } = await supabase
    .from('instructor_conditions')
    .select('user_id, selected_skills')

  console.log('[AcademyMatchesPage] 모든 instructor_conditions:', {
    개수: allInstructorConditions?.length,
    데이터: JSON.stringify(allInstructorConditions?.slice(0, 3)),
    에러: allCondError?.message,
  })

  // 3-1. instructor_conditions에서 selected_skills가 겹치는 강사의 user_id 목록 조회
  console.log('[AcademyMatchesPage] instructor_conditions overlaps 쿼리 시작')
  console.log('[AcademyMatchesPage] overlaps 조건:', {
    테이블: 'instructor_conditions',
    필드: 'selected_skills',
    비교할_required_skills: requiredSkills,
    비교할_타입: typeof requiredSkills[0],
  })
  const { data: instructorConditionsData, error: conditionsError } = await supabase
    .from('instructor_conditions')
    .select('user_id, selected_skills')
    .overlaps('selected_skills', requiredSkills)

  console.log('[AcademyMatchesPage] instructor_conditions 조회 결과 상세:', {
    매칭된행개수: instructorConditionsData?.length,
    실제데이터: instructorConditionsData ? JSON.stringify(instructorConditionsData) : null,
    error: conditionsError?.message,
    error_details: conditionsError?.details,
  })

  if (conditionsError) {
    console.error('[AcademyMatchesPage] instructor_conditions 쿼리 에러:', conditionsError.message, conditionsError.details)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사 정보를 불러오는 데 실패했습니다.</p>
            <p className="text-sm text-red-700 mt-2">{conditionsError.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // 3-2. instructor_conditions에서 뽑은 user_id 목록이 비어있으면 매칭 없음
  if (!instructorConditionsData || instructorConditionsData.length === 0) {
    console.log('[AcademyMatchesPage] 매칭되는 instructor_conditions 없음')
    console.log('[DEBUG] instructorConditionsData:', instructorConditionsData)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 강사가 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3-3. user_id 목록 추출
  const instructorUserIds = instructorConditionsData.map((row: any) => row.user_id)
  console.log('[AcademyMatchesPage] instructorUserIds:', instructorUserIds)
  console.log('[DEBUG] instructorConditionsData 상세:', JSON.stringify(instructorConditionsData))

  // 3-4. instructor_profiles 테이블에서 강사 정보 조회
  console.log('[AcademyMatchesPage] instructor_profiles 조회 시작', {
    조회할_user_ids: instructorUserIds,
  })
  const { data: profilesData, error: profilesError } = await supabase
    .from('instructor_profiles')
    .select('user_id, name')
    .in('user_id', instructorUserIds)

  console.log('[AcademyMatchesPage] instructor_profiles 조회 결과:', {
    조회된행개수: profilesData?.length,
    실제데이터: profilesData ? JSON.stringify(profilesData) : null,
    에러: profilesError?.message,
    에러_details: profilesError?.details,
  })

  if (profilesError) {
    console.error('[AcademyMatchesPage] instructor_profiles 쿼리 에러:', profilesError.message, profilesError.details)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사 정보를 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 4. 최종 데이터 조합 (instructor_profiles만 사용)
  console.log('[AcademyMatchesPage] 최종 조합 시작', {
    profilesData_length: profilesData?.length,
  })

  const matches: MatchedInstructor[] = (profilesData || [])
    .map((profile: any) => {
      const match = {
        user_id: profile.user_id,
        name: profile.name || '미등록 강사',
        email: `instructor_${profile.user_id.substring(0, 8)}`,
      }
      console.log('[AcademyMatchesPage] 강사 매핑:', {
        user_id: profile.user_id,
        name: profile.name,
        final_name: match.name,
        email: match.email,
      })
      return match
    })
    .filter(
      (instructor, index, self) =>
        self.findIndex((a) => a.user_id === instructor.user_id) === index
    )

  console.log('[AcademyMatchesPage] 최종 matches 배열:', {
    개수: matches.length,
    데이터: JSON.stringify(matches),
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 매칭 목록</h1>

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 강사가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((instructor) => (
              <div
                key={instructor.user_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {instructor.name}
                </h2>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">이메일:</span> {instructor.email}
                  </p>
                </div>
                <InterviewProposalModal
                  instructorUserId={instructor.user_id}
                  instructorName={instructor.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
