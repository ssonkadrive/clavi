'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SkillData {
  id: string
  name: string
  parent_id: string | null
  level: number
  display_order: number
  is_active: boolean
}

interface TreeNode extends SkillData {
  children: TreeNode[]
}

interface AcademySkillsTreeProps {
  allSkills: SkillData[]
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
  onSave: () => void
}

export default function AcademySkillsTree({
  allSkills,
  selectedSkills,
  onSkillsChange,
  onSave,
}: AcademySkillsTreeProps) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedSkills))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // 부모가 선택되면 자식도 자동 확장
  useEffect(() => {
    const newExpanded = new Set<string>()
    localSelected.forEach((skillId) => {
      const skill = allSkills.find((s) => s.id === skillId)
      if (skill?.parent_id) {
        newExpanded.add(skill.parent_id)
        // 상위 부모들도 확장
        let currentParentId: string | null = skill.parent_id
        while (currentParentId) {
          newExpanded.add(currentParentId)
          const parentSkill = allSkills.find((s) => s.id === currentParentId)
          currentParentId = parentSkill?.parent_id || null
        }
      }
    })
    setExpanded(newExpanded)
  }, [localSelected, allSkills])

  const buildTree = (skills: SkillData[], parentId: string | null = null): TreeNode[] => {
    return skills
      .filter((skill) => skill.parent_id === parentId && skill.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map((skill) => ({
        ...skill,
        children: buildTree(skills, skill.id),
      }))
  }

  const tree = buildTree(allSkills)

  const handleToggleSkill = (skillId: string) => {
    const newSelected = new Set(localSelected)
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId)
    } else {
      newSelected.add(skillId)
    }
    setLocalSelected(newSelected)
  }

  const handleToggleExpanded = (skillId: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId)
    } else {
      newExpanded.add(skillId)
    }
    setExpanded(newExpanded)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        alert('로그인이 필요합니다.')
        return
      }

      const requiredSkillsPayload = Array.from(localSelected).map((skillId) => ({
        skill_id: skillId,
        weight: 1,
      }))

      const { error } = await supabase
        .from('academy_conditions')
        .update({ required_skills: requiredSkillsPayload })
        .eq('user_id', userData.user.id)

      if (error) {
        alert('저장에 실패했습니다: ' + error.message)
        return
      }

      onSkillsChange(Array.from(localSelected))
      onSave()
    } catch (err) {
      console.error('[AcademySkillsTree] 저장 실패:', err)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${depth * 20}px` }}>
          {node.children.length > 0 && (
            <button
              onClick={() => handleToggleExpanded(node.id)}
              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
            >
              {expanded.has(node.id) ? '▼' : '▶'}
            </button>
          )}
          {node.children.length === 0 && <div className="w-5" />}

          <input
            type="checkbox"
            checked={localSelected.has(node.id)}
            onChange={() => handleToggleSkill(node.id)}
            className="rounded"
          />
          <span className="text-gray-900">{node.name}</span>
        </div>

        {expanded.has(node.id) && node.children.length > 0 && (
          renderTree(node.children, depth + 1)
        )}
      </div>
    ))
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="max-h-96 overflow-y-auto">
        {renderTree(tree)}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onSave}
          className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
