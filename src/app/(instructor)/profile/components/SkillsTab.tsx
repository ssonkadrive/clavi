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

      const userId = authData.user.id
      if (!userId) {
        throw new Error('userId가 없습니다')
      }

      console.log('[SkillsTab] 역량 로드 시작, userId:', userId, '타입:', typeof userId)

      // 역량 조회 (RLS 권한 확인)
      const { data: skillsData, error: skillsError } = await supabase
        .from('skill_categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (skillsError) {
        console.error('[SkillsTab] 역량 조회 에러:', {
          message: skillsError.message,
          code: skillsError.code,
          details: skillsError.details,
          hint: skillsError.hint,
        })
        throw new Error(`역량 조회 실패: ${skillsError.message || '알 수 없는 에러'}`)
      }

      console.log('[SkillsTab] 조회 완료:', skillsData?.length || 0, '개')
      setSkills(skillsData || [])

      // 선택된 역량 조회 (instructor_conditions이 없을 수 있음)
      try {
        const { data: condData, error: condError } = await supabase
          .from('instructor_conditions')
          .select('selected_skills')
          .eq('user_id', userId)
          .single()

        if (!condError) {
          setSelectedSkills(condData?.selected_skills || [])
          console.log('[SkillsTab] 선택된 역량:', condData?.selected_skills || [])
        } else if (condError.code === 'PGRST116') {
          console.log('[SkillsTab] instructor_conditions 데이터 없음 (초기 사용자)')
          setSelectedSkills([])
        } else {
          console.warn('[SkillsTab] 선택 역량 조회 경고:', condError.message)
          setSelectedSkills([])
        }
      } catch (condErr) {
        console.warn('[SkillsTab] 선택 역량 조회 중 예외:', condErr)
        setSelectedSkills([])
      }
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

      const userId = authData.user.id
      if (!userId) throw new Error('userId가 없습니다')

      console.log('[SkillsTab] 저장 시작, userId:', userId)
      console.log('[SkillsTab] 저장할 역량:', selectedSkills)

      // 먼저 update 시도
      const { error: updateError, status: updateStatus } = await supabase
        .from('instructor_conditions')
        .update({ selected_skills: selectedSkills })
        .eq('user_id', userId)

      console.log('[SkillsTab] UPDATE 결과:', {
        status: updateStatus,
        error: updateError,
      })

      if (updateError) {
        console.log('[SkillsTab] UPDATE 에러 상세:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })

        // 행이 없으면 insert 시도
        if (updateError.code === 'PGRST116' || updateError.code === 'NODATA' || updateStatus === 406) {
          console.log('[SkillsTab] 기존 데이터 없음, INSERT 시도')

          const { error: insertError } = await supabase
            .from('instructor_conditions')
            .insert({ user_id: userId, selected_skills: selectedSkills })

          console.log('[SkillsTab] INSERT 결과:', {
            error: insertError,
          })

          if (insertError) throw insertError
        } else {
          throw updateError
        }
      }

      console.log('[SkillsTab] 저장 완료')
      alert('역량이 저장되었습니다.')
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[SkillsTab] 저장 실패:', message, err)
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
