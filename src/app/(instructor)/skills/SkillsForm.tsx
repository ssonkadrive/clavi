'use client'

import { updateSelectedSkills } from './actions'
import SkillCheckboxes from '@/components/SkillCheckboxes'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

interface SkillsFormProps {
  userId: string
  categories: SkillCategory[]
  initialSelectedIds?: string[]
}

export default function SkillsForm({
  userId,
  categories,
  initialSelectedIds = [],
}: SkillsFormProps) {
  const handleSave = async (selectedIds: string[]) => {
    console.log('[SkillsForm] 저장 시작:', { userId, selectedIds })
    await updateSelectedSkills(userId, selectedIds)
  }

  return (
    <SkillCheckboxes
      categories={categories}
      initialSelectedIds={initialSelectedIds}
      onSave={handleSave}
    />
  )
}
