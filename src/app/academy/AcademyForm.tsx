'use client'

import { updateRequiredSkills } from './actions'
import SkillCheckboxes from '@/components/SkillCheckboxes'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

interface AcademyFormProps {
  userId: string
  categories: SkillCategory[]
  initialSelectedIds?: string[]
}

export default function AcademyForm({
  userId,
  categories,
  initialSelectedIds = [],
}: AcademyFormProps) {
  const handleSave = async (requiredIds: string[]) => {
    console.log('[AcademyForm] 저장 시작:', { userId, requiredIds })
    await updateRequiredSkills(userId, requiredIds)
  }

  return (
    <SkillCheckboxes
      categories={categories}
      initialSelectedIds={initialSelectedIds}
      onSave={handleSave}
    />
  )
}
