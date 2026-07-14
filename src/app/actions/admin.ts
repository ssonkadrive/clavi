'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

// 권한 검증
async function checkSuperAdminAccess() {
  const session = await getSession()
  if (!session || session.userId !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
    throw new Error('슈퍼어드민 권한이 없습니다.')
  }
  return session
}

// 사용자 통계 조회
export async function getUserStats() {
  try {
    await checkSuperAdminAccess()
    const supabase = await createClient()

    // 원장 수
    const { count: academyCount } = await supabase
      .from('academies')
      .select('id', { count: 'exact', head: true })

    // 강사 수
    const { count: instructorCount } = await supabase
      .from('instructor_profiles')
      .select('id', { count: 'exact', head: true })

    // 과목 수
    const { count: skillCount } = await supabase
      .from('skill_categories')
      .select('id', { count: 'exact', head: true })

    return {
      academyCount: academyCount || 0,
      instructorCount: instructorCount || 0,
      skillCount: skillCount || 0,
    }
  } catch (err) {
    console.error('[getUserStats] 오류:', err)
    throw err
  }
}

// 과목 카테고리 트리 조회
export async function getSkillCategoriesTree() {
  try {
    console.log('[getSkillCategoriesTree] 시작')
    await checkSuperAdminAccess()
    const supabase = await createClient()

    console.log('[getSkillCategoriesTree] Supabase 클라이언트 생성 완료')

    // 1. 모든 활성화된 카테고리 조회
    const { data: allCategories, error } = await supabase
      .from('skill_categories')
      .select('id, name, parent_id, level, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    console.log('[getSkillCategoriesTree] 전체 카테고리 조회:', {
      count: allCategories?.length || 0,
      error: error?.message || null,
    })

    if (error) {
      console.error('[getSkillCategoriesTree] DB 에러:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      throw error
    }

    if (!allCategories || allCategories.length === 0) {
      console.log('[getSkillCategoriesTree] 카테고리 없음 - 빈 배열 반환')
      return []
    }

    // 2. 트리 구조 구성 (재귀적)
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          level: item.level,
          parent_id: item.parent_id,
          display_order: item.display_order,
          children: buildTree(items, item.id),
        }))
    }

    // 3. 루트(parent_id = null)부터 트리 구성
    const result = buildTree(allCategories, null)

    console.log('[getSkillCategoriesTree] 트리 구성 완료:', {
      rootCount: result.length,
      totalItems: allCategories.length,
    })

    return result
  } catch (err) {
    console.error('[getSkillCategoriesTree] 전체 에러:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
}

// 과목 카테고리 생성
export async function createSkillCategory(
  name: string,
  parentId: string | null = null
) {
  try {
    await checkSuperAdminAccess()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('skill_categories')
      .insert([
        {
          name,
          parent_id: parentId,
          display_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return { success: true, data: data?.[0] }
  } catch (err) {
    console.error('[createSkillCategory] 오류:', err)
    return { success: false, error: String(err) }
  }
}

// 과목 카테고리 수정
export async function updateSkillCategory(id: string, name: string) {
  try {
    await checkSuperAdminAccess()
    const supabase = await createClient()

    const { error } = await supabase
      .from('skill_categories')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[updateSkillCategory] 오류:', err)
    return { success: false, error: String(err) }
  }
}

// 과목 카테고리 삭제
export async function deleteSkillCategory(id: string) {
  try {
    await checkSuperAdminAccess()
    const supabase = await createClient()

    // 자식 항목 확인
    const { data: children } = await supabase
      .from('skill_categories')
      .select('id')
      .eq('parent_id', id)

    if (children && children.length > 0) {
      return { success: false, error: '하위 항목이 있어서 삭제할 수 없습니다.' }
    }

    const { error } = await supabase
      .from('skill_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[deleteSkillCategory] 오류:', err)
    return { success: false, error: String(err) }
  }
}
