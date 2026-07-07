import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'

interface MatchedAcademy {
  user_id: string
  academy_name: string
  region: string
}

export default async function MatchesPage() {
  console.log('[MatchesPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[MatchesPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[MatchesPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session.role !== 'instructor') {
    console.log('[MatchesPage] role 확인 실패:', session.role)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">강사만 접근 가능합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  console.log('[MatchesPage] Supabase 클라이언트 생성 완료')

  // 2. 로그인한 강사의 selected_skills 조회
  console.log('[MatchesPage] instructor_conditions 조회 시작:', session.userId)
  const { data: instructorConditions, error: condError } = await supabase
    .from('instructor_conditions')
    .select('selected_skills')
    .eq('user_id', session.userId)
    .single()

  console.log('[MatchesPage] instructor_conditions 조회 결과:', {
    hasData: !!instructorConditions,
    error: condError,
    data: instructorConditions,
  })

  if (condError) {
    console.error('[MatchesPage] instructor_conditions 쿼리 에러:', condError.message, condError.details)
  }

  if (condError || !instructorConditions || !instructorConditions.selected_skills) {
    console.error('[MatchesPage] instructor_conditions 체크 실패:', {
      hasError: !!condError,
      hasData: !!instructorConditions,
      hasSkills: !!instructorConditions?.selected_skills,
    })
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 학원이 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedSkills = instructorConditions.selected_skills as string[]
  console.log('[MatchesPage] selectedSkills 상세:', {
    개수: selectedSkills.length,
    배열: selectedSkills,
    타입: typeof selectedSkills[0],
  })

  // 3-1. academy_conditions에서 required_skills가 겹치는 academy의 user_id 목록 조회
  console.log('[MatchesPage] academy_conditions overlaps 쿼리 시작')
  console.log('[MatchesPage] overlaps 쿼리 조건:', {
    테이블: 'academy_conditions',
    필드: 'required_skills',
    비교할배열: selectedSkills,
  })

  const { data: academyConditionsData, error: conditionsError } = await supabase
    .from('academy_conditions')
    .select('user_id, required_skills')
    .overlaps('required_skills', selectedSkills)

  console.log('[MatchesPage] academy_conditions 조회 결과 상세:', {
    매칭된행개수: academyConditionsData?.length,
    실제데이터: academyConditionsData,
    error: conditionsError?.message,
  })

  if (conditionsError) {
    console.error('[MatchesPage] academy_conditions 쿼리 에러:', conditionsError.message, conditionsError.details)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">매칭 정보를 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3-2. academy_conditions에서 뽑은 user_id 목록이 비어있으면 매칭 없음
  if (!academyConditionsData || academyConditionsData.length === 0) {
    console.log('[MatchesPage] 매칭되는 academy_conditions 없음')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 학원이 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3-3. user_id 목록 추출
  const academyUserIds = academyConditionsData.map((row: any) => row.user_id)
  console.log('[MatchesPage] academyUserIds:', academyUserIds)

  // 3-4. academies 테이블을 user_id 목록으로 조회
  console.log('[MatchesPage] academies 조회 시작:', {
    조회할_user_ids: academyUserIds,
    쿼리: '.in("user_id", academyUserIds)',
  })
  const { data: academiesData, error: academiesError } = await supabase
    .from('academies')
    .select('user_id, academy_name, region')
    .in('user_id', academyUserIds)

  console.log('[MatchesPage] academies 조회 결과 상세:', {
    조회된행개수: academiesData?.length,
    실제데이터: academiesData,
    에러: academiesError?.message,
  })

  if (academiesError) {
    console.error('[MatchesPage] academies 쿼리 에러:', academiesError.message, academiesError.details)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">매칭 정보를 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 4. academiesData를 MatchedAcademy[] 형태로 변환
  const matches: MatchedAcademy[] = (academiesData || [])
    .map((academy: any) => ({
      user_id: academy.user_id,
      academy_name: academy.academy_name,
      region: academy.region,
    }))
    .filter(
      (academy, index, self) =>
        self.findIndex((a) => a.user_id === academy.user_id) === index
    )

  console.log('[MatchesPage] 최종 matches 배열:', {
    개수: matches.length,
    데이터: matches,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">매칭 목록</h1>

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">아직 매칭 가능한 학원이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((academy) => (
              <div
                key={academy.user_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {academy.academy_name}
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">지역:</span> {academy.region}
                  </p>
                </div>
                <Link
                  href={`/matches/${academy.user_id}`}
                  className="mt-4 w-full inline-block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  자세히 보기
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
