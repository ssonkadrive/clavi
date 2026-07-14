'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Skill {
  id: string
  name: string
}

export default function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setError(null)

      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        throw new Error('사용자 정보를 가져올 수 없습니다')
      }

      console.log('[SkillsTab] 역량 로드 시작, userId:', authData.user.id)

      const { data: skillsData, error: skillsError } = await supabase
        .from('skill_categories')
        .select('id, name')
        .eq('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (skillsError) {
        console.error('[SkillsTab] 역량 조회 에러:', skillsError)
        throw skillsError
      }

      console.log('[SkillsTab] 조회 완료:', skillsData?.length || 0, '개')
      setSkills(skillsData || [])

      const { data: condData, error: condError } = await supabase
        .from('instructor_conditions')
        .select('selected_skills')
        .eq('user_id', authData.user.id)
        .single()

      if (condError && condError.code !== 'PGRST116') {
        console.error('[SkillsTab] 조건 조회 에러:', condError)
      }

      setSelectedSkills(condData?.selected_skills || [])
      console.log('[SkillsTab] 선택된 역량:', condData?.selected_skills || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[SkillsTab] 역량 로드 실패:', message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkillChange = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('사용자 정보 없음')

      const { error: updateError } = await supabase
        .from('instructor_conditions')
        .update({ selected_skills: selectedSkills })
        .eq('user_id', authData.user.id)

      if (updateError) {
        if (updateError.code === 'PGRST116' || updateError.code === 'NODATA') {
          const { error: insertError } = await supabase
            .from('instructor_conditions')
            .insert({ user_id: authData.user.id, selected_skills: selectedSkills })

          if (insertError) throw insertError
        } else {
          throw updateError
        }
      }

      alert('역량이 저장되었습니다.')
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[SkillsTab] 저장 실패:', message)
      alert('저장 실패: ' + message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">⚠️ 로드 실패: {error}</p>
        </div>
        <button
          onClick={() => {
            setIsLoading(true)
            loadSkills()
          }}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">역량이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">보유한 역량을 선택하세요</p>

      <div className="space-y-3">
        {skills.map((skill) => (
          <label
            key={skill.id}
            className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedSkills.includes(skill.id)}
              onChange={() => handleSkillChange(skill.id)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="ml-3 text-gray-900">{skill.name}</span>
          </label>
        ))}
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
