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

export interface WeightedSkill {
  skill_id: string
  weight: number
}

interface WeightedSkillSelectorProps {
  categories: SkillCategory[]
  initialWeights?: WeightedSkill[]
  onSave?: (weights: WeightedSkill[]) => Promise<void>
}

export default function WeightedSkillSelector({
  categories,
  initialWeights = [],
  onSave
}: WeightedSkillSelectorProps) {
  // 초기 선택 스킬 ID 추출
  const getInitialSelectedIds = (): Set<string> => {
    return new Set(initialWeights.map(w => w.skill_id))
  }

  // 초기 가중치 맵 생성
  const getInitialWeightMap = (): Map<string, number> => {
    const map = new Map<string, number>()
    initialWeights.forEach(w => {
      map.set(w.skill_id, w.weight)
    })
    return map
  }

  // 초기 펼쳐진 노드 계산
  const getInitialExpandedIds = (): Set<string> => {
    const expandedSet = new Set<string>()
    const selectedIds = getInitialSelectedIds()

    selectedIds.forEach(selectedId => {
      let currentId = selectedId
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
  const [selected, setSelected] = useState<Set<string>>(getInitialSelectedIds())
  const [weights, setWeights] = useState<Map<string, number>>(getInitialWeightMap())
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    const newWeights = new Map(weights)

    if (newSelected.has(id)) {
      newSelected.delete(id)
      newWeights.delete(id)
    } else {
      newSelected.add(id)
      if (!newWeights.has(id)) {
        newWeights.set(id, 3) // 기본 가중치 3
      }
    }

    setSelected(newSelected)
    setWeights(newWeights)
  }

  const updateWeight = (id: string, weight: number) => {
    const newWeights = new Map(weights)
    newWeights.set(id, weight)
    setWeights(newWeights)
  }

  // 총 가중치 계산
  const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0)

  const renderNode = (node: SkillNode, depth: number) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selected.has(node.id)
    const weight = weights.get(node.id) || 3

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-3 py-3 ${depth > 0 ? '' : ''}`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          {/* 체크박스 */}
          <input
            type="checkbox"
            id={`skill-${node.id}`}
            checked={isSelected}
            onChange={() => toggleSelected(node.id)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />

          {/* 스킬명 */}
          <label
            htmlFor={`skill-${node.id}`}
            className="min-w-max text-sm font-medium text-gray-700 cursor-pointer flex-1"
          >
            {node.name}
            {node.level === 'major' && <span className="ml-2 text-xs text-gray-500">(대분류)</span>}
            {node.level === 'middle' && <span className="ml-2 text-xs text-gray-500">(중분류)</span>}
            {node.level === 'minor' && <span className="ml-2 text-xs text-gray-500">(소분류)</span>}
          </label>

          {/* 가중치 슬라이더 (선택된 경우만) */}
          {isSelected && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={weight}
                onChange={(e) => updateWeight(node.id, parseInt(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="min-w-max text-sm font-bold text-blue-600 w-8 text-right">{weight}점</span>
            </div>
          )}

          {/* 전개/축소 버튼 */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="ml-2 text-gray-500 hover:text-gray-700"
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

    if (selected.size === 0) {
      setSaveMessage({ type: 'error', text: '최소 1개 이상의 과목을 선택해주세요.' })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      // 부모 노드 필터링 (자식이 있는 부모는 저장 안 함)
      const validCategoryIds = new Set(categories.map(c => c.id))
      const validSelected = Array.from(selected).filter(id => validCategoryIds.has(id))

      const selectedArray = validSelected.filter(id => {
        const hasSelectedChildren = validSelected.some(selectedId => {
          const category = categories.find(c => c.id === selectedId)
          return category?.parent_id === id
        })

        const hasAnyChildren = categories.some(c => c.parent_id === id)

        return !hasAnyChildren || !hasSelectedChildren
      })

      // {skill_id, weight}[] 형태로 변환
      const weightedSkills: WeightedSkill[] = selectedArray.map(skillId => ({
        skill_id: skillId,
        weight: weights.get(skillId) || 3
      }))

      console.log('[WeightedSkillSelector] 저장할 데이터:', weightedSkills)

      await onSave(weightedSkills)
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">필요 역량 (스킬)</h3>
        <p className="text-sm text-gray-600 mb-4">
          스킬을 선택하고 중요도(1~5점)를 설정하세요. 가중치는 강사 매칭의 점수 계산에 사용됩니다.
        </p>
        <div className="space-y-2">
          {tree.length === 0 ? (
            <p className="text-gray-500 text-sm">과목 데이터를 불러올 수 없습니다.</p>
          ) : (
            tree.map(node => renderNode(node, 0))
          )}
        </div>
      </div>

      {/* 선택 현황 */}
      {selected.size > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">선택된 과목:</span> {selected.size}개
          </p>
          <div className="bg-white rounded p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-2">가중치 배분:</p>
            <div className="space-y-1">
              {Array.from(selected).map(skillId => {
                const skill = categories.find(c => c.id === skillId)
                const weight = weights.get(skillId) || 3
                return (
                  <div key={skillId} className="flex justify-between text-gray-600">
                    <span>{skill?.name}</span>
                    <span className="font-semibold">{weight}점</span>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold text-gray-900">
              <span>총 가중치:</span>
              <span>{totalWeight}점</span>
            </div>
          </div>
        </div>
      )}

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
