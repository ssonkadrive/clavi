'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Education {
  school_name: string
  degree: string
  major: string
  graduation_year: number
}

export default function EducationTab() {
  const [education, setEducation] = useState<Education>({
    school_name: '',
    degree: '대졸',
    major: '',
    graduation_year: new Date().getFullYear(),
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEducation()
  }, [])

  const loadEducation = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { data } = await supabase
        .from('instructor_profiles')
        .select('education')
        .eq('user_id', authData.user.id)
        .single()

      if (data?.education) {
        setEducation(data.education)
      }
    } catch (err) {
      console.error('학력 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { error } = await supabase
        .from('instructor_profiles')
        .update({ education })
        .eq('user_id', authData.user.id)

      if (error) throw error
      alert('학력이 저장되었습니다.')
    } catch (err) {
      console.error('학력 저장 실패:', err)
      alert('저장 실패')
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
          value={education.graduation_year}
          onChange={(e) =>
            setEducation({
              ...education,
              graduation_year: parseInt(e.target.value),
            })
          }
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
