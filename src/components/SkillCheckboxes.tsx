'use client'

import { useState, useEffect } from 'react'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

interface SkillNode extends SkillCategory {
  children: SkillNode[]
}

interface SkillCheckboxesProps {
  categories: SkillCategory[]
  initialSelectedIds?: string[]
  userId?: string
  type?: 'instructor' | 'academy'
  onSave?: (selectedIds: string[]) => Promise<void>
}

export default function SkillCheckboxes({
  categories,
  initialSelectedIds = [],
  userId,
  type,
  onSave
}: SkillCheckboxesProps) {
  // initialSelectedIds의 모든 부모 노드를 찾아서 expandedIds에 추가
  // 이렇게 하면 초기 로드 시 선택된 항목들의 부모가 자동으로 펼쳐짐
  const getInitialExpandedIds = (): Set<string> => {
    const expandedSet = new Set<string>()

    initialSelectedIds.forEach(selectedId => {
      let currentId = selectedId
      // 선택된 항목의 모든 부모를 타고 올라가며 expandedIds에 추가
      while (currentId) {
        const category = categories.find(c => c.id === currentId)
        if (!category || !category.parent_id) break

        expandedSet.add(category.parent_id)
        currentId = category.parent_id
      }
    })

    return expandedSet
  }

  const [expandedIds, setExpandedIds] = useState<Set<string>>(getInitialExpandedIds())
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds))
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 🔍 디버깅: selectedIds의 실제 내용 출력
  useEffect(() => {
    const selectedArray = Array.from(selected)
    const selectedWithNames = selectedArray.map(id => {
      const category = categories.find(c => c.id === id)
      return {
        id,
        name: category?.name || 'NOT FOUND',
        level: category?.level || 'unknown',
        parent_id: category?.parent_id || null
      }
    })

    console.log('=== SkillCheckboxes 디버깅 ===')
    console.log('[selected state] 총 개수:', selected.size)
    console.log('[selected state] 상세 내용:')
    selectedWithNames.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.level}) [${item.id}]`)
    })
    console.log('[initialSelectedIds] 초기값:', initialSelectedIds)
  }, [selected, categories])

  // 계층 구조로 변환
  const buildTree = (items: SkillCategory[]): SkillNode[] => {
    const map = new Map<string, SkillNode>()

    // 모든 노드를 맵에 추가
    items.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    // 부모-자식 관계 설정
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

    // 각 레벨별로 정렬
    const sort = (nodes: SkillNode[]) => {
      nodes.sort((a, b) => a.display_order - b.display_order)
      nodes.forEach(node => sort(node.children))
    }
    sort(roots)

    return roots
  }

  // 자식 노드의 모든 ID 수집
  const getDescendantIds = (node: SkillNode): string[] => {
    let ids = [node.id]
    node.children.forEach(child => {
      ids = ids.concat(getDescendantIds(child))
    })
    return ids
  }

  // 부모 노드 ID 찾기
  const findParentId = (nodeId: string, items: SkillCategory[]): string | null => {
    const item = items.find(i => i.id === nodeId)
    return item?.parent_id || null
  }

  const tree = buildTree(categories)

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const toggleSelected = (id: string) => {
    const newSelected = new Set(selected)

    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }

    setSelected(newSelected)
  }

  const renderNode = (node: SkillNode, depth: number) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selected.has(node.id)

    return (
      <div key={node.id}>
        <div className={`flex items-center py-2 ${depth > 0 ? `ml-${depth * 4}` : ''}`} style={{ marginLeft: `${depth * 1.5}rem` }}>
          <input
            type="checkbox"
            id={`skill-${node.id}`}
            checked={isSelected}
            onChange={() => toggleSelected(node.id)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label
            htmlFor={`skill-${node.id}`}
            className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
          >
            {node.name}
            {node.level === 'major' && <span className="ml-2 text-xs text-gray-500">(대분류)</span>}
            {node.level === 'middle' && <span className="ml-2 text-xs text-gray-500">(중분류)</span>}
            {node.level === 'minor' && <span className="ml-2 text-xs text-gray-500">(소분류)</span>}
          </label>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="ml-auto text-gray-500 hover:text-gray-700"
              type="button"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const handleSave = async () => {
    if (!onSave) {
      setSaveMessage({ type: 'error', text: '저장 기능이 준비되지 않았습니다.' })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      // ⚠️ 오염된 데이터 제거: categories에 없는 항목(텍스트 문자열 등) 필터링
      const validCategoryIds = new Set(categories.map(c => c.id))
      const validSelected = Array.from(selected).filter(id => validCategoryIds.has(id))

      // 부모 노드(대분류/중분류)는 저장하지 않고, 명시적으로 선택된 것만 저장
      const selectedArray = validSelected.filter(id => {
        // 해당 노드의 자식이 하나라도 선택되어 있으면, 그 부모는 저장 대상에서 제외
        const hasSelectedChildren = validSelected.some(selectedId => {
          const category = categories.find(c => c.id === selectedId)
          return category?.parent_id === id
        })

        // 자식이 있는 부모는 제외, 없는 경우만 포함
        const hasAnyChildren = categories.some(c => c.parent_id === id)

        return !hasAnyChildren || !hasSelectedChildren
      })

      console.log('[SkillCheckboxes] 저장할 데이터:', {
        selected_state_개수: selected.size,
        valid_after_filtering_개수: validSelected.length,
        final_save_개수: selectedArray.length,
        오염된_항목: Array.from(selected).filter(id => !validCategoryIds.has(id)),
        저장될_항목: selectedArray,
      })

      await onSave(selectedArray)
      setSaveMessage({ type: 'success', text: '저장되었습니다!' })
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">과목 선택</h3>
        <div className="space-y-2">
          {tree.length === 0 ? (
            <p className="text-gray-500 text-sm">과목 데이터를 불러올 수 없습니다.</p>
          ) : (
            tree.map(node => renderNode(node, 0))
          )}
        </div>
      </div>

      {selected.size > 0 && (() => {
        // 저장할 때와 동일한 로직으로 실제 저장될 개수 계산
        const categoryMap = new Map(categories.map(c => [c.id, c]))
        const savableCount = Array.from(selected).filter(id => {
          const hasSelectedChildren = categories.some(c =>
            c.parent_id === id && selected.has(c.id)
          )
          const hasAnyChildren = categories.some(c => c.parent_id === id)
          return !hasAnyChildren || !hasSelectedChildren
        }).length

        return (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">선택된 과목:</span> {savableCount}개
            </p>
          </div>
        )
      })()}

      {saveMessage && (
        <div
          className={`rounded-lg border p-4 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={`text-sm ${
              saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {saveMessage.text}
          </p>
        </div>
      )}

      {onSave && (
        <button
          onClick={handleSave}
          disabled={isSaving || selected.size === 0}
          className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      )}
    </div>
  )
}
