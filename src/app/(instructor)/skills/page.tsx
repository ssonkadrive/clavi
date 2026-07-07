import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import SkillsForm from './SkillsForm'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

export default async function SkillsPage() {
  console.log('[SkillsPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[SkillsPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session) {
    console.log('[SkillsPage] 세션 없음 - 로그인 필요')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 역량</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 2. skill_categories 조회
  const supabase = await createClient()
  console.log('[SkillsPage] skill_categories 조회 시작')
  const { data: skillCategories, error: categoriesError } = await supabase
    .from('skill_categories')
    .select('id, parent_id, level, name, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  console.log('[SkillsPage] skill_categories 조회 결과:', {
    dataCount: skillCategories?.length,
    error: categoriesError,
  })

  if (categoriesError) {
    console.error('[SkillsPage] skill_categories 쿼리 에러:', categoriesError.message)
  }

  // 3. 기존 selected_skills 조회
  console.log('[SkillsPage] instructor_conditions 조회 시작:', session.userId)
  const { data: instructorConditions, error: condError } = await supabase
    .from('instructor_conditions')
    .select('selected_skills')
    .eq('user_id', session.userId)
    .single()

  const existingSkills = instructorConditions?.selected_skills || []
  console.log('[SkillsPage] 기존 selected_skills:', existingSkills)

  const categories: SkillCategory[] = skillCategories || []

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 역량</h1>

        {categoriesError ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">과목 정보를 불러오는 데 실패했습니다.</p>
            <p className="text-sm text-red-700 mt-2">{categoriesError.message}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <SkillsForm
              userId={session.userId}
              categories={categories}
              initialSelectedIds={existingSkills}
            />
          </div>
        )}
      </div>
    </div>
  )
}
