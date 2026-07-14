'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AcademySkillsTree from './AcademySkillsTree'

interface AcademyInfo {
  academy_name: string
  region: string
}

interface SkillData {
  id: string
  name: string
  parent_id: string | null
  level: number
  display_order: number
  is_active: boolean
}

export default function AcademyProfileTab() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [allSkills, setAllSkills] = useState<SkillData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setError('로그인이 필요합니다.')
          return
        }

        // 1. 학원 정보 조회
        const { data: academy } = await supabase
          .from('academies')
          .select('academy_name, region')
          .eq('user_id', userData.user.id)
          .single()

        if (academy) {
          setAcademyInfo(academy)
        }

        // 2. 선택된 skills 조회
        const { data: conditions } = await supabase
          .from('academy_conditions')
          .select('required_skills')
          .eq('user_id', userData.user.id)
          .single()

        if (conditions?.required_skills) {
          const requiredSkillIds = (conditions.required_skills || []).map((s: any) =>
            typeof s === 'string' ? s : s.skill_id
          )
          setSelectedSkills(requiredSkillIds)
        }

        // 3. 모든 skills 조회 (트리 표시용)
        const { data: skills } = await supabase
          .from('skill_categories')
          .select('id, name, parent_id, level, display_order, is_active')
          .order('level', { ascending: true })
          .order('display_order', { ascending: true })

        if (skills) {
          setAllSkills(skills)
        }
      } catch (err) {
        console.error('[AcademyProfileTab] 데이터 로드 실패:', err)
        setError('데이터를 불러오는 데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>
  }

  return (
    <div className="space-y-6">
      {/* 학원 기본 정보 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">학원 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">학원명</label>
            <p className="mt-1 text-gray-900">{academyInfo?.academy_name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">지역</label>
            <p className="mt-1 text-gray-900">{academyInfo?.region || '-'}</p>
          </div>
        </div>
      </div>

      {/* 역량 섹션 */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            현재 선택한 역량: <span className="text-blue-600">{selectedSkills.length}개</span>
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isEditing ? '취소' : '수정하기'}
          </button>
        </div>

        {!isEditing && selectedSkills.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-2">
              {selectedSkills.map((skillId) => {
                const skillName = allSkills.find((s) => s.id === skillId)?.name || '알 수 없는 역량'
                return (
                  <li key={skillId} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{skillName}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {isEditing ? (
          <AcademySkillsTree
            allSkills={allSkills}
            selectedSkills={selectedSkills}
            onSkillsChange={setSelectedSkills}
            onSave={() => setIsEditing(false)}
          />
        ) : null}
      </div>
    </div>
  )
}
