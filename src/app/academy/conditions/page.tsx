import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import ConditionsForm from './ConditionsForm'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

export default async function AcademyConditionsPage() {
  console.log('[AcademyConditionsPage] 페이지 로드 시작')

  // 1. 세션 확인
  const session = await getSession()
  if (!session || session.role !== 'academy') {
    redirect('/signin')
  }

  const supabase = await createClient()

  // 2. skill_categories 조회
  console.log('[AcademyConditionsPage] skill_categories 조회 시작')
  const { data: skillCategories, error: categoriesError } = await supabase
    .from('skill_categories')
    .select('id, parent_id, level, name, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (categoriesError) {
    console.error('[AcademyConditionsPage] skill_categories 조회 실패:', categoriesError)
  }

  // 3. 기존 academy_conditions 조회 (.maybeSingle() 사용 - row가 없어도 OK)
  // 참고: 테이블에 실제 있는 컬럼만 선택. 다른 컬럼들은 없음
  console.log('[AcademyConditionsPage] academy_conditions 조회 시작:', session.userId)
  const { data: existingConditions, error: condError } = await supabase
    .from('academy_conditions')
    .select('required_skills')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (condError) {
    console.error('[AcademyConditionsPage] academy_conditions 조회 실패:')
    console.error('  에러 메시지:', condError.message)
    console.error('  에러 코드:', condError.code)
    console.error('  에러 상세:', condError.details)
    console.error('  에러 힌트:', condError.hint)
    console.error('  전체 에러:', JSON.stringify(condError, null, 2))
  } else {
    console.log('[AcademyConditionsPage] academy_conditions 조회 성공:', {
      hasData: !!existingConditions,
      requiredSkillsCount: existingConditions?.required_skills?.length || 0,
    })
  }

  const categories: SkillCategory[] = skillCategories || []
  const initialRequiredSkills = existingConditions?.required_skills || []

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">채용 조건 설정</h1>

        {categoriesError ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">스킬 정보를 불러오는 데 실패했습니다.</p>
          </div>
        ) : (
          <ConditionsForm
            userId={session.userId}
            categories={categories}
            initialRequiredSkills={initialRequiredSkills}
            initialConditions={existingConditions || undefined}
          />
        )}
      </div>
    </div>
  )
}
