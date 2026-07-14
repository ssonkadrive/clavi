'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface RecruitmentItem {
  id: string
  instructorName: string
  statusLabel: '대기' | '진행중' | '완료' | '거절'
  proposedAt: string // ISO 문자열
}

type TabType = '전체' | '대기' | '진행중' | '완료'

const badgeClass: Record<RecruitmentItem['statusLabel'], string> = {
  대기: 'bg-yellow-100 text-yellow-700',
  진행중: 'bg-blue-100 text-blue-700',
  완료: 'bg-green-100 text-green-700',
  거절: 'bg-red-100 text-red-700',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

export default function RecruitmentList({ items }: { items: RecruitmentItem[] }) {
  const [tab, setTab] = useState<TabType>('전체')

  const filtered = tab === '전체' ? items : items.filter((p) => p.statusLabel === tab)

  return (
    <div className="space-y-4">
      {/* 상태 탭 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(['전체', '대기', '진행중', '완료'] as TabType[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`flex-1 py-2 rounded font-medium transition-colors ${
              tab === s ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
            해당하는 제안이 없습니다.
          </div>
        ) : (
          filtered.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/academy/proposals/${proposal.id}`}
              className="bg-white p-4 rounded-lg border flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-bold text-gray-900">{proposal.instructorName}</p>
                <p className="text-sm text-gray-500">제안일: {formatDate(proposal.proposedAt)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${badgeClass[proposal.statusLabel]}`}>
                {proposal.statusLabel}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
