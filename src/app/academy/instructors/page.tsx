'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { searchInstructors, type InstructorSearchRow } from './actions'
import Link from 'next/link'

function AcademyInstructorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 필터/정렬 값 읽기
  const experienceMin = searchParams.get('experience_min') || '0'
  const sort = searchParams.get('sort') || 'latest'

  const [instructors, setInstructors] = useState<InstructorSearchRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 데이터 로드
  useEffect(() => {
    const loadInstructors = async () => {
      console.log('[AcademyInstructorsPage] 강사 검색:', { experienceMin, sort })
      setIsLoading(true)
      setError('')

      const result = await searchInstructors({
        experience_min: parseInt(experienceMin),
        sort: sort as 'cms_score' | 'latest',
      })

      if (result.error) {
        console.error('[AcademyInstructorsPage] 검색 실패:', result.error)
        setError(result.error)
      } else {
        console.log('[AcademyInstructorsPage] 검색 성공:', result.data?.length)
        setInstructors(result.data || [])
      }

      setIsLoading(false)
    }

    loadInstructors()
  }, [experienceMin, sort])

  // 필터/정렬 변경 핸들러
  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    router.push(`/academy/instructors?experience_min=${value}&sort=${sort}`)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    router.push(`/academy/instructors?experience_min=${experienceMin}&sort=${value}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">강사 검색</h1>
          <p className="text-gray-600 mt-2">필요한 강사를 찾아보세요</p>
        </div>

        {/* 필터 & 정렬 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 경력 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">경력</label>
              <select
                value={experienceMin}
                onChange={handleExperienceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">전체</option>
                <option value="1">1년 이상</option>
                <option value="3">3년 이상</option>
                <option value="5">5년 이상</option>
                <option value="10">10년 이상</option>
              </select>
            </div>

            {/* 정렬 옵션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
              <select
                value={sort}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="cms_score">CMS 점수순</option>
              </select>
            </div>

            {/* 검색 결과 수 */}
            <div className="flex items-end">
              <div className="w-full bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>{instructors.length}명</strong>의 강사를 찾았습니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">강사를 검색하는 중...</p>
          </div>
        )}

        {/* 강사 목록 */}
        {!isLoading && instructors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor) => (
              <div
                key={instructor.user_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                {/* 강사 정보 */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{instructor.name}</h3>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>학력:</strong> {instructor.education}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>학위:</strong> {instructor.degree_status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>경력:</strong> {instructor.years_of_experience}년
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>가입:</strong>{' '}
                    {new Date(instructor.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* 배지 */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {instructor.years_of_experience >= 5 && (
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      5년+ 경력
                    </span>
                  )}
                  {instructor.years_of_experience >= 10 && (
                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      10년+ 경력
                    </span>
                  )}
                </div>

                {/* 액션 버튼 */}
                <Link
                  href={`/academy/prospects`}
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  면접 제안
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && instructors.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">검색 조건에 맞는 강사가 없습니다.</p>
          </div>
        )}

        {/* 돌아가기 버튼 */}
        <div className="mt-8">
          <Link
            href="/academy"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg transition-colors font-medium"
          >
            ← 뒤로 가기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AcademyInstructorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-12 px-4">로딩 중...</div>}>
      <AcademyInstructorsContent />
    </Suspense>
  )
}
