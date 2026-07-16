'use client'

import { useEffect, useState, useTransition } from 'react'
import { fetchInstructorsWithMatch, getSkillCategories, requestInstructor } from './actions'
import type { InstructorCard } from './actions'

export default function StudentInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorCard[]>([])
  const [filteredInstructors, setFilteredInstructors] = useState<InstructorCard[]>([])
  const [skillCategories, setSkillCategories] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [requestingInstructorId, setRequestingInstructorId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [instructorsData, skillsData] = await Promise.all([
          fetchInstructorsWithMatch(),
          getSkillCategories(),
        ])
        setInstructors(instructorsData)
        setFilteredInstructors(instructorsData)
        setSkillCategories(skillsData)
      } catch (err) {
        console.error('Failed to load instructors:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // 필터링 처리
  useEffect(() => {
    let filtered = instructors

    // 과목 필터
    if (selectedSkill) {
      filtered = filtered.filter((instructor) =>
        instructor.skills.includes(selectedSkill)
      )
    }

    // 지역 필터
    if (selectedLocation) {
      filtered = filtered.filter((instructor) =>
        instructor.location?.includes(selectedLocation)
      )
    }

    setFilteredInstructors(filtered)
  }, [selectedSkill, selectedLocation, instructors])

  // 토스트 메시지 자동 사라지기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleRequestInstructor = async (instructorId: string) => {
    startTransition(async () => {
      try {
        setRequestingInstructorId(instructorId)
        await requestInstructor(instructorId)
        setToast('수강 신청이 완료되었습니다!')
      } catch (err) {
        console.error('Request failed:', err)
        setToast('수강 신청에 실패했습니다.')
      } finally {
        setRequestingInstructorId(null)
      }
    })
  }

  const uniqueLocations = Array.from(
    new Set(instructors.map((i) => i.location).filter((l) => l !== null && l !== undefined))
  ).sort()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">강사 목록을 로드하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">강사 찾기</h1>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                과목
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">모든 과목</option>
                {skillCategories.map((skill) => (
                  <option key={skill.id} value={skill.name}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">모든 지역</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 강사 목록 */}
        {filteredInstructors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">해당하는 강사가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInstructors.map((instructor) => (
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

                  {/* 정보 섹션 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {instructor.name}
                        </h3>
                        {instructor.location && (
                          <p className="text-sm text-gray-500">{instructor.location}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-blue-600">
                          {instructor.matchScore}%
                        </div>
                        <p className="text-xs text-gray-500">적합도</p>
                      </div>
                    </div>

                    {/* 소개 */}
                    {instructor.bio && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}

                    {/* 역량 태그 */}
                    {instructor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {instructor.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {instructor.skills.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{instructor.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 수강 신청 버튼 */}
                    <button
                      onClick={() => handleRequestInstructor(instructor.userId)}
                      disabled={
                        isPending || requestingInstructorId === instructor.userId
                      }
                      className="w-full py-2 px-4 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {requestingInstructorId === instructor.userId && isPending
                        ? '신청 중...'
                        : '수강 신청'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
