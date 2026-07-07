'use client'

import { useRouter } from 'next/navigation'
import SkillCheckboxes from '@/components/SkillCheckboxes'
import { updateSelectedSkills } from './actions'

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
  const router = useRouter()

  const handleSave = async (selectedIds: string[]) => {
    console.log('[SkillsForm] 역량 저장 시작:', { userId, selectedIds })

    try {
      const result = await updateSelectedSkills(userId, selectedIds)

      if (result.error) {
        console.error('[SkillsForm] 저장 실패:', result.error)
        alert('역량 저장에 실패했습니다: ' + result.error)
        return
      }

      console.log('[SkillsForm] 역량 저장 성공')
      alert('역량이 저장되었습니다!')

      // 프로필 페이지로 돌아가기
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } catch (err) {
      console.error('[SkillsForm] 예외:', err)
      alert('역량 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <SkillCheckboxes
      categories={categories}
      initialSelectedIds={initialSelectedIds}
      type="instructor"
      onSave={handleSave}
    />
  )
}
