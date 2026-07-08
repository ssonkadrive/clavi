'use client'

import { useState } from 'react'

interface Instructor {
  id: string
  name: string
  age?: number
  gender?: string
  education?: string
  experience: number
  subjects: string[]
  cms_score: number
  certified: boolean
  hourly_rate?: number
}

type FilterState = {
  subject: string
  gender: string
  ageMin: string
  ageMax: string
  education: string
  experienceMin: string
  salaryMin: string
  salaryMax: string
}

export default function FindInstructorsPage() {
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    education: '',
    experienceMin: '',
    salaryMin: '',
    salaryMax: '',
  })
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    subject: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    education: '',
    experienceMin: '',
    salaryMin: '',
    salaryMax: '',
  })

  // 필터링된 강사 목록 (DB에서 조회해야 함)
  const filteredInstructors = [].filter((instructor: Instructor) => {
    if (activeFilters.subject && !instructor.subjects.includes(activeFilters.subject)) return false
    if (activeFilters.gender && instructor.gender !== activeFilters.gender) return false
    if (activeFilters.ageMin && instructor.age && instructor.age < parseInt(activeFilters.ageMin)) return false
    if (activeFilters.ageMax && instructor.age && instructor.age > parseInt(activeFilters.ageMax)) return false
    if (activeFilters.education && instructor.education !== activeFilters.education) return false
    if (activeFilters.experienceMin && instructor.experience < parseInt(activeFilters.experienceMin)) return false
    if (activeFilters.salaryMin && instructor.hourly_rate && instructor.hourly_rate < parseInt(activeFilters.salaryMin)) return false
    if (activeFilters.salaryMax && instructor.hourly_rate && instructor.hourly_rate > parseInt(activeFilters.salaryMax)) return false
    return true
  })

  // CMS 점수순 정렬
  const sorted = [...filteredInstructors].sort((a, b) => b.cms_score - a.cms_score)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilter = () => {
    setActiveFilters(filters)
    setShowFilter(false)
  }

  const handleResetFilter = () => {
    const empty: FilterState = {
      subject: '',
      gender: '',
      ageMin: '',
      ageMax: '',
      education: '',
      experienceMin: '',
      salaryMin: '',
      salaryMax: '',
    }
    setFilters(empty)
    setActiveFilters(empty)
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">강사찾기</h1>
        <p className="text-sm text-gray-500">총 {sorted.length}명</p>
      </div>

      {/* 검색바 + 필터 버튼 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="강사 이름 검색..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          🔍 필터
        </button>
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
          <h3 className="font-bold text-gray-900">필터 조건</h3>

          <div className="grid grid-cols-2 gap-2">
            {/* 과목 */}
            <div>
              <label className="text-xs text-gray-600">과목</label>
              <select
                value={filters.subject}
                onChange={e => handleFilterChange('subject', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">전체</option>
                <option value="수학">수학</option>
                <option value="영어">영어</option>
                <option value="과학">과학</option>
                <option value="물리">물리</option>
              </select>
            </div>

            {/* 성별 */}
            <div>
              <label className="text-xs text-gray-600">성별</label>
              <select
                value={filters.gender}
                onChange={e => handleFilterChange('gender', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">전체</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>

            {/* 나이 범위 */}
            <div>
              <label className="text-xs text-gray-600">최소 나이</label>
              <input
                type="number"
                value={filters.ageMin}
                onChange={e => handleFilterChange('ageMin', e.target.value)}
                placeholder="20"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600">최대 나이</label>
              <input
                type="number"
                value={filters.ageMax}
                onChange={e => handleFilterChange('ageMax', e.target.value)}
                placeholder="40"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            {/* 학력 */}
            <div className="col-span-2">
              <label className="text-xs text-gray-600">학력</label>
              <select
                value={filters.education}
                onChange={e => handleFilterChange('education', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">전체</option>
                <option value="서울대">서울대</option>
                <option value="연세대">연세대</option>
                <option value="포항공대">포항공대</option>
              </select>
            </div>

            {/* 경력 */}
            <div>
              <label className="text-xs text-gray-600">최소 경력(년)</label>
              <input
                type="number"
                value={filters.experienceMin}
                onChange={e => handleFilterChange('experienceMin', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            {/* 시급 범위 */}
            <div>
              <label className="text-xs text-gray-600">최소 시급</label>
              <input
                type="number"
                value={filters.salaryMin}
                onChange={e => handleFilterChange('salaryMin', e.target.value)}
                placeholder="30000"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-600">최대 시급</label>
              <input
                type="number"
                value={filters.salaryMax}
                onChange={e => handleFilterChange('salaryMax', e.target.value)}
                placeholder="50000"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 bg-blue-600 text-white py-2 rounded font-medium"
            >
              필터 적용
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 bg-gray-300 text-gray-900 py-2 rounded font-medium"
            >
              초기화
            </button>
          </div>
        </div>
      )}

      {/* 적용된 필터 표시 */}
      {Object.values(activeFilters).some(v => v) && (
        <div className="bg-blue-50 p-2 rounded text-sm text-gray-700">
          필터 적용됨: {Object.entries(activeFilters)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}
        </div>
      )}

      {/* 강사 카드 리스트 (CMS 점수순) */}
      <div className="space-y-3">
        {sorted.length > 0 ? (
          sorted.map(instructor => (
            <div key={instructor.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{instructor.name}</p>
                  <p className="text-xs text-gray-500">
                    {instructor.age}세 · {instructor.gender} · {instructor.education}
                  </p>
                </div>
                {instructor.certified && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    ✓ 인증
                  </span>
                )}
              </div>

              <div className="space-y-1 mb-3">
                <p className="text-sm">
                  과목: <span className="font-medium">{instructor.subjects.join(', ')}</span>
                </p>
                <p className="text-sm">
                  경력: <span className="font-medium">{instructor.experience}년</span>
                </p>
                <p className="text-sm">
                  시급: <span className="font-medium text-blue-600">{instructor.hourly_rate?.toLocaleString()}원</span>
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-right">
                  <p className="text-xs text-gray-500">CMS 점수</p>
                  <p className="text-2xl font-bold text-blue-600">{instructor.cms_score}</p>
                </div>
                <button
                  onClick={() => alert(`${instructor.name}에게 제안했습니다!`)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  ❤️ 제안
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            조건에 맞는 강사가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
