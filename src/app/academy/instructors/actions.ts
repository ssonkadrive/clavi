'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface InstructorSearchRow {
  user_id: string
  name: string
  education: string
  degree_status: string
  years_of_experience: number
  created_at: string
}

export async function searchInstructors(params: {
  experience_min?: number
  sort?: 'cms_score' | 'latest'
}): Promise<{
  data?: InstructorSearchRow[]
  error?: string
}> {
  console.log('[searchInstructors] 검색 시작:', params)

  try {
    const session = await getSession()
    if (!session || session.role !== 'academy') {
      console.error('[searchInstructors] 권한 없음')
      return { error: '학원만 접근 가능합니다.' }
    }

    const supabase = await createClient()

    // 기본값 설정
    const experienceMin = params.experience_min || 0
    const sort = params.sort || 'latest'

    // instructor_profiles 조회
    let query = supabase
      .from('instructor_profiles')
      .select('user_id, name, education, degree_status, years_of_experience, created_at')
      .gte('years_of_experience', experienceMin)

    // 정렬 적용
    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false })
    } else {
      // CMS 점수 정렬은 클라이언트에서 처리 (instructor_conditions와 academy_conditions 비교 필요)
      query = query.order('created_at', { ascending: false })
    }

    const { data: instructors, error: instructorsError } = await query

    if (instructorsError) {
      console.error('[searchInstructors] 조회 실패:', instructorsError)
      return { error: '강사 정보를 불러올 수 없습니다.' }
    }

    console.log('[searchInstructors] 조회 성공:', instructors?.length || 0)

    return {
      data: instructors || [],
    }
  } catch (error: any) {
    console.error('[searchInstructors] 예외 발생:', error)
    return { error: '검색 중 오류가 발생했습니다.' }
  }
}
