'use client'

import { useState } from 'react'
import SchoolAutocomplete, { School } from '@/components/SchoolAutocomplete'

export interface PreferredSchool {
  school_id: string
  school_name: string
  weight: number
}

interface PreferredSchoolSelectorProps {
  value: PreferredSchool[]
  onChange: (schools: PreferredSchool[]) => void
}

const MAX_SCHOOLS = 15

export default function PreferredSchoolSelector({
  value,
  onChange,
}: PreferredSchoolSelectorProps) {
  const [pendingInput, setPendingInput] = useState('')

  const handleAdd = (school: School) => {
    if (value.some((s) => s.school_id === school.id)) {
      setPendingInput('')
      return
    }
    if (value.length >= MAX_SCHOOLS) {
      alert(`선호 학교는 최대 ${MAX_SCHOOLS}개까지 등록할 수 있습니다.`)
      setPendingInput('')
      return
    }
    onChange([...value, { school_id: school.id, school_name: school.name, weight: 5 }])
    setPendingInput('')
  }

  const handleRemove = (schoolId: string) => {
    onChange(value.filter((s) => s.school_id !== schoolId))
  }

  const handleWeightChange = (schoolId: string, weight: number) => {
    onChange(value.map((s) => (s.school_id === schoolId ? { ...s, weight } : s)))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">선호 출신 학교</h3>
        <p className="text-sm text-gray-600 mb-4">
          선호하는 강사 출신 학교를 검색해 추가하고 중요도(5~1점)를 설정하세요. 최대 {MAX_SCHOOLS}개까지 등록할 수 있으며, 채용 조건 CMS 점수 계산에 반영됩니다.
        </p>
        <SchoolAutocomplete
          value={pendingInput}
          onSelect={handleAdd}
          placeholder="학교명을 검색해 추가하세요"
          disabled={value.length >= MAX_SCHOOLS}
        />
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((school) => (
            <div
              key={school.school_id}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <span className="flex-1 text-sm font-medium text-gray-700">{school.school_name}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={school.weight}
                onChange={(e) => handleWeightChange(school.school_id, parseInt(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="min-w-max text-sm font-bold text-blue-600 w-8 text-right">
                {school.weight}점
              </span>
              <button
                type="button"
                onClick={() => handleRemove(school.school_id)}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
