'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Proposal {
  id: string
  instructor_name: string
  status: '대기' | '진행중' | '완료'
  date: string
  cms_score: number
}

const mockData: Proposal[] = [
  { id: '1', instructor_name: '김수학', status: '진행중', date: '2026-07-08', cms_score: 85 },
  { id: '2', instructor_name: '이영어', status: '진행중', date: '2026-07-07', cms_score: 78 },
  { id: '3', instructor_name: '박과학', status: '대기', date: '2026-07-06', cms_score: 92 },
]

type StatusType = '전체' | '대기' | '진행중' | '완료'

export default function RecruitmentPage() {
  const [status, setStatus] = useState<StatusType>('전체')

  const filtered = status === '전체'
    ? mockData
    : mockData.filter(p => p.status === status)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">채용현황</h1>

      {/* 상태 탭 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(['전체', '대기', '진행중', '완료'] as StatusType[]).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`flex-1 py-2 rounded font-medium transition-colors ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="space-y-2">
        {filtered.map(proposal => (
          <div key={proposal.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-bold">{proposal.instructor_name}</p>
              <p className="text-sm text-gray-500">{proposal.date}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">{proposal.cms_score}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {proposal.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
