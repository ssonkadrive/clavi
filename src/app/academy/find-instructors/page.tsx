'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchInstructors, type Instructor } from './actions'
import SkillCheckboxes from '@/components/SkillCheckboxes'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

type FilterState = {
  selectedSkillIds: string[]
  education: string
  experienceMin: string
  salaryMin: string
  salaryMax: string
}

export default function FindInstructorsPage() {
  const supabase = createClient()

  const [showFilter, setShowFilter] = useState(false)
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    selectedSkillIds: [],
    education: '',
    experienceMin: '',
    salaryMin: '',
    salaryMax: '',
  })
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    selectedSkillIds: [],
    education: '',
    experienceMin: '',
    salaryMin: '',
    salaryMax: '',
  })

  const [results, setResults] = useState<Instructor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // 1. 초기 로드: skill_categories 조회
  useEffect(() => {
    const loadSkillCategories = async () => {
      console.log('[FindInstructorsPage] skill_categories 로드 시작')
      try {
        const { data, error } = await supabase
          .from('skill_categories')
          .select('id, parent_id, level, name, display_order, is_active')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (error) {
          console.error('[FindInstructorsPage] skill_categories 로드 실패:', error)
          setSkillCategories([])
        } else {
          console.log('[FindInstructorsPage] skill_categories 로드 완료:', data?.length || 0, '개')
          setSkillCategories(data || [])
        }
      } catch (err) {
        console.error('[FindInstructorsPage] 오류:', err)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadSkillCategories()
  }, [supabase])

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    if (key === 'selectedSkillIds') {
      setFilters(prev => ({ ...prev, [key]: value as string[] }))
    } else {
      setFilters(prev => ({ ...prev, [key]: value as string }))
    }
  }

  const handleApplyFilter = async () => {
    console.log('[FindInstructorsPage] 필터 적용:', filters)
    setIsSearching(true)
    setSearchError('')
    setResults([])

    try {
      const result = await searchInstructors({
        selectedSkillIds: filters.selectedSkillIds,
        education: filters.education || undefined,
        experienceMin: filters.experienceMin ? parseInt(filters.experienceMin) : undefined,
        salaryMin: filters.salaryMin ? parseInt(filters.salaryMin) : undefined,
        salaryMax: filters.salaryMax ? parseInt(filters.salaryMax) : undefined,
      })

      if (result.error) {
        console.error('[FindInstructorsPage] 검색 실패:', result.error)
        setSearchError(result.error)
        setResults([])
      } else {
        console.log('[FindInstructorsPage] 검색 완료:', result.data?.length || 0, '명')
        setResults(result.data || [])
        setActiveFilters(filters)
      }
    } catch (err) {
      console.error('[FindInstructorsPage] 예외 발생:', err)
      setSearchError('검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
      setShowFilter(false)
    }
  }

  const handleResetFilter = () => {
    const empty: FilterState = {
      selectedSkillIds: [],
      education: '',
      experienceMin: '',
      salaryMin: '',
      salaryMax: '',
    }
    setFilters(empty)
    setActiveFilters(empty)
    setResults([])
    setSearchError('')
  }

  // skill_id → skill_name 변환 (결과 화면에 사용)
  const getSkillNames = (skillIds: string[]): string[] => {
    return skillIds
      .map(id => skillCategories.find(c => c.id === id)?.name)
      .filter(Boolean) as string[]
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">강사찾기</h1>
        <p className="text-sm text-gray-500">총 {results.length}명</p>
      </div>

      {/* 필터 버튼 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="강사 이름 검색..."
          disabled
          className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-500"
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          🔍 필터
        </button>
      </div>

      {/* 에러 메시지 */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{searchError}</p>
        </div>
      )}

      {/* 필터 패널 */}
      {showFilter && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border">
          <h3 className="font-bold text-gray-900">필터 조건</h3>

          {/* 계층형 스킬 체크박스 */}
          {isLoadingCategories ? (
            <div className="text-center py-4 text-gray-500">과목 정보를 불러오는 중...</div>
          ) : skillCategories.length > 0 ? (
            <SkillCheckboxes
              categories={skillCategories}
              initialSelectedIds={filters.selectedSkillIds}
              type="academy"
              onSave={undefined}
            />
          ) : (
            <div className="text-center py-4 text-gray-500">과목 정보를 불러올 수 없습니다.</div>
          )}

          {/* 선택된 스킬 반영 */}
          {skillCategories.length > 0 && (
            <div className="space-y-3">
              {/* 학력 */}
              <div>
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
              <div className="grid grid-cols-2 gap-2">
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
                <div>
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
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleApplyFilter}
              disabled={isSearching}
              className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 bg-gray-300 text-gray-900 py-2 rounded font-medium hover:bg-gray-400"
            >
              초기화
            </button>
          </div>
        </div>
      )}

      {/* 적용된 필터 표시 */}
      {(Object.values(activeFilters).some(v => v) || activeFilters.selectedSkillIds.length > 0) && (
        <div className="bg-blue-50 p-3 rounded text-sm text-gray-700 border border-blue-200">
          <p>
            <span className="font-semibold">적용된 필터:</span>
            {activeFilters.selectedSkillIds.length > 0 && ` 과목(${activeFilters.selectedSkillIds.length}개)`}
            {activeFilters.education && ` · 학력: ${activeFilters.education}`}
            {activeFilters.experienceMin && ` · 최소 경력: ${activeFilters.experienceMin}년`}
          </p>
        </div>
      )}

      {/* 강사 카드 리스트 */}
      <div className="space-y-3">
        {results.length > 0 ? (
          results.map(instructor => (
            <div key={instructor.user_id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{instructor.name}</p>
                  <p className="text-xs text-gray-500">
                    {instructor.education}
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
                  과목: <span className="font-medium">{getSkillNames(instructor.selected_skills).join(', ')}</span>
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
                  <p className="text-xs text-gray-500">매칭 점수</p>
                  <p className="text-2xl font-bold text-blue-600">{instructor.cms_score}%</p>
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
        ) : isSearching ? (
          <div className="text-center py-8 text-gray-500">검색 중...</div>
        ) : activeFilters.selectedSkillIds.length > 0 || Object.values(activeFilters).some(v => v) ? (
          <div className="text-center py-8 text-gray-500">조건에 맞는 강사가 없습니다.</div>
        ) : (
          <div className="text-center py-8 text-gray-500">필터를 설정하고 검색해주세요.</div>
        )}
      </div>
    </div>
  )
}
