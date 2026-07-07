import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'

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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 상세 정보</h1>
          <div className="rounded-md bg-red-50 p-4">
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 상세 정보</h1>
          <div className="rounded-md bg-red-50 p-4">
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
    .single()

  console.log('[AcademyDetailPage] academies 조회 결과:', {
    hasData: !!academyData,
    error: academyError,
  })

  if (academyError || !academyData) {
    console.error('[AcademyDetailPage] 학원 정보 조회 실패:', academyError?.message)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/matches"
            className="text-blue-600 hover:text-blue-700 mb-8 inline-block"
          >
            ← 매칭 목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 상세 정보</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">학원 정보를 불러오는 데 실패했습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 3. academy_conditions에서 조건 정보 조회
  console.log('[AcademyDetailPage] academy_conditions 조회 시작')
  const { data: conditionsData, error: conditionsError } = await supabase
    .from('academy_conditions')
    .select('required_skills, weekdays, pay_max, description')
    .eq('user_id', academyData.user_id)
    .single()

  console.log('[AcademyDetailPage] academy_conditions 조회 결과:', {
    hasData: !!conditionsData,
    error: conditionsError,
    requiredSkills: conditionsData?.required_skills,
  })

  let requiredSkillsNames: string[] = []
  if (conditionsData?.required_skills && Array.isArray(conditionsData.required_skills)) {
    // 4. skill_categories에서 skill 이름 조회
    console.log('[AcademyDetailPage] skill_categories 조회 시작')
    const { data: skillsData, error: skillsError } = await supabase
      .from('skill_categories')
      .select('id, name')
      .in('id', conditionsData.required_skills)

    console.log('[AcademyDetailPage] skill_categories 조회 결과:', {
      count: skillsData?.length,
      error: skillsError,
    })

    if (skillsData) {
      requiredSkillsNames = skillsData.map((skill) => skill.name)
    }
  }

  // 5. 현재 로그인한 강사의 pay_min 조회
  console.log('[AcademyDetailPage] instructor_conditions 조회 시작')
  const { data: instructorConditions, error: instructorError } = await supabase
    .from('instructor_conditions')
    .select('pay_min')
    .eq('user_id', session.userId)
    .single()

  console.log('[AcademyDetailPage] instructor_conditions 조회 결과:', {
    hasData: !!instructorConditions,
    payMin: instructorConditions?.pay_min,
    error: instructorError,
  })

  // 6. 급여 조건 충족 여부 판단
  const paySalaryMet =
    instructorConditions &&
    conditionsData &&
    conditionsData.pay_max &&
    instructorConditions.pay_min <= conditionsData.pay_max

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/matches"
          className="text-blue-600 hover:text-blue-700 mb-8 inline-block"
        >
          ← 매칭 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            {academyData.academy_name}
          </h1>

          <div className="mt-8 space-y-6">
            {/* 지역 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">지역</h2>
              <p className="text-gray-700">{academyData.region}</p>
            </div>

            {/* 필요 과목 */}
            {requiredSkillsNames.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">필요 과목</h2>
                <div className="flex flex-wrap gap-2">
                  {requiredSkillsNames.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 근무 요일 */}
            {conditionsData?.weekdays && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">근무 요일</h2>
                <p className="text-gray-700">{conditionsData.weekdays}</p>
              </div>
            )}

            {/* 급여 조건 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">급여 조건</h2>
              {paySalaryMet ? (
                <p className="text-green-700 font-medium">
                  ✓ 귀하의 희망 급여 조건에 부합하는 학원입니다.
                </p>
              ) : (
                <p className="text-gray-700">급여 조건을 확인하시기 바랍니다.</p>
              )}
            </div>

            {/* 설명 */}
            {conditionsData?.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">학원 소개</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{conditionsData.description}</p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t pt-8">
            <Link
              href="/matches"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
