'use client'

import { useState } from 'react'
import {
  createSkillCategory,
  deleteSkillCategory,
  updateSkillCategory,
} from '@/app/actions/admin'

interface TreeNode {
  id: string
  name: string
  parent_id: string | null
  order: number
  children: TreeNode[]
}

interface SkillsTreeProps {
  initialTree: TreeNode[]
}

export default function SkillsTree({ initialTree }: SkillsTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>(initialTree)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [addingParentId, setAddingParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleAdd = async (parentId: string | null) => {
    if (!newName.trim()) return

    const result = await createSkillCategory(newName, parentId)
    if (result.success && result.data) {
      // 트리 재구성 (실제로는 서버에서 가져와야 함)
      setNewName('')
      setAddingParentId(null)
      // TODO: 트리 업데이트 로직
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return

    const result = await updateSkillCategory(id, editingName)
    if (result.success) {
      setEditingId(null)
      setEditingName('')
      // TODO: 트리 업데이트 로직
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const result = await deleteSkillCategory(id)
    if (result.success) {
      // TODO: 트리 업데이트 로직
    } else {
      alert(result.error || '삭제 실패')
    }
  }

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedIds.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-2">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          {/* 확장/축소 버튼 */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          {/* 이름 */}
          {editingId === node.id ? (
            <input
              autoFocus
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdate(node.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded"
            />
          ) : (
            <span className="flex-1 font-medium text-gray-900">{node.name}</span>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-1">
            {editingId === node.id ? (
              <>
                <button
                  onClick={() => handleUpdate(node.id)}
                  className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded font-semibold"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-sm rounded font-semibold"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAddingParentId(node.id)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-semibold"
                  title="하위 항목 추가"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setEditingId(node.id)
                    setEditingName(node.name)
                  }}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded font-semibold"
                  title="수정"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(node.id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-semibold"
                  title="삭제"
                >
                  ×
                </button>
              </>
            )}
          </div>
        </div>

        {/* 하위 항목 추가 입력 */}
        {addingParentId === node.id && (
          <div
            style={{ marginLeft: `${(depth + 1) * 20}px` }}
            className="mt-2 flex gap-2 items-center p-2 bg-blue-50 rounded-lg"
          >
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd(node.id)
                if (e.key === 'Escape') setAddingParentId(null)
              }}
              placeholder="새 과목명"
              className="flex-1 px-2 py-1 border border-blue-300 rounded"
            />
            <button
              onClick={() => handleAdd(node.id)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-semibold"
            >
              추가
            </button>
            <button
              onClick={() => setAddingParentId(null)}
              className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-sm rounded font-semibold"
            >
              취소
            </button>
          </div>
        )}

        {/* 자식 노드 */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setAddingParentId('root')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          + 대분류 추가
        </button>
      </div>

      {/* 대분류 추가 입력 */}
      {addingParentId === 'root' && (
        <div className="mb-6 flex gap-2 items-center p-4 bg-blue-50 rounded-lg">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd(null)
              if (e.key === 'Escape') setAddingParentId(null)
            }}
            placeholder="새 대분류명"
            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-base"
          />
          <button
            onClick={() => handleAdd(null)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            추가
          </button>
          <button
            onClick={() => setAddingParentId(null)}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg"
          >
            취소
          </button>
        </div>
      )}

      {/* 트리 렌더링 */}
      <div className="space-y-1">
        {tree.length > 0 ? (
          tree.map((node) => renderNode(node, 0))
        ) : (
          <p className="text-gray-500 text-center py-8">
            아직 과목이 없습니다. 대분류를 추가하세요.
          </p>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">버튼 설명</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded font-semibold">
              +
            </button>
            <span className="text-gray-600">하위 항목 추가</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-gray-500 text-white text-xs rounded font-semibold">
              ✎
            </button>
            <span className="text-gray-600">항목 수정</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-red-500 text-white text-xs rounded font-semibold">
              ×
            </button>
            <span className="text-gray-600">항목 삭제</span>
          </div>
        </div>
      </div>
    </div>
  )
}
