import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import SkillsForm from './SkillsForm'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

export default async function ProfileSkillsPage() {
  console.log('[ProfileSkillsPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  console.log('[ProfileSkillsPage] 세션:', session ? `UserId=${session.userId}, Role=${session.role}` : 'null')

  if (!session || session.role !== 'instructor') {
    console.log('[ProfileSkillsPage] 세션 없음 또는 강사가 아님 - 리다이렉트')
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">역량 관리</h1>
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
          <Link
            href="/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // 2. skill_categories 조회
  console.log('[ProfileSkillsPage] skill_categories 조회 시작')
  const { data: skillCategories, error: categoriesError } = await supabase
    .from('skill_categories')
    .select('id, parent_id, level, name, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  console.log('[ProfileSkillsPage] skill_categories 조회 결과:', {
    dataCount: skillCategories?.length,
    error: categoriesError?.message,
  })

  if (categoriesError) {
    console.error('[ProfileSkillsPage] skill_categories 조회 실패:', categoriesError)
  }

  // 3. 기존 selected_skills 조회
  console.log('[ProfileSkillsPage] instructor_conditions 조회 시작:', session.userId)
  const { data: instructorConditions, error: condError } = await supabase
    .from('instructor_conditions')
    .select('selected_skills')
    .eq('user_id', session.userId)
    .maybeSingle()

  console.log('[ProfileSkillsPage] instructor_conditions 조회 결과:', {
    hasData: !!instructorConditions,
    skillCount: instructorConditions?.selected_skills?.length || 0,
    error: condError?.message,
  })

  if (condError) {
    console.error('[ProfileSkillsPage] instructor_conditions 조회 실패:', condError)
  }

  const categories: SkillCategory[] = skillCategories || []
  const existingSkills = instructorConditions?.selected_skills || []

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">역량 관리</h1>
          <Link
            href="/profile"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← 프로필로 돌아가기
          </Link>
        </div>

        {categoriesError ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">역량 정보를 불러오는 데 실패했습니다.</p>
            <p className="text-sm text-red-700 mt-2">{categoriesError.message}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-6">
              자신이 보유한 역량(과목/등급)을 선택하세요. 이 정보는 학원의 강사 매칭에 사용됩니다.
            </p>
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
