'use client'

import { useEffect, useState } from 'react'
import { loadInstructorSearch, requestInstructor } from './actions'
import type { InstructorCard } from './actions'

export default function StudentInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorCard[]>([])
  const [skillOptions, setSkillOptions] = useState<string[]>([])
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const [studentInterests, setStudentInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await loadInstructorSearch()
      if (error || !data) {
        setLoadError(error || '데이터를 불러올 수 없습니다.')
      } else {
        setInstructors(data.instructors)
        setSkillOptions(data.skillOptions)
        setRequestedIds(data.requestedInstructorIds)
        setStudentInterests(data.studentInterests)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleRequest = async (instructorId: string) => {
    setRequestingId(instructorId)
    const result = await requestInstructor(instructorId)
    setRequestingId(null)

    if (result.success) {
      setRequestedIds((prev) => [...prev, instructorId])
      setToast('신청 완료')
    } else {
      setToast(result.error || '수강 신청에 실패했습니다.')
    }
  }

  const filteredInstructors = selectedSkill
    ? instructors.filter((i) => i.skills.includes(selectedSkill))
    : instructors

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">강사 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">강사 찾기</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">강사 찾기</h1>

        {/* 관심과목 안내 */}
        {studentInterests.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              프로필에서 관심과목을 등록하면 적합도 점수를 확인할 수 있습니다.{' '}
              <a href="/student/profile" className="font-medium underline">
                프로필 작성하기
              </a>
            </p>
          </div>
        )}

        {/* 필터 */}
        {skillOptions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">과목</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">모든 과목</option>
              {skillOptions.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 강사 목록 */}
        {filteredInstructors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">강사를 찾을 수 없습니다.</p>
            {selectedSkill && (
              <button
                onClick={() => setSelectedSkill('')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInstructors.map((instructor) => {
              const isRequested = requestedIds.includes(instructor.userId)
              const isRequesting = requestingId === instructor.userId

              return (
                <div
                  key={instructor.userId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* 프로필 사진 */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                      {instructor.profileImageUrl ? (
                        <img
                          src={instructor.profileImageUrl}
                          alt={instructor.name}
                          className="w-20 h-20 object-cover"
                        />
                      ) : (
                        <span className="text-3xl">👨‍🏫</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {instructor.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {[
                              instructor.education,
                              instructor.experience > 0
                                ? `경력 ${instructor.experience}년`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '소개 정보 없음'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-blue-600">
                            {instructor.matchScore}%
                          </div>
                          <p className="text-xs text-gray-500">적합도</p>
                        </div>
                      </div>

                      {/* 역량 태그 */}
                      {instructor.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {instructor.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                studentInterests.some(
                                  (i) => skill.includes(i) || i.includes(skill)
                                )
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                          {instructor.skills.length > 4 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{instructor.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 수강 신청 버튼 */}
                      <button
                        onClick={() => handleRequest(instructor.userId)}
                        disabled={isRequested || isRequesting}
                        className={`w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                          isRequested
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                        }`}
                      >
                        {isRequested
                          ? '신청완료'
                          : isRequesting
                            ? '신청 중...'
                            : '수강 신청'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
