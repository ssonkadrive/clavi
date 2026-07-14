'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SkillCategory {
  id: string
  parent_id: string | null
  level?: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

interface SkillNode extends SkillCategory {
  children: SkillNode[]
}

export default function SkillsTab() {
  const [tree, setTree] = useState<SkillNode[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSkills()
  }, [])

  // 계층 구조로 변환
  const buildTree = (items: SkillCategory[]): SkillNode[] => {
    const map = new Map<string, SkillNode>()

    items.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    const roots: SkillNode[] = []
    items.forEach(item => {
      const node = map.get(item.id)!
      if (item.parent_id) {
        const parent = map.get(item.parent_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    const sort = (nodes: SkillNode[]) => {
      nodes.sort((a, b) => a.display_order - b.display_order)
      nodes.forEach(node => sort(node.children))
    }
    sort(roots)

    return roots
  }

  const loadSkills = async () => {
    try {
      setError(null)

      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        throw new Error('사용자 정보를 가져올 수 없습니다')
      }

      const userId = authData.user.id
      if (!userId) {
        throw new Error('userId가 없습니다')
      }

      console.log('[SkillsTab] 역량 로드 시작, userId:', userId, '타입:', typeof userId)

      // 모든 활성 역량 조회 (계층 구조 유지)
      const { data: skillsData, error: skillsError } = await supabase
        .from('skill_categories')
        .select('id, parent_id, level, name, display_order, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (skillsError) {
        console.error('[SkillsTab] 역량 조회 에러:', {
          message: skillsError.message,
          code: skillsError.code,
          details: skillsError.details,
          hint: skillsError.hint,
        })
        throw new Error(`역량 조회 실패: ${skillsError.message || '알 수 없는 에러'}`)
      }

      console.log('[SkillsTab] 조회 완료:', skillsData?.length || 0, '개')

      // 트리 구조로 변환
      const treeData = buildTree(skillsData || [])
      setTree(treeData)

      // 선택된 역량 조회 (instructor_conditions이 없을 수 있음)
      try {
        const { data: condData, error: condError } = await supabase
          .from('instructor_conditions')
          .select('selected_skills')
          .eq('user_id', userId)
          .single()

        if (!condError) {
          const selectedIds = condData?.selected_skills || []
          setSelectedSkills(selectedIds)
          console.log('[SkillsTab] 선택된 역량:', selectedIds)

          // 선택된 항목의 부모들을 펼치기
          const expandedSet = new Set<string>()
          selectedIds.forEach((selectedId: string) => {
            let currentId: string | null = selectedId
            while (currentId) {
              const category = (skillsData || []).find(c => c.id === currentId)
              if (!category || !category.parent_id) break

              expandedSet.add(category.parent_id)
              currentId = category.parent_id
            }
          })
          setExpandedIds(expandedSet)
        } else if (condError.code === 'PGRST116') {
          console.log('[SkillsTab] instructor_conditions 데이터 없음 (초기 사용자)')
          setSelectedSkills([])
        } else {
          console.warn('[SkillsTab] 선택 역량 조회 경고:', condError.message)
          setSelectedSkills([])
        }
      } catch (condErr) {
        console.warn('[SkillsTab] 선택 역량 조회 중 예외:', condErr)
        setSelectedSkills([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[SkillsTab] 역량 로드 실패:', message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleSkillChange = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const renderNode = (node: SkillNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selectedSkills.includes(node.id)

    const depthClass = depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : 'font-normal'
    const depthColor = depth === 0 ? 'text-gray-900' : depth === 1 ? 'text-gray-800' : 'text-gray-700'

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-2">
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
          {/* 펼치기/접기 버튼 */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-5"></div>
          )}

          {/* 체크박스 */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSkillChange(node.id)}
            className="w-4 h-4 text-blue-600 rounded"
          />

          {/* 레이블 */}
          <span className={`flex-1 text-sm ${depthClass} ${depthColor}`}>{node.name}</span>

          {/* 레벨 배지 */}
          {node.level && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {node.level === 'major' ? '대' : node.level === 'middle' ? '중' : '소'}
            </span>
          )}
        </div>

        {/* 자식 노드 */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('사용자 정보 없음')

      const userId = authData.user.id
      if (!userId) throw new Error('userId가 없습니다')

      console.log('[SkillsTab] 저장 시작, userId:', userId)
      console.log('[SkillsTab] 저장할 역량:', selectedSkills)

      // 먼저 update 시도
      const { error: updateError, status: updateStatus } = await supabase
        .from('instructor_conditions')
        .update({ selected_skills: selectedSkills })
        .eq('user_id', userId)

      console.log('[SkillsTab] UPDATE 결과:', {
        status: updateStatus,
        error: updateError,
      })

      if (updateError) {
        console.log('[SkillsTab] UPDATE 에러 상세:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })

        // 행이 없으면 insert 시도
        if (updateError.code === 'PGRST116' || updateError.code === 'NODATA' || updateStatus === 406) {
          console.log('[SkillsTab] 기존 데이터 없음, INSERT 시도')

          const { error: insertError } = await supabase
            .from('instructor_conditions')
            .insert({ user_id: userId, selected_skills: selectedSkills })

          console.log('[SkillsTab] INSERT 결과:', {
            error: insertError,
          })

          if (insertError) throw insertError
        } else {
          throw updateError
        }
      }

      console.log('[SkillsTab] 저장 완료')

      // 저장 후 다시 조회하여 실제로 뭐가 저장되었는지 확인
      console.log('[SkillsTab] 저장 후 검증 시작...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('instructor_conditions')
        .select('selected_skills')
        .eq('user_id', userId)
        .single()

      if (verifyError) {
        console.error('[SkillsTab] 검증 조회 실패:', verifyError)
      } else {
        console.log('[SkillsTab] 저장된 역량 검증:', verifyData?.selected_skills)
        console.log('[SkillsTab] 저장된 역량 개수:', verifyData?.selected_skills?.length || 0)
      }

      alert('역량이 저장되었습니다.')
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[SkillsTab] 저장 실패:', message, err)
      alert('저장 실패: ' + message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">⚠️ 로드 실패: {error}</p>
        </div>
        <button
          onClick={() => {
            setIsLoading(true)
            loadSkills()
          }}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">역량이 없습니다.</p>
      </div>
    )
  }

  // 축약된 상태: 선택된 역량 개수만 표시
  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-gray-900">
          현재 선택한 역량: <span className="text-blue-600">{selectedSkills.length}개</span>
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          수정하기
        </button>
      </div>
    )
  }

  // 편집 상태: 전체 트리 표시
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">보유한 역량을 선택하세요</h3>
        <p className="text-sm text-gray-600 mb-4">
          선택된 역량: <span className="font-semibold text-blue-600">{selectedSkills.length}개</span>
        </p>
      </div>

      <div className="space-y-1 p-4 bg-white border border-gray-200 rounded-lg">
        {tree.map((node) => renderNode(node, 0))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(false)}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
