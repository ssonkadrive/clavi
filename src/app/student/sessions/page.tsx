'use client'

import { useEffect, useState } from 'react'
import { getMySessions } from './actions'
import type { StudentSession } from './actions'

const STATUS_LABEL: Record<StudentSession['status'], string> = {
  pending: '대기중',
  accepted: '수락됨',
  rejected: '거절됨',
  completed: '완료',
}

const STATUS_STYLE: Record<StudentSession['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-200 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
}

export default function StudentSessionsPage() {
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getMySessions()
      if (error || !data) {
        setLoadError(error || '데이터를 불러올 수 없습니다.')
      } else {
        setSessions(data)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">수강 현황을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">수강 현황</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">수강 현황</h1>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 text-lg">현재 등록된 수강 정보가 없습니다.</p>
            <p className="text-gray-500 text-sm mt-2">강사를 찾아 수업을 예약하세요.</p>
            <a
              href="/student/instructors"
              className="inline-block mt-4 text-sm text-blue-600 hover:underline"
            >
              강사 찾기
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {s.instructorName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      신청일: {new Date(s.requestedAt).toLocaleDateString('ko-KR')}
                      {s.respondedAt &&
                        ` · 응답일: ${new Date(s.respondedAt).toLocaleDateString('ko-KR')}`}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[s.status]}`}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
