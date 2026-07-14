'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Education {
  school_name: string
  degree: string
  major: string
  graduation_year: number
}

const DEFAULT_EDUCATION: Education = {
  school_name: '',
  degree: '대졸',
  major: '',
  graduation_year: new Date().getFullYear(),
}

export default function EducationTab() {
  const [education, setEducation] = useState<Education>(DEFAULT_EDUCATION)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEducation()
  }, [])

  const loadEducation = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        setEducation(DEFAULT_EDUCATION)
        return
      }

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('education')
        .eq('user_id', authData.user.id)
        .single()

      if (error) {
        console.error('[EducationTab] DB 조회 에러:', error)
        // 행이 없으면 기본값 사용
        setEducation(DEFAULT_EDUCATION)
      } else if (data?.education) {
        // 로드된 데이터 확인 및 안전하게 설정
        const loaded = data.education as Partial<Education>
        setEducation({
          school_name: loaded.school_name ?? '',
          degree: loaded.degree ?? '대졸',
          major: loaded.major ?? '',
          graduation_year: typeof loaded.graduation_year === 'number' ? loaded.graduation_year : new Date().getFullYear(),
        })
      } else {
        setEducation(DEFAULT_EDUCATION)
      }
    } catch (err) {
      console.error('[EducationTab] 학력 로드 실패:', err)
      setEducation(DEFAULT_EDUCATION)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('사용자 정보 없음')

      // 데이터 유효성 확인
      if (!education.school_name.trim()) {
        alert('학교명을 입력하세요.')
        setIsSaving(false)
        return
      }

      // 먼저 update 시도
      const { error: updateError } = await supabase
        .from('instructor_profiles')
        .update({ education })
        .eq('user_id', authData.user.id)

      if (updateError) {
        // 행이 없으면 insert 시도
        if (updateError.code === 'PGRST116' || updateError.code === 'NODATA') {
          const { error: insertError } = await supabase
            .from('instructor_profiles')
            .insert({ user_id: authData.user.id, education })

          if (insertError) throw insertError
        } else {
          throw updateError
        }
      }

      alert('학력이 저장되었습니다.')
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[EducationTab] 저장 실패:', message)
      alert('저장 실패: ' + message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">학교명</label>
        <input
          type="text"
          value={education.school_name}
          onChange={(e) =>
            setEducation({ ...education, school_name: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 서울대학교"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">학위</label>
        <select
          value={education.degree}
          onChange={(e) =>
            setEducation({ ...education, degree: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="초졸">초졸</option>
          <option value="중졸">중졸</option>
          <option value="고졸">고졸</option>
          <option value="대졸">대졸</option>
          <option value="대학원">대학원</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
        <input
          type="text"
          value={education.major}
          onChange={(e) =>
            setEducation({ ...education, major: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 국어국문학"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">졸업년도</label>
        <input
          type="number"
          value={education.graduation_year || new Date().getFullYear()}
          onChange={(e) => {
            const year = e.target.value ? parseInt(e.target.value) : new Date().getFullYear()
            setEducation({
              ...education,
              graduation_year: isNaN(year) ? new Date().getFullYear() : year,
            })
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1950"
          max={new Date().getFullYear()}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium"
      >
        {isSaving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
