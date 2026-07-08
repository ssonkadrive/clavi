'use client'

import { useState } from 'react'

interface Matching {
  id: string
  academy_name: string
  status: '대기' | '진행중' | '수락'
  date: string
  subject: string
}

const mockData: Matching[] = []

type StatusType = '전체' | '대기' | '진행중' | '수락'

export default function MatchingPage() {
  const [status, setStatus] = useState<StatusType>('전체')

  const filtered = status === '전체'
    ? mockData
    : mockData.filter(m => m.status === status)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">매칭현황</h1>

      {/* 상태 탭 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(['전체', '대기', '진행중', '수락'] as StatusType[]).map(s => (
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
        {filtered.map(matching => (
          <div key={matching.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-bold">{matching.academy_name}</p>
              <p className="text-sm text-gray-500">{matching.subject} - {matching.date}</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {matching.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
