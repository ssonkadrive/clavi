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
  const supabase = createClient()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { data: skillsData } = await supabase
        .from('skill_categories')
        .select('id, name')
        .eq('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setSkills(skillsData || [])

      const { data: condData } = await supabase
        .from('instructor_conditions')
        .select('selected_skills')
        .eq('user_id', authData.user.id)
        .single()

      setSelectedSkills(condData?.selected_skills || [])
    } catch (err) {
      console.error('역량 로드 실패:', err)
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
      if (!authData.user) return

      const { error } = await supabase
        .from('instructor_conditions')
        .update({ selected_skills: selectedSkills })
        .eq('user_id', authData.user.id)

      if (error) throw error
      alert('역량이 저장되었습니다.')
    } catch (err) {
      console.error('역량 저장 실패:', err)
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
